from app.db.database import db
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.application_schema import ApplicationCreate
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# ── APPLY TO A JOB ──────────────────────────────────────────────────
@router.post("/apply-job")
def apply(data: ApplicationCreate, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # prevent duplicate applications
    existing = db.applications.find_one({
        "job_id": data.job_id,
        "user_email": user["email"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    application = {
        "job_id": data.job_id,
        "user_email": user["email"],
        "user_name": db_user.get("name", ""),
        "cover_letter": data.cover_letter,
        "experience": data.experience,
        "rate": data.rate,
        "interview_answers": data.interview_answers,
        "status": "pending",
        "applied_at": datetime.utcnow().isoformat(),
    }

    result = db.applications.insert_one(application)
    return {
        "msg": "Applied successfully",
        "application_id": str(result.inserted_id),
        "job_id": data.job_id
    }


# ── MY APPLICATIONS ─────────────────────────────────────────────────
@router.get("/my-applications")
def get_my_applications(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        return []
    
    user_id = str(db_user["_id"])
    
    # 1. Fetch regular applications
    apps = list(db.applications.find({"user_email": user["email"]}))
    for app in apps:
        app["_id"] = str(app["_id"])
        # try to enrich with job title
        try:
            job = db.jobs.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                app["job_title"] = job.get("title", "Untitled Job")
                app["job_skill"] = job.get("requiredSkill", job.get("skill", ""))
                app["job_type"] = "Standard"
        except Exception:
            app["job_title"] = "Unknown Job"
            app["job_skill"] = ""
            app["job_type"] = "Standard"

    # 2. Fetch urgent job applications
    # In urgent_jobs, applications are sub-documents in the 'applicants' array
    urgent_apps = list(db.urgent_jobs.find({"applicants.user_id": user_id}))
    for uj in urgent_apps:
        # Find the specific applicant sub-document for this user
        my_app = next((a for a in uj.get("applicants", []) if a.get("user_id") == user_id), None)
        if my_app:
            apps.append({
                "_id": f"urgent-{str(uj['_id'])}",
                "job_id": str(uj["_id"]),
                "job_title": uj.get("title", "Untitled Urgent Job"),
                "job_skill": uj.get("skill", ""),
                "job_type": "Urgent",
                "status": my_app.get("status", "pending"),
                "applied_at": my_app.get("applied_at").isoformat() if isinstance(my_app.get("applied_at"), datetime) else str(my_app.get("applied_at")),
                "rate": uj.get("rate"),
                "is_urgent": True
            })

    # Sort by applied_at descending
    apps.sort(key=lambda x: x.get("applied_at", ""), reverse=True)
    return apps


# ── APPLICATIONS FOR A JOB (recruiter view) ─────────────────────────
@router.get("/for-job/{job_id}")
def get_applications_for_job(job_id: str, user=Depends(verify_token)):
    apps = list(db.applications.find({"job_id": job_id}))
    for app in apps:
        app["_id"] = str(app["_id"])
    return apps