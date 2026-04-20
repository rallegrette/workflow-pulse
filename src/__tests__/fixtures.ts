import type { WorkflowRun } from "@/lib/github";

let _id = 1;

interface RunOverrides {
  id?: number;
  name?: string;
  head_branch?: string;
  status?: string;
  conclusion?: string | null;
  workflow_id?: number;
  created_at?: string;
  updated_at?: string;
  run_started_at?: string;
  run_number?: number;
  event?: string;
  actor_login?: string;
}

export function makeRun(overrides: RunOverrides = {}): WorkflowRun {
  const id = overrides.id ?? _id++;
  const created = overrides.created_at ?? "2026-04-15T10:00:00Z";
  return {
    id,
    name: overrides.name ?? "CI",
    head_branch: overrides.head_branch ?? "main",
    head_sha: "abc123",
    status: overrides.status ?? "completed",
    conclusion: overrides.conclusion ?? "success",
    workflow_id: overrides.workflow_id ?? 1,
    html_url: `https://github.com/test/repo/actions/runs/${id}`,
    created_at: created,
    updated_at: overrides.updated_at ?? "2026-04-15T10:02:00Z",
    run_started_at: overrides.run_started_at ?? created,
    run_number: overrides.run_number ?? id,
    event: overrides.event ?? "push",
    actor: {
      login: overrides.actor_login ?? "testuser",
      avatar_url: "https://github.com/testuser.png",
    },
    repository: {
      full_name: "test/repo",
    },
  };
}

export function makeSuccessRun(overrides: RunOverrides = {}): WorkflowRun {
  return makeRun({ conclusion: "success", ...overrides });
}

export function makeFailureRun(overrides: RunOverrides = {}): WorkflowRun {
  return makeRun({ conclusion: "failure", ...overrides });
}

export function makeCancelledRun(overrides: RunOverrides = {}): WorkflowRun {
  return makeRun({ conclusion: "cancelled", ...overrides });
}

export function makeInProgressRun(overrides: RunOverrides = {}): WorkflowRun {
  return makeRun({ status: "in_progress", conclusion: null, ...overrides });
}

export function resetIdCounter() {
  _id = 1;
}
