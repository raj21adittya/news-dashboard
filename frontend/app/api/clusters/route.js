import { GoogleGenerativeAI } from "@google/generative-ai";

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

async function clusterWithGemini(headlines) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const titles = headlines.map((h, i) => `${i}. ${h.title}`).join("\n");

    const prompt = `You are a news analyst. Group these headlines into topic clusters.

Headlines:
${titles}

Return ONLY a valid JSON array like this:
[
  {
    "label": "Topic Name (3-5 words)",
    "summary": "Two sentence summary of this topic.",
    "indices": [0, 3, 7]
  }
]

Rules:
- Create 5-10 clusters
- Each headline can only appear in one cluster
- Skip headlines that don't fit any cluster
- Return ONLY the JSON array, no other text`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const clusters = JSON.parse(text);

    return clusters.map((c, i) => ({
        cluster_id: i,
        label: c.label,
        summary: c.summary,
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
        const clusters = await clusterWithGemini(headlines);

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