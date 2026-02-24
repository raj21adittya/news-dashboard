"use client";
import { useEffect, useRef } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function BubbleChart({ clusters, onSelect }) {
    const ref = useRef();

    useEffect(() => {
        if (!clusters.length) return;

        const d3 = require("d3");
        const container = ref.current.parentElement;
        const width = container.clientWidth || 800;
        const height = 550;

        d3.select(ref.current).selectAll("*").remove();

        const svg = d3.select(ref.current)
            .attr("width", width)
            .attr("height", height);

        const maxSize = Math.max(...clusters.map(c => c.size));
        const radiusScale = d3.scaleSqrt().domain([1, maxSize]).range([50, 100]);

        const nodes = clusters.map((c, i) => ({
            ...c,
            r: radiusScale(c.size),
            color: COLORS[i % COLORS.length],
        }));

        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(3))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius((d) => d.r + 8))
            .on("tick", ticked);

        // Run simulation longer before rendering to avoid initial jitter
        simulation.tick(300);
        simulation.stop();

        // Keep bubbles within bounds
        nodes.forEach(d => {
            d.x = Math.max(d.r, Math.min(width - d.r, d.x));
            d.y = Math.max(d.r, Math.min(height - d.r, d.y));
        });

        const node = svg.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", (_, d) => onSelect(d));

        // Circle
        node.append("circle")
            .attr("r", d => d.r)
            .attr("fill", d => d.color)
            .attr("opacity", 0.9)
            .on("mouseover", function () {
                d3.select(this).attr("opacity", 1).attr("r", d => d.r + 4);
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 0.9).attr("r", d => d.r);
            });

        // Label text - word wrap inside bubble
        node.each(function (d) {
            const words = d.label.split(" ");
            const lineHeight = 16;
            const lines = [];
            let line = [];

            words.forEach(word => {
                line.push(word);
                if (line.length === 2) {
                    lines.push(line.join(" "));
                    line = [];
                }
            });
            if (line.length) lines.push(line.join(" "));

            const totalHeight = lines.length * lineHeight;
            const startY = -totalHeight / 2 - 6;

            lines.forEach((l, i) => {
                d3.select(this).append("text")
                    .text(l)
                    .attr("text-anchor", "middle")
                    .attr("y", startY + i * lineHeight)
                    .attr("fill", "white")
                    .attr("font-size", Math.min(14, d.r / 3.5))
                    .attr("font-weight", "bold");
            });

            // Article count below label
            d3.select(this).append("text")
                .text(`${d.size} articles`)
                .attr("text-anchor", "middle")
                .attr("y", totalHeight / 2 + 8)
                .attr("fill", "rgba(255,255,255,0.7)")
                .attr("font-size", 11);
        });

        function ticked() {
            node.attr("transform", d => `translate(${d.x},${d.y})`);
        }

    }, [clusters]);

    return (
        <div className="w-full">
            <svg ref={ref} className="rounded-xl bg-gray-900 w-full" />
        </div>
    );
}