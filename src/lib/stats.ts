import { WorkflowRun } from "./github";
import { format, parseISO, differenceInSeconds, subDays, startOfDay } from "date-fns";

export interface PipelineStats {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  cancelledCount: number;
  inProgressCount: number;
  successRate: number;
  failureRate: number;
  avgDurationSeconds: number;
  medianDurationSeconds: number;
  p95DurationSeconds: number;
}

export interface DailyTrend {
  date: string;
  success: number;
  failure: number;
  cancelled: number;
  total: number;
  successRate: number;
  avgDuration: number;
}

export interface WorkflowBreakdown {
  name: string;
  workflowId: number;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationSeconds: number;
  lastRun: string;
  lastConclusion: string | null;
}

export interface BranchBreakdown {
  branch: string;
  totalRuns: number;
  successRate: number;
}

function getDurationSeconds(run: WorkflowRun): number {
  const start = parseISO(run.run_started_at || run.created_at);
  const end = parseISO(run.updated_at);
  return Math.max(0, differenceInSeconds(end, start));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function computeStats(runs: WorkflowRun[]): PipelineStats {
  const completed = runs.filter((r) => r.status === "completed");
  const successCount = completed.filter((r) => r.conclusion === "success").length;
  const failureCount = completed.filter((r) => r.conclusion === "failure").length;
  const cancelledCount = completed.filter((r) => r.conclusion === "cancelled").length;
  const inProgressCount = runs.filter((r) => r.status !== "completed").length;

  const durations = completed.map(getDurationSeconds).sort((a, b) => a - b);
  const avg = durations.length > 0
    ? durations.reduce((s, d) => s + d, 0) / durations.length
    : 0;

  return {
    totalRuns: runs.length,
    successCount,
    failureCount,
    cancelledCount,
    inProgressCount,
    successRate: completed.length > 0 ? (successCount / completed.length) * 100 : 0,
    failureRate: completed.length > 0 ? (failureCount / completed.length) * 100 : 0,
    avgDurationSeconds: Math.round(avg),
    medianDurationSeconds: percentile(durations, 50),
    p95DurationSeconds: percentile(durations, 95),
  };
}

export function computeDailyTrends(runs: WorkflowRun[], days: number = 14): DailyTrend[] {
  const now = new Date();
  const buckets = new Map<string, WorkflowRun[]>();

  for (let i = days - 1; i >= 0; i--) {
    const day = format(startOfDay(subDays(now, i)), "yyyy-MM-dd");
    buckets.set(day, []);
  }

  for (const run of runs) {
    const day = format(parseISO(run.created_at), "yyyy-MM-dd");
    if (buckets.has(day)) {
      buckets.get(day)!.push(run);
    }
  }

  return Array.from(buckets.entries()).map(([date, dayRuns]) => {
    const completed = dayRuns.filter((r) => r.status === "completed");
    const success = completed.filter((r) => r.conclusion === "success").length;
    const failure = completed.filter((r) => r.conclusion === "failure").length;
    const cancelled = completed.filter((r) => r.conclusion === "cancelled").length;
    const durations = completed.map(getDurationSeconds);
    const avgDuration = durations.length > 0
      ? durations.reduce((s, d) => s + d, 0) / durations.length
      : 0;

    return {
      date: format(parseISO(date), "MMM d"),
      success,
      failure,
      cancelled,
      total: dayRuns.length,
      successRate: completed.length > 0 ? (success / completed.length) * 100 : 0,
      avgDuration: Math.round(avgDuration),
    };
  });
}

export function computeWorkflowBreakdowns(runs: WorkflowRun[]): WorkflowBreakdown[] {
  const groups = new Map<number, WorkflowRun[]>();

  for (const run of runs) {
    const existing = groups.get(run.workflow_id) || [];
    existing.push(run);
    groups.set(run.workflow_id, existing);
  }

  return Array.from(groups.entries())
    .map(([workflowId, wfRuns]) => {
      const sorted = [...wfRuns].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const completed = wfRuns.filter((r) => r.status === "completed");
      const successCount = completed.filter((r) => r.conclusion === "success").length;
      const failureCount = completed.filter((r) => r.conclusion === "failure").length;
      const durations = completed.map(getDurationSeconds);
      const avg = durations.length > 0
        ? durations.reduce((s, d) => s + d, 0) / durations.length
        : 0;

      return {
        name: sorted[0].name,
        workflowId,
        totalRuns: wfRuns.length,
        successCount,
        failureCount,
        successRate: completed.length > 0 ? (successCount / completed.length) * 100 : 0,
        avgDurationSeconds: Math.round(avg),
        lastRun: sorted[0].created_at,
        lastConclusion: sorted[0].conclusion,
      };
    })
    .sort((a, b) => b.totalRuns - a.totalRuns);
}

export function computeBranchBreakdowns(runs: WorkflowRun[]): BranchBreakdown[] {
  const groups = new Map<string, WorkflowRun[]>();

  for (const run of runs) {
    const existing = groups.get(run.head_branch) || [];
    existing.push(run);
    groups.set(run.head_branch, existing);
  }

  return Array.from(groups.entries())
    .map(([branch, branchRuns]) => {
      const completed = branchRuns.filter((r) => r.status === "completed");
      const success = completed.filter((r) => r.conclusion === "success").length;
      return {
        branch,
        totalRuns: branchRuns.length,
        successRate: completed.length > 0 ? (success / completed.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalRuns - a.totalRuns);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  const remainMin = min % 60;
  return `${hr}h ${remainMin}m`;
}
