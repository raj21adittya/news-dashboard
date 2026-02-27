"use client";
import { useEffect, useRef } from "react";

const COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9"
];

const SENTIMENT_COLORS = {
    positive: "#22c55e",
    negative: "#ef4444",
    neutral: "#94a3b8",
};

/** Fetch a Wikipedia thumbnail for a given topic label. Returns null on miss. */
async function fetchTopicImage(label) {
    try {
        const res = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(label)}`,
            { headers: { Accept: "application/json" } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.thumbnail?.source ?? null;
    } catch {
        return null;
    }
}

export default function BubbleChart({ clusters, onSelect, selected, darkMode }) {
    const ref = useRef();

    useEffect(() => {
        if (!clusters.length) return;

        // Fetch all topic images first, then render
        Promise.all(clusters.map(c => fetchTopicImage(c.label))).then(imageUrls => {
            renderChart(imageUrls);
        });

        function renderChart(imageUrls) {
            const d3 = require("d3");
            const container = ref.current.parentElement;
            const width = container.clientWidth || 900;

            const maxSize = Math.max(...clusters.map(c => c.size));
            const radiusScale = d3.scaleSqrt().domain([1, maxSize]).range([55, 110]);

            const nodes = clusters.map((c, i) => ({
                ...c,
                r: radiusScale(c.size),
                color: COLORS[i % COLORS.length],
                imageUrl: imageUrls[i],
            }));

            // Dynamic height based on total bubble area
            const totalArea = nodes.reduce((sum, n) => sum + Math.PI * n.r * n.r, 0);
            const height = Math.max(500, Math.ceil(totalArea / width * 3.5));

            d3.select(ref.current).selectAll("*").remove();

            const svg = d3.select(ref.current)
                .attr("width", width)
                .attr("height", height);

            d3.forceSimulation(nodes)
                .force("charge", d3.forceManyBody().strength(2))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collision", d3.forceCollide().radius(d => d.r + 8).strength(1).iterations(20))
                .tick(800)
                .stop();

            nodes.forEach(d => {
                d.x = Math.max(d.r + 10, Math.min(width - d.r - 10, d.x));
                d.y = Math.max(d.r + 10, Math.min(height - d.r - 10, d.y));
            });

            // ── Defs ───────────────────────────────────────────────────────
            const defs = svg.append("defs");

            // Per-bubble: clip path + glow filter
            nodes.forEach((d, i) => {
                // Circular clip for the image
                defs.append("clipPath")
                    .attr("id", `clip-${i}`)
                    .append("circle")
                    .attr("r", d.r)
                    .attr("cx", 0).attr("cy", 0);

                // Glow filter
                const filter = defs.append("filter").attr("id", `glow-${i}`);
                filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
                const feMerge = filter.append("feMerge");
                feMerge.append("feMergeNode").attr("in", "coloredBlur");
                feMerge.append("feMergeNode").attr("in", "SourceGraphic");
            });

            // Drop-shadow filter for text legibility
            const textShadow = defs.append("filter")
                .attr("id", "text-shadow")
                .attr("x", "-20%").attr("y", "-20%")
                .attr("width", "140%").attr("height", "140%");
            textShadow.append("feDropShadow")
                .attr("dx", "0").attr("dy", "1")
                .attr("stdDeviation", "1.5")
                .attr("flood-color", "rgba(0,0,0,0.55)");

            // ── Nodes ──────────────────────────────────────────────────────
            const node = svg.selectAll("g")
                .data(nodes)
                .enter()
                .append("g")
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .style("cursor", "pointer")
                .on("click", (_, d) => onSelect(d));

            // 1. Outer glow ring
            node.append("circle")
                .attr("r", d => d.r + 6)
                .attr("fill", "none")
                .attr("stroke", d => d.color)
                .attr("stroke-width", 1)
                .attr("opacity", 0.2);

            // 2. Topic image clipped to circle (under color fill)
            node.filter(d => !!d.imageUrl)
                .append("image")
                .attr("href", d => d.imageUrl)
                .attr("x", d => -d.r)
                .attr("y", d => -d.r)
                .attr("width", d => d.r * 2)
                .attr("height", d => d.r * 2)
                .attr("clip-path", (_, i) => `url(#clip-${i})`)
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr("opacity", 0)
                .transition()
                .delay((_, i) => i * 60 + 200)
                .duration(600)
                .attr("opacity", 0.22);

            // 3. Main circle — semi-transparent so image shows through
            node.append("circle")
                .attr("r", 0)
                .attr("fill", d => d.color)
                // Slightly lower base opacity so photo bleeds through
                .attr("opacity", d => selected?.cluster_id === d.cluster_id ? 0.72 : 0.62)
                .attr("filter", (_, i) => `url(#glow-${i})`)
                .attr("stroke", d => d.color)
                .attr("stroke-width", d => selected?.cluster_id === d.cluster_id ? 3 : 0)
                .on("mouseover", function (_, d) {
                    d3.select(this).attr("opacity", 0.78).attr("r", d.r + 5);
                })
                .on("mouseout", function (_, d) {
                    d3.select(this)
                        .attr("opacity", selected?.cluster_id === d.cluster_id ? 0.72 : 0.62)
                        .attr("r", d.r);
                })
                .transition()
                .delay((_, i) => i * 60)
                .duration(550)
                .ease(d3.easeElasticOut.amplitude(1).period(0.4))
                .attr("r", d => d.r);

            // 4. Pulsing sentiment ring
            const sentimentRing = node.append("circle")
                .attr("r", d => d.r + 3)
                .attr("fill", "none")
                .attr("stroke", d => SENTIMENT_COLORS[d.sentiment] || SENTIMENT_COLORS.neutral)
                .attr("stroke-width", 3)
                .attr("opacity", 0);

            function pulse(sel, baseOpacity, delay) {
                sel.transition()
                    .delay(delay)
                    .duration(1000)
                    .ease(d3.easeSinInOut)
                    .attr("opacity", baseOpacity)
                    .attr("stroke-width", 4)
                    .transition()
                    .duration(1000)
                    .ease(d3.easeSinInOut)
                    .attr("opacity", baseOpacity * 0.45)
                    .attr("stroke-width", 2)
                    .on("end", function (d) {
                        pulse(d3.select(this), baseOpacity, 0);
                    });
            }

            sentimentRing.each(function (d, i) {
                const baseOpacity = 0.35 + (d.sentiment_score || 0.5) * 0.55;
                pulse(d3.select(this), baseOpacity, i * 60 + 550);
            });

            // 5. Labels — Inter font + drop shadow
            node.each(function (d) {
                const words = d.label.split(" ");
                const lines = [];
                let line = [];
                words.forEach(word => {
                    line.push(word);
                    if (line.length === 2) { lines.push(line.join(" ")); line = []; }
                });
                if (line.length) lines.push(line.join(" "));

                const lineHeight = 15;
                const totalHeight = lines.length * lineHeight;
                const fontSize = Math.min(13, d.r / 3.8);

                lines.forEach((l, i) => {
                    d3.select(this).append("text")
                        .text(l)
                        .attr("text-anchor", "middle")
                        .attr("y", -totalHeight / 2 + i * lineHeight + 4)
                        .attr("fill", "white")
                        .attr("font-size", fontSize)
                        .attr("font-weight", "700")
                        .attr("font-family", "'Inter', 'Outfit', system-ui, sans-serif")
                        .attr("letter-spacing", "0.3px")
                        .attr("filter", "url(#text-shadow)")
                        .attr("opacity", 0)
                        .transition()
                        .delay((_, j) => j * 60 + 500)
                        .duration(300)
                        .attr("opacity", 1);
                });

                d3.select(this).append("text")
                    .text(`${d.size} stories`)
                    .attr("text-anchor", "middle")
                    .attr("y", totalHeight / 2 + 14)
                    .attr("fill", "rgba(255,255,255,0.7)")
                    .attr("font-size", 10)
                    .attr("font-family", "'Inter', 'Outfit', system-ui, sans-serif")
                    .attr("letter-spacing", "0.6px")
                    .attr("font-weight", "500")
                    .attr("filter", "url(#text-shadow)")
                    .attr("opacity", 0)
                    .transition()
                    .delay(600)
                    .duration(300)
                    .attr("opacity", 1);
            });
        }

    }, [clusters, selected, darkMode]);

    return (
        <div className="w-full overflow-hidden">
            <svg ref={ref} className="w-full" />
        </div>
    );
}