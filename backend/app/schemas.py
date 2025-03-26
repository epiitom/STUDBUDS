from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class StudyPlanBase(BaseModel):
    exam_date: datetime
    subjects: List[str]
    class_level: str
    study_preferences: Optional[dict] = None

class StudyPlanCreate(StudyPlanBase):
    pass

class StudyPlan(StudyPlanBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str
    subject: Optional[str] = None 