from pydantic import BaseModel, validator
from typing import Optional, Union

ALLOWED_SKILLS = ["coding", "plumbing", "cleaning", "design", "editing", "tutoring"]

class UrgentJobCreate(BaseModel):
    title: str
    skill: str
    description: str

    duration_hours: Union[int, float]   # ✅ flexible
    work_mode: str
    rate: Union[int, float]             # ✅ flexible

    lat: Optional[float] = None
    lon: Optional[float] = None
    location_name: Optional[str] = None

    @validator("skill")
    def normalize_skill(cls, v):
        v = v.lower().strip()
        if v not in ALLOWED_SKILLS:
            raise ValueError("Invalid skill")
        return v

    @validator("work_mode")
    def normalize_work_mode(cls, v):
        return v.lower().strip()