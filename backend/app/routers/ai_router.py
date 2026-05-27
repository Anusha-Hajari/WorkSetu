from fastapi import APIRouter
from app.services.ai_service import rank_users

router = APIRouter()

@router.post("/ai-match")
def ai_match(users: list):
    return rank_users(users)