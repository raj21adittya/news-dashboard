"use client";
import React, { useEffect, useState } from "react";
import BubbleChart from "./components/BubbleChart";
import ChatBubble from "./components/ChatBubble";

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

  const dark = darkMode;

  const sentimentEmoji = (s) => s === "positive" ? "😊" : s === "negative" ? "😟" : "😐";
  const sentimentBadgeClass = (s) =>
    s === "positive"
      ? "bg-green-500/20 text-green-400"
      : s === "negative"
        ? "bg-red-500/20 text-red-400"
        : "bg-slate-500/20 text-slate-400";

  return (
    <main className={`min-h-screen transition-colors duration-500 ${dark ? "bg-[#0a0a0f] text-white" : "bg-[#f4f4f0] text-gray-900"}`}>

      {/* Header */}
      <header className={`border-b ${dark ? "border-white/10" : "border-black/10"} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${dark ? "bg-white/10" : "bg-black/10"}`}>
              🌐
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">NewsLens</h1>
              <p className={`text-xs ${dark ? "text-white/40" : "text-black/40"} leading-none mt-0.5`}>AI-powered news clustering</p>
            </div>
          </div>

          {/* Center — last updated */}
          <div className="hidden md:block text-center">
            {fetchedAt && (
              <p className={`text-xs ${dark ? "text-white/30" : "text-black/30"}`}>
                Updated {fetchedAt} · auto-refreshes every 30 min
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadClusters(true)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dark
                ? "bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                : "bg-black/10 hover:bg-black/20 text-black disabled:opacity-30"
                }`}
            >
              <span className={loading ? "animate-spin" : ""}>↻</span>
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-black/10 hover:bg-black/20 text-black"
                }`}
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Hero text */}
        <div className="mb-8 text-center">
          <h2 className={`text-4xl font-bold tracking-tight mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
            What the world is talking about
          </h2>
          <p className={`text-sm ${dark ? "text-white/40" : "text-black/40"}`}>
            {clusters.length > 0 ? `${clusters.length} topics detected from live headlines` : "Analyzing live news..."}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className={`w-10 h-10 rounded-full border-2 border-t-transparent animate-spin ${dark ? "border-white/30" : "border-black/30"}`} />
            <p className={`text-sm ${dark ? "text-white/40" : "text-black/40"}`}>Fetching and clustering live headlines with AI...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Chart + Detail */}
        {!loading && !error && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Bubble chart */}
            <div className={`flex-1 rounded-2xl overflow-hidden ${dark ? "bg-white/[0.03] border border-white/10" : "bg-black/[0.03] border border-black/10"}`}>
              <BubbleChart clusters={clusters} onSelect={setSelected} selected={selected} darkMode={darkMode} />
            </div>

            {/* Side panel */}
            <div className="lg:w-80 flex flex-col gap-3">
              {selected ? (
                <React.Fragment>
                  <div className={`rounded-2xl p-5 ${dark ? "bg-white/[0.05] border border-white/10" : "bg-white border border-black/10"}`}>

                    {/* Title + close */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-bold leading-snug">{selected.label}</h3>
                      <button
                        onClick={() => setSelected(null)}
                        className={`text-xs mt-0.5 ${dark ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60"}`}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Sentiment badge */}
                    <div className="mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sentimentBadgeClass(selected.sentiment)}`}>
                        {sentimentEmoji(selected.sentiment)} {selected.sentiment} · {Math.round((selected.sentiment_score || 0.5) * 100)}%
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed mb-4 ${dark ? "text-white/50" : "text-black/50"}`}>
                      {selected.summary}
                    </p>

                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? "text-white/30" : "text-black/30"}`}>
                      Headlines
                    </div>
                    <ul className="space-y-2">
                      {selected.headlines.map((h, i) => (
                        <li key={i} className={`text-xs leading-snug pl-3 border-l-2 border-current ${dark ? "text-white/60 border-white/20" : "text-black/60 border-black/20"}`}>
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hover:underline ${dark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                            {h.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </React.Fragment>
              ) : (
                <div className={`rounded-2xl p-5 ${dark ? "bg-white/[0.03] border border-white/10" : "bg-black/[0.03] border border-black/10"}`}>
                  <p className={`text-sm ${dark ? "text-white/30" : "text-black/30"}`}>
                    👆 Click any bubble to explore the headlines in that topic cluster
                  </p>
                </div>
              )}

              {/* Topic list */}
              {clusters.length > 0 && (
                <div className={`rounded-2xl p-4 ${dark ? "bg-white/[0.03] border border-white/10" : "bg-black/[0.03] border border-black/10"}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-3 flex justify-between ${dark ? "text-white/30" : "text-black/30"}`}>
                    <span>All Topics</span>
                    <span>{clusters.reduce((sum, c) => sum + c.size, 0)} articles</span>
                  </div>
                  <ul className="space-y-1.5">
                    {clusters.map((c, i) => (
                      <li key={i}>
                        <button
                          onClick={() => setSelected(c)}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${selected?.cluster_id === c.cluster_id
                            ? (dark ? "bg-white/10 text-white" : "bg-black/10 text-black")
                            : (dark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-black/50 hover:bg-black/5 hover:text-black")
                            }`}
                        >
                          <span className="font-medium">{c.label}</span>
                          <div className="flex items-center gap-2">
                            <span>{sentimentEmoji(c.sentiment)}</span>
                            <span className={`${dark ? "text-white/20" : "text-black/20"}`}>{c.size}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={`mt-16 px-6 py-6 border-t ${dark ? "border-white/10" : "border-black/10"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className={`text-xs ${dark ? "text-white/20" : "text-black/20"}`}>
            NewsLens · For informational purposes only · Data from NewsAPI & GNews API
          </p>
          <p className={`text-xs ${dark ? "text-white/20" : "text-black/20"}`}>
            Powered by Gemini AI
          </p>
        </div>
      </footer>
      <ChatBubble clusters={clusters} darkMode={darkMode} />
    </main >
  );
}