"use client";
import { useEffect, useRef } from "react";

const COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9"
];

export default function BubbleChart({ clusters, onSelect, selected, darkMode }) {
    const ref = useRef();

    useEffect(() => {
        if (!clusters.length) return;
        const d3 = require("d3");
        const container = ref.current.parentElement;
        const width = container.clientWidth || 900;

        const maxSize = Math.max(...clusters.map(c => c.size));
        const radiusScale = d3.scaleSqrt().domain([1, maxSize]).range([55, 110]);

        const nodes = clusters.map((c, i) => ({
            ...c,
            r: radiusScale(c.size),
            color: COLORS[i % COLORS.length],
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

        // Glow filters
        const defs = svg.append("defs");
        nodes.forEach((d, i) => {
            const filter = defs.append("filter").attr("id", `glow-${i}`);
            filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
            const feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode").attr("in", "coloredBlur");
            feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        });

        const node = svg.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", (_, d) => onSelect(d));

        // Outer glow ring
        node.append("circle")
            .attr("r", d => d.r + 6)
            .attr("fill", "none")
            .attr("stroke", d => d.color)
            .attr("stroke-width", 1)
            .attr("opacity", 0.2);

        // Main circle
        node.append("circle")
            .attr("r", d => d.r)
            .attr("fill", d => d.color)
            .attr("opacity", d => selected?.cluster_id === d.cluster_id ? 1 : 0.82)
            .attr("filter", (_, i) => `url(#glow-${i})`)
            .attr("stroke", d => d.color)
            .attr("stroke-width", d => selected?.cluster_id === d.cluster_id ? 3 : 0)
            .on("mouseover", function (_, d) {
                d3.select(this).attr("opacity", 1).attr("r", d.r + 5);
            })
            .on("mouseout", function (_, d) {
                d3.select(this)
                    .attr("opacity", selected?.cluster_id === d.cluster_id ? 1 : 0.82)
                    .attr("r", d.r);
            });

        // Labels
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

            lines.forEach((l, i) => {
                d3.select(this).append("text")
                    .text(l)
                    .attr("text-anchor", "middle")
                    .attr("y", -totalHeight / 2 + i * lineHeight + 4)
                    .attr("fill", darkMode ? "white" : "black")
                    .attr("font-size", Math.min(13, d.r / 3.8))
                    .attr("font-weight", "700")
                    .attr("letter-spacing", "0.3px");
            });

            d3.select(this).append("text")
                .text(`${d.size} stories`)
                .attr("text-anchor", "middle")
                .attr("y", totalHeight / 2 + 14)
                .attr("fill", darkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)")
                .attr("font-size", 10)
                .attr("letter-spacing", "0.5px");
        });

    }, [clusters, selected, darkMode]);

    return (
        <div className="w-full overflow-hidden">
            <svg ref={ref} className="w-full" />
        </div>
    );
}