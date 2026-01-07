
import os
from dotenv import load_dotenv
load_dotenv()

token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
print(f"Token loaded: {'Yes' if token else 'No'} (Length: {len(token) if token else 0})")

try:
    from langchain_huggingface import HuggingFaceEndpoint
    print("Import successful.")
    
    repo_id = "mistralai/Mistral-7B-Instruct-v0.3"
    print(f"Testing model access: {repo_id}")
    
    llm = HuggingFaceEndpoint(
        repo_id=repo_id,
        task="text-generation",
        huggingfacehub_api_token=token
    )
    print("Endpoint initialized.")
    
    print("Invoking model...")
    res = llm.invoke("Say 'Hello World'")
    print(f"Result: {res}")
    print("SUCCESS: Model is accessible.")
    
except Exception as e:
    print("FAILURE: Model access failed.")
    import traceback
    traceback.print_exc()
