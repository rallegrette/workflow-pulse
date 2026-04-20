import {
  computeStats,
  computeDailyTrends,
  computeWorkflowBreakdowns,
  computeBranchBreakdowns,
  formatDuration,
} from "@/lib/stats";
import {
  makeSuccessRun,
  makeFailureRun,
  makeCancelledRun,
  makeInProgressRun,
  resetIdCounter,
} from "../fixtures";

beforeEach(() => resetIdCounter());

describe("computeStats", () => {
  it("returns zeroed stats for empty runs", () => {
    const stats = computeStats([]);
    expect(stats.totalRuns).toBe(0);
    expect(stats.successCount).toBe(0);
    expect(stats.failureCount).toBe(0);
    expect(stats.cancelledCount).toBe(0);
    expect(stats.inProgressCount).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.failureRate).toBe(0);
    expect(stats.avgDurationSeconds).toBe(0);
    expect(stats.medianDurationSeconds).toBe(0);
    expect(stats.p95DurationSeconds).toBe(0);
  });

  it("counts successes, failures, cancelled, and in-progress correctly", () => {
    const runs = [
      makeSuccessRun(),
      makeSuccessRun(),
      makeSuccessRun(),
      makeFailureRun(),
      makeCancelledRun(),
      makeInProgressRun(),
    ];
    const stats = computeStats(runs);

    expect(stats.totalRuns).toBe(6);
    expect(stats.successCount).toBe(3);
    expect(stats.failureCount).toBe(1);
    expect(stats.cancelledCount).toBe(1);
    expect(stats.inProgressCount).toBe(1);
  });

  it("computes success and failure rates from completed runs only", () => {
    const runs = [
      makeSuccessRun(),
      makeSuccessRun(),
      makeFailureRun(),
      makeInProgressRun(),
    ];
    const stats = computeStats(runs);

    // 3 completed: 2 success, 1 failure
    expect(stats.successRate).toBeCloseTo(66.67, 1);
    expect(stats.failureRate).toBeCloseTo(33.33, 1);
  });

  it("computes duration statistics", () => {
    // 120s each run
    const runs = [
      makeSuccessRun({
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:02:00Z",
      }),
      makeSuccessRun({
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:04:00Z", // 240s
      }),
      makeSuccessRun({
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:01:00Z", // 60s
      }),
    ];
    const stats = computeStats(runs);

    expect(stats.avgDurationSeconds).toBe(140); // (120+240+60)/3 = 140
    expect(stats.medianDurationSeconds).toBe(120);
    expect(stats.p95DurationSeconds).toBe(240);
  });

  it("handles all-successful runs as 100% success rate", () => {
    const runs = [makeSuccessRun(), makeSuccessRun(), makeSuccessRun()];
    const stats = computeStats(runs);
    expect(stats.successRate).toBe(100);
    expect(stats.failureRate).toBe(0);
  });

  it("handles all-failed runs as 0% success rate", () => {
    const runs = [makeFailureRun(), makeFailureRun()];
    const stats = computeStats(runs);
    expect(stats.successRate).toBe(0);
    expect(stats.failureRate).toBe(100);
  });
});

describe("computeDailyTrends", () => {
  it("returns the correct number of days", () => {
    const trends = computeDailyTrends([], 7);
    expect(trends).toHaveLength(7);
  });

  it("returns 14 days by default", () => {
    const trends = computeDailyTrends([]);
    expect(trends).toHaveLength(14);
  });

  it("buckets runs into the correct day", () => {
    const today = new Date().toISOString().slice(0, 10);
    const runs = [
      makeSuccessRun({ created_at: `${today}T08:00:00Z`, updated_at: `${today}T08:01:00Z` }),
      makeFailureRun({ created_at: `${today}T12:00:00Z`, updated_at: `${today}T12:01:00Z` }),
    ];

    const trends = computeDailyTrends(runs, 1);
    expect(trends).toHaveLength(1);
    expect(trends[0].total).toBe(2);
    expect(trends[0].success).toBe(1);
    expect(trends[0].failure).toBe(1);
    expect(trends[0].successRate).toBe(50);
  });

  it("ignores runs outside the date range", () => {
    const runs = [
      makeSuccessRun({ created_at: "2020-01-01T00:00:00Z", updated_at: "2020-01-01T00:01:00Z" }),
    ];
    const trends = computeDailyTrends(runs, 7);
    const totalRuns = trends.reduce((s, t) => s + t.total, 0);
    expect(totalRuns).toBe(0);
  });

  it("computes average duration per day", () => {
    const today = new Date().toISOString().slice(0, 10);
    const runs = [
      makeSuccessRun({
        created_at: `${today}T08:00:00Z`,
        run_started_at: `${today}T08:00:00Z`,
        updated_at: `${today}T08:01:00Z`, // 60s
      }),
      makeSuccessRun({
        created_at: `${today}T09:00:00Z`,
        run_started_at: `${today}T09:00:00Z`,
        updated_at: `${today}T09:03:00Z`, // 180s
      }),
    ];
    const trends = computeDailyTrends(runs, 1);
    expect(trends[0].avgDuration).toBe(120); // (60+180)/2
  });
});

describe("computeWorkflowBreakdowns", () => {
  it("returns empty array for no runs", () => {
    expect(computeWorkflowBreakdowns([])).toEqual([]);
  });

  it("groups runs by workflow_id", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, name: "CI" }),
      makeSuccessRun({ workflow_id: 1, name: "CI" }),
      makeFailureRun({ workflow_id: 2, name: "Deploy" }),
    ];

    const breakdowns = computeWorkflowBreakdowns(runs);
    expect(breakdowns).toHaveLength(2);

    const ci = breakdowns.find((b) => b.name === "CI")!;
    expect(ci.totalRuns).toBe(2);
    expect(ci.successCount).toBe(2);
    expect(ci.successRate).toBe(100);

    const deploy = breakdowns.find((b) => b.name === "Deploy")!;
    expect(deploy.totalRuns).toBe(1);
    expect(deploy.failureCount).toBe(1);
    expect(deploy.successRate).toBe(0);
  });

  it("sorts by total runs descending", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, name: "A" }),
      makeSuccessRun({ workflow_id: 2, name: "B" }),
      makeSuccessRun({ workflow_id: 2, name: "B" }),
      makeSuccessRun({ workflow_id: 2, name: "B" }),
    ];

    const breakdowns = computeWorkflowBreakdowns(runs);
    expect(breakdowns[0].name).toBe("B");
    expect(breakdowns[1].name).toBe("A");
  });

  it("sets lastRun and lastConclusion to the most recent run", () => {
    const runs = [
      makeSuccessRun({
        workflow_id: 1,
        created_at: "2026-04-14T10:00:00Z",
        updated_at: "2026-04-14T10:01:00Z",
      }),
      makeFailureRun({
        workflow_id: 1,
        created_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:01:00Z",
      }),
    ];

    const breakdowns = computeWorkflowBreakdowns(runs);
    expect(breakdowns[0].lastRun).toBe("2026-04-15T10:00:00Z");
    expect(breakdowns[0].lastConclusion).toBe("failure");
  });
});

describe("computeBranchBreakdowns", () => {
  it("returns empty array for no runs", () => {
    expect(computeBranchBreakdowns([])).toEqual([]);
  });

  it("groups runs by branch and computes success rates", () => {
    const runs = [
      makeSuccessRun({ head_branch: "main" }),
      makeSuccessRun({ head_branch: "main" }),
      makeFailureRun({ head_branch: "main" }),
      makeSuccessRun({ head_branch: "feature" }),
    ];

    const breakdowns = computeBranchBreakdowns(runs);
    const main = breakdowns.find((b) => b.branch === "main")!;
    expect(main.totalRuns).toBe(3);
    expect(main.successRate).toBeCloseTo(66.67, 1);

    const feature = breakdowns.find((b) => b.branch === "feature")!;
    expect(feature.totalRuns).toBe(1);
    expect(feature.successRate).toBe(100);
  });

  it("sorts by total runs descending", () => {
    const runs = [
      makeSuccessRun({ head_branch: "a" }),
      makeSuccessRun({ head_branch: "b" }),
      makeSuccessRun({ head_branch: "b" }),
    ];

    const breakdowns = computeBranchBreakdowns(runs);
    expect(breakdowns[0].branch).toBe("b");
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60)).toBe("1m 0s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(3599)).toBe("59m 59s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3661)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h 0m");
  });
});
