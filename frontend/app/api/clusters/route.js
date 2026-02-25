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
    const seen = new Set();
    const headlines = [];

    // NewsData.io — paginate 5 pages
    try {
        let nextPage = null;
        for (let i = 0; i < 5; i++) {
            const url = nextPage
                ? `https://newsdata.io/api/1/latest?apikey=${process.env.NEWSDATA_API_KEY}&language=en&size=10&page=${nextPage}`
                : `https://newsdata.io/api/1/latest?apikey=${process.env.NEWSDATA_API_KEY}&language=en&size=10`;

            const res = await fetch(url);
            const data = await res.json();

            if (!data.results || !Array.isArray(data.results)) break;

            data.results
                .filter(a => a.title && a.link && !seen.has(a.title))
                .forEach(a => {
                    seen.add(a.title);
                    headlines.push({ title: a.title, source: a.source_id || "Unknown", url: a.link });
                });

            nextPage = data.nextPage || null;
            if (!nextPage) break;
        }
        console.log(`NewsData.io: ${headlines.length} articles fetched`);
    } catch (err) {
        console.error("NewsData.io error:", err.message);
    }

    // GNews — fetch top headlines across 5 topics in parallel
    try {
        const topics = ["world", "technology", "business", "science", "health"];
        const gNewsRequests = topics.map(topic =>
            fetch(`https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`)
                .then(r => r.json())
                .catch(() => ({ articles: [] }))
        );

        const gNewsResults = await Promise.all(gNewsRequests);
        let gNewsCount = 0;

        gNewsResults.forEach(data => {
            (data.articles || []).forEach(a => {
                if (a.title && a.url && !seen.has(a.title)) {
                    seen.add(a.title);
                    headlines.push({ title: a.title, source: a.source?.name || "Unknown", url: a.url });
                    gNewsCount++;
                }
            });
        });
        console.log(`GNews: ${gNewsCount} articles fetched`);
    } catch (err) {
        console.error("GNews error:", err.message);
    }

    console.log(`Total: ${headlines.length} unique headlines fetched`);
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

        if (headlines.length === 0) {
            return Response.json(
                { error: "No headlines could be fetched. All sources failed." },
                { status: 503 }
            );
        }

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