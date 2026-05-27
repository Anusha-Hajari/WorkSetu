from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.db.database import db
from app.services.auth_service import verify_token
from bson import ObjectId
from datetime import datetime
import os
import shutil

router = APIRouter()

# Directory for KYC documents
KYC_DIR = "uploads/kyc"
os.makedirs(KYC_DIR, exist_ok=True)

@router.post("/submit")
async def submit_kyc(
    id_type: str = Form(...),
    id_number: str = Form(...),
    id_image: UploadFile = File(...),
    selfie_image: UploadFile = File(...),
    user=Depends(verify_token)
):
    db_user = db.users.find_one({"email": user["email"]})
    user_id = str(db_user["_id"])

    # File paths
    id_filename = f"{user_id}_id_{id_image.filename}"
    selfie_filename = f"{user_id}_selfie_{selfie_image.filename}"
    
    id_path = os.path.join(KYC_DIR, id_filename)
    selfie_path = os.path.join(KYC_DIR, selfie_filename)

    # Save files
    with open(id_path, "wb") as buffer:
        shutil.copyfileobj(id_image.file, buffer)
    with open(selfie_path, "wb") as buffer:
        shutil.copyfileobj(selfie_image.file, buffer)

    # Simulate AI Verification (In a real app, use Face Recognition / OCR)
    # We check if ID number is valid format (simple check)
    is_valid = len(id_number) >= 10 
    
    kyc_doc = {
        "user_id": user_id,
        "id_type": id_type,
        "id_number": id_number,
        "id_image_url": f"/uploads/kyc/{id_filename}",
        "selfie_url": f"/uploads/kyc/{selfie_filename}",
        "status": "verified" if is_valid else "rejected",
        "submitted_at": datetime.utcnow().isoformat() + "Z",
        "verified_at": datetime.utcnow().isoformat() + "Z" if is_valid else None
    }

    db.kyc.update_one({"user_id": user_id}, {"$set": kyc_doc}, upsert=True)
    
    if is_valid:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_verified": True}})
        # Grant a "Identity Pro" badge for verifying
        from app.services.badge_service import BADGE_DEFINITIONS
        badge = BADGE_DEFINITIONS.get("identity_pro", {
            "name": "Verified Pro",
            "icon": "🛡️",
            "description": "Verified identity for maximum trust.",
            "color": "#3b82f6"
        })
        badge["id"] = "identity_pro"
        badge["granted_at"] = datetime.utcnow().isoformat()
        
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"badges": badge}}
        )

    return {
        "status": kyc_doc["status"],
        "msg": "KYC Verified successfully!" if is_valid else "KYC Rejected. Please check ID number."
    }

@router.get("/status")
def get_kyc_status(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    kyc = db.kyc.find_one({"user_id": str(db_user["_id"])})
    if not kyc:
        return {"status": "not_submitted"}
    
    kyc["_id"] = str(kyc["_id"])
    return kyc
