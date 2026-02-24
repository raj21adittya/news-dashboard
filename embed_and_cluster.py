import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

for m in genai.list_models():
    if "embedContent" in m.supported_generation_methods:
        print(m.name)

def load_headlines():
    with open("data/headlines.json", "r") as f:
        return json.load(f)

def embed_headlines(headlines):
    titles = [h["title"] for h in headlines]
    
    print(f"Embedding {len(titles)} headlines...")
    embeddings = []
    for i, title in enumerate(titles):
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=title,
            task_type="clustering"
        )
        embeddings.append(result["embedding"])
        print(f"  {i+1}/{len(titles)} done")
    
    print(f"Got {len(embeddings)} embeddings, each of length {len(embeddings[0])}")
    return embeddings

if __name__ == "__main__":
    headlines = load_headlines()
    embeddings = embed_headlines(headlines)
    
    for i, h in enumerate(headlines):
        h["embedding"] = embeddings[i]
    
    with open("data/headlines_embedded.json", "w") as f:
        json.dump(headlines, f, indent=2)
    
    print("Saved to data/headlines_embedded.json")