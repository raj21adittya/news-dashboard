// NewsLens Logo Component
// Drop this into app/components/NewsLensLogo.js
// Usage: <NewsLensLogo size={32} /> or <NewsLensLogo size={32} textSize="lg" showText />

export default function NewsLensLogo({ size = 32, showText = false, darkMode = true }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Icon Mark */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="dotGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#e0e7ff" />
                        <stop offset="100%" stopColor="#a5b4fc" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer ring */}
                <circle cx="20" cy="20" r="17" stroke="url(#ringGrad)" strokeWidth="2" fill="none" opacity="0.6" />

                {/* Middle ring */}
                <circle cx="20" cy="20" r="11" stroke="url(#ringGrad)" strokeWidth="1.5" fill="none" opacity="0.4" />

                {/* Lens cross lines */}
                <line x1="20" y1="3" x2="20" y2="37" stroke="url(#ringGrad)" strokeWidth="1" opacity="0.25" />
                <line x1="3" y1="20" x2="37" y2="20" stroke="url(#ringGrad)" strokeWidth="1" opacity="0.25" />

                {/* Diagonal accents */}
                <line x1="7" y1="7" x2="13" y2="13" stroke="#818cf8" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
                <line x1="33" y1="7" x2="27" y2="13" stroke="#818cf8" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
                <line x1="7" y1="33" x2="13" y2="27" stroke="#818cf8" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
                <line x1="33" y1="33" x2="27" y2="27" stroke="#818cf8" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />

                {/* Center dot with glow */}
                <circle cx="20" cy="20" r="4.5" fill="url(#dotGrad)" filter="url(#glow)" />
                <circle cx="20" cy="20" r="2" fill="white" opacity="0.9" />
            </svg>

            {showText && (
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: 26,
                        letterSpacing: "-0.02em",
                        color: darkMode ? "#ffffff" : "#0f0f1a",
                        fontFamily: "system-ui"
                    }}>
                        News<span style={{ color: "#818cf8" }}>Lens</span>
                    </span>
                    <span style={{
                        fontSize: 10,
                        color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 2
                    }}>
                        AI News Intelligence
                    </span>
                </div>
            )}
        </div>
    );
}