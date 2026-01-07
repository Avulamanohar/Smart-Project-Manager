# Agentic AI Service Architecture & Workflow

This document details the internal working of the AI Agent service responsible for natural language processing, task creation, and project management assistance within the Smart Project Manager.

## 1. High-Level Architecture
The AI Service is built using **Python** and leverages the following core technologies:
- **Flask**: A lightweight web server exposing RESTful API endpoints.
- **LangChain & LangGraph**: Frameworks for orchestrating the AI workflow and state management.
- **Hugging Face Inference API**: accessing the `HuggingFaceH4/zephyr-7b-beta` model for intelligent text generation.

## 2. Core Components

### 2.1 The Agent (`agent.py`)
The agent is designed as a stateful workflow using `LangGraph`.

#### **State Management (`AgentState`)**
The agent maintains a state dictionary across the execution flow:
- `text`: The raw user input message.
- `history`: Previous chat context (last 5 messages) for conversational continuity.
- `file_content`: Content from uploaded files (if any).
- `structured_task`: The extraction result (Intent + Data).
- `error`: Any error messages encountered during processing.

#### **Workflow Logic**
1.  **Extraction Node**:
    - Constructs a dynamic prompt including `SYSTEM_PROMPT`, user text, chat history, and file context.
    - Sends this prompt to the Llama-3 model.
    - The `SYSTEM_PROMPT` strictly instructs the model to return valid **JSON**.
2.  **JSON Parsing (`valid_json_check`)**:
    - A robust parser that handles common LLM formatting issues (e.g., markdown blocks, concatenated objects, truncated lists).
    - Ensures the output is a valid JSON object matching the expected schema.
3.  **Graph Execution**:
    - The `process_command` function initializes the graph with user inputs and runs the workflow.

### 2.2 API Layer (`app.py`)
The Flask application exposes endpoints for the frontend to interact with the agent.

- **`POST /api/chat`** (Main Endpoint):
    - Receives `message`, `history`, and optional `file_content`.
    - Invokes the Agent Workflow.
    - Routes the response based on **Intent**:
        - **`project`**: Returns project details (name, description, deadline) for confirmation.
        - **`task`**: Returns a list of tasks for bulk creation.
        - **`chat`**: Returns a conversational reply.

- **`POST /api/analyze`**:
    - Specialized endpoint for generating subtasks and risk assessments from a project description.

- **`POST /api/recommend`**:
    - (Currently Mocked) Returns a recommended assignee for a task based on team data.

## 3. The Intent System
The agent classifies user requests into three distinct intents:

### A. **Project Creation** (`intent: "project"`)
- **Trigger**: "Create a project to build a new website."
- **Output**: JSON containing `name`, `description`, `deadline`.
- **Action**: Frontend prompts user for confirmation -> Backend creates project -> Socket.io updates UI.

### B. **Task Creation** (`intent: "task"`)
- **Trigger**: "Add tasks for UI design and Database setup."
- **Output**: JSON containing a list of tasks with `name`, `priority`, `deadline`, etc.
- **Action**: Frontend lists identified tasks -> User confirms -> Batch creation in Backend.

### C. **Chat / Q&A** (`intent: "chat"`)
- **Trigger**: "How do I use this app?" or "What is a Gantt chart?"
- **Output**: A helpful text response.
- **Action**: Displayed directly in the chat interface.

## 4. Error Handling & Recovery
- **JSON Repair**: If the model outputs broken JSON (e.g., missing brackets), the `valid_json_check` function attempts to repair it by appending closing characters or extracting valid substrings.
- **Fallback**: If parsing fails completely, the response is treated as a generic chat reply to prevent application crashes and maintain user flow.

## 5. Future Roadmap
- **RAG Integration**: Implementing Retrieval-Augmented Generation to allow the agent to query a vector database of project documents.
- **Tool Calling**: Enabling the agent to directly call internal tools (e.g., "Delete task X") rather than just returning JSON.
- **Advanced Context**: Increasing the context window to handle larger files or longer project histories.
