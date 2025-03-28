from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv
from datetime import datetime
from typing import List
from bson import ObjectId

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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    priority: str
    created_at: datetime

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
            "completed": False,
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

@app.get("/todolists/", response_model=List[TodoListResponse])
async def get_todolists(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all todo lists"""
    try:
        cursor = db.todolists.find({})
        todolists = []
        async for todolist in cursor:
            # Convert ObjectId to string
            todolist["id"] = str(todolist.pop("_id"))
            # Convert ObjectIds in items
            for item in todolist.get("items", []):
                item["id"] = str(item.pop("_id"))
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
async def chat(message: ChatMessage):
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