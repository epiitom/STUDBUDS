from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

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