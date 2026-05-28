from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.db.database import db
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime
import asyncio
from app.socket_manager import notify_chat, notify_user, broadcast_job_status

router = APIRouter()


class ChatMessage(BaseModel):
    message: Optional[str] = ""
    imageUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    documentUrl: Optional[str] = None
    fileName: Optional[str] = None


class ChatAction(BaseModel):
    action: str

def _check_chat_access(job_id: str, user: dict):
    """
    Check that the current user is either the poster or the selected/assigned
    worker for this job, and that the job is in a state where chat is allowed.
    Returns (job_dict, user_id, role) or raises HTTPException.
    Works for BOTH regular jobs and urgent jobs.
    """
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(db_user["_id"])

    # Try urgent_jobs collection first
    try:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        job = None

    if job:
        is_poster = job.get("posted_by") == user_id
        is_selected = job.get("selected_worker") == user_id

        if not (is_poster or is_selected):
            raise HTTPException(
                status_code=403,
                detail="Chat is only available between the poster and the selected worker",
            )

        if job.get("status") not in ("in_progress", "work_undergoing", "completed"):
            raise HTTPException(
                status_code=403,
                detail="Chat is not enabled yet — a worker must be selected first",
            )

        role = "poster" if is_poster else "worker"
        return job, user_id, role

    # Try regular jobs collection
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        job = None

    if job:
        poster_id = job.get("postedBy", {}).get("id")
        assigned_to = job.get("assignedTo")

        is_poster = poster_id == user_id
        is_assigned = assigned_to == user_id

        if not (is_poster or is_assigned):
            raise HTTPException(
                status_code=403,
                detail="Chat is only available between the poster and the assigned worker",
            )

        if job.get("status") not in ("assigned", "in_progress", "work_undergoing", "completed"):
            raise HTTPException(
                status_code=403,
                detail="Chat is not enabled yet — a worker must accept the job first",
            )

        role = "poster" if is_poster else "worker"
        return job, user_id, role

    raise HTTPException(status_code=404, detail="Job not found")


# ─────────────────── CHECK CHAT ACCESS ───────────────────────────────

@router.get("/chat-access/{job_id}")
def check_chat_access(job_id: str, user=Depends(verify_token)):
    """Returns whether the current user can access the chat for this job."""
    job, user_id, role = _check_chat_access(job_id, user)

    # Determine partner name based on job collection
    if "posted_by_name" in job:
        # urgent job
        partner_name = (
            job.get("selected_worker_name") if role == "poster"
            else job.get("posted_by_name")
        )
    else:
        # regular job
        if role == "poster":
            assigned_id = job.get("assignedTo")
            assigned_user = db.users.find_one({"_id": ObjectId(assigned_id)}) if assigned_id else None
            partner_name = assigned_user.get("name") if assigned_user else "Worker"
        else:
            partner_name = job.get("postedBy", {}).get("name", "")

    # Find partner isOnline status
    partner_id = None
    if "posted_by_name" in job:
        partner_id = job.get("selected_worker") if role == "poster" else job.get("posted_by")
    else:
        partner_id = job.get("assignedTo") if role == "poster" else job.get("postedBy", {}).get("id")

    partner_online = False
    if partner_id:
        partner_user = db.users.find_one({"_id": ObjectId(partner_id)})
        if partner_user:
            partner_online = partner_user.get("isOnline", False)

    # Find booking_id if confirmed
    booking_id = None
    if job.get("poster_agreed") and job.get("worker_agreed"):
        if "posted_by_name" in job:
            booking_id = job_id
        else:
            booking = db.bookings.find_one({"job_id": job_id})
            if booking:
                booking_id = str(booking["_id"])

    return {
        "allowed": True,
        "role": role,
        "job_id": job_id,
        "booking_id": booking_id,
        "partner_name": partner_name,
        "partner_id": str(partner_id) if partner_id else None,
        "partner_online": partner_online,
        "status": job.get("status"),
        "poster_agreed": job.get("poster_agreed", False),
        "worker_agreed": job.get("worker_agreed", False)
    }


# ─────────────────── GET CHAT HISTORY (secured) ─────────────────────

@router.get("/chat/{job_id}")
def get_chat_history(job_id: str, user=Depends(verify_token)):
    """Only the poster and selected/assigned worker can read chat history."""
    _check_chat_access(job_id, user)

    messages = list(db.messages.find({"job_id": job_id}))

    # convert ObjectId to string
    for msg in messages:
        msg["_id"] = str(msg["_id"])

    return messages


# ─────────────────── SEND MESSAGE (secured) ──────────────────────────

@router.post("/chat/{job_id}")
def send_message(job_id: str, body: ChatMessage, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    """Only the poster and selected/assigned worker can send messages."""
    job, user_id, role = _check_chat_access(job_id, user)

    db_user = db.users.find_one({"email": user["email"]})

    msg = {
        "job_id": job_id,
        "sender_id": user_id,
        "sender_name": db_user.get("name", "Unknown"),
        "message": body.message,
        "imageUrl": body.imageUrl,
        "videoUrl": body.videoUrl,
        "documentUrl": body.documentUrl,
        "fileName": body.fileName,
        "sent_at": datetime.utcnow().isoformat() + "Z",
    }

    result = db.messages.insert_one(msg)
    msg["_id"] = str(result.inserted_id)

    background_tasks.add_task(notify_chat, job_id, msg)

    # Real-time notifications for the other party
    is_urgent = "posted_by_name" in job
    if role == "poster":
        recipient_id = job.get("selected_worker") if is_urgent else job.get("assignedTo")
    else:
        recipient_id = job.get("posted_by") if is_urgent else job.get("postedBy", {}).get("id")

    if recipient_id:
        text_preview = body.message[:50] + "..." if body.message and len(body.message) > 50 else (body.message or "")
        msg_preview = f"{db_user.get('name', 'Someone')}: {text_preview}" if text_preview else f"{db_user.get('name', 'Someone')} sent an attachment."
        background_tasks.add_task(
            notify_user, 
            str(recipient_id), 
            {
                "title": "New Message",
                "message": msg_preview,
                "link": f"/chat/{job_id}"
            }
        )

    return msg


# ─────────────────── CHAT ACTIONS (Negotiation) ──────────────────────

@router.post("/chat/{job_id}/action")
def chat_action(job_id: str, body: ChatAction, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    """Handle poster and worker agreement actions."""
    job, user_id, role = _check_chat_access(job_id, user)
    
    action = body.action
    is_urgent = "posted_by_name" in job
    collection = db.urgent_jobs if is_urgent else db.jobs
    
    db_user = db.users.find_one({"_id": ObjectId(user_id)})
    user_name = db_user.get("name", "Unknown") if db_user else "Unknown"

    system_msg = ""
    
    if role == "poster":
        if action == "poster_accept":
            # Escrow logic
            rate = float(job.get("rate", 0))
            if rate > 0:
                user_balance = db_user.get("wallet_balance", 0.0)
                # if user_balance < rate:
                #     raise HTTPException(
                #         status_code=400, 
                #         detail=f"Insufficient funds. You need ₹{rate} in your wallet to lock in Escrow. Please visit the Payments page."
                #     )
                
                # Lock funds in escrow
                db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$inc": {"wallet_balance": -rate, "escrow_balance": rate}}
                )
                
                from app.services.transaction_service import record_transaction
                record_transaction(user_id, "escrow_lock", -rate, f"Escrow locked for job: {job.get('title', 'Job')}", job_id)
                
                collection.update_one(
                    {"_id": ObjectId(job_id)}, 
                    {"$set": {"poster_agreed": True, "escrow_amount": rate}}
                )
            else:
                collection.update_one({"_id": ObjectId(job_id)}, {"$set": {"poster_agreed": True}})
                
            system_msg = f"SYSTEM: {user_name} has finalized the job offer and locked funds in Escrow. Waiting for worker to accept."
        elif action == "poster_reject":
            # REFUND ESCROW if it was locked
            if job.get("poster_agreed") and job.get("escrow_amount", 0) > 0:
                escrow_amount = job.get("escrow_amount", 0)
                poster_id = job.get("posted_by") if is_urgent else job.get("postedBy", {}).get("id")
                db.users.update_one(
                    {"_id": ObjectId(poster_id)},
                    {"$inc": {"wallet_balance": escrow_amount, "escrow_balance": -escrow_amount}}
                )
                from app.services.transaction_service import record_transaction
                record_transaction(poster_id, "escrow_refund", escrow_amount, f"Escrow refunded for job: {job.get('title')}", job_id)
            
            # Reset job back to open state
            if is_urgent:
                collection.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "open", "selected_worker": None, "selected_worker_name": None, "poster_agreed": False, "worker_agreed": False, "escrow_amount": 0}})
                # Reset urgent jobs applicants status back to pending
                urgent_job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
                if urgent_job:
                    applicants = urgent_job.get("applicants", [])
                    for app in applicants:
                        app["status"] = "pending"
                    db.urgent_jobs.update_one(
                        {"_id": ObjectId(job_id)},
                        {"$set": {"applicants": applicants}}
                    )
            else:
                collection.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "open", "assignedTo": None, "poster_agreed": False, "worker_agreed": False, "escrow_amount": 0}})
                # Reset standard job applications status back to pending
                db.applications.update_many(
                    {"job_id": job_id},
                    {"$set": {"status": "pending"}}
                )
            background_tasks.add_task(broadcast_job_status, job_id, "open")
            system_msg = f"SYSTEM: {user_name} has chosen to look for another worker. The job is now open again. (Any escrowed funds refunded)"
            
    elif role == "worker":
        if action == "worker_accept":
            if not job.get("poster_agreed"):
                raise HTTPException(status_code=400, detail="Poster has not finalized yet")
            
            # 1. Create a Booking record (This is the unique contract for this worker)
            poster_id = job.get("posted_by") if is_urgent else job.get("postedBy", {}).get("id")
            escrow_amount = job.get("escrow_amount", 0)
            
            booking_doc = {
                "job_id": job_id,
                "job_title": job.get("title", "Untitled"),
                "poster_id": poster_id,
                "worker_id": user_id,
                "worker_name": user_name,
                "escrow_amount": escrow_amount,
                "status": "in_progress",
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            booking_res = db.bookings.insert_one(booking_doc)
            booking_id = str(booking_res.inserted_id)

            # 2. Update the Job with this worker in the team list
            hired_list = job.get("hired_workers", [])
            hired_list.append({"user_id": user_id, "booking_id": booking_id, "name": user_name})
            
            max_workers = job.get("max_workers", 1)
            new_status = "filled" if len(hired_list) >= max_workers else "open"
            
            collection.update_one(
                {"_id": ObjectId(job_id)}, 
                {
                    "$set": {
                        "hired_workers": hired_list,
                        "status": new_status,
                        "worker_agreed": True,
                        "last_booking_id": booking_id 
                    }
                }
            )
            background_tasks.add_task(broadcast_job_status, job_id, new_status)
            
            # 3. Update application/applicant statuses
            db_user = db.users.find_one({"_id": ObjectId(user_id)})
            worker_email = db_user.get("email") if db_user else None
            
            if is_urgent:
                # Update urgent jobs applicants statuses
                urgent_job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
                if urgent_job:
                    applicants = urgent_job.get("applicants", [])
                    for app in applicants:
                        if app.get("user_id") == user_id:
                            app["status"] = "accepted"
                        else:
                            app["status"] = "rejected"
                    db.urgent_jobs.update_one(
                        {"_id": ObjectId(job_id)},
                        {"$set": {"applicants": applicants}}
                    )
            else:
                # Standard job: update the applications collection
                if worker_email:
                    db.applications.update_one(
                        {"job_id": job_id, "user_email": worker_email},
                        {"$set": {"status": "accepted"}}
                    )
                    db.applications.update_many(
                        {"job_id": job_id, "user_email": {"$ne": worker_email}},
                        {"$set": {"status": "rejected"}}
                    )
            
            system_msg = f"SYSTEM: {user_name} has joined the team! A unique contract has been created. Tracking for this worker can now begin at Booking #{booking_id}."
        
        elif action == "worker_reject":
            # REFUND ESCROW if poster had locked it
            if job.get("poster_agreed") and job.get("escrow_amount", 0) > 0:
                escrow_amount = job.get("escrow_amount", 0)
                poster_id = job.get("posted_by") if is_urgent else job.get("postedBy", {}).get("id")
                db.users.update_one(
                    {"_id": ObjectId(poster_id)},
                    {"$inc": {"wallet_balance": escrow_amount, "escrow_balance": -escrow_amount}}
                )
                from app.services.transaction_service import record_transaction
                record_transaction(poster_id, "escrow_refund", escrow_amount, f"Escrow refunded (Worker declined) for job: {job.get('title')}", job_id)

            collection.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "open", "poster_agreed": False, "worker_agreed": False, "escrow_amount": 0}})
            # Reset all application statuses to pending
            if is_urgent:
                urgent_job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
                if urgent_job:
                    applicants = urgent_job.get("applicants", [])
                    for app in applicants:
                        app["status"] = "pending"
                    db.urgent_jobs.update_one(
                        {"_id": ObjectId(job_id)},
                        {"$set": {"applicants": applicants}}
                    )
            else:
                db.applications.update_many(
                    {"job_id": job_id},
                    {"$set": {"status": "pending"}}
                )
            background_tasks.add_task(broadcast_job_status, job_id, "open")
            system_msg = f"SYSTEM: {user_name} has declined the offer. The job is now open again."

    if system_msg:
        msg = {
            "job_id": job_id,
            "sender_id": "system",
            "sender_name": "System",
            "message": system_msg,
            "sent_at": datetime.utcnow().isoformat() + "Z",
        }
        result = db.messages.insert_one(msg)
        msg["_id"] = str(result.inserted_id)
    background_tasks.add_task(notify_chat, job_id, msg)
        
    return {"msg": "Action processed successfully", "system_msg": system_msg}