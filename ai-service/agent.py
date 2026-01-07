"""
AI Agent Module - Main orchestrator for handling user commands
This module routes user requests to appropriate specialized agents (task or chat)
"""

from config import chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from task_agent import run_task_agent
from chat_agent import run_chat_agent


# Simple prompt for intent classification
ROUTER_PROMPT = """Classify the user's intent based on their message.
Return ONLY one word: "TASK" (if they want to create/manage projects/tasks) or "CHAT" (for general questions).

User Input: {text}
"""


def classify_intent(text: str) -> str:
    """
    Determines whether the user wants to create a task or just chat.
    Uses quick keyword matching first, then falls back to AI if needed.
    """
    text_lower = text.lower()
    
    # Quick check for common task-related keywords
    task_keywords = ["create", "add task", "new project", "assign", "schedule", "deadline"]
    if any(keyword in text_lower for keyword in task_keywords):
        return "TASK"
    
    # For ambiguous cases, ask the AI model
    try:
        response = chat_model.invoke([
            SystemMessage(content=ROUTER_PROMPT.replace("{text}", text))
        ])
        content = response.content.strip().upper()
        
        if "TASK" in content:
            return "TASK"
        return "CHAT"
    except Exception as e:
        # If something goes wrong, default to chat mode
        print(f"Intent classification error: {e}")
        return "CHAT"


def process_command(text: str, file_content: str = "", history: list = None):
    """
    Main entry point for processing user commands.
    Routes to either task creation or general chat based on intent.
    
    Args:
        text: User's message
        file_content: Optional file content if user uploaded something
        history: Chat history for context
    
    Returns:
        Dictionary with structured response including intent and data
    """
    if history is None:
        history = []
    
    # Figure out what the user wants to do
    intent = classify_intent(text)
    print(f"User intent detected: {intent}")
    
    # Route to the right agent
    if intent == "TASK":
        result = run_task_agent(text, file_content)
        
        # Handle errors gracefully
        if "error" in result:
            return {
                "structured_task": {
                    "intent": "chat",
                    "reply": f"Sorry, I had trouble processing that task request: {result['error']}"
                }
            }
        
        return {"structured_task": result}
    
    else:
        # General conversation
        result = run_chat_agent(text, file_content, history)
        return {"structured_task": result}


def analyze_project_description(description: str) -> str:
    """
    Analyzes a project description and provides professional insights.
    This helps transform rough ideas into well-structured project plans.
    
    Args:
        description: Raw project description from user
    
    Returns:
        Enhanced description with subtasks and insights
    """
    try:
        system_prompt = """You are an experienced Project Manager helping to refine project ideas.

Your task is to:
1. Transform the user's rough description into a clear, professional project specification
2. Break it down into 3-5 actionable subtasks
3. Provide one key insight or recommendation

Format your response as:

### Enhanced Description
[Professional description with clear scope and goals]

### Recommended Subtasks
- [Subtask 1]
- [Subtask 2]
- [Subtask 3]

### Key Insight
[One strategic recommendation]
"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=description)
        ]
        
        response = chat_model.invoke(messages)
        return response.content
        
    except Exception as e:
        return f"Unable to analyze project: {str(e)}"
