import {
  computeMTTR,
  detectFlakyWorkflows,
  detectAnomalies,
  computeActivityHeatmap,
  detectFailureStreaks,
  findSlowestRuns,
  computePeakHours,
} from "@/lib/analytics";
import {
  makeRun,
  makeSuccessRun,
  makeFailureRun,
  resetIdCounter,
} from "../fixtures";

beforeEach(() => resetIdCounter());

describe("computeMTTR", () => {
  it("returns null when there are no failure→success transitions", () => {
    const runs = [makeSuccessRun(), makeSuccessRun()];
    expect(computeMTTR(runs)).toBeNull();
  });

  it("returns null for all-failures with no recovery", () => {
    const runs = [makeFailureRun(), makeFailureRun()];
    expect(computeMTTR(runs)).toBeNull();
  });

  it("computes MTTR for a single recovery event", () => {
    const runs = [
      makeFailureRun({
        created_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:01:00Z",
      }),
      makeSuccessRun({
        created_at: "2026-04-15T10:05:00Z",
        updated_at: "2026-04-15T10:10:00Z",
      }),
    ];

    const result = computeMTTR(runs)!;
    expect(result).not.toBeNull();
    expect(result.recoveryCount).toBe(1);
    // Recovery = updated_at of success - created_at of failure = 10min = 600s
    expect(result.mttrSeconds).toBe(600);
    expect(result.longestRecoverySeconds).toBe(600);
    expect(result.shortestRecoverySeconds).toBe(600);
  });

  it("computes average MTTR across multiple recovery events", () => {
    const runs = [
      makeFailureRun({
        created_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:01:00Z",
      }),
      makeSuccessRun({
        created_at: "2026-04-15T10:05:00Z",
        updated_at: "2026-04-15T10:10:00Z", // 600s recovery
      }),
      makeFailureRun({
        created_at: "2026-04-15T11:00:00Z",
        updated_at: "2026-04-15T11:01:00Z",
      }),
      makeSuccessRun({
        created_at: "2026-04-15T11:20:00Z",
        updated_at: "2026-04-15T11:30:00Z", // 1800s recovery
      }),
    ];

    const result = computeMTTR(runs)!;
    expect(result.recoveryCount).toBe(2);
    expect(result.mttrSeconds).toBe(1200); // (600+1800)/2
    expect(result.shortestRecoverySeconds).toBe(600);
    expect(result.longestRecoverySeconds).toBe(1800);
  });

  it("ignores consecutive failures before recovery", () => {
    const runs = [
      makeFailureRun({ created_at: "2026-04-15T10:00:00Z", updated_at: "2026-04-15T10:01:00Z" }),
      makeFailureRun({ created_at: "2026-04-15T10:05:00Z", updated_at: "2026-04-15T10:06:00Z" }),
      makeFailureRun({ created_at: "2026-04-15T10:10:00Z", updated_at: "2026-04-15T10:11:00Z" }),
      makeSuccessRun({ created_at: "2026-04-15T10:15:00Z", updated_at: "2026-04-15T10:20:00Z" }),
    ];

    const result = computeMTTR(runs)!;
    expect(result.recoveryCount).toBe(1);
    // Recovery measured from FIRST failure
    expect(result.mttrSeconds).toBe(1200); // 10:20 - 10:00 = 20min = 1200s
  });
});

describe("detectFlakyWorkflows", () => {
  it("returns empty array when no workflows are flaky", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:00:00Z" }),
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:01:00Z" }),
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:02:00Z" }),
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:03:00Z" }),
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:04:00Z" }),
    ];
    expect(detectFlakyWorkflows(runs)).toEqual([]);
  });

  it("skips workflows with fewer than 4 runs", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, created_at: "2026-04-15T10:01:00Z" }),
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:02:00Z" }),
    ];
    expect(detectFlakyWorkflows(runs)).toEqual([]);
  });

  it("detects a highly flaky workflow", () => {
    // Alternating: pass, fail, pass, fail, pass = 4 alternations / 4 possible = 1.0
    const runs = [
      makeSuccessRun({ workflow_id: 1, name: "Flaky CI", created_at: "2026-04-15T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, name: "Flaky CI", created_at: "2026-04-15T10:01:00Z" }),
      makeSuccessRun({ workflow_id: 1, name: "Flaky CI", created_at: "2026-04-15T10:02:00Z" }),
      makeFailureRun({ workflow_id: 1, name: "Flaky CI", created_at: "2026-04-15T10:03:00Z" }),
      makeSuccessRun({ workflow_id: 1, name: "Flaky CI", created_at: "2026-04-15T10:04:00Z" }),
    ];

    const flaky = detectFlakyWorkflows(runs);
    expect(flaky).toHaveLength(1);
    expect(flaky[0].name).toBe("Flaky CI");
    expect(flaky[0].flakinessScore).toBe(1.0);
    expect(flaky[0].alternations).toBe(4);
  });

  it("excludes in-progress runs from flaky detection", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, created_at: "2026-04-15T10:01:00Z" }),
      makeSuccessRun({ workflow_id: 1, created_at: "2026-04-15T10:02:00Z" }),
      makeRun({ workflow_id: 1, status: "in_progress", conclusion: null, created_at: "2026-04-15T10:03:00Z" }),
    ];
    // Only 3 completed, below threshold
    expect(detectFlakyWorkflows(runs)).toEqual([]);
  });

  it("includes recent pattern in results", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, name: "Test", created_at: "2026-04-15T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, name: "Test", created_at: "2026-04-15T10:01:00Z" }),
      makeSuccessRun({ workflow_id: 1, name: "Test", created_at: "2026-04-15T10:02:00Z" }),
      makeFailureRun({ workflow_id: 1, name: "Test", created_at: "2026-04-15T10:03:00Z" }),
    ];

    const flaky = detectFlakyWorkflows(runs);
    expect(flaky[0].recentPattern).toEqual(["pass", "fail", "pass", "fail"]);
  });
});

describe("detectAnomalies", () => {
  it("returns empty array when fewer than 10 completed runs", () => {
    const runs = Array.from({ length: 9 }, () => makeSuccessRun());
    expect(detectAnomalies(runs)).toEqual([]);
  });

  it("detects a failure rate spike", () => {
    // 12 historical successes, then 4 recent failures = 100% recent fail rate vs 0% historical
    const historical = Array.from({ length: 12 }, (_, i) =>
      makeSuccessRun({
        created_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        updated_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:01:00Z`,
        run_started_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
      })
    );
    const recent = Array.from({ length: 4 }, (_, i) =>
      makeFailureRun({
        created_at: `2026-04-${String(i + 13).padStart(2, "0")}T10:00:00Z`,
        updated_at: `2026-04-${String(i + 13).padStart(2, "0")}T10:01:00Z`,
        run_started_at: `2026-04-${String(i + 13).padStart(2, "0")}T10:00:00Z`,
      })
    );

    const anomalies = detectAnomalies([...historical, ...recent]);
    const spike = anomalies.find((a) => a.type === "failure_spike");
    expect(spike).toBeDefined();
    expect(spike!.severity).toBe("critical");
    expect(spike!.metric).toBe(100);
  });

  it("does not flag when failure rate is below threshold", () => {
    // Mix of some failures everywhere
    const runs = Array.from({ length: 20 }, (_, i) =>
      i % 10 === 0
        ? makeFailureRun({
            created_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
            updated_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:01:00Z`,
            run_started_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
          })
        : makeSuccessRun({
            created_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
            updated_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:01:00Z`,
            run_started_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
          })
    );

    const anomalies = detectAnomalies(runs);
    expect(anomalies.find((a) => a.type === "failure_spike")).toBeUndefined();
  });

  it("detects a duration regression", () => {
    const fast = Array.from({ length: 12 }, (_, i) =>
      makeSuccessRun({
        created_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        run_started_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        updated_at: `2026-04-${String(i + 1).padStart(2, "0")}T10:01:00Z`, // 60s
      })
    );
    const slow = Array.from({ length: 4 }, (_, i) =>
      makeSuccessRun({
        created_at: `2026-04-${String(i + 13).padStart(2, "0")}T10:00:00Z`,
        run_started_at: `2026-04-${String(i + 13).padStart(2, "0")}T10:00:00Z`,
        updated_at: `2026-04-${String(i + 13).padStart(2, "0")}T10:05:00Z`, // 300s
      })
    );

    const anomalies = detectAnomalies([...fast, ...slow]);
    const regression = anomalies.find((a) => a.type === "duration_regression");
    expect(regression).toBeDefined();
    expect(regression!.metric).toBeGreaterThan(regression!.baseline);
  });
});

describe("computeActivityHeatmap", () => {
  it("returns 168 cells (7 days × 24 hours)", () => {
    const heatmap = computeActivityHeatmap([]);
    expect(heatmap).toHaveLength(168);
  });

  it("all cells are zero for empty runs", () => {
    const heatmap = computeActivityHeatmap([]);
    expect(heatmap.every((c) => c.count === 0)).toBe(true);
    expect(heatmap.every((c) => c.successRate === 0)).toBe(true);
  });

  it("increments the correct cell for a run", () => {
    // 2026-04-15 is a Wednesday (day=3), 10:00 UTC (hour=10)
    const runs = [
      makeSuccessRun({ created_at: "2026-04-15T10:00:00Z" }),
    ];

    const heatmap = computeActivityHeatmap(runs);
    const cell = heatmap.find((c) => c.day === 3 && c.hour === 10);
    expect(cell).toBeDefined();
    expect(cell!.count).toBe(1);
    expect(cell!.successRate).toBe(100);
  });

  it("computes success rate per cell correctly", () => {
    const runs = [
      makeSuccessRun({ created_at: "2026-04-15T10:00:00Z" }),
      makeFailureRun({ created_at: "2026-04-15T10:30:00Z" }),
    ];

    const heatmap = computeActivityHeatmap(runs);
    const cell = heatmap.find((c) => c.day === 3 && c.hour === 10);
    expect(cell!.count).toBe(2);
    expect(cell!.successRate).toBe(50);
  });
});

describe("detectFailureStreaks", () => {
  it("returns empty array when no streaks exist", () => {
    const runs = [
      makeSuccessRun({ workflow_id: 1, head_branch: "main" }),
      makeFailureRun({ workflow_id: 1, head_branch: "main" }),
      makeSuccessRun({ workflow_id: 1, head_branch: "main" }),
    ];
    expect(detectFailureStreaks(runs)).toEqual([]);
  });

  it("detects a streak of 3+ consecutive failures from HEAD", () => {
    const runs = [
      makeSuccessRun({
        workflow_id: 1,
        head_branch: "main",
        name: "CI",
        created_at: "2026-04-10T10:00:00Z",
        updated_at: "2026-04-10T10:01:00Z",
      }),
      makeFailureRun({
        workflow_id: 1,
        head_branch: "main",
        name: "CI",
        created_at: "2026-04-11T10:00:00Z",
        updated_at: "2026-04-11T10:01:00Z",
      }),
      makeFailureRun({
        workflow_id: 1,
        head_branch: "main",
        name: "CI",
        created_at: "2026-04-12T10:00:00Z",
        updated_at: "2026-04-12T10:01:00Z",
      }),
      makeFailureRun({
        workflow_id: 1,
        head_branch: "main",
        name: "CI",
        created_at: "2026-04-13T10:00:00Z",
        updated_at: "2026-04-13T10:01:00Z",
      }),
    ];

    const streaks = detectFailureStreaks(runs);
    expect(streaks).toHaveLength(1);
    expect(streaks[0].workflow).toBe("CI");
    expect(streaks[0].branch).toBe("main");
    expect(streaks[0].consecutiveFailures).toBe(3);
  });

  it("does not count a streak broken by a success", () => {
    const runs = [
      makeFailureRun({ workflow_id: 1, head_branch: "main", created_at: "2026-04-10T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, head_branch: "main", created_at: "2026-04-11T10:00:00Z" }),
      makeSuccessRun({ workflow_id: 1, head_branch: "main", created_at: "2026-04-12T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, head_branch: "main", created_at: "2026-04-13T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, head_branch: "main", created_at: "2026-04-14T10:00:00Z" }),
    ];

    // Most recent: fail, fail (only 2, below threshold of 3)
    expect(detectFailureStreaks(runs)).toEqual([]);
  });

  it("tracks streaks per workflow+branch combination", () => {
    const runs = [
      makeFailureRun({ workflow_id: 1, head_branch: "main", name: "CI", created_at: "2026-04-11T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, head_branch: "main", name: "CI", created_at: "2026-04-12T10:00:00Z" }),
      makeFailureRun({ workflow_id: 1, head_branch: "main", name: "CI", created_at: "2026-04-13T10:00:00Z" }),
      makeSuccessRun({ workflow_id: 1, head_branch: "dev", name: "CI", created_at: "2026-04-13T10:00:00Z" }),
    ];

    const streaks = detectFailureStreaks(runs);
    expect(streaks).toHaveLength(1);
    expect(streaks[0].branch).toBe("main");
  });
});

describe("findSlowestRuns", () => {
  it("returns empty array for no runs", () => {
    expect(findSlowestRuns([])).toEqual([]);
  });

  it("returns empty for only failed runs", () => {
    const runs = [makeFailureRun(), makeFailureRun()];
    expect(findSlowestRuns(runs)).toEqual([]);
  });

  it("returns runs sorted by duration descending", () => {
    const runs = [
      makeSuccessRun({
        name: "Fast",
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:01:00Z", // 60s
      }),
      makeSuccessRun({
        name: "Slow",
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:10:00Z", // 600s
      }),
      makeSuccessRun({
        name: "Medium",
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:03:00Z", // 180s
      }),
    ];

    const slowest = findSlowestRuns(runs, 3);
    expect(slowest[0].name).toBe("Slow");
    expect(slowest[0].durationSeconds).toBe(600);
    expect(slowest[1].name).toBe("Medium");
    expect(slowest[2].name).toBe("Fast");
  });

  it("respects the limit parameter", () => {
    const runs = Array.from({ length: 10 }, (_, i) =>
      makeSuccessRun({
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: `2026-04-15T10:${String(i + 1).padStart(2, "0")}:00Z`,
      })
    );

    expect(findSlowestRuns(runs, 3)).toHaveLength(3);
  });

  it("computes deviation from average correctly", () => {
    const runs = [
      makeSuccessRun({
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:01:00Z", // 60s
      }),
      makeSuccessRun({
        run_started_at: "2026-04-15T10:00:00Z",
        updated_at: "2026-04-15T10:03:00Z", // 180s
      }),
    ];

    // avg = 120s
    const slowest = findSlowestRuns(runs, 2);
    expect(slowest[0].durationSeconds).toBe(180);
    expect(slowest[0].deviationFromAvg).toBe(50); // (180-120)/120 * 100
    expect(slowest[1].deviationFromAvg).toBe(-50); // (60-120)/120 * 100
  });
});

describe("computePeakHours", () => {
  it("returns empty array for no runs", () => {
    expect(computePeakHours([])).toEqual([]);
  });

  it("only includes hours with runs", () => {
    const runs = [
      makeSuccessRun({ created_at: "2026-04-15T10:00:00Z" }),
    ];
    const peaks = computePeakHours(runs);
    expect(peaks.every((p) => p.count > 0)).toBe(true);
    expect(peaks).toHaveLength(1);
    expect(peaks[0].hour).toBe(10);
  });

  it("sorts by count descending", () => {
    const runs = [
      makeSuccessRun({ created_at: "2026-04-15T10:00:00Z" }),
      makeSuccessRun({ created_at: "2026-04-15T14:00:00Z" }),
      makeSuccessRun({ created_at: "2026-04-15T14:30:00Z" }),
    ];

    const peaks = computePeakHours(runs);
    expect(peaks[0].hour).toBe(14);
    expect(peaks[0].count).toBe(2);
  });

  it("computes failure rate per hour", () => {
    const runs = [
      makeSuccessRun({ created_at: "2026-04-15T10:00:00Z", updated_at: "2026-04-15T10:01:00Z" }),
      makeFailureRun({ created_at: "2026-04-15T10:30:00Z", updated_at: "2026-04-15T10:31:00Z" }),
    ];

    const peaks = computePeakHours(runs);
    const hour10 = peaks.find((p) => p.hour === 10)!;
    expect(hour10.failureRate).toBe(50);
  });

  it("formats labels correctly", () => {
    const runs = [
      makeSuccessRun({ created_at: "2026-04-15T00:00:00Z" }),
      makeSuccessRun({ created_at: "2026-04-15T12:00:00Z" }),
      makeSuccessRun({ created_at: "2026-04-15T15:00:00Z" }),
    ];

    const peaks = computePeakHours(runs);
    const midnight = peaks.find((p) => p.hour === 0)!;
    expect(midnight.label).toBe("12AM");

    const noon = peaks.find((p) => p.hour === 12)!;
    expect(noon.label).toBe("12PM");

    const three = peaks.find((p) => p.hour === 15)!;
    expect(three.label).toBe("3PM");
  });
});
