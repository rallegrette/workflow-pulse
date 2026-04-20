import { WorkflowRun } from "./github";
import { parseISO, differenceInSeconds, differenceInMinutes, getDay, getHours } from "date-fns";

// --- MTTR (Mean Time to Recovery) ---

export interface MTTRResult {
  mttrSeconds: number;
  recoveryCount: number;
  longestRecoverySeconds: number;
  shortestRecoverySeconds: number;
}

export function computeMTTR(runs: WorkflowRun[]): MTTRResult | null {
  const sorted = [...runs]
    .filter((r) => r.status === "completed")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const recoveryTimes: number[] = [];
  let lastFailureTime: Date | null = null;

  for (const run of sorted) {
    if (run.conclusion === "failure" && !lastFailureTime) {
      lastFailureTime = parseISO(run.created_at);
    } else if (run.conclusion === "success" && lastFailureTime) {
      const recoverySeconds = differenceInSeconds(
        parseISO(run.updated_at),
        lastFailureTime
      );
      recoveryTimes.push(recoverySeconds);
      lastFailureTime = null;
    }
  }

  if (recoveryTimes.length === 0) return null;

  const sorted_times = [...recoveryTimes].sort((a, b) => a - b);
  return {
    mttrSeconds: Math.round(
      recoveryTimes.reduce((s, t) => s + t, 0) / recoveryTimes.length
    ),
    recoveryCount: recoveryTimes.length,
    longestRecoverySeconds: sorted_times[sorted_times.length - 1],
    shortestRecoverySeconds: sorted_times[0],
  };
}

// --- Flaky Workflow Detection ---

export interface FlakyWorkflow {
  name: string;
  workflowId: number;
  flakinessScore: number;
  alternations: number;
  totalRuns: number;
  recentPattern: string[];
}

export function detectFlakyWorkflows(runs: WorkflowRun[]): FlakyWorkflow[] {
  const groups = new Map<number, WorkflowRun[]>();

  for (const run of runs) {
    if (run.status !== "completed") continue;
    const existing = groups.get(run.workflow_id) || [];
    existing.push(run);
    groups.set(run.workflow_id, existing);
  }

  const results: FlakyWorkflow[] = [];

  for (const [workflowId, wfRuns] of groups) {
    if (wfRuns.length < 4) continue;

    const sorted = [...wfRuns].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let alternations = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].conclusion !== sorted[i - 1].conclusion) {
        alternations++;
      }
    }

    // Flakiness = ratio of state changes to possible state changes
    const flakinessScore = alternations / (sorted.length - 1);

    if (flakinessScore > 0.4) {
      const recent = sorted.slice(-8).map((r) =>
        r.conclusion === "success" ? "pass" : r.conclusion === "failure" ? "fail" : "other"
      );

      results.push({
        name: sorted[0].name,
        workflowId,
        flakinessScore,
        alternations,
        totalRuns: sorted.length,
        recentPattern: recent,
      });
    }
  }

  return results.sort((a, b) => b.flakinessScore - a.flakinessScore);
}

// --- Anomaly Detection ---

export interface Anomaly {
  type: "failure_spike" | "duration_regression" | "unusual_volume";
  severity: "warning" | "critical";
  message: string;
  detail: string;
  metric: number;
  baseline: number;
}

export function detectAnomalies(runs: WorkflowRun[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const completed = runs.filter((r) => r.status === "completed");

  if (completed.length < 10) return anomalies;

  const sorted = [...completed].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Split into recent (last 25%) vs historical (first 75%)
  const splitIdx = Math.floor(sorted.length * 0.75);
  const historical = sorted.slice(0, splitIdx);
  const recent = sorted.slice(splitIdx);

  // Failure rate anomaly
  const historicalFailRate =
    historical.filter((r) => r.conclusion === "failure").length / historical.length;
  const recentFailRate =
    recent.filter((r) => r.conclusion === "failure").length / recent.length;

  if (recentFailRate > historicalFailRate * 2 && recentFailRate > 0.15) {
    anomalies.push({
      type: "failure_spike",
      severity: recentFailRate > 0.4 ? "critical" : "warning",
      message: "Failure rate spike detected",
      detail: `Recent failure rate (${(recentFailRate * 100).toFixed(1)}%) is ${(recentFailRate / Math.max(historicalFailRate, 0.01)).toFixed(1)}x the historical baseline (${(historicalFailRate * 100).toFixed(1)}%)`,
      metric: recentFailRate * 100,
      baseline: historicalFailRate * 100,
    });
  }

  // Duration regression
  const getDuration = (run: WorkflowRun) => {
    const start = parseISO(run.run_started_at || run.created_at);
    const end = parseISO(run.updated_at);
    return Math.max(0, differenceInSeconds(end, start));
  };

  const historicalDurations = historical.map(getDuration);
  const recentDurations = recent.map(getDuration);

  const historicalAvg =
    historicalDurations.reduce((s, d) => s + d, 0) / historicalDurations.length;
  const recentAvg =
    recentDurations.reduce((s, d) => s + d, 0) / recentDurations.length;

  if (recentAvg > historicalAvg * 1.5 && recentAvg - historicalAvg > 30) {
    const regressPct = ((recentAvg - historicalAvg) / historicalAvg) * 100;
    anomalies.push({
      type: "duration_regression",
      severity: regressPct > 100 ? "critical" : "warning",
      message: "Build duration regression",
      detail: `Recent builds average ${formatSec(Math.round(recentAvg))}, up ${regressPct.toFixed(0)}% from the ${formatSec(Math.round(historicalAvg))} baseline`,
      metric: recentAvg,
      baseline: historicalAvg,
    });
  }

  // Volume anomaly
  const dayBuckets = new Map<string, number>();
  for (const run of runs) {
    const day = run.created_at.slice(0, 10);
    dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
  }

  const dayCounts = Array.from(dayBuckets.values());
  if (dayCounts.length >= 3) {
    const avgDaily = dayCounts.reduce((s, c) => s + c, 0) / dayCounts.length;
    const lastDay = dayCounts[dayCounts.length - 1];

    if (lastDay > avgDaily * 2.5 && lastDay > 10) {
      anomalies.push({
        type: "unusual_volume",
        severity: "warning",
        message: "Unusual build volume",
        detail: `${lastDay} runs on the most recent day vs. an average of ${avgDaily.toFixed(1)} per day`,
        metric: lastDay,
        baseline: avgDaily,
      });
    }
  }

  return anomalies;
}

function formatSec(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// --- Activity Heatmap ---

export interface HeatmapCell {
  day: number; // 0=Sun, 6=Sat
  hour: number; // 0-23
  count: number;
  successRate: number;
}

export function computeActivityHeatmap(runs: WorkflowRun[]): HeatmapCell[] {
  const grid = new Map<string, { total: number; success: number }>();

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid.set(`${d}-${h}`, { total: 0, success: 0 });
    }
  }

  for (const run of runs) {
    const date = parseISO(run.created_at);
    const key = `${getDay(date)}-${getHours(date)}`;
    const cell = grid.get(key)!;
    cell.total++;
    if (run.conclusion === "success") cell.success++;
  }

  return Array.from(grid.entries()).map(([key, val]) => {
    const [day, hour] = key.split("-").map(Number);
    return {
      day,
      hour,
      count: val.total,
      successRate: val.total > 0 ? (val.success / val.total) * 100 : 0,
    };
  });
}

// --- Failure Streaks ---

export interface FailureStreak {
  workflow: string;
  branch: string;
  consecutiveFailures: number;
  since: string;
  runs: { id: number; created_at: string; html_url: string }[];
}

export function detectFailureStreaks(runs: WorkflowRun[]): FailureStreak[] {
  const groups = new Map<string, WorkflowRun[]>();

  for (const run of runs) {
    if (run.status !== "completed") continue;
    const key = `${run.workflow_id}::${run.head_branch}`;
    const existing = groups.get(key) || [];
    existing.push(run);
    groups.set(key, existing);
  }

  const streaks: FailureStreak[] = [];

  for (const [, groupRuns] of groups) {
    const sorted = [...groupRuns].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const consecutive: WorkflowRun[] = [];
    for (const run of sorted) {
      if (run.conclusion === "failure") {
        consecutive.push(run);
      } else {
        break;
      }
    }

    if (consecutive.length >= 3) {
      streaks.push({
        workflow: consecutive[0].name,
        branch: consecutive[0].head_branch,
        consecutiveFailures: consecutive.length,
        since: consecutive[consecutive.length - 1].created_at,
        runs: consecutive.map((r) => ({
          id: r.id,
          created_at: r.created_at,
          html_url: r.html_url,
        })),
      });
    }
  }

  return streaks.sort((a, b) => b.consecutiveFailures - a.consecutiveFailures);
}

// --- Slowest Runs ---

export interface SlowestRun {
  id: number;
  name: string;
  branch: string;
  durationSeconds: number;
  created_at: string;
  html_url: string;
  deviationFromAvg: number;
}

export function findSlowestRuns(runs: WorkflowRun[], limit: number = 10): SlowestRun[] {
  const completed = runs.filter(
    (r) => r.status === "completed" && r.conclusion === "success"
  );

  if (completed.length === 0) return [];

  const getDuration = (run: WorkflowRun) => {
    const start = parseISO(run.run_started_at || run.created_at);
    const end = parseISO(run.updated_at);
    return Math.max(0, differenceInSeconds(end, start));
  };

  const withDuration = completed.map((r) => ({
    run: r,
    duration: getDuration(r),
  }));

  const avg = withDuration.reduce((s, r) => s + r.duration, 0) / withDuration.length;

  return withDuration
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit)
    .map(({ run, duration }) => ({
      id: run.id,
      name: run.name,
      branch: run.head_branch,
      durationSeconds: duration,
      created_at: run.created_at,
      html_url: run.html_url,
      deviationFromAvg: ((duration - avg) / avg) * 100,
    }));
}

// --- Peak Hours ---

export interface PeakHour {
  hour: number;
  label: string;
  count: number;
  avgDurationMinutes: number;
  failureRate: number;
}

export function computePeakHours(runs: WorkflowRun[]): PeakHour[] {
  const buckets = new Map<number, WorkflowRun[]>();
  for (let h = 0; h < 24; h++) buckets.set(h, []);

  for (const run of runs) {
    const hour = getHours(parseISO(run.created_at));
    buckets.get(hour)!.push(run);
  }

  return Array.from(buckets.entries())
    .map(([hour, hourRuns]) => {
      const completed = hourRuns.filter((r) => r.status === "completed");
      const failures = completed.filter((r) => r.conclusion === "failure").length;
      const durations = completed.map((r) => {
        const start = parseISO(r.run_started_at || r.created_at);
        const end = parseISO(r.updated_at);
        return differenceInMinutes(end, start);
      });
      const avgDur = durations.length > 0
        ? durations.reduce((s, d) => s + d, 0) / durations.length
        : 0;

      const period = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;

      return {
        hour,
        label: `${h12}${period}`,
        count: hourRuns.length,
        avgDurationMinutes: Math.round(avgDur * 10) / 10,
        failureRate: completed.length > 0 ? (failures / completed.length) * 100 : 0,
      };
    })
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count);
}
