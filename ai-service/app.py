from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from config import DEEPSEEK_API_KEY
from agent import process_command, analyze_project_description

app = Flask(__name__)
CORS(app)

# Removed broken call_deepseek function

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Service Running", "provider": "HuggingFace Llama-3"})

@app.route('/api/analyze', methods=['POST'])
def analyze_task():
    data = request.json
    description = data.get('description', '')
    
    # Use HuggingFace model via agent.py
    ai_insight = analyze_project_description(description)
    
    return jsonify({
        "insight": ai_insight,
        "suggested_tags": ["productivity", "ai-analyzed"],
        "sentiment": "positive" # Placeholder
    })

@app.route('/api/chat', methods=['POST'])
def chat_command():
    try:
        data = request.json
        message = data.get('message', '')
        file_content = data.get('file_content', '')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        # Call LangGraph Agent
        result = process_command(message, file_content)
        
        if result.get('error'):
            return jsonify({"status": "error", "message": result['error']}), 500
            
        ai_data = result['structured_task']
        
        if ai_data.get('intent') == 'chat':
             return jsonify({
                "status": "success",
                "intent": "chat",
                "reply": ai_data.get('reply', "I'm not sure how to respond to that.")
            })
            
        # Task intent
        # Support both 'tasks' list (batch) and legacy 'task_details' (single)
        tasks = ai_data.get('tasks', [])
        if not tasks and ai_data.get('task_details'):
            tasks = [ai_data['task_details']]
            
        first_task_name = tasks[0]['name'] if tasks else "New Task"
        
        return jsonify({
            "status": "success",
            "intent": "task",
            "task_data": { "tasks": tasks }, # Wrap in object to match backend expectation
            "reply": f"I've analyzed your request. I found {len(tasks)} task(s) to create, starting with '{first_task_name}'."
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/recommend', methods=['POST'])
def recommend_assignee():
    # Keep mock for simplicity unless user provides team data
    team = ["Alice", "Bob", "Charlie", "Dave"]
    import random
    return jsonify({
        "recommended_assignee": random.choice(team),
        "reason": "AI analysis suggests this member has the relevant skills."
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
