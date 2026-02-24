import json
import os
from dotenv import load_dotenv
import google.generativeai as genai
import time


load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        print(m.name)
model = genai.GenerativeModel("gemini-2.5-flash")

def load_clustered_headlines():
    with open("data/headlines_clustered.json", "r") as f:
        return json.load(f)

def group_by_cluster(headlines):
    clusters = {}
    for h in headlines:
        c = h["cluster"]
        if c == -1:
            continue  # skip noise
        if c not in clusters:
            clusters[c] = []
        clusters[c].append(h["title"])
    return clusters

def summarize_cluster(titles):
    prompt = f"""You are a news analyst. Given these headlines from the same news cluster, provide:
1. A short topic label (3-5 words max)
2. A 2-sentence summary of what this cluster is about

Headlines:
{chr(10).join(f'- {t}' for t in titles)}

Respond in this exact JSON format:
{{"label": "...", "summary": "..."}}"""

    response = model.generate_content(prompt)
    
    # Clean response and parse JSON
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

if __name__ == "__main__":
    headlines = load_clustered_headlines()
    clusters = group_by_cluster(headlines)
    
    results = []
    for cluster_id, titles in clusters.items():
        print(f"\nCluster {cluster_id} ({len(titles)} headlines):")
        for t in titles:
            print(f"  - {t}")
        
        summary = summarize_cluster(titles)
        print(f"  → Label: {summary['label']}")
        print(f"  → Summary: {summary['summary']}")
        
        results.append({
            "cluster_id": cluster_id,
            "label": summary["label"],
            "summary": summary["summary"],
            "headlines": titles,
            "size": len(titles)
        })
        time.sleep(30)  # wait 30 seconds between calls to avoid rate limit

    
    with open("data/clusters_summarized.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("\nSaved to data/clusters_summarized.json")