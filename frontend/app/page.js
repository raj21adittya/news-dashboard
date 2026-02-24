"use client";
import { useEffect, useState } from "react";
import BubbleChart from "./components/BubbleChart";

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export default function Home() {
  const [clusters, setClusters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [error, setError] = useState(null);

  async function loadClusters() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/clusters");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClusters(data.clusters);
      setFetchedAt(new Date(data.fetchedAt).toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClusters();
    const interval = setInterval(loadClusters, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-2">🌐 News Landscape</h1>
      <p className="text-center text-gray-400 mb-1">
        Live news clustered by topic using AI
      </p>
      {fetchedAt && (
        <div className="flex flex-col items-center gap-2 mb-8">
          <p className="text-center text-gray-600 text-sm">
            Last updated: {fetchedAt} · refreshes every 30 min
          </p>
          <button
            onClick={loadClusters}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {loading ? "Refreshing..." : "🔄 Refresh Now"}
          </button>
        </div>
      )}

      {loading && (
        <p className="text-center text-gray-500 mt-20">
          Fetching and clustering live news...
        </p>
      )}

      {error && (
        <p className="text-center text-red-400 mt-20">Error: {error}</p>
      )}

      {!loading && !error && (
        <div className="flex flex-col items-center gap-8">
          <BubbleChart clusters={clusters} onSelect={setSelected} />

          {selected && (
            <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full">
              <h2 className="text-xl font-bold mb-2">{selected.label}</h2>
              <p className="text-gray-300 mb-4">{selected.summary}</p>
              <ul className="space-y-2">
                {selected.headlines.map((h, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-400 border-l-2 border-blue-500 pl-3"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}