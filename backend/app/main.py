from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import timedelta
from typing import List, Optional
import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv

from . import models, schemas, auth
from .database import get_db, init_db
from .config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Gemini API
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    logger.info("Gemini API initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini API: {str(e)}")
    raise

app = FastAPI(title="Study Planner API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth.verify_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = await db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.on_event("startup")
async def startup_event():
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint to verify API and database status"""
    db_status = "unhealthy"
    gemini_status = "unhealthy"
    
    # Check database connection
    try:
        async for db in get_db():
            # Simple database check
            await db.execute(text("SELECT 1"))
            db_status = "healthy"
            logger.info("Database connection check successful")
            break
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
    
    # Check Gemini API
    try:
        # Test with a simple prompt
        response = model.generate_content("Test connection")
        if response and response.text:
            gemini_status = "healthy"
            logger.info("Gemini API connection check successful")
        else:
            logger.error("Gemini API returned empty response")
    except Exception as e:
        logger.error(f"Gemini API connection check failed: {str(e)}")
    
    return {
        "status": "healthy" if db_status == "healthy" and gemini_status == "healthy" else "unhealthy",
        "database": db_status,
        "gemini_api": gemini_status
    }

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
async def create_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.post("/study-plans/", response_model=schemas.StudyPlan)
async def create_study_plan(
    study_plan: schemas.StudyPlanCreate,
    db: AsyncSession = Depends(get_db)
):
    db_study_plan = models.StudyPlan(**study_plan.dict())
    db.add(db_study_plan)
    await db.commit()
    await db.refresh(db_study_plan)
    return db_study_plan

@app.get("/study-plans/", response_model=List[schemas.StudyPlan])
async def read_study_plans(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    study_plans = await db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == current_user.id
    ).all()
    return study_plans

@app.post("/chat/")
async def chat(message: schemas.ChatMessage):
    try:
        logger.info("Processing chat request")
        
        if not message.message or not message.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Create prompt for Gemini
        prompt = f"""
        You are a helpful study assistant. Please help the student with their question.
        
        Student's question: {message.message}
        """
        
        # Generate response using Gemini
        try:
            response = model.generate_content(prompt)
            if not response or not response.text:
                raise HTTPException(status_code=500, detail="Empty response from Gemini API")
            
            logger.info("Successfully generated response from Gemini API")
            return {"response": response.text}
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 