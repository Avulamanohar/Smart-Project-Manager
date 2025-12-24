import os
from huggingface_hub import HfApi, whoami
from config import HUGGINGFACEHUB_API_TOKEN

print(f"Testing Token: {HUGGINGFACEHUB_API_TOKEN[:6]}...")

try:
    user_info = whoami(token=HUGGINGFACEHUB_API_TOKEN)
    print("Token is VALID.")
    print(f"User: {user_info['name']}")
    print(f"Orgs: {user_info.get('orgs')}")
except Exception as e:
    print(f"Token is INVALID or Error Occurred: {e}")
