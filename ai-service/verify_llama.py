import os
from dotenv import load_dotenv
from huggingface_hub import HfApi, whoami
from langchain_huggingface import HuggingFaceEndpoint

load_dotenv()

token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
repo_id = "meta-llama/Llama-3.1-8B-Instruct"

print(f"Checking access for token: {token[:6]}... to model: {repo_id}")

try:
    # 1. Check if token is valid
    user = whoami(token=token)
    print(f"Token belongs to user: {user['name']}")
    
    # 2. Try to initialize the endpoint (this usually triggers the 403 if no access)
    print("Attempting to connect to Hugging Face Inference API...")
    llm = HuggingFaceEndpoint(
        repo_id=repo_id,
        task="text-generation",
        huggingfacehub_api_token=token
    )
    # 3. Try a minimal generation
    print("Attempting generation...")
    res = llm.invoke("Hello")
    print("Success! Access verified.")
except Exception as e:
    print("\nERROR: Access Failed")
    print(str(e))
