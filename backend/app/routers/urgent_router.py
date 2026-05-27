from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.socket_manager import broadcast_job_status, broadcast_new_urgent_job
import asyncio
from app.db.database import db
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional
import math

from app.schemas.urgent_schema import UrgentJobCreate

router = APIRouter()


# ─────────────────── HELPERS ────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def ai_score(worker: dict, job: dict) -> int:
    """Score a worker against a job using skill match, rating, distance."""
    score = 0
    worker_skills = [s.lower() for s in worker.get("skills", [])]
    job_skill = job.get("skill", "").lower()

    # Skill match (40 pts)
    if job_skill in worker_skills:
        score += 40

    # Rating (20 pts)
    rating = worker.get("rating", 0)
    if rating >= 4.5:
        score += 20
    elif rating >= 4.0:
        score += 10
    elif rating >= 3.0:
        score += 5

    # Experience (15 pts)
    if worker.get("completed_jobs", 0) >= 10:
        score += 15
    elif worker.get("completed_jobs", 0) >= 5:
        score += 8

    # Distance for onsite jobs (25 pts max)
    if job.get("work_mode") == "onsite":
        w_lat = worker.get("lat")
        w_lon = worker.get("lon")
        j_lat = job.get("lat")
        j_lon = job.get("lon")
        if all(v is not None for v in [w_lat, w_lon, j_lat, j_lon]):
            dist = haversine(w_lat, w_lon, j_lat, j_lon)
            if dist <= 2:
                score += 25
            elif dist <= 5:
                score += 15
            elif dist <= 10:
                score += 5
    else:
        # Remote job — location irrelevant
        score += 25

    # Badge Boost (up to 15 pts)
    badges = worker.get("badges", [])
    score += min(len(badges) * 5, 15)

    return min(score, 100)


def serialize_job(job: dict) -> dict:
    """Convert MongoDB _id and datetime fields to JSON-safe types."""
    job["_id"] = str(job["_id"])
    if isinstance(job.get("created_at"), datetime):
        job["created_at"] = job["created_at"].isoformat() + "Z"
    if isinstance(job.get("expires_at"), datetime):
        job["expires_at"] = job["expires_at"].isoformat() + "Z"
    for a in job.get("applicants", []):
        if isinstance(a.get("applied_at"), datetime):
            a["applied_at"] = a["applied_at"].isoformat() + "Z"
    return job


# ─────────────────── CREATE URGENT JOB ──────────────────────────────

@router.post("/create")
def create_urgent_job(data: UrgentJobCreate, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    expires_at = datetime.utcnow() + timedelta(hours=data.duration_hours)

    job = {
        "title": data.title,
        "skill": data.skill.lower(),
        "description": data.description,
        "duration_hours": data.duration_hours,
        "work_mode": data.work_mode.lower(),
        "rate": data.rate,
        "lat": data.lat,
        "lon": data.lon,
        "location_name": data.location_name,
        "max_workers": getattr(data, "max_workers", 1),
        "interviewQuestions": getattr(data, "interviewQuestions", []),
        "hired_workers": [],

        "posted_by": str(db_user["_id"]),
        "posted_by_name": db_user["name"],
        "posted_by_email": db_user["email"],

        "status": "open",          # open → in_progress → completed
        "applicants": [],          # workers who applied
        "selected_worker": None,   # worker_id chosen by poster
        "selected_worker_name": None,
        "selected_worker_email": None,

        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
        "type": "urgent",
    }

    result = db.urgent_jobs.insert_one(job)
    job["_id"] = str(result.inserted_id)
    job["created_at"] = job["created_at"].isoformat() + "Z"
    job["expires_at"] = job["expires_at"].isoformat() + "Z"
    return job


# ─────────────────── GET ACTIVE JOBS ────────────────────────────────

@router.get("/active")
def get_active_urgent_jobs():
    now = datetime.utcnow()
    jobs = list(db.urgent_jobs.find(
        {"expires_at": {"$gt": now}},
    ).sort("created_at", -1))
    return [serialize_job(j) for j in jobs]


# ─────────────────── SKILLS LIST ────────────────────────────────────

@router.get("/skills")
def get_skills():
    return ["coding", "plumbing", "cleaning", "design", "editing", "tutoring"]


# ─────────────────── APPLY ──────────────────────────────────────────

@router.post("/{job_id}/apply")
def apply_to_urgent_job(job_id: str, payload: dict = {}, user=Depends(verify_token)):
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is no longer accepting applicants")

    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    worker_id = str(db_user["_id"])

    # Prevent poster from applying to own job
    if job.get("posted_by") == worker_id:
        raise HTTPException(status_code=400, detail="You cannot apply to your own job")

    # Prevent duplicate applications
    if any(a["worker_id"] == worker_id for a in job.get("applicants", [])):
        raise HTTPException(status_code=400, detail="Already applied")

    # AI score
    score = ai_score({
        "skills": db_user.get("skills", []),
        "rating": db_user.get("rating", 0),
        "completed_jobs": db_user.get("completedJobs", 0),
        "lat": payload.get("lat"),
        "lon": payload.get("lon"),
        "badges": db_user.get("badges", []),
    }, job)

    applicant = {
        "worker_id": worker_id,
        "name": db_user["name"],
        "email": db_user["email"],
        "skills": db_user.get("skills", []),
        "rating": db_user.get("rating", 0),
        "completedJobs": db_user.get("completedJobs", 0),
        "bio": db_user.get("bio", ""),
        "score": score,
        "lat": payload.get("lat"),
        "lon": payload.get("lon"),
        "status": "pending",    # pending → selected | rejected
        "applied_at": datetime.utcnow(),
    }

    db.urgent_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$push": {"applicants": applicant}}
    )

    return {"msg": "Applied successfully", "ai_score": score}


# ─────────────────── REJECT (worker rejects the job) ────────────────

@router.post("/{job_id}/reject")
def reject_urgent_job(job_id: str, user=Depends(verify_token)):
    """Worker explicitly rejects/dismisses a job from their view."""
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    worker_id = str(db_user["_id"])

    # Track rejections so we don't show this job to the worker again
    db.urgent_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$addToSet": {"rejected_by": worker_id}}
    )
    return {"msg": "Job dismissed"}


# ─────────────────── GET APPLICANTS (poster only) ────────────────────

@router.get("/{job_id}/applicants")
def get_applicants(job_id: str, user=Depends(verify_token)):
    """Only the job poster can see the applicant list."""
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if job.get("posted_by") != str(db_user["_id"]):
        raise HTTPException(status_code=403, detail="Only the poster can view applicants")

    applicants = job.get("applicants", [])
    # Sort by AI score descending
    applicants_sorted = sorted(applicants, key=lambda a: a.get("score", 0), reverse=True)

    for a in applicants_sorted:
        if isinstance(a.get("applied_at"), datetime):
            a["applied_at"] = a["applied_at"].isoformat()

    return applicants_sorted


# ─────────────────── SELECT WORKER (poster approves) ─────────────────

@router.post("/{job_id}/select/{worker_id}")
def select_worker(job_id: str, worker_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    """Poster selects one applicant — unlocks private chat."""
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if job.get("posted_by") != str(db_user["_id"]):
        raise HTTPException(status_code=403, detail="Only the poster can select a worker")

    if job.get("status") != "open":
        raise HTTPException(status_code=400, detail="Job is no longer open")

    # Find the selected applicant
    applicant = next((a for a in job.get("applicants", []) if a["worker_id"] == worker_id), None)
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # Update job: mark selected, status → work_undergoing
    db.urgent_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$set": {
                "status": "work_undergoing",
                "selected_worker": worker_id,
                "selected_worker_name": applicant["name"],
                "selected_worker_email": applicant["email"],
                "selected_at": datetime.utcnow(),
            },
            # Update the applicant's status within the array
            "$push": {}
        }
    )

    # Update applicant statuses in the array
    db.urgent_jobs.update_one(
        {"_id": ObjectId(job_id), "applicants.worker_id": worker_id},
        {"$set": {"applicants.$.status": "selected"}}
    )

    background_tasks.add_task(broadcast_job_status, job_id, "work_undergoing")


    return {
        "msg": "Worker selected — chat is now enabled",
        "worker_id": worker_id,
        "worker_name": applicant["name"],
        "job_id": job_id,
    }


# ─────────────────── ACCEPT (worker instant booking) ───────────────────

@router.post("/{job_id}/accept")
def accept_urgent_job(job_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    """Worker instantly accepts the job. First come, first served."""
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") != "open":
        raise HTTPException(status_code=400, detail="Job is no longer open")

    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    worker_id = str(db_user["_id"])

    # Prevent poster from accepting their own job
    if job.get("posted_by") == worker_id:
        raise HTTPException(status_code=400, detail="You cannot accept your own job")

    # Update job: mark selected, status → work_undergoing
    db.urgent_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {
            "$set": {
                "status": "work_undergoing",
                "selected_worker": worker_id,
                "selected_worker_name": db_user.get("name", "Unknown"),
                "selected_worker_email": db_user.get("email", ""),
                "selected_at": datetime.utcnow(),
            }
        }
    )

    background_tasks.add_task(broadcast_job_status, job_id, "work_undergoing")


    return {"msg": "Job accepted"}



# ─────────────────── REJECT APPLICANT (poster rejects one) ───────────

@router.post("/{job_id}/reject-applicant/{worker_id}")
def reject_applicant(job_id: str, worker_id: str, user=Depends(verify_token)):
    """Poster explicitly rejects an applicant."""
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if job.get("posted_by") != str(db_user["_id"]):
        raise HTTPException(status_code=403, detail="Only the poster can reject applicants")

    db.urgent_jobs.update_one(
        {"_id": ObjectId(job_id), "applicants.worker_id": worker_id},
        {"$set": {"applicants.$.status": "rejected"}}
    )
    return {"msg": "Applicant rejected"}



# ─────────────────── GET SINGLE JOB ─────────────────────────────────

@router.get("/{job_id}")
def get_urgent_job(job_id: str):
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return serialize_job(job)