const GITHUB_API = "https://api.github.com";

export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  workflow_id: number;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  run_number: number;
  event: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  repository: {
    full_name: string;
  };
}

export interface WorkflowRunsResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
}

export interface WorkflowsResponse {
  total_count: number;
  workflows: Workflow[];
}

export interface WorkflowRunTiming {
  run_duration_ms: number;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function fetchWorkflows(
  token: string,
  owner: string,
  repo: string
): Promise<Workflow[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows?per_page=100`,
    { headers: headers(token), next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  const data: WorkflowsResponse = await res.json();
  return data.workflows;
}

export async function fetchWorkflowRuns(
  token: string,
  owner: string,
  repo: string,
  options: {
    per_page?: number;
    page?: number;
    status?: string;
    created?: string;
  } = {}
): Promise<WorkflowRunsResponse> {
  const params = new URLSearchParams();
  params.set("per_page", String(options.per_page ?? 100));
  params.set("page", String(options.page ?? 1));
  if (options.status) params.set("status", options.status);
  if (options.created) params.set("created", options.created);

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?${params}`,
    { headers: headers(token), next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchRunTiming(
  token: string,
  owner: string,
  repo: string,
  runId: number
): Promise<WorkflowRunTiming> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}/timing`,
    { headers: headers(token), next: { revalidate: 600 } }
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchAllRecentRuns(
  token: string,
  owner: string,
  repo: string,
  pages: number = 3
): Promise<WorkflowRun[]> {
  const allRuns: WorkflowRun[] = [];
  for (let page = 1; page <= pages; page++) {
    const data = await fetchWorkflowRuns(token, owner, repo, {
      per_page: 100,
      page,
    });
    allRuns.push(...data.workflow_runs);
    if (allRuns.length >= data.total_count) break;
  }
  return allRuns;
}
