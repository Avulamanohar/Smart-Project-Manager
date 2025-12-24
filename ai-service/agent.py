import os
import json
import datetime
from typing import TypedDict, Annotated, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from config import HUGGINGFACEHUB_API_TOKEN

# Ensure token is in env for LangChain
os.environ["HUGGINGFACEHUB_API_TOKEN"] = HUGGINGFACEHUB_API_TOKEN

# Define State
class AgentState(TypedDict):
    text: str
    file_content: str
    structured_task: Dict[str, Any]
    error: str

# Initialize Model
# Using a model known for good instruction following on HF Inference API
repo_id = "meta-llama/Llama-3.1-8B-Instruct"

llm = HuggingFaceEndpoint(
    repo_id=repo_id,
    task="text-generation",
    max_new_tokens=4096,
    do_sample=False,
    temperature=0.1,
)

chat_model = ChatHuggingFace(llm=llm)

# System Prompt
# System Prompt
SYSTEM_PROMPT = """You are a smart project management assistant. Your goal is to help the user by either creating one or more tasks, or answering a question based on the provided context.
Current Date: {current_date}

You must return a valid JSON object with the following structure.
Determine the user's INTENT: either "task" (to create tasks) or "chat" (to answer a question).

If INTENT is "task":
{{
    "intent": "task",
    "tasks": [
        {{
            "name": "Task Name",
            "description": "...",
            "deadline": "YYYY-MM-DD",
            "priority": "low/medium/high",
            "assignee_role": "Role",
            "project_name": "Project Name (or null)"
        }}
    ]
}}

If INTENT is "chat":
{{
    "intent": "chat",
    "reply": "Your helpful response here. If the user provided a file/context, use it to answer."
}}

Context/File Content (if any):
{file_content}

Example Input: "Create a task to fix the login bug."
Example Output: {{ "intent": "task", "tasks": [ {{ "name": "Fix Login Bug", ... }} ] }}

Example Input: "Create 3 tasks: A, B, and C."
Example Output: {{ "intent": "task", "tasks": [ {{ "name": "A", ... }}, {{ "name": "B", ... }}, {{ "name": "C", ... }} ] }}

Return ONLY the JSON.
"""

def valid_json_check(content: str) -> Dict[str, Any]:
    print(f"DEBUG - Raw AI Content: {content}")
    try:
        # 1. Strip markdown code blocks if present
        import re
        pattern = r"```json\s*(.*?)\s*```"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            content = match.group(1) # Continue processing inner content

        # 2. Try standard parsing
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
            
        # 3. Handle Concatenated JSON objects (e.g. {...} {...})
        # Find all top-level JSON objects
        json_objects = []
        decoder = json.JSONDecoder()
        pos = 0
        while pos < len(content):
            try:
                # Skip whitespace
                while pos < len(content) and content[pos].isspace():
                    pos += 1
                if pos >= len(content):
                    break
                    
                obj, end_pos = decoder.raw_decode(content[pos:])
                json_objects.append(obj)
                pos += end_pos
            except json.JSONDecodeError:
                pos += 1 # Move forward significantly or break if garbage
                
        if len(json_objects) > 0:
            # If we found multiple objects, merge them into a tasks list structure
            # Check if they are task intents
            tasks = []
            for obj in json_objects:
                if obj.get('intent') == 'task':
                    if 'tasks' in obj:
                        tasks.extend(obj['tasks'])
                    elif 'task_details' in obj:
                        tasks.append(obj['task_details'])
            
            if tasks:
                return {"intent": "task", "tasks": tasks}
            
            # If just one valid object found (and standard parse failed due to noise), return it
            if len(json_objects) == 1:
                return json_objects[0]

        # 4. Handle Truncated JSON (Try to close list)
        # Check if it looks like a task list that got cut off
        if '"tasks": [' in content:
            # Try appending closing brackets sequences
            for closer in [']}', ']}', '"]}', '"]']:
                try:
                    return json.loads(content + closer)
                except json.JSONDecodeError:
                    continue
            
            # If simple closing failed, try to salvage valid objects from the list string manually
            # This is complex but useful for partial results
            try:
                # Extract the "tasks": [...] part
                start_tasks = content.find('"tasks": [') + 10
                partial_list_str = content[start_tasks:]
                
                # Recover objects loop
                recovered_tasks = []
                decoder = json.JSONDecoder()
                p_pos = 0
                while p_pos < len(partial_list_str):
                    try:
                        # Skip whitespace/commas/brackets
                        while p_pos < len(partial_list_str) and (partial_list_str[p_pos].isspace() or partial_list_str[p_pos] in ',['):
                            p_pos += 1
                        if p_pos >= len(partial_list_str): break
                        
                        obj, end_pos = decoder.raw_decode(partial_list_str[p_pos:])
                        recovered_tasks.append(obj)
                        p_pos += end_pos
                    except json.JSONDecodeError:
                        p_pos += 1
                
                if recovered_tasks:
                    print(f"Recovered {len(recovered_tasks)} tasks from truncated JSON")
                    return {"intent": "task", "tasks": recovered_tasks}

            except Exception as e:
                print(f"Truncated recovery failed: {e}")

        # 5. Try regex to finding the first '{' and last '}' as fallback
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end != -1:
            json_str = content[start:end]
            return json.loads(json_str)

        return None
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return None

# Nodes
def extraction_node(state: AgentState):
    user_text = state['text']
    # content from file upload, if processed by backend
    file_content = state.get('file_content', '') 
    
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # Truncate file content if too long to avoid context limits (naive)
    if len(file_content) > 10000:
        file_content = file_content[:10000] + "...(truncated)"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", "{input}")
    ])
    
    chain = prompt | chat_model
    
    try:
        response = chain.invoke({
            "input": user_text, 
            "current_date": current_date,
            "file_content": file_content or "No file attached."
        })
        content = response.content
        
        data = valid_json_check(content)
        
        if not data:
            # Fallback: If AI didn't return JSON, assume it's a chat reply
            # This logic prevents 500 errors when the model just chats naturally
            print("Fallback: JSON parsing failed, treating as chat reply.")
            fallback_data = {
                "intent": "chat",
                "reply": content
            }
            return {"structured_task": fallback_data, "error": None}
            
        return {"structured_task": data, "error": None}
        
    except Exception as e:
        return {"error": str(e), "structured_task": {}}

# Graph Construction
workflow = StateGraph(AgentState)

workflow.add_node("extract", extraction_node)
workflow.set_entry_point("extract")
workflow.add_edge("extract", END)

app_graph = workflow.compile()

def process_command(text: str, file_content: str = ""):
    """
    Entry point for the Flask app to call.
    """
    inputs = {"text": text, "file_content": file_content, "structured_task": {}, "error": None}
    result = app_graph.invoke(inputs)
    return result

def analyze_project_description(description: str) -> str:
    """
    Analyzes a project description using the HF model.
    """
    prompt_msg = f"Analyze this project description and provide 3 key subtasks and a risk assessment. Be concise.\n\nDescription: {description}"
    try:
        # Use chat_model which handles the message formatting required by the API
        response = chat_model.invoke([HumanMessage(content=prompt_msg)])
        return response.content
    except Exception as e:
        return f"Analysis failed: {str(e)}"
