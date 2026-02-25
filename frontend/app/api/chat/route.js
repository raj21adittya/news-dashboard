import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    try {
        const { question, clusters } = await request.json();

        if (!question || !clusters || clusters.length === 0) {
            return Response.json({ error: "Missing question or clusters" }, { status: 400 });
        }

        // Build RAG context from all clusters
        const context = clusters.map(c => `
TOPIC: ${c.label}
SUMMARY: ${c.summary}
SENTIMENT: ${c.sentiment}
HEADLINES:
${c.headlines.map(h => `- ${h.title} (${h.url})`).join("\n")}
        `).join("\n---\n");

        const prompt = `You are a news assistant. You have access to today's top news clusters below. Answer the user's question using ONLY the information provided. If the answer is not in the news data, say "I don't have information about that in today's news."

TODAY'S NEWS CONTEXT:
${context}

USER QUESTION: ${question}

Instructions:
- Answer concisely in 2-4 sentences
- Reference specific headlines where relevant
- End your answer with a "Sources:" section listing the most relevant article titles and URLs
- Format sources as a JSON block at the very end like this:
SOURCES_JSON:[{"title":"Article title","url":"https://..."}]`;

        const result = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });

        const raw = result.choices[0].message.content;

        // Parse answer and sources
        const sourcesMatch = raw.match(/SOURCES_JSON:(\[.*?\])/s);
        let sources = [];
        let answer = raw;

        if (sourcesMatch) {
            try {
                sources = JSON.parse(sourcesMatch[1]);
                answer = raw.replace(/SOURCES_JSON:(\[.*?\])/s, "").trim();
            } catch {
                answer = raw;
            }
        }

        return Response.json({ answer, sources });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}