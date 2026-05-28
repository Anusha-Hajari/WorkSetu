from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.db.database import db
from app.services.auth_service import verify_token
from app.services.ai_service import evaluate_work_update
from bson import ObjectId
from datetime import datetime
import asyncio
from app.socket_manager import notify_tracker, notify_user

router = APIRouter()

class TrackerUpdate(BaseModel):
    text: str
    imageUrl: Optional[str] = None
    mediaUrl: Optional[str] = None
    media_verdict: Optional[dict] = None

@router.get("/job/{job_id}/active-booking")
def get_active_booking(job_id: str, user=Depends(verify_token)):
    """Find the tracking ID (booking_id) for a specific job."""
    db_user = db.users.find_one({"email": user["email"]})
    user_id = str(db_user["_id"])
    
    # Check regular jobs
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        # Check urgent jobs
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
        if job:
            # For urgent jobs, we use the job_id as the tracking identifier
            # as they don't use the 'bookings' collection
            is_poster = job.get("posted_by") == user_id
            is_worker = job.get("selected_worker") == user_id
            if is_poster or is_worker:
                return {"booking_id": job_id}
            raise HTTPException(status_code=403, detail="Not authorized")
        raise HTTPException(status_code=404, detail="Job not found")

    # Regular job logic
    poster_id = job.get("postedBy", {}).get("id")
    is_poster = poster_id == user_id
    
    # Find bookings for this job
    booking = db.bookings.find_one({"job_id": job_id})
    if not booking:
        return {"booking_id": None}
    
    # Authorization check
    is_worker = booking.get("user_email") == user["email"]
    if not (is_poster or is_worker):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return {"booking_id": str(booking["_id"])}

@router.get("/{booking_id}")
def get_tracker_status(booking_id: str, user=Depends(verify_token)):
    # 1. Try to find a booking record first
    booking = db.bookings.find_one({"_id": ObjectId(booking_id)}) if len(booking_id) == 24 else None
    
    if booking:
        # Regular job path
        job_id = booking.get("job_id")
        job = db.jobs.find_one({"_id": ObjectId(job_id)}) or db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    else:
        # If no booking found, check if the ID is a job ID (Urgent jobs path)
        job_id = booking_id
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)}) or db.jobs.find_one({"_id": ObjectId(job_id)})
        
    if not job:
        raise HTTPException(status_code=404, detail="Job/Booking not found")
        
    db_user = db.users.find_one({"email": user["email"]})
    user_id = str(db_user["_id"])
    
    is_poster = job.get("postedBy", {}).get("id") == user_id or job.get("posted_by") == user_id
    is_worker = job.get("assignedTo") == user_id or job.get("selected_worker") == user_id
    
    if not (is_poster or is_worker):
        raise HTTPException(status_code=403, detail="Not authorized to view tracker")
        
    tracker = db.tracking.find_one({"booking_id": booking_id})
    if not tracker:
        tracker = {
            "booking_id": booking_id,
            "job_id": job_id,
            "status": "In Progress",
            "updates": []
        }
        db.tracking.insert_one(tracker)
        tracker["_id"] = str(tracker["_id"])
    else:
        tracker["_id"] = str(tracker["_id"])
        
    tracker["role"] = "poster" if is_poster else "worker"
    tracker["poster_agreed"] = job.get("poster_agreed", False)
    tracker["worker_agreed"] = job.get("worker_agreed", False)
    return tracker

@router.post("/{booking_id}/update")
def submit_update(booking_id: str, body: TrackerUpdate, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    tracker = get_tracker_status(booking_id, user)
    if tracker["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only worker can submit updates")
        
    job_id = tracker["job_id"]
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
        
    ai_result = evaluate_work_update(body.text, job.get("description", ""))
    
    # If media is provided, we MUST re-verify it on the server side for security
    is_media_flagged = False
    if body.mediaUrl:
        # Re-run verification on the server to prevent client-side tampering
        # Note: In a production app, we would store the verdict during upload and look it up
        from app.services.ai_service import verify_media_authenticity
        import os
        
        # Get absolute path to the file
        file_path = os.path.join("uploads", body.mediaUrl.replace("/uploads/", ""))
        if os.path.exists(file_path):
            server_verdict = verify_media_authenticity(file_path, body.mediaUrl)
            body.media_verdict = server_verdict # Override client-sent verdict
            if server_verdict.get("verdict") == "flagged":
                is_media_flagged = True
        else:
            is_media_flagged = True # Reject if file missing
            
    if is_media_flagged:
        ai_result["passed"] = False
        ai_result["score"] = min(ai_result["score"], 20)
        ai_result["feedback"] = f"SECURITY REJECTION: The attached media failed authenticity checks. {body.media_verdict.get('reason') if body.media_verdict else 'File not found.'}"
    
    new_update = {
        "id": str(ObjectId()),
        "text": body.text,
        "imageUrl": body.imageUrl,
        "mediaUrl": body.mediaUrl,
        "media_verdict": body.media_verdict,
        "submitted_at": datetime.utcnow().isoformat() + "Z",
        "ai_score": ai_result["score"],
        "ai_feedback": ai_result["feedback"],
        "status": "pending_poster" if ai_result["passed"] else "rejected_by_ai"
    }
    
    db.tracking.update_one(
        {"booking_id": booking_id},
        {"$push": {"updates": new_update}}
    )
    
    background_tasks.add_task(notify_tracker, booking_id, {"event": "new_update"})
    
    # Notify poster globally if it passed AI
    if ai_result["passed"]:
        poster_id = job.get("postedBy", {}).get("id") if "postedBy" in job else job.get("posted_by")
        background_tasks.add_task(notify_user, str(poster_id), {
            "title": "New Tracker Update",
            "message": f"Worker submitted a new progress update.",
            "link": f"/jobs/{job_id}"
        })
    
    return new_update

@router.post("/{booking_id}/approve/{update_id}")
def approve_update(booking_id: str, update_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    tracker = get_tracker_status(booking_id, user)
    if tracker["role"] != "poster":
        raise HTTPException(status_code=403, detail="Only poster can approve")
        
    db.tracking.update_one(
        {"booking_id": booking_id, "updates.id": update_id},
        {"$set": {"updates.$.status": "approved_by_poster"}}
    )
    
    background_tasks.add_task(notify_tracker, booking_id, {"event": "status_change"})
    
    job = db.jobs.find_one({"_id": ObjectId(tracker["job_id"])}) or db.urgent_jobs.find_one({"_id": ObjectId(tracker["job_id"])})
    if job:
        worker_id = job.get("assignedTo") or job.get("selected_worker")
        background_tasks.add_task(notify_user, str(worker_id), {
            "title": "Update Approved!",
            "message": "The client has approved your progress update.",
            "link": f"/jobs/{tracker['job_id']}"
        })
        
    return {"msg": "Update approved"}

@router.post("/{booking_id}/reject/{update_id}")
def reject_update(booking_id: str, update_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    tracker = get_tracker_status(booking_id, user)
    if tracker["role"] != "poster":
        raise HTTPException(status_code=403, detail="Only poster can reject")
        
    db.tracking.update_one(
        {"booking_id": booking_id, "updates.id": update_id},
        {"$set": {"updates.$.status": "rejected_by_poster"}}
    )
    
    background_tasks.add_task(notify_tracker, booking_id, {"event": "status_change"})
    
    job = db.jobs.find_one({"_id": ObjectId(tracker["job_id"])}) or db.urgent_jobs.find_one({"_id": ObjectId(tracker["job_id"])})
    if job:
        worker_id = job.get("assignedTo") or job.get("selected_worker")
        background_tasks.add_task(notify_user, str(worker_id), {
            "title": "Update Rejected",
            "message": "The client has rejected your progress update.",
            "link": f"/jobs/{tracker['job_id']}"
        })
        
    return {"msg": "Update rejected"}

@router.post("/{booking_id}/complete_job")
def complete_job(booking_id: str, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    tracker = get_tracker_status(booking_id, user)
    if tracker["role"] != "poster":
        raise HTTPException(status_code=403, detail="Only poster can complete the job")
        
    job_id = tracker["job_id"]
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    is_urgent = False
    if not job:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
        is_urgent = True
        
    if job.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Job is already completed")
        
    # Process Escrow Release
    escrow_amount = job.get("escrow_amount", 0.0)
    if escrow_amount > 0:
        poster_id = job.get("postedBy", {}).get("id") if not is_urgent else job.get("posted_by")
        worker_id = job.get("assignedTo") if not is_urgent else job.get("selected_worker")
        
        # Deduct from Poster's Escrow
        db.users.update_one(
            {"_id": ObjectId(poster_id)},
            {"$inc": {"escrow_balance": -escrow_amount}}
        )
        # Add to Worker's Wallet
        db.users.update_one({"_id": ObjectId(worker_id)}, {"$inc": {"wallet_balance": escrow_amount}})
        
        from app.services.transaction_service import record_transaction
        record_transaction(poster_id, "escrow_release", -escrow_amount, f"Escrow released for job: {job.get('title')}", job_id)
        record_transaction(worker_id, "payment_received", escrow_amount, f"Payment received for job: {job.get('title')}", job_id)
        
    # Update Statuses
    db.tracking.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "Completed"}}
    )
    
    if not is_urgent:
        db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"status": "completed"}}
        )
    
    collection = db.urgent_jobs if is_urgent else db.jobs
    collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "completed"}}
    )
    
    background_tasks.add_task(notify_tracker, booking_id, {"event": "status_change"})
    if escrow_amount > 0:
        background_tasks.add_task(notify_user, str(worker_id), {
            "title": "Job Completed & Paid!",
            "message": f"The job is completed and ₹{escrow_amount} has been released to your wallet.",
            "link": f"/jobs/{job_id}"
        })
    
    return {"msg": "Job marked as completed and funds released from Escrow!"}

