import json
import datetime
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from config import chat_model

TASK_PROMPT = """You are a specialized Task Extension Agent. Your ONLY goal is to extract structured project or task information from user input.

Current Date: {current_date}

Output a JSON object with the "intent" set to "task" (or "project") and the details.

IMPORTANT: If the user provided description is brief, you MUST expand it into a DETAILED, PROFESSIONAL description. Include context, potential requirements, or next steps to make the task clear.

Format for "task":
{{
    "intent": "task",
    "tasks": [
        {{
            "name": "Task Name",
            "description": "Detailed, professional description of the task requirements and context (2-3 sentences minimum)",
            "deadline": "YYYY-MM-DD",
            "priority": "low/medium/high",
            "assignee_role": "Role (e.g. Developer, Designer)",
            "project_name": "Project Name (or null)"
        }}
    ]
}}

Format for "project":
{{
    "intent": "project",
    "project": {{
        "name": "Project Name",
        "description": "Comprehensive project overview including goals and scope",
        "deadline": "YYYY-MM-DD"
    }}
}}

Example Input: "Add a high priority task to fix the header bug by Friday."
Example Output: {{ "intent": "task", "tasks": [ {{ "name": "Fix header bug", "description": "Investigate and resolve the visual alignment issue in the site header. Ensure responsive behavior across mobile and desktop. Verify fix with regression testing.", "priority": "high", "deadline": "Next Friday's Date", ... }} ] }}

Return ONLY the JSON. Do not add conversational filler.
"""

def extract_json(content: str):
    """Robust JSON extraction."""
    import re
    # Strip code blocks
    pattern = r"```json\s*(.*?)\s*```"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        content = match.group(1)
    
    # Try parsing
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Fallback: finding first { and last }
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != -1:
            try:
                return json.loads(content[start:end])
            except:
                pass
    return None

def run_task_agent(text: str, file_content: str = "") -> dict:
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", TASK_PROMPT),
        ("user", "File Context: {file_content}\n\nUser Request: {text}")
    ])
    
    chain = prompt | chat_model
    
    try:
        response = chain.invoke({
            "text": text,
            "file_content": file_content[:5000], # Truncate for safety
            "current_date": current_date
        })
        
        data = extract_json(response.content)
        if not data:
             return {"error": "Failed to parse task data", "raw": response.content}
             
        return data
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
