from app.db.database import db
from datetime import datetime


def create_job(job_data: dict) -> str:
    job_data["created_at"] = datetime.utcnow()
    job_data.setdefault("status", "open")
    job_data.setdefault("is_active", True)
    result = db.jobs.insert_one(job_data)
    return str(result.inserted_id)


def get_jobs(skill: str = "", job_type: str = "", search: str = "") -> list:
    query = {}
    if skill:
        query["requiredSkill"] = {"$regex": skill, "$options": "i"}
    if job_type:
        query["type"] = job_type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"requiredSkill": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    jobs = list(db.jobs.find(query).sort("created_at", -1))
    for job in jobs:
        job["_id"] = str(job["_id"])
        job["created_at"] = str(job.get("created_at", ""))
    return jobs