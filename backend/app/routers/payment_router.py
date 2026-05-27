from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.db.database import db
from app.services.auth_service import verify_token

router = APIRouter()

@router.post("/approve-payment/{job_id}")
def approve_payment(job_id: str, user=Depends(verify_token)):

    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # only recruiter can approve
    poster_id = job.get("postedBy", {}).get("id")
    if poster_id != str(user.get("id")):
        # Fallback for different user dict formats
        db_user = db.users.find_one({"email": user["email"]})
        if poster_id != str(db_user["_id"]):
            raise HTTPException(status_code=403, detail="Not allowed")

    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")


    # 🔥 release payment
    db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"paymentStatus": "paid"}}
    )

    return {"msg": "Payment released"}
@router.get("/payment/{job_id}")
def get_payment_status(job_id: str):
    job = db.jobs.find_one({"_id": ObjectId(job_id)})

    if not job:
        return {"msg": "Job not found"}

    return {
        "status": job.get("status"),
        "paymentStatus": job.get("paymentStatus", "pending")
    }