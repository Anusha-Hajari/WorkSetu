from fastapi import APIRouter, Depends, HTTPException
from app.db.database import db
from app.services.auth_service import verify_token
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime

router = APIRouter()


class BookingCreate(BaseModel):
    jobId: str
    date: str
    time: str
    notes: Optional[str] = ""


# ── CREATE BOOKING ──────────────────────────────────────────────────
@router.post("")
def create_booking(data: BookingCreate, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        job = db.jobs.find_one({"_id": ObjectId(data.jobId)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    booking = {
        "job_id": data.jobId,
        "job_title": job.get("title", "Untitled"),
        "user_email": user["email"],
        "user_name": db_user.get("name", ""),
        "date": data.date,
        "time": data.time,
        "notes": data.notes,
        "status": "confirmed",
        "created_at": datetime.utcnow().isoformat(),
    }

    result = db.bookings.insert_one(booking)
    booking["_id"] = str(result.inserted_id)

    # Mark slot as booked on the job
    db.jobs.update_one(
        {"_id": ObjectId(data.jobId)},
        {"$push": {"bookedSlots": {"date": data.date, "time": data.time}}}
    )

    return booking


# ── MY BOOKINGS ─────────────────────────────────────────────────────
@router.get("/my-bookings")
def get_my_bookings(user=Depends(verify_token)):
    bookings = list(db.bookings.find({"user_email": user["email"]}).sort("created_at", -1))
    for b in bookings:
        b["_id"] = str(b["_id"])
    return bookings


# ── GET BOOKING BY ID ───────────────────────────────────────────────
@router.get("/{booking_id}")
def get_booking(booking_id: str, user=Depends(verify_token)):
    try:
        booking = db.bookings.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking ID")

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking["_id"] = str(booking["_id"])
    return booking
