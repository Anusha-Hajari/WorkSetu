from fastapi import APIRouter, Depends, HTTPException
from app.db.database import db
from app.services.auth_service import verify_token
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None


# ── GET MY PROFILE ──────────────────────────────────────────────────
@router.get("/me")
def get_profile(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(db_user["_id"]),
        "name": db_user.get("name", ""),
        "email": db_user.get("email", ""),
        "phone": db_user.get("phone", ""),
        "location": db_user.get("location", ""),
        "skills": db_user.get("skills", []),
        "bio": db_user.get("bio", ""),
        "linkedin": db_user.get("linkedin", ""),
        "website": db_user.get("website", ""),
        "portfolio": db_user.get("portfolio", []),
        "badges": db_user.get("badges", []),
        "role": db_user.get("role", "user"),
        "is_admin": db_user.get("is_admin", False),
        "is_verified": db_user.get("is_verified", False),
        "rating": db_user.get("rating", 0),
        "completedJobs": db_user.get("completedJobs", 0),
    }


# ── UPDATE PROFILE ──────────────────────────────────────────────────
@router.put("/profile")
def update_profile(data: ProfileUpdate, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name
    if data.phone is not None:
        update_fields["phone"] = data.phone
    if data.location is not None:
        update_fields["location"] = data.location
    if data.linkedin is not None:
        update_fields["linkedin"] = data.linkedin
    if data.website is not None:
        update_fields["website"] = data.website
    if data.skills is not None:
        # accept comma-separated string or list
        if isinstance(data.skills, str):
            update_fields["skills"] = [s.strip() for s in data.skills.split(",") if s.strip()]
        else:
            update_fields["skills"] = data.skills
    if data.bio is not None:
        update_fields["bio"] = data.bio

    if not update_fields:
        return {"msg": "Nothing to update"}

    db.users.update_one({"email": user["email"]}, {"$set": update_fields})
    return {"msg": "Profile updated"}

@router.put("/portfolio/add")
def add_portfolio_item(item: dict, user=Depends(verify_token)):
    from bson import ObjectId
    from datetime import datetime
    db.users.update_one(
        {"email": user["email"]},
        {"$push": {"portfolio": {
            "id": str(ObjectId()),
            "title": item.get("title"),
            "description": item.get("description"),
            "imageUrl": item.get("imageUrl"),
            "created_at": datetime.utcnow().isoformat() + "Z"
        }}}
    )
    return {"msg": "Portfolio item added"}

@router.delete("/portfolio/{item_id}")
def delete_portfolio_item(item_id: str, user=Depends(verify_token)):
    db.users.update_one(
        {"email": user["email"]},
        {"$pull": {"portfolio": {"id": item_id}}}
    )
    return {"msg": "Portfolio item removed"}