# 🌐 NewsLens — AI-Powered News Intelligence Dashboard

> Real-time news clustering, sentiment analysis, and RAG-powered Q&A — built with Next.js, Groq, and deployed on Vercel.

**Live Demo:** [news-dashboard-app-ruddy.vercel.app](https://news-dashboard-zeta.vercel.app/)

---

## What is NewsLens?

NewsLens fetches hundreds of live headlines every 30 minutes, uses Groq's Llama 3.3 70B to automatically cluster them into topics, and visualizes the results as an interactive bubble chart. Each cluster is analyzed for sentiment. Users can also chat with the news using a RAG-powered chatbot that answers questions using today's actual headlines as context.

---

## Features

- **AI Topic Clustering** — Groq LLM groups 100+ headlines into 5–10 meaningful topic clusters automatically
- **Sentiment Analysis** — Each cluster is classified as Positive, Negative, or Neutral with a confidence score
- **Interactive Bubble Chart** — D3.js visualization where bubble size = topic prominence, with sentiment color rings
- **RAG Chatbot** — Ask natural language questions answered using today's live headlines as context
- **Multi-Source News** — Pulls from NewsData.io and GNews across categories and regions
- **30-min Auto Refresh** — Cache-backed refresh with manual override
- **Dark / Light Mode** — Full theme toggle
- **Fully Deployed** — Hosted on Vercel, publicly accessible

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Visualization | D3.js |
| AI / LLM | Groq API — Llama 3.3 70B Versatile |
| News Sources | NewsData.io API, GNews API |
| Deployment | Vercel |
| RAG | Custom implementation using cluster headlines as context |

---

## Project Structure

```
news-dashboard/
├── venv/                            # Python virtual environment (optional, not committed)
├── .env                             # Python environment variables (not committed)
├── requirements.txt                 # Python dependencies (legacy scripts)
├── fetch_headlines.py               # Legacy: fetches headlines via NewsAPI
├── embed_and_cluster.py             # Legacy: Gemini embeddings + HDBSCAN clustering
├── cluster.py                       # Legacy: clustering script
├── summarize.py                     # Legacy: Gemini summarization
└── frontend/
    ├── .env.local                   # Local environment variables (not committed)
    ├── package.json                 # Node dependencies
    ├── next.config.mjs              # Next.js config
    └── app/
        ├── page.js                  # Main UI — hero, bubble chart, side panel, footer
        ├── layout.js                # Root layout
        ├── globals.css              # Global styles
        ├── components/
        │   ├── BubbleChart.js       # D3.js force simulation bubble chart
        │   ├── ChatBubble.js        # Floating RAG chatbot UI component
        │   └── NewsLensLogo.js      # SVG logo component with dark/light mode
        └── api/
            ├── clusters/
            │   └── route.js         # Main API — fetches news, clusters with Groq, caches results
            └── chat/
                └── route.js         # RAG chat API — answers questions using live clusters as context
```

---

## Installation

### Prerequisites

- Node.js 18+
- Python 3.9+ (optional, for legacy scripts only)
- npm or yarn
- API keys (see below)

### 1. Clone the repo

```bash
git clone https://github.com/raj21adittya/news-dashboard.git
cd news-dashboard
```

### 2. (Optional) Set up Python virtual environment

Only needed if you want to explore the legacy Python pipeline scripts. The main dashboard runs entirely on Node.js — skip this if you just want to run the app.

```bash
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# OR
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

### 3. Install Node dependencies

```bash
cd frontend
npm install
```

### 4. Get API Keys

You need three free API keys:

| Service | Where to get it | Free Tier |
|---|---|---|
| **Groq** | [console.groq.com](https://console.groq.com) | 14,400 requests/day |
| **NewsData.io** | [newsdata.io](https://newsdata.io) | 200 requests/day |
| **GNews** | [gnews.io](https://gnews.io) | 100 requests/day |

### 5. Set up environment variables

Create a `.env.local` file inside the `frontend/` directory:

```bash
GROQ_API_KEY=your_groq_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `GROQ_API_KEY`
   - `NEWSDATA_API_KEY`
   - `GNEWS_API_KEY`
5. Click **Deploy**

Vercel auto-deploys on every `git push`.

---

## How It Works

### News Fetching
Two sources are queried in parallel on every refresh:
- **NewsData.io** — paginated across 5 pages (~40 articles)
- **GNews** — top headlines across 5 topics: world, technology, business, science, health (~50 articles)

Headlines are deduplicated using a `Set` before clustering.

### AI Clustering
All headlines are sent in a single prompt to Groq's `llama-3.3-70b-versatile` model. The model returns a JSON array of clusters, each with:
- A topic label (3–5 words)
- A two-sentence summary
- A sentiment classification (`positive`, `negative`, `neutral`)
- A sentiment confidence score (0.0–1.0)
- The indices of headlines that belong to the cluster

### Caching
Results are cached in memory for 30 minutes. Use the **Refresh** button to force a fresh fetch. This ensures the news APIs stay within their free tier daily limits.

### RAG Chatbot
When a user asks a question:
1. All current clusters (labels, summaries, headlines + URLs) are passed as context to Groq
2. Groq answers using only that context — no hallucination from outside sources
3. The response includes cited source URLs from the actual headlines

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for LLM clustering and chat |
| `NEWSDATA_API_KEY` | NewsData.io API key for headline fetching |
| `GNEWS_API_KEY` | GNews API key for additional headline sources |

---

## Known Limitations

- In-memory cache resets on Vercel cold starts
- NewsData.io and GNews free tiers limit total daily refreshes to ~100
- Groq free tier supports up to 14,400 requests/day which is more than sufficient

---

## Built By

Made with ❤️ by **Adittya Raj**  
MBA Candidate, UNC Kenan-Flagler Business School  
[GitHub](https://github.com/raj21adittya)
