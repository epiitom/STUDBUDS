from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from enum import Enum

class VibeLevel(str, Enum):
    MEH = "meh"
    OKAY = "okay"
    GOOD = "good"
    GREAT = "great"
    SUPER_MOTIVATED = "super_motivated"

class StudyChallenge(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str

class Subject(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: Optional[str] = None
    user_id: str

class StudyProfile(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    subjects: List[Subject] = []
    challenges: List[StudyChallenge] = []
    current_vibe: Optional[VibeLevel] = None
    last_vibe_check: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StudyTip(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    content: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    based_on_vibe: VibeLevel
    based_on_subjects: List[str] = []
    based_on_challenges: List[str] = []

class TodoItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TodoList(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: Optional[str] = None
    items: List[TodoItem] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)