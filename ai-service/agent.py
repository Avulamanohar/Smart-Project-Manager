from config import chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from task_agent import run_task_agent
from chat_agent import run_chat_agent

# Use a lightweight prompt (or reuse the model) to classify intent
ROUTER_PROMPT = """Classify the user's intent based on the text.
Return ONLY one word: "TASK" (if they want to create/manage projects/tasks) or "CHAT" (if they are asking questions or chatting).

User Input: {text}
"""

def classify_intent(text: str) -> str:
    # Rule based heuristics for speed
    text_lower = text.lower()
    if any(keyword in text_lower for keyword in ["create", "add task", "new project", "assign", "schedule"]):
        return "TASK"
        
    # Use LLM for ambiguity
    try:
        response = chat_model.invoke([
            SystemMessage(content=ROUTER_PROMPT.replace("{text}", text))
        ])
        content = response.content.strip().upper()
        if "TASK" in content: return "TASK"
        return "CHAT"
    except:
        return "CHAT" # Default fallback


def process_command(text: str, file_content: str = "", history: list = None):
    """
    Orchestrator function that replaces the old LangGraph agent.
    """
    history = history or []
    
    # 1. Determine Intent
    intent = classify_intent(text)
    print(f"DEBUG: Intent classified as {intent}")
    
    # 2. Route to appropriate agent
    if intent == "TASK":
        data = run_task_agent(text, file_content)
        # If task extraction failed or returned error, maybe fall back to chat? 
        # For now, wrap in standard structure
        if "error" in data:
            return {"structured_task": {"intent": "chat", "reply": f"I tried to create a task but failed: {data['error']}"}}
        return {"structured_task": data}
        
    else:
        # Chat
        data = run_chat_agent(text, file_content, history)
        return {"structured_task": data}

def analyze_project_description(description: str) -> str:
    """
    Kept for backward compatibility.
    """
    try:
        messages = [
            SystemMessage(content="""You are an expert Senior Project Manager.
Your goal is to analyze the user's raw input and transform it into a professional, detailed project specification.

1. **Refine the Description**: Create a comprehensive, well-structured description that clearly defines the scope, context, and success criteria.
2. **Identify Key Tasks**: Break the project down into 3-5 actionable subtasks.
3. **Assess Risks**: Briefly mention potential challenges.

Output Format:

### Enhanced Description
[Insert the detailed, professional description here]

### Recommended Subtasks
- [Subtask 1]
- [Subtask 2]
- [Subtask 3]

### Key Insight
[One sentence strategic advice]
"""),
            HumanMessage(content=description)
        ]
        response = chat_model.invoke(messages)
        return response.content
    except Exception as e:
        return f"Analysis failed: {str(e)}"
