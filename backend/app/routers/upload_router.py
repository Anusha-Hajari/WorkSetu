from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.services.auth_service import verify_token
from app.services.ai_service import verify_media_authenticity
import os
import uuid
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads")
UPLOAD_DIR = os.path.normpath(UPLOAD_DIR)

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", # Images
    ".mp4", ".mov", ".avi", ".mkv",           # Videos
    ".pdf", ".doc", ".docx", ".txt", ".zip"   # Documents
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # Increase to 50 MB for videos/docs


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(verify_token)):
    """Upload a media file (image/video) and run AI authenticity verification."""
    
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 20 MB.")
    
    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}_{int(datetime.utcnow().timestamp())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Save
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Run AI authenticity verification on images
    media_verdict = {"verdict": "skipped", "confidence": 0, "reason": "Video files skip image analysis."}
    
    if ext in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        media_verdict = verify_media_authenticity(file_path, file.filename)
    
    # Build public URL
    file_url = f"/uploads/{unique_name}"
    
    return {
        "url": file_url,
        "filename": unique_name,
        "original_name": file.filename,
        "size": len(content),
        "media_verdict": media_verdict
    }
