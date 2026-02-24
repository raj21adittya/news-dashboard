import requests
import json
from dotenv import load_dotenv
import os
import datetime

load_dotenv()
API_KEY = os.getenv("NEWSAPI_KEY")

def fetch_headlines():
    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "language": "en",
        "pageSize": 100,
        "apiKey": API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

    articles = data.get("articles", [])
    
    headlines = []
    for article in articles:
        headlines.append({
            "title": article["title"],
            "source": article["source"]["name"],
            "published_at": article["publishedAt"],
            "url": article["url"],
"fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
    
    print(f"Fetched {len(headlines)} headlines")
    
    # Save to a local JSON file for now
    with open("data/headlines.json", "w") as f:
        json.dump(headlines, f, indent=2)
    
    return headlines

if __name__ == "__main__":
    fetch_headlines()