from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from enum import Enum

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# TodoItem schemas
class TodoItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    completed: bool = False
    deleted: bool = False

class TodoItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    deleted: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")

class TodoItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool
    deleted: bool
    priority: Optional[str] = None
    created_at: datetime

# TodoList schemas
class TodoListCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TodoListUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class TodoListResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    items: List[TodoItemResponse]
    created_at: datetime
    user_id: str

# Chat schema (keeping this from the previous implementation)
class ChatMessage(BaseModel):
    message: str

class VibeLevel(str, Enum):
    MEH = "meh"
    OKAY = "okay"
    GOOD = "good"
    GREAT = "great"
    SUPER_MOTIVATED = "super_motivated"

# Study Profile schemas
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class SubjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    user_id: str

class StudyChallengeCreate(BaseModel):
    description: str

class StudyChallengeResponse(BaseModel):
    id: str
    description: str
    created_at: datetime
    user_id: str

class StudyProfileCreate(BaseModel):
    subjects: List[str] = []
    challenges: List[str] = []
    current_vibe: Optional[VibeLevel] = None

class StudyProfileUpdate(BaseModel):
    subjects: Optional[List[str]] = None
    challenges: Optional[List[str]] = None
    current_vibe: Optional[VibeLevel] = None

class StudyProfileResponse(BaseModel):
    id: str
    user_id: str
    subjects: List[SubjectResponse]
    challenges: List[StudyChallengeResponse]
    current_vibe: Optional[VibeLevel]
    last_vibe_check: Optional[datetime]
    created_at: datetime
    updated_at: datetime

# Study Tip schemas
class StudyTipCreate(BaseModel):
    based_on_vibe: VibeLevel
    based_on_subjects: List[str] = []
    based_on_challenges: List[str] = []

class StudyTipResponse(BaseModel):
    id: str
    user_id: str
    content: str
    generated_at: datetime
    based_on_vibe: VibeLevel
    based_on_subjects: List[str]
    based_on_challenges: List[str]