from pydantic import BaseModel
from typing import Optional, List

class JobCreate(BaseModel):
    title: str
    requiredSkill: str
    description: Optional[str] = ""
    company: Optional[str] = ""
    location: Optional[str] = "Remote"
    type: Optional[str] = "hourly"        # "hourly" | "longterm"
    rate: Optional[float] = None
    duration: Optional[str] = None
    skills: Optional[List[str]] = []
    isUrgent: Optional[bool] = False
    max_workers: Optional[int] = 1
    interviewQuestions: Optional[List[str]] = []