from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

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

class TodoItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")

class TodoItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool
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