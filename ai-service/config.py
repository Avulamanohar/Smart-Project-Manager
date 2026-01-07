
import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

load_dotenv()

HUGGINGFACEHUB_API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")
# Ensure token is in env for LangChain
if HUGGINGFACEHUB_API_TOKEN:
    os.environ["HUGGINGFACEHUB_API_TOKEN"] = HUGGINGFACEHUB_API_TOKEN

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

# Initialize Shared Model
repo_id = "meta-llama/Llama-3.1-8B-Instruct"

try:
    print(f"Loading Model: {repo_id}")
    llm = HuggingFaceEndpoint(
        repo_id=repo_id,
        task="text-generation",
        max_new_tokens=4096,
        do_sample=False,
        temperature=0.1,
    )
    chat_model = ChatHuggingFace(llm=llm)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model {repo_id}: {e}")
    # Fallback to avoid import errors in agents, though they will fail at runtime if this is None
    chat_model = None
