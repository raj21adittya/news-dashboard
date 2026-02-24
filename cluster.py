import json
import numpy as np
from sklearn.preprocessing import normalize
import hdbscan

def load_embedded_headlines():
    with open("data/headlines_embedded.json", "r") as f:
        return json.load(f)

def cluster_headlines(headlines):
    # Extract embeddings into a matrix
    embeddings = np.array([h["embedding"] for h in headlines])
    
    # Normalize for better clustering
    embeddings = normalize(embeddings)
    
    print(f"Clustering {len(embeddings)} headlines...")
    clusterer = hdbscan.HDBSCAN(min_cluster_size=2, min_samples=1, metric="euclidean")
    labels = clusterer.fit_predict(embeddings)
    
    # Attach cluster label to each headline
    for i, h in enumerate(headlines):
        h["cluster"] = int(labels[i])  # -1 means "noise" (no cluster)
    
    # Print summary
    unique_clusters = set(labels)
    unique_clusters.discard(-1)  # remove noise label
    print(f"Found {len(unique_clusters)} clusters")
    print(f"Unclustered headlines (noise): {list(labels).count(-1)}")
    
    return headlines

if __name__ == "__main__":
    headlines = load_embedded_headlines()
    clustered = cluster_headlines(headlines)
    
    with open("data/headlines_clustered.json", "w") as f:
        json.dump(clustered, f, indent=2)
    
    print("Saved to data/headlines_clustered.json")