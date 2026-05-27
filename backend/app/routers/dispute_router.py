from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from app.db.database import db
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime
import asyncio
from app.socket_manager import notify_user

router = APIRouter()

class DisputeCreate(BaseModel):
    booking_id: str
    reason: str
    description: str

class DisputeResolve(BaseModel):
    resolution: str # 'pay_worker' or 'refund_poster'
    admin_note: str

# ── RAISE DISPUTE (User/Worker) ──────────────────────────────────────
@router.post("/raise")
def raise_dispute(body: DisputeCreate, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    user_id = str(db_user["_id"])
    
    # Verify the user is part of this booking
    booking = db.bookings.find_one({"_id": ObjectId(body.booking_id)})
    job = None
    if booking:
        job = db.jobs.find_one({"_id": ObjectId(booking["job_id"])}) or db.urgent_jobs.find_one({"_id": ObjectId(booking["job_id"])})
    else:
        # Check if booking_id is actually a job_id (urgent jobs)
        job = db.urgent_jobs.find_one({"_id": ObjectId(body.booking_id)}) or db.jobs.find_one({"_id": ObjectId(body.booking_id)})
        
    if not job:
        raise HTTPException(status_code=404, detail="Job/Booking not found")
        
    poster_id = job.get("postedBy", {}).get("id") or job.get("posted_by")
    worker_id = job.get("assignedTo") or job.get("selected_worker")
    
    if user_id not in [str(poster_id), str(worker_id)]:
        raise HTTPException(status_code=403, detail="Only participants can raise a dispute")
        
    # Check if a dispute already exists
    existing = db.disputes.find_one({"booking_id": body.booking_id, "status": "open"})
    if existing:
        raise HTTPException(status_code=400, detail="A dispute is already open for this job")
        
    dispute = {
        "booking_id": body.booking_id,
        "job_id": str(job["_id"]),
        "raised_by": user_id,
        "raised_by_name": db_user.get("name"),
        "reason": body.reason,
        "description": body.description,
        "status": "open",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "resolution": None,
        "resolved_at": None,
        "admin_note": None
    }
    
    result = db.disputes.insert_one(dispute)
    
    # Notify the OTHER party
    other_party_id = worker_id if user_id == str(poster_id) else poster_id
    notify_user(str(other_party_id), {
        "title": "Dispute Raised",
        "message": f"A dispute has been raised regarding Job: {job.get('title')}. An admin will mediate.",
        "link": f"/jobs/{job['_id']}"
    })
    
    return {"msg": "Dispute raised successfully. Our team will review it shortly.", "id": str(result.inserted_id)}

# ── LIST DISPUTES (Admin Only - simplified check for now) ───────────
@router.get("/admin/all")
def get_all_disputes(user=Depends(verify_token)):
    # In a real app, check if user is admin
    disputes = list(db.disputes.find().sort("created_at", -1))
    for d in disputes:
        d["_id"] = str(d["_id"])
    return disputes

# ── GET DISPUTE DETAILS (Admin) ──────────────────────────────────────
@router.get("/admin/{dispute_id}")
def get_dispute_details(dispute_id: str, user=Depends(verify_token)):
    dispute = db.disputes.find_one({"_id": ObjectId(dispute_id)})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    dispute["_id"] = str(dispute["_id"])
    
    # Attach tracker history for mediation
    tracker = db.tracking.find_one({"booking_id": dispute["booking_id"]})
    if tracker:
        tracker["_id"] = str(tracker["_id"])
        dispute["tracker"] = tracker
        
    return dispute

# ── RESOLVE DISPUTE (Admin) ──────────────────────────────────────────
@router.post("/admin/{dispute_id}/resolve")
def resolve_dispute(dispute_id: str, body: DisputeResolve, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    dispute = db.disputes.find_one({"_id": ObjectId(dispute_id)})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    if dispute["status"] == "resolved":
        raise HTTPException(status_code=400, detail="Dispute already resolved")
        
    job_id = dispute["job_id"]
    job = db.jobs.find_one({"_id": ObjectId(job_id)}) or db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    
    poster_id = job.get("postedBy", {}).get("id") or job.get("posted_by")
    worker_id = job.get("assignedTo") or job.get("selected_worker")
    escrow_amount = job.get("escrow_amount", 0.0)
    
    if body.resolution == "pay_worker":
        # Release escrow to worker
        if escrow_amount > 0:
            db.users.update_one({"_id": ObjectId(poster_id)}, {"$inc": {"escrow_balance": -escrow_amount}})
            db.users.update_one({"_id": ObjectId(worker_id)}, {"$inc": {"wallet_balance": escrow_amount}})
            
        system_msg = f"Admin mediated: Payment of ₹{escrow_amount} released to worker."
        
    elif body.resolution == "refund_poster":
        # Refund escrow to poster
        if escrow_amount > 0:
            db.users.update_one({"_id": ObjectId(poster_id)}, {"$inc": {"escrow_balance": -escrow_amount, "wallet_balance": escrow_amount}})
            
        system_msg = f"Admin mediated: Funds of ₹{escrow_amount} refunded to poster."
        
    # Update dispute
    db.disputes.update_one(
        {"_id": ObjectId(dispute_id)},
        {"$set": {
            "status": "resolved",
            "resolution": body.resolution,
            "resolved_at": datetime.utcnow().isoformat() + "Z",
            "admin_note": body.admin_note
        }}
    )
    
    # Update job status
    collection = db.jobs if db.jobs.find_one({"_id": ObjectId(job_id)}) else db.urgent_jobs
    collection.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "completed", "dispute_resolved": True}})
    
    # Notify both
    msg = {
        "title": "Dispute Resolved",
        "message": f"Admin has resolved the dispute: {body.resolution.replace('_', ' ').capitalize()}",
        "link": f"/jobs/{job_id}"
    }
    background_tasks.add_task(notify_user, str(poster_id), msg)
    background_tasks.add_task(notify_user, str(worker_id), msg)
    
    return {"msg": "Dispute resolved successfully"}
