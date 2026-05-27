from fastapi import APIRouter, Depends, HTTPException
from app.db.database import db
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def require_admin(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user or not db_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return db_user

# ── STATS ──────────────────────────────────────────────
@router.get("/stats")
def get_stats(admin=Depends(require_admin)):
    from datetime import timedelta

    total_users    = db.users.count_documents({})
    total_jobs     = db.jobs.count_documents({})
    total_bookings = db.bookings.count_documents({}) if "bookings" in db.list_collection_names() else 0
    total_payments = db.payments.count_documents({}) if "payments" in db.list_collection_names() else 0
    banned_users   = db.users.count_documents({"is_banned": True})
    active_jobs    = db.jobs.count_documents({"is_active": {"$ne": False}})
    open_disputes  = db.disputes.count_documents({"status": {"$ne": "resolved"}}) if "disputes" in db.list_collection_names() else 0

    # Completion rate
    completed = db.bookings.count_documents({"status": "completed"}) if "bookings" in db.list_collection_names() else 0
    completion_rate = round((completed / total_bookings * 100) if total_bookings > 0 else 0)

    # Skills distribution
    pipeline = [{"$group": {"_id": "$requiredSkill", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 6}]
    skills = [{"skill": s["_id"], "count": s["count"]} for s in db.jobs.aggregate(pipeline) if s["_id"]]

    # Last 7 days growth helpers
    def daily_counts(collection, date_field="created_at"):
        result = []
        for i in range(6, -1, -1):
            day = datetime.utcnow() - timedelta(days=i)
            start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end   = start + timedelta(days=1)
            count = collection.count_documents({date_field: {"$gte": start, "$lt": end}})
            result.append({"date": start.strftime("%m/%d"), "count": count})
        return result

    user_growth = daily_counts(db.users)
    job_growth  = daily_counts(db.jobs)

    # Revenue last 7 days (from payments collection if it exists)
    revenue_data = []
    if "payments" in db.list_collection_names():
        for i in range(6, -1, -1):
            day = datetime.utcnow() - timedelta(days=i)
            start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end   = start + timedelta(days=1)
            pipeline_rev = [
                {"$match": {"created_at": {"$gte": start, "$lt": end}}},
                {"$group": {"_id": None, "amount": {"$sum": "$amount"}}}
            ]
            res = list(db.payments.aggregate(pipeline_rev))
            revenue_data.append({"date": start.strftime("%m/%d"), "amount": res[0]["amount"] if res else 0})
    else:
        revenue_data = [{"date": "", "amount": 0}]

    return {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "total_bookings": total_bookings,
        "total_payments": total_payments,
        "banned_users": banned_users,
        "active_jobs": active_jobs,
        "open_disputes": open_disputes,
        "completion_rate": completion_rate,
        "skills": skills,
        "user_growth": user_growth,
        "job_growth": job_growth,
        "revenue_data": revenue_data,
    }


# ── USERS ──────────────────────────────────────────────
@router.get("/users")
def get_users(admin=Depends(require_admin)):
    users = list(db.users.find({}, {"password": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return users

@router.put("/users/{user_id}/ban")
def ban_user(user_id: str, admin=Depends(require_admin)):
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_banned": True}})
    return {"msg": "User banned"}

@router.put("/users/{user_id}/unban")
def unban_user(user_id: str, admin=Depends(require_admin)):
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_banned": False}})
    return {"msg": "User unbanned"}

@router.put("/users/{user_id}/verify")
def verify_user(user_id: str, admin=Depends(require_admin)):
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_verified": True}})
    return {"msg": "User verified"}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin=Depends(require_admin)):
    db.users.delete_one({"_id": ObjectId(user_id)})
    return {"msg": "User deleted"}

# ── JOBS ───────────────────────────────────────────────
@router.get("/jobs")
def get_all_jobs(admin=Depends(require_admin)):
    jobs = list(db.jobs.find({}))
    for j in jobs:
        j["_id"] = str(j["_id"])
    return jobs

@router.put("/jobs/{job_id}/approve")
def approve_job(job_id: str, admin=Depends(require_admin)):
    db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": {"is_active": True, "is_approved": True}})
    return {"msg": "Job approved"}

@router.put("/jobs/{job_id}/reject")
def reject_job(job_id: str, admin=Depends(require_admin)):
    db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": {"is_active": False, "is_approved": False}})
    return {"msg": "Job rejected"}

@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, admin=Depends(require_admin)):
    db.jobs.delete_one({"_id": ObjectId(job_id)})
    return {"msg": "Job deleted"}

# ── BOOKINGS ───────────────────────────────────────────
@router.get("/bookings")
def get_bookings(admin=Depends(require_admin)):
    bookings = list(db.bookings.find({})) if "bookings" in db.list_collection_names() else []
    for b in bookings:
        b["_id"] = str(b["_id"])
    return bookings

# ── DISPUTES ───────────────────────────────────────────
@router.get("/disputes")
def get_disputes(admin=Depends(require_admin)):
    disputes = list(db.disputes.find({})) if "disputes" in db.list_collection_names() else []
    for d in disputes:
        d["_id"] = str(d["_id"])
    return disputes

@router.put("/disputes/{dispute_id}/resolve")
def resolve_dispute(dispute_id: str, admin=Depends(require_admin)):
    db.disputes.update_one(
        {"_id": ObjectId(dispute_id)},
        {"$set": {"status": "resolved", "resolved_at": datetime.utcnow().isoformat()}}
    )
    return {"msg": "Dispute resolved"}

# ── MAKE ADMIN (run once manually) ────────────────────
@router.put("/make-admin/{user_id}")
def make_admin(user_id: str):
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_admin": True}})
    return {"msg": "User is now admin"}

SETUP_SECRET = "worksetu_setup_2024"  # change this to anything you want

@router.post("/setup-admin")
def setup_admin(payload: dict):
    secret = payload.get("secret")
    email  = payload.get("email")

    if secret != SETUP_SECRET:
        raise HTTPException(status_code=403, detail="Wrong secret key")

    user = db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.users.update_one(
        {"email": email},
        {"$set": {"is_admin": True}}
    )
    return {
        "msg": f"{email} is now admin",
        "user_id": str(user["_id"])
    }