import datetime
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from config import chat_model

CHAT_PROMPT = """You are a smart, helpful project management assistant.
Your goal is to answer user questions, provide insights, or chat in a friendly manner.

Current Date: {current_date}

Context/History:
{history_context}

File Context (if any):
{file_content}

User Input: {text}

Provide a helpful, concise response. Do NOT try to generate JSON for tasks; just talk to the user.
"""

def format_history(history: list) -> str:
    history_context = ""
    if history and isinstance(history, list):
        try:
            for msg in history[-5:]: # Keep last 5
                if isinstance(msg, dict):
                    role = "User" if msg.get("sender") == "user" else "Assistant"
                    content = msg.get("text") or msg.get("message") or ""
                    history_context += f"{role}: {content}\n"
        except:
            pass
    return history_context

def run_chat_agent(text: str, file_content: str = "", history: list = []) -> dict:
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    hist_str = format_history(history)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("user", CHAT_PROMPT)
    ])
    
    chain = prompt | chat_model
    
    try:
        response = chain.invoke({
            "text": text,
            "file_content": file_content[:5000],
            "history_context": hist_str,
            "current_date": current_date
        })
        
        # Return standard structure for consistency with the app
        return {
            "intent": "chat",
            "reply": response.content
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"intent": "chat", "reply": "I encountered an error processing your request.", "error": str(e)}
