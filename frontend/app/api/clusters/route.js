import Groq from "groq-sdk";

// In-memory cache
let cache = {
    clusters: null,
    fetchedAt: null,
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function isCacheValid() {
    return (
        cache.clusters &&
        cache.fetchedAt &&
        Date.now() - cache.fetchedAt < CACHE_DURATION
    );
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchHeadlines() {
    const categories = ["general", "technology", "business", "science", "health", "sports", "entertainment"];

    const requests = categories.map(category =>
        fetch(`https://newsapi.org/v2/top-headlines?language=en&pageSize=15&category=${category}&apiKey=${process.env.NEWSAPI_KEY}`)
            .then(r => r.json())
    );

    const results = await Promise.all(requests);

    const seen = new Set();
    const headlines = [];

    results.forEach(data => {
        (data.articles || []).forEach(a => {
            if (
                a.title &&
                a.title !== "[Removed]" &&
                !seen.has(a.title)
            ) {
                seen.add(a.title);
                headlines.push({
                    title: a.title,
                    source: a.source.name,
                    url: a.url,
                });
            }
        });
    });

    return headlines;
}

async function clusterWithGroq(headlines) {
    const titles = headlines.map((h, i) => `${i}. ${h.title}`).join("\n");

    const prompt = `You are a news analyst. Group these headlines into topic clusters.

Headlines:
${titles}

Return ONLY a valid JSON array like this:
[
  {
    "label": "Topic Name (3-5 words)",
    "summary": "Two sentence summary of this topic.",
    "sentiment": "positive",
    "sentiment_score": 0.72,
    "indices": [0, 3, 7]
  }
]

Rules:
- Create 5-10 clusters
- Each headline can only appear in one cluster
- Skip headlines that don't fit any cluster
- sentiment must be exactly one of: "positive", "negative", "neutral"
- sentiment_score is a float from 0.0 to 1.0 representing confidence
- Return ONLY the JSON array, no other text`;

    const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
    });

    const text = result.choices[0].message.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const clusters = JSON.parse(text);

    return clusters.map((c, i) => ({
        cluster_id: i,
        label: c.label,
        summary: c.summary,
        sentiment: c.sentiment || "neutral",
        sentiment_score: c.sentiment_score || 0.5,
        headlines: c.indices.map((idx) => ({
            title: headlines[idx]?.title,
            url: headlines[idx]?.url,
        })).filter(h => h.title),
        size: c.indices.length,
    }));
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get("force") === "true";

        if (!force && isCacheValid()) {
            console.log("Serving from cache");
            return Response.json({
                clusters: cache.clusters,
                fetchedAt: new Date(cache.fetchedAt).toISOString(),
                fromCache: true,
            });
        }

        console.log("Fetching fresh data...");
        const headlines = await fetchHeadlines();
        const clusters = await clusterWithGroq(headlines);

        cache.clusters = clusters;
        cache.fetchedAt = Date.now();

        return Response.json({
            clusters,
            fetchedAt: new Date(cache.fetchedAt).toISOString(),
            fromCache: false,
        });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}