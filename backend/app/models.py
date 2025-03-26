from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    study_plans = relationship("StudyPlan", back_populates="user")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    exam_date = Column(String)  # Store as string for simplicity
    subjects = Column(JSON)  # Store as JSON array
    class_level = Column(String)
    study_preferences = Column(JSON, nullable=True)  # Store as JSON object
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Make user_id optional
    user = relationship("User", back_populates="study_plans") 