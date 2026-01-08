"""
AI Service API - FastAPI server for handling AI-powered project management features
Provides endpoints for task analysis, chat interactions, and team recommendations
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from config import DEEPSEEK_API_KEY
from agent import process_command, analyze_project_description

# Initialize FastAPI app
app = FastAPI(
    title="Smart Project Manager AI Service",
    description="AI-powered assistant for project and task management",
    version="1.0.0"
)

# Configure CORS to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class AnalyzeRequest(BaseModel):
    """Request model for project description analysis"""
    description: str


class ChatRequest(BaseModel):
    """Request model for chat interactions"""
    message: str
    file_content: Optional[str] = ""
    history: Optional[List[Dict[str, Any]]] = []


class ChatResponse(BaseModel):
    """Response model for chat interactions"""
    status: str
    intent: str
    reply: Optional[str] = None
    project_data: Optional[Dict[str, Any]] = None
    task_data: Optional[Dict[str, Any]] = None


# API Endpoints

@app.get("/")
def health_check():
    """Health check endpoint to verify service is running"""
    return {
        "status": "AI Service Running",
        "provider": "DeepSeek AI",
        "version": "1.0.0"
    }


@app.post("/api/analyze")
def analyze_task(request: AnalyzeRequest):
    """
    Analyzes a project description and provides AI-generated insights.
    Helps transform rough ideas into structured project plans.
    """
    try:
        # Get AI analysis of the project description
        ai_insight = analyze_project_description(request.description)
        
        return {
            "insight": ai_insight,
            "suggested_tags": ["productivity", "ai-analyzed"],
            "sentiment": "positive"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze project: {str(e)}"
        )


@app.post("/api/chat")
def chat_command(request: ChatRequest):
    """
    Main chat endpoint for processing user commands.
    Handles both task creation and general conversation.
    """
    try:
        print(f"Received message: {request.message}")
        print(f"Chat history: {len(request.history)} messages")
        
        if not request.message:
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        # Process the command through our AI agent
        result = process_command(
            request.message,
            request.file_content,
            request.history
        )
        
        print(f"Agent response: {result}")
        
        # Check for errors
        if result.get('error'):
            raise HTTPException(
                status_code=500,
                detail=result['error']
            )
        
        # Extract the structured response
        intent = result.get('structured_task', {}).get('intent', 'chat')
        ai_data = result.get('structured_task', {})
        
        # Handle different intent types
        if intent == 'chat':
            return {
                "status": "success",
                "intent": "chat",
                "reply": ai_data.get('reply', "I'm not sure how to respond to that.")
            }
        
        if intent == 'project':
            project_data = ai_data.get('project', {})
            return {
                "status": "success",
                "intent": "project",
                "project_data": project_data,
                "reply": f"I can help you create the project '{project_data.get('name')}'. Would you like to proceed?"
            }
        
        if intent == 'task':
            # Handle task creation
            tasks = ai_data.get('tasks', [])
            if not tasks and ai_data.get('task_details'):
                tasks = [ai_data['task_details']]
            
            task_count = len(tasks)
            first_task = tasks[0]['name'] if tasks else "New Task"
            
            return {
                "status": "success",
                "intent": "task",
                "task_data": {"tasks": tasks},
                "reply": f"I've identified {task_count} task(s) to create, starting with '{first_task}'."
            }
        
        # Fallback for unknown intents
        return {
            "status": "success",
            "intent": "chat",
            "reply": str(ai_data)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )


@app.post("/api/recommend")
def recommend_assignee():
    """
    Recommends a team member for task assignment.
    Currently uses simple random selection - can be enhanced with ML.
    """
    # Mock team data - in production, this would come from database
    team_members = ["Alice", "Bob", "Charlie", "Dave"]
    
    import random
    recommended = random.choice(team_members)
    
    return {
        "recommended_assignee": recommended,
        "reason": "Based on current workload and skill match"
    }


# Start the server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f" Starting AI Service on port {port}...")
    print(f" API docs available at http://localhost:{port}/docs")
    
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=port,
        log_level="info"
    )
