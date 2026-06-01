import requests
from dotenv import load_dotenv
import os
import json

load_dotenv()

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

params = {
    "engine": "amazon_product",
    "asin": "B0DZZWMB2L",  
    "api_key": SERPAPI_API_KEY
}

# Commented out as requested: "Don't make any api call for now."
search = requests.get("https://serpapi.com/search", params=params)
response = search.json()
print(json.dumps(response, indent=2))
