"use client";
import { useEffect, useState } from "react";
import BubbleChart from "./components/BubbleChart";

const REFRESH_INTERVAL = 30 * 60 * 1000;

export default function Home() {
  const [clusters, setClusters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  async function loadClusters(force = false) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clusters${force ? "?force=true" : ""}`);
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

  const bg = darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white border border-gray-200";
  const subText = darkMode ? "text-gray-400" : "text-gray-500";
  const mutedText = darkMode ? "text-gray-600" : "text-gray-400";

  return (
    <main className={`min-h-screen ${bg} p-6 transition-colors duration-300`}>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-40" />
        <div className="text-center">
          <h1 className="text-3xl font-bold">🌐 News Landscape</h1>
          <p className={`text-sm ${subText}`}>Live news clustered by topic using AI</p>
          {fetchedAt && (
            <p className={`text-xs ${mutedText} mt-1`}>
              Last updated: {fetchedAt} · refreshes every 30 min
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 w-40 justify-end">
          <button
            onClick={() => loadClusters(true)}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {loading ? "..." : "🔄 Refresh"}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <p className={`text-center ${subText} mt-20`}>
          Fetching and clustering live news...
        </p>
      )}

      {error && (
        <p className="text-center text-red-400 mt-20">Error: {error}</p>
      )}

      {!loading && !error && (
        <div className="flex flex-col items-center gap-8">
          <BubbleChart clusters={clusters} onSelect={setSelected} darkMode={darkMode} />

          {selected && (
            <div className={`${cardBg} rounded-xl p-6 max-w-2xl w-full`}>
              <h2 className="text-xl font-bold mb-2">{selected.label}</h2>
              <p className={`${subText} mb-4`}>{selected.summary}</p>
              <ul className="space-y-2">
                {selected.headlines.map((h, i) => (
                  <li
                    key={i}
                    className={`text-sm ${subText} border-l-2 border-blue-500 pl-3`}
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