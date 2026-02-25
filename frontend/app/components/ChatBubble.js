"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatBubble({ clusters, darkMode }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! Ask me anything about today's news. I'll answer using the current headlines." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const dark = darkMode;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;

        const question = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: question }]);
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, clusters }),
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, {
                role: "assistant",
                text: data.answer,
                sources: data.sources || [],
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                text: "Sorry, I couldn't get an answer. Please try again.",
            }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

            {/* Chat window */}
            {open && (
                <div
                    className={`w-80 rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${dark ? "bg-[#0f0f17] border-white/10" : "bg-white border-black/10"}`}
                    style={{ height: "420px" }}
                >
                    {/* Header */}
                    <div className={`px-4 py-3 flex items-center justify-between border-b ${dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
                        <div>
                            <p className="text-sm font-semibold">Ask the News</p>
                            <p className={`text-xs ${dark ? "text-white/30" : "text-black/30"}`}>Powered by Groq + RAG</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className={`text-xs ${dark ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60"}`}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user"
                                        ? dark ? "bg-white/10 text-white" : "bg-black/10 text-black"
                                        : dark ? "bg-white/[0.05] text-white/80" : "bg-black/[0.04] text-black/80"
                                    }`}>
                                    <p>{msg.text}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className={`mt-2 pt-2 border-t ${dark ? "border-white/10" : "border-black/10"}`}>
                                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? "text-white/30" : "text-black/30"}`}>Sources</p>
                                            {msg.sources.map((s, j) => (
                                                <a
                                                    key={j}
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`block text-xs truncate hover:underline ${dark ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"}`}
                                                >
                                                    → {s.title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className={`rounded-xl px-3 py-2 text-xs ${dark ? "bg-white/[0.05] text-white/40" : "bg-black/[0.04] text-black/40"}`}>
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className={`px-3 py-3 border-t ${dark ? "border-white/10" : "border-black/10"}`}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Ask about today's news..."
                                className={`flex-1 text-xs px-3 py-2 rounded-lg outline-none ${dark
                                    ? "bg-white/10 text-white placeholder-white/20 focus:bg-white/15"
                                    : "bg-black/5 text-black placeholder-black/20 focus:bg-black/10"
                                    }`}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${dark
                                    ? "bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                                    : "bg-black/10 hover:bg-black/20 text-black disabled:opacity-30"
                                    }`}
                            >
                                ↑
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setOpen(!open)}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg transition-all ${dark
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-black/90"
                    }`}
            >
                {open ? "✕" : "💬"}
            </button>
        </div>
    );
}