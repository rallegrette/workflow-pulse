# Workflow Pulse

[![CI](https://github.com/rallegrette/workflow-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/rallegrette/workflow-pulse/actions/workflows/ci.yml)

**Real-time GitHub Actions dashboard with AI-powered CI/CD intelligence.**

Workflow Pulse connects to any GitHub repository and turns raw Actions data into actionable insights — surfacing pipeline health trends, detecting anomalies in failure rates and build durations, identifying flaky workflows through statistical analysis, and generating AI-driven root cause analysis and executive health summaries via OpenAI.

### Highlights

- **AI Failure Analysis** — GPT-4o-mini analyzes recent failures, identifies patterns across workflows/branches/triggers, and generates prioritized fix recommendations
- **AI Health Grading** — On-demand executive summary with a letter grade (A–F), key concerns, and action items informed by real pipeline metrics
- **Anomaly Detection** — Statistical engine that flags failure rate spikes, duration regressions, and unusual build volume by comparing recent vs. historical cohorts
- **Flaky Workflow Detection** — Scores workflows by pass/fail alternation frequency, with visual dot-pattern breakdowns of recent outcomes
- **MTTR Tracking** — Computes Mean Time to Recovery across all failure→success transitions
- **Interactive Visualizations** — Success rate trends, stacked run volume, duration charts, workflow health rankings, branch comparisons, and a day×hour activity heatmap
- **Data Export** — One-click CSV or JSON export on Workflows, Runs, and Branches pages for offline analysis or integration into other tools
- **Mobile-Responsive** — Fully responsive sidebar with hamburger menu, backdrop overlay, and auto-close on navigation; skeleton loading states on every route
- **Error Boundaries** — Graceful error handling with retry capability at the root and per-route level, plus animated loading skeletons
- **CI Pipeline** — GitHub Actions workflow with lint, type check, unit tests, API tests, and production build on every push and PR

Built with **Next.js 16** · **TypeScript** · **Tailwind CSS 4** · **Recharts** · **OpenAI API** · **83 tests**

---

## Features

### Dashboard Overview

Eight KPI cards at the top give you an instant read on pipeline health:

| Metric | Description |
|--------|-------------|
| **Total Runs** | Count of all workflow runs fetched (up to 300 recent runs across 3 paginated API calls) |
| **Success Rate** | Percentage of completed runs that concluded with `success` |
| **Successes** | Absolute count of successful runs |
| **Failures** | Absolute count of failed runs |
| **Avg Duration** | Mean wall-clock time across all completed runs, computed from `run_started_at` to `updated_at` |
| **P95 Duration** | 95th percentile duration — highlights outlier slow builds that the average would mask |
| **MTTR** | Mean Time to Recovery — average time from a failure to the next successful run |
| **Flaky** | Number of workflows with flakiness scores above 40% (frequent pass/fail alternation) |

Below the cards, six visualizations provide trend context:

- **Success Rate Trend** — Area chart tracking daily success rate over a rolling 14-day window
- **Daily Run Volume** — Stacked bar chart breaking down each day's runs by outcome (success / failure / cancelled)
- **Average Duration Trend** — Line chart showing how build speed is changing day-over-day
- **Workflow Health** — Horizontal bar chart ranking each workflow by success rate, color-coded with thresholds (green >= 90%, amber >= 70%, red < 70%)
- **Build Activity Heatmap** — Day-of-week × hour-of-day grid showing when builds happen most and least, with intensity coloring
- **Branch Health** — Success rate comparison across all active branches with color-coded progress bars

An **Anomaly Detection** banner surfaces automatically when the system detects failure rate spikes, duration regressions, or unusual build volume.

### AI Insights Page

Two AI-powered analysis panels, each generating on-demand via OpenAI:

**Pipeline Health Summary**
- Assigns a letter grade (A–F) based on current metrics
- Produces an executive summary for engineering leadership
- Identifies key concerns and what's working well
- Provides three prioritized recommended actions
- Incorporates anomaly data, flaky workflow data, MTTR, and failure streaks into the analysis

**Failure Root Cause Analysis**
- Analyzes up to 20 recent failures for patterns
- Groups failures by workflow, branch, and trigger event
- Hypothesizes root causes based on failure clustering
- Generates prioritized, actionable fix recommendations
- Assesses whether the failure pattern is worsening

The page also includes:
- **Reliability metric cards** for MTTR, flaky count, active failure streaks, and peak build hour
- **Flaky Workflow detector** with pass/fail pattern visualization (colored dot sequences showing recent run outcomes)
- **Active Failure Streaks** — workflows with 3+ consecutive failures on a branch, with links to GitHub
- **Slowest Builds** ranking with deviation-from-average percentages

### Workflows Page

A detailed table breaking down every distinct workflow in the repository:

- Workflow name and total run count
- Success rate rendered as a color-coded progress bar
- Average duration in human-readable format (`2m 34s`, `1h 12m`)
- Relative timestamp for the most recent run
- Status badge for the latest conclusion (Success / Failed / Cancelled / Running)

### Branch Health Page

Full branch-level CI/CD comparison:

- **Branch comparison chart** with success rates and progress bars
- **Activity heatmap** showing build patterns across the week
- **Detailed branch table** with pass/fail counts, success rates, contributor tags, and last activity timestamps

### Recent Runs Page

Full list of all fetched runs with filter toggles:

- **All** — Every run regardless of status
- **Success** — Only runs that concluded successfully
- **Failed** — Only runs that concluded with failure
- **Cancelled** — Only manually or automatically cancelled runs
- **In Progress** — Runs that haven't completed yet

Each run shows its workflow name, run number, branch, trigger event, wall-clock duration, relative timestamp, and a link to the GitHub Actions run page.

### Settings Page

Configuration UI for connecting to your data sources:

- **GitHub Token** — Personal Access Token with password masking and a direct link to GitHub's token creation page with correct scopes pre-selected
- **OpenAI API Key** — Optional key for AI-powered features, with link to platform.openai.com
- **Repository management** — Add repos in `owner/repo` format, click to set one as active, or remove repos you no longer want to track

All configuration is persisted to `localStorage` under the key `workflow-pulse-config`.

---

## Getting Started

### Prerequisites

- **Node.js 18+** (tested with Node 20/22)
- **npm** (ships with Node)
- A **GitHub Personal Access Token** with `repo` and `workflow` scopes
- *(Optional)* An **OpenAI API key** for AI-powered insights

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
3. *(Optional)* Paste your OpenAI API key to enable AI features
4. Add a repository in `owner/repo` format (e.g. `facebook/react`, `vercel/next.js`)
5. Click the repo to make it active
6. Head to the **Overview** page — data loads automatically

### Production Build

```bash
npm run build
npm start
```

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
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── ai/
│   │   │   ├── analyze/route.ts      # POST — AI failure root cause analysis
│   │   │   └── summary/route.ts      # POST — AI pipeline health summary
│   │   └── github/
│   │       ├── runs/route.ts         # GET  — proxies workflow runs
│   │       └── workflows/route.ts    # GET  — proxies workflow list
│   ├── branches/
│   │   ├── page.tsx                  # Branch health comparison
│   │   └── loading.tsx               # Branch page skeleton
│   ├── insights/
│   │   ├── page.tsx                  # AI insights + anomaly detection
│   │   └── loading.tsx               # Insights page skeleton
│   ├── workflows/
│   │   ├── page.tsx                  # Per-workflow breakdown table
│   │   └── loading.tsx               # Workflows page skeleton
│   ├── runs/
│   │   ├── page.tsx                  # Filterable run history
│   │   └── loading.tsx               # Runs page skeleton
│   ├── settings/page.tsx             # Token, API key & repo configuration
│   ├── error.tsx                     # Root error boundary with retry
│   ├── loading.tsx                   # Root loading state
│   ├── layout.tsx                    # Root layout (responsive sidebar + provider)
│   ├── page.tsx                      # Dashboard overview
│   └── globals.css                   # Tailwind imports + dark theme
├── components/
│   ├── charts/
│   │   ├── ActivityHeatmap.tsx       # Day×hour build activity heatmap
│   │   ├── SuccessRateChart.tsx      # 14-day success rate area chart
│   │   ├── RunVolumeChart.tsx        # Stacked bar chart
│   │   ├── DurationChart.tsx         # Average duration line chart
│   │   └── WorkflowHealthChart.tsx   # Horizontal bar chart by workflow
│   ├── AIInsightsPanel.tsx           # Reusable AI generation panel
│   ├── AnomalyAlerts.tsx             # Anomaly detection alert banners
│   ├── BranchComparison.tsx          # Branch success rate comparison
│   ├── FailureStreaks.tsx             # Consecutive failure tracker
│   ├── FlakyWorkflows.tsx            # Flaky workflow detector UI
│   ├── EmptyState.tsx                # Shown when no repo is configured
│   ├── ExportButton.tsx              # CSV/JSON export dropdown button
│   ├── LoadingState.tsx              # Spinner during initial data fetch
│   ├── RunsList.tsx                  # Run history feed with status icons
│   ├── Sidebar.tsx                   # Responsive navigation sidebar (mobile + desktop)
│   ├── StatCard.tsx                  # Reusable KPI metric card
│   └── WorkflowTable.tsx             # Workflow breakdown with progress bars
├── context/
│   └── DashboardContext.tsx          # Global state: tokens, repos, runs
└── lib/
    ├── analytics.ts                  # Anomaly detection, MTTR, flaky detection, heatmaps
    ├── export.ts                     # CSV/JSON export utilities with download trigger
    ├── github.ts                     # GitHub REST API client functions
    ├── stats.ts                      # Core data processing & aggregation
    └── types.ts                      # Shared TypeScript interfaces
```

### Data Flow

```
GitHub REST API ──────────────────────────────────────────────────────
       │
       ▼
API Routes (src/app/api/github/)
  Server-side proxy — attaches token via x-github-token header
       │
       ▼
DashboardContext (src/context/)
  React Context + localStorage persistence
  Manages: tokens, repo list, active repo, runs[], loading, error
  Auto-fetches on token or activeRepo change
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
Stats Layer (src/lib/stats.ts)    Analytics Layer (src/lib/analytics.ts)
  computeStats()                    detectAnomalies()
  computeDailyTrends()              detectFlakyWorkflows()
  computeWorkflowBreakdowns()       computeMTTR()
  computeBranchBreakdowns()         computeActivityHeatmap()
  formatDuration()                  detectFailureStreaks()
                                    findSlowestRuns()
                                    computePeakHours()
       │                                  │
       └──────────────┬───────────────────┘
                      ▼
               UI Components
                      │
                      ├─── On-demand AI Analysis ───┐
                      │                              ▼
                      │                    API Routes (src/app/api/ai/)
                      │                      POST /api/ai/analyze
                      │                      POST /api/ai/summary
                      │                              │
                      │                              ▼
                      │                        OpenAI API
                      │                      (gpt-4o-mini)
                      ▼
              Rendered Dashboard
```

### Key Design Decisions

**API proxy pattern** — The client never calls `api.github.com` or `api.openai.com` directly. All requests go through Next.js API routes that forward credentials server-side. This keeps tokens out of browser network logs and avoids CORS issues.

**Paginated fetching** — `fetchAllRecentRuns()` makes up to 3 sequential requests at 100 runs per page, yielding up to 300 recent runs. It short-circuits early if the total count is reached.

**Pure analytics engine** — All data processing in `stats.ts` and `analytics.ts` is implemented as pure functions with no side effects. This makes them easily testable and memoizable with `useMemo`.

**Statistical anomaly detection** — The system splits completed runs into historical (first 75%) and recent (last 25%) cohorts, then compares failure rates and duration averages. A failure rate spike is flagged when the recent rate exceeds 2x the baseline and is above 15%. Duration regressions trigger when recent average exceeds 1.5x baseline with at least 30s absolute increase.

**Flakiness scoring** — For each workflow with 4+ runs, flakiness is measured as the ratio of conclusion state changes (pass↔fail alternations) to total possible transitions. Workflows scoring above 40% are flagged, with the last 8 run outcomes shown as colored dots.

**MTTR calculation** — Scans chronologically sorted runs for failure→success transitions. The time delta from first failure to the resolving success gives recovery time. MTTR is the mean across all recovery events.

**AI integration** — OpenAI calls are on-demand (user clicks "Generate"), not automatic. The summary endpoint receives pre-computed metrics (stats, anomalies, flaky data, MTTR, streaks) so the LLM has full context. The analysis endpoint receives structured failure metadata. Both use `gpt-4o-mini` for cost efficiency.

**Client-side state** — React Context with `useCallback`-stabilized setters. Configuration (GitHub token, OpenAI key, repos) is mirrored to `localStorage` on every write. State reads from storage on mount via `useEffect` to avoid SSR hydration mismatches.

### API Endpoints

| Method | Endpoint | Purpose | Auth Header |
|--------|----------|---------|-------------|
| `GET` | `/api/github/runs` | Fetch paginated workflow runs | `x-github-token` |
| `GET` | `/api/github/workflows` | List repository workflows | `x-github-token` |
| `POST` | `/api/ai/analyze` | AI failure root cause analysis | `x-openai-key` |
| `POST` | `/api/ai/summary` | AI pipeline health summary | `x-openai-key` |

### GitHub API Endpoints Used

| Endpoint | Function | Cache TTL |
|----------|----------|-----------|
| `GET /repos/{owner}/{repo}/actions/workflows` | `fetchWorkflows()` | 5 min |
| `GET /repos/{owner}/{repo}/actions/runs` | `fetchWorkflowRuns()` | 1 min |
| `GET /repos/{owner}/{repo}/actions/runs/{id}/timing` | `fetchRunTiming()` | 10 min |

All requests use `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`.

---

## Analytics Engine

### Anomaly Detection (`detectAnomalies`)

| Anomaly Type | Detection Method | Severity Thresholds |
|--------------|-----------------|---------------------|
| Failure Spike | Recent (25%) failure rate vs. historical (75%) baseline | Warning: >2x baseline & >15%. Critical: >40% absolute |
| Duration Regression | Recent avg duration vs. historical avg | Warning: >1.5x & >30s increase. Critical: >2x |
| Unusual Volume | Latest day's run count vs. daily average | Warning: >2.5x average & >10 absolute |

### Reliability Metrics

| Metric | Formula |
|--------|---------|
| **MTTR** | Mean of all (first failure → resolving success) time deltas |
| **Flakiness Score** | `alternations / (runs - 1)` where alternations = conclusion state changes |
| **Failure Streak** | Count of consecutive failures from HEAD on a workflow+branch combination |
| **P95 Duration** | Ceil-based percentile index over sorted durations |

---

## Tech Stack

| Technology | Version | Role |
|------------|---------|------|
| [Next.js](https://nextjs.org/) | 16.2 | App Router, API routes, server-side rendering |
| [React](https://react.dev/) | 19.2 | UI component model |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Static type checking across the full stack |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first styling, dark theme via CSS variables |
| [Recharts](https://recharts.org/) | 3.x | Composable charting (Area, Bar, Line charts) |
| [OpenAI SDK](https://github.com/openai/openai-node) | 4.x | AI-powered failure analysis and health summaries |
| [Lucide React](https://lucide.dev/) | 1.x | Icon library (consistent stroke-based icons) |
| [date-fns](https://date-fns.org/) | 4.x | Lightweight date parsing, formatting, and math |

---

## Testing

The project includes 83 tests across 11 test suites covering the core logic, API routes, and UI components.

```bash
npm test              # Run all tests (unit + API)
npm run test:unit     # Unit + component tests only (jsdom)
npm run test:api      # API route tests only (node)
npm run test:watch    # Watch mode for development
npm run test:coverage # Run with coverage reports
```

### Test Structure

```
src/__tests__/
├── fixtures.ts                     # Shared test factory (makeRun, makeSuccessRun, etc.)
├── lib/
│   ├── stats.test.ts               # 23 tests — computeStats, trends, breakdowns, formatDuration
│   └── analytics.test.ts           # 30 tests — MTTR, flaky detection, anomalies, heatmap, streaks
├── api/
│   ├── github-runs.test.ts         # 5 tests  — GET /api/github/runs validation + proxy
│   ├── github-workflows.test.ts    # 3 tests  — GET /api/github/workflows
│   ├── ai-analyze.test.ts          # 3 tests  — POST /api/ai/analyze with mocked OpenAI
│   └── ai-summary.test.ts          # 2 tests  — POST /api/ai/summary with mocked OpenAI
└── components/
    ├── StatCard.test.tsx            # 5 tests  — KPI card rendering, trends, subtitles
    ├── AnomalyAlerts.test.tsx       # 4 tests  — Warning/critical alert rendering
    ├── FlakyWorkflows.test.tsx      # 3 tests  — Flaky detection UI
    ├── FailureStreaks.test.tsx       # 2 tests  — Streak display
    └── BranchComparison.test.tsx    # 3 tests  — Branch health bars, truncation
```

### Test Approach

- **Unit tests** (`lib/`) use a shared fixture factory to create `WorkflowRun` objects with specific overrides, keeping tests concise and readable
- **API route tests** mock the underlying service functions (`fetchAllRecentRuns`, `fetchWorkflows`, OpenAI SDK) to isolate route handler logic — verifying parameter validation, error handling, and response formatting
- **Component tests** use React Testing Library to verify rendering behavior without testing implementation details
- Two separate Jest configs are used: `jest.config.ts` (jsdom environment for components + unit tests) and `jest.api.config.ts` (node environment for API routes that depend on Web APIs)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack on `localhost:3000` |
| `npm run build` | Create optimized production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint across the project |
| `npm test` | Run all tests (unit + component + API) |
| `npm run test:unit` | Unit and component tests only |
| `npm run test:api` | API route tests only |
| `npm run test:watch` | Watch mode for unit tests |
| `npm run test:coverage` | Run all tests with coverage reports |

---

## Rate Limits

**GitHub:** 5,000 requests/hour for authenticated requests. Each dashboard load makes 1–3 API calls. Built-in `next: { revalidate }` caching prevents redundant calls.

**OpenAI:** AI analysis is on-demand only (not automatic). Each generation makes one API call using `gpt-4o-mini`. Typical cost is < $0.01 per analysis.

