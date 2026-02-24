"use client";
import { useEffect, useRef } from "react";
const d3 = require("d3");

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function BubbleChart({ clusters, onSelect }) {
    const ref = useRef();

    useEffect(() => {
        if (!clusters.length) return;

        const width = 800;
        const height = 500;

        d3.select(ref.current).selectAll("*").remove();

        const svg = d3.select(ref.current)
            .attr("width", width)
            .attr("height", height);

        const nodes = clusters.map((c, i) => ({
            ...c,
            r: 40 + c.size * 15,
            color: COLORS[i % COLORS.length],
        }));

        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(5))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius((d) => d.r + 10))
            .on("tick", ticked);

        const node = svg.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .style("cursor", "pointer")
            .on("click", (_, d) => onSelect(d));

        node.append("circle")
            .attr("r", (d) => d.r)
            .attr("fill", (d) => d.color)
            .attr("opacity", 0.85);

        node.append("text")
            .text((d) => d.label)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "white")
            .attr("font-size", (d) => Math.max(10, d.r / 4))
            .attr("font-weight", "bold")
            .each(function (d) {
                const words = d.label.split(" ");
                if (words.length > 2) {
                    d3.select(this).text("");
                    words.forEach((w, i) => {
                        d3.select(this).append("tspan")
                            .text(w)
                            .attr("x", 0)
                            .attr("dy", i === 0 ? `-${(words.length - 1) * 0.6}em` : "1.2em")
                            .attr("text-anchor", "middle");
                    });
                }
            });

        node.append("text")
            .text((d) => `${d.size} articles`)
            .attr("text-anchor", "middle")
            .attr("dy", (d) => d.r / 4 + 15)
            .attr("fill", "rgba(255,255,255,0.7)")
            .attr("font-size", 10);

        function ticked() {
            node.attr("transform", (d) => `translate(${d.x},${d.y})`);
        }
    }, [clusters]);

    return <svg ref={ref} className="rounded-xl bg-gray-900" />;
}