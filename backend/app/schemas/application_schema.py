from typing import Optional, List
from pydantic import BaseModel

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = ""
    experience: Optional[str] = ""
    rate: Optional[float] = None
    interview_answers: Optional[List[dict]] = None # [{question: str, answer: str}]