# Workflow Pulse

A real-time GitHub Actions dashboard that visualizes CI/CD pipeline health, run durations, and failure rates across repositories. Point it at any GitHub repo with Actions enabled and get instant insight into what's passing, what's breaking, and how long builds take.

Built with Next.js 16, TypeScript, Tailwind CSS 4, and Recharts.

---

## Features

### Dashboard Overview

Six KPI cards at the top give you an instant read on pipeline health:

| Metric | Description |
|--------|-------------|
| **Total Runs** | Count of all workflow runs fetched (up to 300 recent runs across 3 paginated API calls) |
| **Success Rate** | Percentage of completed runs that concluded with `success` |
| **Successes** | Absolute count of successful runs |
| **Failures** | Absolute count of failed runs |
| **Avg Duration** | Mean wall-clock time across all completed runs, computed from `run_started_at` to `updated_at` |
| **P95 Duration** | 95th percentile duration — highlights outlier slow builds that the average would mask |

Below the cards, four charts provide trend context over a rolling 14-day window:

- **Success Rate Trend** — Area chart tracking daily success rate so you can spot regressions over time
- **Daily Run Volume** — Stacked bar chart breaking down each day's runs by outcome (success / failure / cancelled)
- **Average Duration Trend** — Line chart showing how build speed is changing day-over-day
- **Workflow Health** — Horizontal bar chart ranking each workflow by success rate, color-coded with thresholds (green >= 90%, amber >= 70%, red < 70%)

A **Recent Runs** feed at the bottom lists the last 15 runs with status icons, branch names, event triggers, wall-clock duration, relative timestamps, and direct links to the run on GitHub.

### Workflows Page

A detailed table breaking down every distinct workflow in the repository:

- Workflow name and total run count
- Success rate rendered as a color-coded progress bar
- Average duration in human-readable format (`2m 34s`, `1h 12m`)
- Relative timestamp for the most recent run
- Status badge for the latest conclusion (Success / Failed / Cancelled / Running)

Sorted by total run count so the most active workflows surface first.

### Recent Runs Page

Full list of all fetched runs with filter toggles:

- **All** — Every run regardless of status
- **Success** — Only runs that concluded successfully
- **Failed** — Only runs that concluded with failure
- **Cancelled** — Only manually or automatically cancelled runs
- **In Progress** — Runs that haven't completed yet

Each run shows its workflow name, run number, branch, trigger event, wall-clock duration, relative timestamp, and a link to the GitHub Actions run page.

### Settings Page

Configuration UI for connecting to your GitHub data:

- **Token input** — Paste a GitHub Personal Access Token with password masking and a toggle to reveal it. Links directly to GitHub's token creation page with the correct scopes pre-selected.
- **Repository management** — Add repos in `owner/repo` format, click to set one as active, or remove repos you no longer want to track. The active repo is highlighted and shown in the sidebar.

All configuration is persisted to `localStorage` under the key `workflow-pulse-config`, so your token and repo list survive page refreshes without needing a backend database.

---

## Getting Started

### Prerequisites

- **Node.js 18+** (tested with Node 20/22)
- **npm** (ships with Node)
- A **GitHub Personal Access Token** with `repo` and `workflow` scopes

### Installation

```bash
git clone https://github.com/rallegrette/workflow-pulse.git
cd workflow-pulse
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-Time Setup

1. Navigate to **Settings** in the sidebar
2. Paste your GitHub Personal Access Token
3. Add a repository in `owner/repo` format (e.g. `facebook/react`, `vercel/next.js`)
4. Click the repo to make it active
5. Head to the **Overview** page — data loads automatically

### Production Build

```bash
npm run build
npm start
```

The app runs on port 3000 by default. Set the `PORT` environment variable to change it.

### Token Scopes

Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=repo,workflow).

| Scope | Required | Purpose |
|-------|----------|---------|
| `repo` | Yes | Read workflow run data from private repositories |
| `workflow` | Yes | Access the Actions API for run details and timing |

For public repos only, a fine-grained token with `Actions: Read` permission is sufficient.

---

## Architecture

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/github/
│   │   ├── runs/route.ts         # GET /api/github/runs — proxies workflow runs
│   │   └── workflows/route.ts    # GET /api/github/workflows — proxies workflow list
│   ├── workflows/page.tsx        # Per-workflow breakdown table
│   ├── runs/page.tsx             # Filterable run history
│   ├── settings/page.tsx         # Token & repo configuration
│   ├── layout.tsx                # Root layout (sidebar + provider)
│   ├── page.tsx                  # Dashboard overview
│   └── globals.css               # Tailwind imports + dark theme variables
├── components/
│   ├── charts/
│   │   ├── SuccessRateChart.tsx   # 14-day success rate area chart
│   │   ├── RunVolumeChart.tsx     # Stacked bar chart (success/failure/cancelled)
│   │   ├── DurationChart.tsx      # Average duration line chart
│   │   └── WorkflowHealthChart.tsx # Horizontal bar chart by workflow
│   ├── EmptyState.tsx            # Shown when no repo is configured
│   ├── LoadingState.tsx          # Spinner during initial data fetch
│   ├── RunsList.tsx              # Run history feed with status icons
│   ├── Sidebar.tsx               # Navigation sidebar with refresh control
│   ├── StatCard.tsx              # Reusable KPI metric card
│   └── WorkflowTable.tsx         # Workflow breakdown with progress bars
├── context/
│   └── DashboardContext.tsx      # Global state: token, repos, runs, loading
└── lib/
    ├── github.ts                 # GitHub REST API client functions
    ├── stats.ts                  # Pure data processing & aggregation
    └── types.ts                  # Shared TypeScript interfaces
```

### Data Flow

```
GitHub REST API
       │
       ▼
API Routes (src/app/api/github/)
  Server-side proxy — attaches token via
  x-github-token header, never exposed to browser
       │
       ▼
DashboardContext (src/context/)
  React Context + localStorage persistence
  Manages: token, repo list, active repo, runs[], loading, error
  Auto-fetches on token or activeRepo change
       │
       ▼
Stats Layer (src/lib/stats.ts)
  Pure functions — no side effects, fully memoized via useMemo
  computeStats()             → PipelineStats (totals, rates, percentiles)
  computeDailyTrends()       → DailyTrend[] (14-day bucketed aggregates)
  computeWorkflowBreakdowns()→ WorkflowBreakdown[] (per-workflow metrics)
  computeBranchBreakdowns()  → BranchBreakdown[] (per-branch metrics)
       │
       ▼
UI Components (src/components/)
  Recharts visualizations + tables + feeds
  All client components ("use client")
```

### Key Design Decisions

**API proxy pattern** — The client never calls `api.github.com` directly. All requests go through Next.js API routes (`/api/github/runs`, `/api/github/workflows`) that forward the token server-side via the `x-github-token` header. This keeps the PAT out of browser network logs, CORS isn't an issue, and the server can add caching headers (`next: { revalidate }`) for ISR-style freshness.

**Paginated fetching** — `fetchAllRecentRuns()` makes up to 3 sequential requests at 100 runs per page, yielding up to 300 recent runs. It short-circuits early if the total count is reached, avoiding unnecessary API calls against GitHub's rate limit.

**Pure stats layer** — All data processing in `stats.ts` is implemented as pure functions with no side effects. Duration is calculated from `run_started_at` → `updated_at` timestamps. Percentiles use a ceil-based index formula. Daily trends pre-initialize 14 date buckets to guarantee the chart always shows a full 2-week window even when some days have zero runs.

**Client-side state** — React Context with `useCallback`-stabilized setters. Configuration is mirrored to `localStorage` on every write so it persists across sessions. State reads from storage on mount via `useEffect` to avoid SSR hydration mismatches.

**Chart theming** — All Recharts instances share a consistent dark palette: `#111827` tooltip backgrounds, `#1f2937` grid lines, `#374151` axes, with semantic colors for data series (emerald for success, red for failure, gray for cancelled, purple for duration).

### GitHub API Endpoints Used

| Endpoint | Function | Cache TTL |
|----------|----------|-----------|
| `GET /repos/{owner}/{repo}/actions/workflows` | `fetchWorkflows()` | 5 min |
| `GET /repos/{owner}/{repo}/actions/runs` | `fetchWorkflowRuns()` | 1 min |
| `GET /repos/{owner}/{repo}/actions/runs/{id}/timing` | `fetchRunTiming()` | 10 min |

All requests use `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`.

---

## Tech Stack

| Technology | Version | Role |
|------------|---------|------|
| [Next.js](https://nextjs.org/) | 16.2 | App Router, API routes, server-side rendering |
| [React](https://react.dev/) | 19.2 | UI component model |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Static type checking across the full stack |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first styling, dark theme via CSS variables |
| [Recharts](https://recharts.org/) | 3.x | Composable charting (Area, Bar, Line charts) |
| [Lucide React](https://lucide.dev/) | 1.x | Icon library (consistent stroke-based icons) |
| [date-fns](https://date-fns.org/) | 4.x | Lightweight date parsing, formatting, and math |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@tailwindcss/postcss` | PostCSS integration for Tailwind 4 |
| `eslint` + `eslint-config-next` | Linting with Next.js-specific rules |
| `@types/react`, `@types/react-dom`, `@types/node` | TypeScript type definitions |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack on `localhost:3000` |
| `npm run build` | Create optimized production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint across the project |

---

## Rate Limits

GitHub's REST API allows **5,000 requests per hour** for authenticated requests. Each dashboard load makes 1–3 API calls (paginated). With the built-in `next: { revalidate }` caching on API routes, repeated loads within the cache window don't count against your rate limit.

If you're monitoring many repos or refreshing frequently, keep an eye on your remaining quota:

```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/rate_limit | jq '.rate'
```

