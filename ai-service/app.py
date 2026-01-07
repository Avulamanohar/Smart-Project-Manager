
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load .env file first
load_dotenv()

from config import DEEPSEEK_API_KEY
from agent import process_command, analyze_project_description

app = FastAPI(title="AI Service")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Validation ---

class AnalyzeRequest(BaseModel):
    description: str

class ChatRequest(BaseModel):
    message: str
    file_content: Optional[str] = ""
    history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    status: str
    intent: str
    reply: Optional[str] = None
    project_data: Optional[Dict[str, Any]] = None
    task_data: Optional[Dict[str, Any]] = None

# --- Routes ---

@app.get("/")
def health_check():
    return {"status": "AI Service Running", "provider": "HuggingFace Llama-3"}

@app.post("/api/analyze")
def analyze_task(request: AnalyzeRequest):
    try:
        # Use HuggingFace model via agent.py
        ai_insight = analyze_project_description(request.description)
        
        return {
            "insight": ai_insight,
            "suggested_tags": ["productivity", "ai-analyzed"],
            "sentiment": "positive" # Placeholder
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_command(request: ChatRequest):
    try:
        print(f"DEBUG: Processing message: {request.message}")
        print(f"DEBUG: History received: {len(request.history)} items")
        
        if not request.message:
            raise HTTPException(status_code=400, detail="No message provided")
            
        # Call LangGraph Agent
        # process_command expects (text, file_content, history)
        result = process_command(request.message, request.file_content, request.history)
        print(f"DEBUG: Agent Result: {result}")
        
        if result.get('error'):
            raise HTTPException(status_code=500, detail=result['error'])
            
        intent = result.get('structured_task', {}).get('intent', 'chat')
        ai_data = result.get('structured_task', {})
        
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
                "reply": f"I'm ready to create the project '{project_data.get('name')}'. confirm?"
            }
            
        # Task intent
        if intent == 'task':
            tasks = ai_data.get('tasks', [])
            if not tasks and ai_data.get('task_details'):
                tasks = [ai_data['task_details']]
                
            first_task_name = tasks[0]['name'] if tasks else "New Task"
            
            return {
                "status": "success",
                "intent": "task",
                "task_data": { "tasks": tasks }, 
                "reply": f"I've analyzed your request. I found {len(tasks)} task(s) to create, starting with '{first_task_name}'."
            }
        
        # Fallback
        return {
            "status": "success",
            "intent": "chat",
            "reply": str(ai_data)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend")
def recommend_assignee():
    # Keep mock for simplicity unless user provides team data
    team = ["Alice", "Bob", "Charlie", "Dave"]
    import random
    return {
        "recommended_assignee": random.choice(team),
        "reason": "AI analysis suggests this member has the relevant skills."
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting FastAPI server on port {port}...")
    uvicorn.run(app, host='0.0.0.0', port=port)
