# Workflow Pulse

A GitHub Actions dashboard that visualizes CI/CD pipeline health, run times, and failure rates across repositories.

Built with Next.js, TypeScript, Tailwind CSS, and Recharts.

## Features

- **Pipeline Overview** — KPI cards showing total runs, success rate, failure count, avg/p95 durations
- **Trend Charts** — 14-day success rate, run volume (stacked by outcome), and duration trends
- **Workflow Health** — Horizontal bar chart ranking workflows by success rate with color-coded thresholds
- **Workflow Table** — Per-workflow breakdown with success rate progress bars, avg duration, and last-run status
- **Recent Runs Feed** — Filterable list of all runs with status icons, branch, event type, duration, and links to GitHub
- **Multi-Repo Support** — Add multiple repositories and switch between them
- **Persistent Config** — Token and repo list stored in localStorage

## Getting Started

### Prerequisites

- Node.js 18+
- A GitHub Personal Access Token with `repo` and `workflow` scopes

### Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), navigate to **Settings**, paste your token, and add a repository in `owner/repo` format.

### Token Scopes

Generate a token at https://github.com/settings/tokens/new?scopes=repo,workflow

| Scope | Why |
|-------|-----|
| `repo` | Access private repo workflow data |
| `workflow` | Read workflow run details |

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/github/         # API routes (proxy to GitHub API)
│   ├── workflows/          # Workflows breakdown page
│   ├── runs/               # Filterable runs list page
│   ├── settings/           # Token & repo configuration
│   └── page.tsx            # Dashboard overview
├── components/             # React components
│   ├── charts/             # Recharts visualizations
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── StatCard.tsx        # KPI metric cards
│   ├── WorkflowTable.tsx   # Workflow breakdown table
│   └── RunsList.tsx        # Run history feed
├── context/                # React context (DashboardContext)
└── lib/                    # Core logic
    ├── github.ts           # GitHub API client
    ├── stats.ts            # Data processing & aggregation
    └── types.ts            # Shared types
```

## Tech Stack

- **Next.js 16** — App Router, API routes
- **TypeScript** — Type safety throughout
- **Tailwind CSS 4** — Utility-first styling, dark theme
- **Recharts** — Area, bar, and line charts
- **Lucide React** — Icon system
- **date-fns** — Date formatting and calculations
