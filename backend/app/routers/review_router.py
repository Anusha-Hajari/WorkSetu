from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.db.database import db
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime
import asyncio
from app.socket_manager import notify_user

router = APIRouter()

class ReviewSubmit(BaseModel):
    rating: int
    comment: str

@router.post("/{job_id}/review")
def submit_review(job_id: str, body: ReviewSubmit, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_id = str(db_user["_id"])
    user_name = db_user.get("name", "Unknown")
    
    # Verify job exists and is completed
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    is_urgent = False
    if not job:
        job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
        is_urgent = True
        
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Reviews can only be left for completed jobs")
        
    poster_id = job.get("postedBy", {}).get("id") if not is_urgent else job.get("posted_by")
    worker_id = job.get("assignedTo") if not is_urgent else job.get("selected_worker")
    
    if user_id not in [poster_id, worker_id]:
        raise HTTPException(status_code=403, detail="You are not authorized to review this job")
        
    role = "poster" if user_id == poster_id else "worker"
    target_id = worker_id if role == "poster" else poster_id
    
    # Check if review already exists
    existing_review = db.reviews.find_one({"job_id": job_id, "reviewer_id": user_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this job")
        
    review_doc = {
        "job_id": job_id,
        "job_title": job.get("title", "Untitled Job"),
        "reviewer_id": user_id,
        "reviewer_name": user_name,
        "target_id": target_id,
        "role": role,
        "rating": body.rating,
        "comment": body.comment,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    db.reviews.insert_one(review_doc)
    
    # Update target user's average rating
    all_target_reviews = list(db.reviews.find({"target_id": target_id}))
    if all_target_reviews:
        avg_rating = sum(r["rating"] for r in all_target_reviews) / len(all_target_reviews)
        db.users.update_one(
            {"_id": ObjectId(target_id)},
            {"$set": {"rating": round(avg_rating, 1)}}
        )
        
    # Increment completed jobs count for worker if not already done
    if role == "poster":
        db.users.update_one(
            {"_id": ObjectId(worker_id)},
            {"$inc": {"completedJobs": 1}}
        )
    
    # CHECK FOR BADGES
    from app.services.badge_service import check_and_grant_badges
    check_and_grant_badges(target_id)
        
    background_tasks.add_task(notify_user, str(target_id), {
        "title": "New Review",
        "body": f"You received a {body.rating}-star review from {db_user['name']}.",
        "link": "/profile"
    })
        
    return {"msg": "Review submitted successfully!"}

@router.get("/user/{user_id}")
def get_user_reviews(user_id: str):
    reviews = list(db.reviews.find({"target_id": user_id}).sort("created_at", -1))
    for r in reviews:
        r["_id"] = str(r["_id"])
    return reviews

@router.get("/job/{job_id}/my-review")
def check_my_review(job_id: str, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_id = str(db_user["_id"])
    review = db.reviews.find_one({"job_id": job_id, "reviewer_id": user_id})
    
    if review:
        review["_id"] = str(review["_id"])
        return {"has_reviewed": True, "review": review}
    return {"has_reviewed": False}
