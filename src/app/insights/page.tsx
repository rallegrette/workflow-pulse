"use client";

import { useMemo, useCallback, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  computeStats,
  computeWorkflowBreakdowns,
} from "@/lib/stats";
import {
  detectAnomalies,
  detectFlakyWorkflows,
  detectFailureStreaks,
  computeMTTR,
  findSlowestRuns,
  computePeakHours,
} from "@/lib/analytics";
import { formatDuration } from "@/lib/stats";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import AnomalyAlerts from "@/components/AnomalyAlerts";
import FlakyWorkflows from "@/components/FlakyWorkflows";
import FailureStreaks from "@/components/FailureStreaks";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import {
  Clock,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Trophy,
  AlertTriangle,
  FileText,
} from "lucide-react";

export default function InsightsPage() {
  const { runs, loading, error, activeRepo, token, openaiKey } = useDashboard();
  const [logsFetched, setLogsFetched] = useState(false);

  const stats = useMemo(() => computeStats(runs), [runs]);
  const workflows = useMemo(() => computeWorkflowBreakdowns(runs), [runs]);
  const anomalies = useMemo(() => detectAnomalies(runs), [runs]);
  const flakyWorkflows = useMemo(() => detectFlakyWorkflows(runs), [runs]);
  const failureStreaks = useMemo(() => detectFailureStreaks(runs), [runs]);
  const mttr = useMemo(() => computeMTTR(runs), [runs]);
  const slowest = useMemo(() => findSlowestRuns(runs, 5), [runs]);
  const peakHours = useMemo(() => computePeakHours(runs), [runs]);

  const failedRuns = useMemo(
    () =>
      runs
        .filter((r) => r.status === "completed" && r.conclusion === "failure")
        .slice(0, 20)
        .map((r) => ({
          id: r.id,
          name: r.name,
          branch: r.head_branch,
          event: r.event,
          created_at: r.created_at,
          conclusion: r.conclusion || "",
          run_number: r.run_number,
        })),
    [runs]
  );

  const fetchAnalysis = useCallback(async () => {
    const runsWithLogs = await Promise.all(
      failedRuns.slice(0, 5).map(async (r) => {
        if (!activeRepo) return { ...r, logs: null };
        try {
          const params = new URLSearchParams({
            owner: activeRepo.owner,
            repo: activeRepo.repo,
            runId: String(r.id),
          });
          const res = await fetch(`/api/github/logs?${params}`, {
            headers: { "x-github-token": token },
          });
          if (!res.ok) return { ...r, logs: null };
          const data = await res.json();
          return { ...r, logs: data.logs as string };
        } catch {
          return { ...r, logs: null };
        }
      })
    );

    const remainingRuns = failedRuns.slice(5).map((r) => ({ ...r, logs: null }));
    const allRuns = [...runsWithLogs, ...remainingRuns];
    setLogsFetched(allRuns.some((r) => r.logs));

    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-openai-key": openaiKey,
      },
      body: JSON.stringify({
        failedRuns: allRuns,
        repoFullName: activeRepo ? `${activeRepo.owner}/${activeRepo.repo}` : "",
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.analysis;
  }, [failedRuns, activeRepo, openaiKey, token]);

  const fetchSummary = useCallback(async () => {
    const topFailing = workflows
      .filter((w) => w.failureCount > 0)
      .sort((a, b) => b.failureCount / b.totalRuns - a.failureCount / a.totalRuns)
      .slice(0, 5)
      .map((w) => ({
        name: w.name,
        failureRate: 100 - w.successRate,
        totalRuns: w.totalRuns,
      }));

    const res = await fetch("/api/ai/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-openai-key": openaiKey,
      },
      body: JSON.stringify({
        repoFullName: activeRepo ? `${activeRepo.owner}/${activeRepo.repo}` : "",
        totalRuns: stats.totalRuns,
        successRate: stats.successRate,
        failureRate: stats.failureRate,
        avgDurationSeconds: stats.avgDurationSeconds,
        p95DurationSeconds: stats.p95DurationSeconds,
        topFailingWorkflows: topFailing,
        anomalies: anomalies.map((a) => ({
          type: a.type,
          message: a.message,
          detail: a.detail,
        })),
        flakyWorkflows: flakyWorkflows.map((f) => ({
          name: f.name,
          flakinessScore: f.flakinessScore,
        })),
        mttrSeconds: mttr?.mttrSeconds || null,
        failureStreaks: failureStreaks.map((s) => ({
          workflow: s.workflow,
          branch: s.branch,
          count: s.consecutiveFailures,
        })),
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.summary;
  }, [stats, workflows, anomalies, flakyWorkflows, failureStreaks, mttr, activeRepo, openaiKey]);

  if (!token || !activeRepo) return <EmptyState />;
  if (loading && runs.length === 0) return <LoadingState />;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          Intelligent analysis and anomaly detection for{" "}
          <span className="text-gray-400 font-mono">
            {activeRepo.owner}/{activeRepo.repo}
          </span>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* AI Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsightsPanel
          type="summary"
          title="Pipeline Health Summary"
          description="AI-generated executive summary of your CI/CD pipeline health with a letter grade, key concerns, and recommended actions."
          fetchFn={fetchSummary}
          openaiKey={openaiKey}
        />
        <div className="space-y-2">
          <AIInsightsPanel
            type="analysis"
            title="Failure Root Cause Analysis"
            description="AI fetches actual workflow logs from GitHub, then analyzes error messages, stack traces, and failure patterns to identify root causes."
            fetchFn={fetchAnalysis}
            openaiKey={openaiKey}
          />
          {logsFetched && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/80 px-1">
              <FileText className="h-3 w-3" />
              Analysis included real log output from GitHub Actions
            </div>
          )}
        </div>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Anomaly Detection
          </h2>
          <AnomalyAlerts anomalies={anomalies} />
        </div>
      )}

      {/* Reliability Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">MTTR</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {mttr ? formatDuration(mttr.mttrSeconds) : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {mttr
              ? `${mttr.recoveryCount} recovery events`
              : "No failure→recovery cycles"}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Flaky</span>
          </div>
          <p className="text-2xl font-bold text-white">{flakyWorkflows.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            workflows with &gt;40% state alternation
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownRight className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Streaks</span>
          </div>
          <p className="text-2xl font-bold text-white">{failureStreaks.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            active failure streaks (3+ consecutive)
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Peak Hour</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {peakHours[0]?.label || "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {peakHours[0] ? `${peakHours[0].count} runs, ${peakHours[0].failureRate.toFixed(0)}% fail rate` : "No data"}
          </p>
        </div>
      </div>

      {/* Flaky + Streaks side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FlakyWorkflows workflows={flakyWorkflows} />
        <FailureStreaks streaks={failureStreaks} />
      </div>

      {/* Slowest Builds */}
      {slowest.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-gray-300">Slowest Builds</h3>
          </div>
          <div className="space-y-2">
            {slowest.map((run, idx) => (
              <div
                key={run.id}
                className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg"
              >
                <span className="text-xs text-gray-600 font-mono w-5">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{run.name}</p>
                  <span className="text-xs text-gray-500 font-mono">{run.branch}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono text-amber-400">
                    {formatDuration(run.durationSeconds)}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    +{run.deviationFromAvg.toFixed(0)}% vs avg
                  </p>
                </div>
                <a
                  href={run.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
