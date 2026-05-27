from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserModel(BaseModel):
    name: str
    email: EmailStr
    password: str

    role: str = "job_seeker"

    skills: List[str] = []
    rating: float = 0.0
    completed_jobs: int = 0

    availability: Optional[List[dict]] = []

    portfolio_links: Optional[List[str]] = []

    created_at: datetime = Field(default_factory=datetime.utcnow)