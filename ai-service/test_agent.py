
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from agent import process_command
from config import DEEPSEEK_API_KEY, HUGGINGFACEHUB_API_TOKEN

print(f"HF Token present: {bool(HUGGINGFACEHUB_API_TOKEN)}")

try:
    print("Testing process_command...")
    result = process_command(
        text="Create a task to update the homepage", 
        file_content="", 
        history=[]
    )
    print("Result:", result)
except Exception as e:
    print("ERROR OCCURRED:")
    import traceback
    traceback.print_exc()
