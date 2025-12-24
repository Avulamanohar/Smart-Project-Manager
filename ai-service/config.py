import os

# In a real production app, use environment variables. 
# For this demo, we use the key provided by the user.
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
HUGGINGFACEHUB_API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")
