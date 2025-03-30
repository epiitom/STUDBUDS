from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel

from .database import connect_to_mongo, close_mongo_connection, get_database
from . import schemas

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Gemini API
try:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    logger.info("Gemini API initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini API: {str(e)}")
    raise

app = FastAPI(title="Study Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    allow_credentials=True,
    expose_headers=["*"],
    max_age=3600
)

# Events
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    logger.info("Starting up application...")
    try:
        await connect_to_mongo()
        logger.info("MongoDB connection established successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close connections on shutdown"""
    logger.info("Shutting down application...")
    try:
        await close_mongo_connection()
        logger.info("MongoDB connection closed successfully")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {str(e)}")

# Dependencies
async def get_db() -> AsyncIOMotorDatabase:
    """Get database instance"""
    db = get_database()
    if db is None:
        logger.error("Database connection not available")
        raise HTTPException(status_code=500, detail="Database connection not available")
    return db

# Add this function to get user ID from header
async def get_current_user(user_id: Optional[str] = Header(None)) -> str:
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID is required")
    return user_id

class ChatMessage(schemas.ChatMessage):
    message: str

class TodoListCreate(schemas.TodoListCreate):
    title: str
    description: str

class TodoListResponse(schemas.TodoListResponse):
    id: str
    title: str
    description: str
    items: List[dict]
    created_at: datetime
    user_id: str

class TodoItemCreate(schemas.TodoItemCreate):
    title: str
    description: str
    due_date: datetime
    priority: str

class TodoItemResponse(schemas.TodoItemResponse):
    id: str
    title: str
    description: str
    due_date: datetime
    completed: bool
    deleted: bool
    priority: str
    created_at: datetime

class TodoItemUpdate(schemas.TodoItemUpdate):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    deleted: Optional[bool] = None
    priority: Optional[str] = None

class ChatContext(BaseModel):
    vibe: Optional[str] = None
    subjects: List[str] = []
    challenges: List[str] = []

class ChatRequest(BaseModel):
    message: str
    context: Optional[ChatContext] = None

# TodoList endpoints
@app.post("/todolists/", response_model=TodoListResponse)
async def create_todolist(
    todolist: TodoListCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new todo list"""
    try:
        # Create the todo list document
        todolist_dict = {
            "title": todolist.title,
            "description": todolist.description,
            "items": [],
            "created_at": datetime.utcnow(),
            "user_id": "temp_user"  # Replace with actual user ID when auth is implemented
        }
        
        # Insert into database
        result = await db.todolists.insert_one(todolist_dict)
        
        # Get the created todo list
        created_todolist = await db.todolists.find_one({"_id": result.inserted_id})
        if created_todolist:
            # Convert ObjectId to string for the response
            created_todolist["id"] = str(created_todolist.pop("_id"))
            return created_todolist
        
        raise HTTPException(status_code=404, detail="Todo list not found after creation")
    except Exception as e:
        logger.error(f"Error creating todo list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/todolists/{todolist_id}/items/", response_model=TodoItemResponse)
async def add_todo_item(
    todolist_id: str,
    item: TodoItemCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Add a new item to a todo list"""
    try:
        # Create the todo item
        todo_item = {
            "_id": ObjectId(),
            "title": item.title,
            "description": item.description,
            "due_date": item.due_date,
            "completed": item.completed,
            "deleted": item.deleted,
            "priority": item.priority,
            "created_at": datetime.utcnow()
        }
        
        # Add item to the todo list
        result = await db.todolists.update_one(
            {"_id": ObjectId(todolist_id)},
            {"$push": {"items": todo_item}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Todo list not found")
        
        # Convert ObjectId to string for the response
        todo_item["id"] = str(todo_item.pop("_id"))
        return todo_item
    except Exception as e:
        logger.error(f"Error adding todo item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/todolists/{todolist_id}/items/{item_id}", response_model=TodoItemResponse)
async def update_todo_item(
    todolist_id: str,
    item_id: str,
    item: TodoItemUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a todo item"""
    try:
        update_fields = {}
        if item.title is not None:
            update_fields["items.$.title"] = item.title
        if item.description is not None:
            update_fields["items.$.description"] = item.description
        if item.due_date is not None:
            update_fields["items.$.due_date"] = item.due_date
        if item.completed is not None:
            update_fields["items.$.completed"] = item.completed
        if item.deleted is not None:
            update_fields["items.$.deleted"] = item.deleted
        if item.priority is not None:
            update_fields["items.$.priority"] = item.priority

        result = await db.todolists.update_one(
            {
                "_id": ObjectId(todolist_id),
                "items._id": ObjectId(item_id)
            },
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Todo item not found")
        
        # Get the updated item
        todolist = await db.todolists.find_one(
            {"_id": ObjectId(todolist_id)},
            {"items": {"$elemMatch": {"_id": ObjectId(item_id)}}}
        )
        
        if not todolist or not todolist.get("items"):
            raise HTTPException(status_code=404, detail="Todo item not found")
        
        updated_item = todolist["items"][0]
        updated_item["id"] = str(updated_item.pop("_id"))
        return updated_item
    except Exception as e:
        logger.error(f"Error updating todo item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/todolists/", response_model=List[TodoListResponse])
async def get_todolists(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all todo lists"""
    try:
        cursor = db.todolists.find({})
        todolists = []
        async for todolist in cursor:
            # Convert ObjectId to string
            todolist["id"] = str(todolist.pop("_id"))
            # Convert ObjectIds in items and filter out deleted items
            todolist["items"] = [
                {**item, "id": str(item.pop("_id"))}
                for item in todolist.get("items", [])
                if not item.get("deleted", False)
            ]
            todolists.append(todolist)
        return todolists
    except Exception as e:
        logger.error(f"Error fetching todo lists: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify API and database status"""
    db_status = "unhealthy"
    gemini_status = "unhealthy"
    
    # Check database connection
    try:
        db = get_database()
        if db:
            await db.command("ping")
            db_status = "healthy"
            logger.info("Database health check: OK")
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
    
    # Check Gemini API
    try:
        response = model.generate_content("Test connection")
        if response and response.text:
            gemini_status = "healthy"
            logger.info("Gemini API health check: OK")
    except Exception as e:
        logger.error(f"Gemini API health check failed: {str(e)}")
    
    return {
        "status": "healthy" if db_status == "healthy" and gemini_status == "healthy" else "unhealthy",
        "database": db_status,
        "gemini_api": gemini_status
    }

# Chat endpoint
@app.post("/chat/")
async def chat(request: ChatRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        logger.info("Processing chat request")
        
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Create context-aware prompt for Gemini
        context_str = ""
        if request.context:
            context_str = f"""
            Current Mood: {request.context.vibe or 'neutral'}
            Subjects: {', '.join(request.context.subjects) if request.context.subjects else 'Not specified'}
            Challenges: {', '.join(request.context.challenges) if request.context.challenges else 'Not specified'}
            """
        
        prompt = f"""
        You are a helpful study assistant. Please help the student with their question.
        Consider their current state and provide personalized advice.
        
        {context_str}
        
        Student's question: {request.message}
        
        Please provide a response that:
        1. Directly addresses their question
        2. Takes into account their current mood and challenges
        3. Suggests study strategies relevant to their subjects
        4. Maintains an encouraging and supportive tone
        
        Format your response as bullet points, with each point on a new line starting with a bullet point (•).
        Keep each point concise and actionable.
        """
        
        # Generate response using Gemini
        try:
            response = model.generate_content(prompt)
            if not response or not response.text:
                raise HTTPException(status_code=500, detail="Empty response from Gemini API")
            
            logger.info("Successfully generated response from Gemini API")
            return {"response": response.text}
        except Exception as e:
            logger.error(f"Error generating response from Gemini API: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate response")
            
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Study Profile endpoints
@app.post("/study-profile/", response_model=schemas.StudyProfileResponse)
async def create_study_profile(
    profile: schemas.StudyProfileCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new study profile for a user"""
    try:
        # Create the study profile document
        profile_dict = {
            "user_id": user_id,  # Use the Clerk user ID
            "subjects": [
                {
                    "_id": ObjectId(),
                    "name": subject.name,
                    "description": subject.description,
                    "user_id": user_id
                }
                for subject in profile.subjects
            ],
            "challenges": [
                {
                    "_id": ObjectId(),
                    "description": challenge.description,
                    "created_at": datetime.utcnow(),
                    "user_id": user_id
                }
                for challenge in profile.challenges
            ],
            "current_vibe": profile.current_vibe,
            "last_vibe_check": datetime.utcnow() if profile.current_vibe else None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Check if profile already exists for this user
        existing_profile = await db.study_profiles.find_one({"user_id": user_id})
        if existing_profile:
            raise HTTPException(status_code=400, detail="Study profile already exists for this user")
        
        # Insert into database
        result = await db.study_profiles.insert_one(profile_dict)
        
        # Get the created profile
        created_profile = await db.study_profiles.find_one({"_id": result.inserted_id})
        if created_profile:
            created_profile["id"] = str(created_profile.pop("_id"))
            for subject in created_profile["subjects"]:
                subject["id"] = str(subject.pop("_id"))
            for challenge in created_profile["challenges"]:
                challenge["id"] = str(challenge.pop("_id"))
            return created_profile
        
        raise HTTPException(status_code=404, detail="Study profile not found after creation")
    except Exception as e:
        logger.error(f"Error creating study profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/study-profile/{profile_id}/vibe", response_model=schemas.StudyProfileResponse)
async def update_vibe_check(
    profile_id: str,
    vibe: schemas.VibeLevel,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update the user's current vibe"""
    try:
        result = await db.study_profiles.update_one(
            {"_id": ObjectId(profile_id)},
            {
                "$set": {
                    "current_vibe": vibe,
                    "last_vibe_check": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Study profile not found")
        
        updated_profile = await db.study_profiles.find_one({"_id": ObjectId(profile_id)})
        updated_profile["id"] = str(updated_profile.pop("_id"))
        return updated_profile
    except Exception as e:
        logger.error(f"Error updating vibe check: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/study-profile/{profile_id}/subjects/", response_model=schemas.SubjectResponse)
async def add_subject(
    profile_id: str,
    subject: schemas.SubjectCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Add a new subject to the study profile"""
    try:
        subject_dict = {
            "_id": ObjectId(),
            "name": subject.name,
            "description": subject.description,
            "user_id": "temp_user"  # Replace with actual user ID when auth is implemented
        }
        
        result = await db.study_profiles.update_one(
            {"_id": ObjectId(profile_id)},
            {
                "$push": {"subjects": subject_dict},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Study profile not found")
        
        subject_dict["id"] = str(subject_dict.pop("_id"))
        return subject_dict
    except Exception as e:
        logger.error(f"Error adding subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/study-profile/{profile_id}/challenges/", response_model=schemas.StudyChallengeResponse)
async def add_challenge(
    profile_id: str,
    challenge: schemas.StudyChallengeCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Add a new study challenge to the profile"""
    try:
        challenge_dict = {
            "_id": ObjectId(),
            "description": challenge.description,
            "created_at": datetime.utcnow(),
            "user_id": "temp_user"  # Replace with actual user ID when auth is implemented
        }
        
        result = await db.study_profiles.update_one(
            {"_id": ObjectId(profile_id)},
            {
                "$push": {"challenges": challenge_dict},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Study profile not found")
        
        challenge_dict["id"] = str(challenge_dict.pop("_id"))
        return challenge_dict
    except Exception as e:
        logger.error(f"Error adding challenge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/study-tips/", response_model=schemas.StudyTipResponse)
async def generate_study_tip(
    tip_request: schemas.StudyTipCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Generate a personalized study tip based on user's profile"""
    try:
        # Get the user's study profile
        profile = await db.study_profiles.find_one({"user_id": "temp_user"})  # Replace with actual user ID
        if not profile:
            raise HTTPException(status_code=404, detail="Study profile not found")
        
        # Create prompt for Gemini
        prompt = f"""
        Generate a personalized study tip for a student with the following characteristics:
        
        Current Vibe: {tip_request.based_on_vibe}
        Subjects: {', '.join(profile['subjects']) if profile.get('subjects') else 'Not specified'}
        Challenges: {', '.join(profile['challenges']) if profile.get('challenges') else 'Not specified'}
        
        Please provide a specific, actionable study tip that:
        1. Directly addresses their current subjects and challenges
        2. Takes into account their current mood
        3. Provides concrete, actionable steps
        4. Maintains an encouraging and supportive tone
        
        Format your response as bullet points, with each point on a new line starting with a bullet point (•).
        Keep each point concise and actionable.
        """
        
        # Generate response using Gemini
        response = model.generate_content(prompt)
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Failed to generate study tip")
        
        # Create study tip document
        tip_dict = {
            "user_id": "temp_user",  # Replace with actual user ID
            "content": response.text,
            "generated_at": datetime.utcnow(),
            "based_on_vibe": tip_request.based_on_vibe,
            "based_on_subjects": [subject['name'] for subject in profile.get('subjects', [])],
            "based_on_challenges": [challenge['description'] for challenge in profile.get('challenges', [])]
        }
        
        # Insert into database
        result = await db.study_tips.insert_one(tip_dict)
        
        # Get the created tip
        created_tip = await db.study_tips.find_one({"_id": result.inserted_id})
        if created_tip:
            created_tip["id"] = str(created_tip.pop("_id"))
            return created_tip
        
        raise HTTPException(status_code=404, detail="Study tip not found after creation")
    except Exception as e:
        logger.error(f"Error generating study tip: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/study-tips/", response_model=List[schemas.StudyTipResponse])
async def get_study_tips(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all study tips for a user"""
    try:
        cursor = db.study_tips.find({"user_id": user_id})
        tips = []
        async for tip in cursor:
            tip["id"] = str(tip.pop("_id"))
            tips.append(tip)
        return tips
    except Exception as e:
        logger.error(f"Error fetching study tips: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add a new endpoint to get user's study profile
@app.get("/study-profile/", response_model=schemas.StudyProfileResponse)
async def get_study_profile(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get the study profile for the current user"""
    try:
        profile = await db.study_profiles.find_one({"user_id": user_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Study profile not found")
        
        profile["id"] = str(profile.pop("_id"))
        for subject in profile["subjects"]:
            subject["id"] = str(subject.pop("_id"))
        for challenge in profile["challenges"]:
            challenge["id"] = str(challenge.pop("_id"))
        return profile
    except Exception as e:
        logger.error(f"Error fetching study profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/study-profile/", response_model=schemas.StudyProfileResponse)
async def update_study_profile(
    profile: schemas.StudyProfileUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update the study profile for the current user"""
    try:
        logger.info(f"Updating study profile for user {user_id} with data: {profile}")
        
        # Check if profile exists
        existing_profile = await db.study_profiles.find_one({"user_id": user_id})
        
        if not existing_profile:
            # If profile doesn't exist, create a new one
            profile_dict = {
                "user_id": user_id,
                "subjects": [
                    {
                        "_id": ObjectId(),
                        "name": subject,
                        "description": None,
                        "user_id": user_id
                    }
                    for subject in (profile.subjects or [])
                ],
                "challenges": [
                    {
                        "_id": ObjectId(),
                        "description": challenge,
                        "created_at": datetime.utcnow(),
                        "user_id": user_id
                    }
                    for challenge in (profile.challenges or [])
                ],
                "current_vibe": profile.current_vibe,
                "last_vibe_check": datetime.utcnow() if profile.current_vibe else None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db.study_profiles.insert_one(profile_dict)
            created_profile = await db.study_profiles.find_one({"_id": result.inserted_id})
            if created_profile:
                created_profile["id"] = str(created_profile.pop("_id"))
                for subject in created_profile["subjects"]:
                    subject["id"] = str(subject.pop("_id"))
                for challenge in created_profile["challenges"]:
                    challenge["id"] = str(challenge.pop("_id"))
                return created_profile
        else:
            # If profile exists, update it
            update_fields = {}
            if profile.subjects is not None:
                update_fields["subjects"] = [
                    {
                        "_id": ObjectId(),
                        "name": subject,
                        "description": None,
                        "user_id": user_id
                    }
                    for subject in profile.subjects
                ]
            if profile.challenges is not None:
                update_fields["challenges"] = [
                    {
                        "_id": ObjectId(),
                        "description": challenge,
                        "created_at": datetime.utcnow(),
                        "user_id": user_id
                    }
                    for challenge in profile.challenges
                ]
            if profile.current_vibe is not None:
                update_fields["current_vibe"] = profile.current_vibe
                update_fields["last_vibe_check"] = datetime.utcnow()
            
            update_fields["updated_at"] = datetime.utcnow()
            
            result = await db.study_profiles.update_one(
                {"user_id": user_id},
                {"$set": update_fields}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail="Failed to update study profile")
            
            # Get the updated profile
            updated_profile = await db.study_profiles.find_one({"user_id": user_id})
            if updated_profile:
                updated_profile["id"] = str(updated_profile.pop("_id"))
                for subject in updated_profile["subjects"]:
                    subject["id"] = str(subject.pop("_id"))
                for challenge in updated_profile["challenges"]:
                    challenge["id"] = str(challenge.pop("_id"))
                return updated_profile
        
        raise HTTPException(status_code=404, detail="Study profile not found after update")
    except Exception as e:
        logger.error(f"Error updating study profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Study Tips endpoints
@app.post("/study-tips/generate/", response_model=schemas.StudyTipResponse)
async def generate_study_tip(
    tip_request: schemas.StudyTipCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Generate a personalized study tip based on user's profile"""
    try:
        logger.info(f"Generating study tip for user {user_id} with data: {tip_request}")
        
        # Get the user's study profile
        profile = await db.study_profiles.find_one({"user_id": user_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Study profile not found")
        
        # Create prompt for Gemini
        prompt = f"""
        Generate a personalized study tip for a student with the following characteristics:
        
        Current Vibe: {tip_request.based_on_vibe}
        Subjects: {', '.join(tip_request.based_on_subjects) if tip_request.based_on_subjects else 'Not specified'}
        Challenges: {', '.join(tip_request.based_on_challenges) if tip_request.based_on_challenges else 'Not specified'}
        
        Please provide a specific, actionable study tip that:
        1. Directly addresses their current subjects and challenges
        2. Takes into account their current mood
        3. Provides concrete, actionable steps
        4. Maintains an encouraging and supportive tone
        
        Format your response as bullet points, with each point on a new line starting with a bullet point (•).
        Keep each point concise and actionable.
        """
        
        # Generate response using Gemini
        response = model.generate_content(prompt)
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Failed to generate study tip")
        
        # Create study tip document
        tip_dict = {
            "user_id": user_id,
            "content": response.text,
            "generated_at": datetime.utcnow(),
            "based_on_vibe": tip_request.based_on_vibe,
            "based_on_subjects": tip_request.based_on_subjects,
            "based_on_challenges": tip_request.based_on_challenges
        }
        
        # Insert into database
        result = await db.study_tips.insert_one(tip_dict)
        
        # Get the created tip
        created_tip = await db.study_tips.find_one({"_id": result.inserted_id})
        if created_tip:
            created_tip["id"] = str(created_tip.pop("_id"))
            return created_tip
        
        raise HTTPException(status_code=404, detail="Study tip not found after creation")
    except Exception as e:
        logger.error(f"Error generating study tip: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/study-tips/", response_model=List[schemas.StudyTipResponse])
async def get_study_tips(
    user_id: str = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all study tips for a user"""
    try:
        cursor = db.study_tips.find({"user_id": user_id})
        tips = []
        async for tip in cursor:
            tip["id"] = str(tip.pop("_id"))
            tips.append(tip)
        return tips
    except Exception as e:
        logger.error(f"Error fetching study tips: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "_main_":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)