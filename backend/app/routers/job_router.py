from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.socket_manager import broadcast_job_status
import asyncio
from app.schemas.job_schema import JobCreate
from app.services.job_service import create_job, get_jobs
from bson import ObjectId
from app.db.database import db
from app.services.auth_service import verify_token
from app.services.matching_service import get_best_users_for_job
from app.socket_manager import sio

router = APIRouter()


# ── POST A JOB ──────────────────────────────────────────────────────
@router.post("/add-job")
def add_job(job: JobCreate, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    job_data = job.dict()
    job_data["postedBy"] = {
        "id": str(db_user["_id"]),
        "name": db_user.get("name", ""),
        "email": db_user.get("email", ""),
    }

    # Save job
    job_id = create_job(job_data)

    # Instant hiring logic for urgent jobs
    if job_data.get("isUrgent", False):
        users = list(db.users.find())
        formatted_users = []
        for u in users:
            formatted_users.append({
                "id": str(u["_id"]),
                "skills": u.get("skills", []),
                "rating": u.get("rating", 3),
                "completedJobs": u.get("completedJobs", 0),
                "responseTime": u.get("responseTime", 5),
                "isOnline": u.get("isOnline", True),
                "distance": u.get("distance", 5)
            })

        job_for_ai = {
            "skills": job_data.get("skills", [job_data.get("requiredSkill", "")])
        }

        top_users = get_best_users_for_job(job_for_ai, formatted_users)

        return {
            "msg": "Job added & instant matching done",
            "job_id": job_id,
            "top_users": top_users
        }

    return {"msg": "Job added", "job_id": job_id}


# ── ACCEPT A JOB ────────────────────────────────────────────────────
@router.post("/accept-job/{job_id}")
def accept_job(job_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") in ("assigned", "work_undergoing"):
        raise HTTPException(status_code=400, detail="Job already taken")

    db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"assignedTo": str(db_user["_id"]), "status": "work_undergoing"}}
    )
    background_tasks.add_task(broadcast_job_status, job_id, "work_undergoing")
    return {"msg": "Job accepted successfully"}


# ── START JOB ───────────────────────────────────────────────────────
@router.post("/start-job/{job_id}")
def start_job(job_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("assignedTo") != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "work_undergoing"}}
    )
    background_tasks.add_task(broadcast_job_status, job_id, "work_undergoing")
    return {"msg": "Job started"}


# ── COMPLETE JOB ────────────────────────────────────────────────────
@router.post("/complete-job/{job_id}")
def complete_job(job_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("assignedTo") != user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "completed"}}
    )
    background_tasks.add_task(broadcast_job_status, job_id, "completed")
    return {"msg": "Job completed"}


# ── GET ALL JOBS (with filtering) ───────────────────────────────────
@router.get("/jobs")
def get_all_jobs(skill: str = "", type: str = "", search: str = ""):
    query = {}
    if skill:
        query["requiredSkill"] = {"$regex": skill, "$options": "i"}
    if type:
        query["type"] = type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"requiredSkill": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    jobs = list(db.jobs.find(query).sort("created_at", -1))
    for job in jobs:
        job["_id"] = str(job["_id"])
        job["created_at"] = job["created_at"].isoformat() if job.get("created_at") else ""
    return jobs


# ── GET MY POSTS ────────────────────────────────────────────────────
@router.get("/my-posts")
def get_my_posts(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(db_user["_id"])
    jobs = list(db.jobs.find({"postedBy.id": user_id}).sort("created_at", -1))
    for job in jobs:
        job["_id"] = str(job["_id"])
        job["created_at"] = job["created_at"].isoformat() if job.get("created_at") else ""
    return jobs


# ── GET SINGLE JOB ──────────────────────────────────────────────────
@router.get("/job/{job_id}")
def get_job(job_id: str):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job["_id"] = str(job["_id"])
    return job


# ── AI MATCHING ─────────────────────────────────────────────────────
@router.get("/job/{job_id}/best-users")
def get_best_users(job_id: str):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    users = list(db.users.find())
    formatted_users = []
    for u in users:
        formatted_users.append({
            "id": str(u["_id"]),
            "skills": u.get("skills", []),
            "rating": u.get("rating", 3),
            "completedJobs": u.get("completedJobs", 0),
            "responseTime": u.get("responseTime", 5),
            "isOnline": u.get("isOnline", True),
            "distance": u.get("distance", 5),
            "badges": u.get("badges", []),
        })

    job_data = {
        "skills": job.get("skills", [job.get("requiredSkill", "")])
    }

    return get_best_users_for_job(job_data, formatted_users)


# ── DELETE JOB ──────────────────────────────────────────────────────
@router.delete("/delete-job/{job_id}")
def delete_job(job_id: str, user=Depends(verify_token)):
    try:
        db.jobs.delete_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    return {"msg": "Job deleted"}


# ── UPDATE JOB ──────────────────────────────────────────────────────
@router.put("/update-job/{job_id}")
def update_job(job_id: str, job: JobCreate, user=Depends(verify_token)):
    try:
        db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": job.dict()})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    return {"msg": "Job updated"}