"use client";

import { useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Timer,
  Shield,
  Zap,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import {
  computeStats,
  computeDailyTrends,
  computeWorkflowBreakdowns,
  computeBranchBreakdowns,
  formatDuration,
} from "@/lib/stats";
import {
  detectAnomalies,
  detectFlakyWorkflows,
  computeMTTR,
  computeActivityHeatmap,
} from "@/lib/analytics";
import StatCard from "@/components/StatCard";
import SuccessRateChart from "@/components/charts/SuccessRateChart";
import RunVolumeChart from "@/components/charts/RunVolumeChart";
import DurationChart from "@/components/charts/DurationChart";
import WorkflowHealthChart from "@/components/charts/WorkflowHealthChart";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import AnomalyAlerts from "@/components/AnomalyAlerts";
import BranchComparison from "@/components/BranchComparison";
import RunsList from "@/components/RunsList";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";

export default function OverviewPage() {
  const { runs, loading, error, activeRepo, token } = useDashboard();

  const stats = useMemo(() => computeStats(runs), [runs]);
  const trends = useMemo(() => computeDailyTrends(runs), [runs]);
  const workflows = useMemo(() => computeWorkflowBreakdowns(runs), [runs]);
  const branches = useMemo(() => computeBranchBreakdowns(runs), [runs]);
  const anomalies = useMemo(() => detectAnomalies(runs), [runs]);
  const flaky = useMemo(() => detectFlakyWorkflows(runs), [runs]);
  const mttr = useMemo(() => computeMTTR(runs), [runs]);
  const heatmap = useMemo(() => computeActivityHeatmap(runs), [runs]);

  if (!token || !activeRepo) return <EmptyState />;
  if (loading && runs.length === 0) return <LoadingState />;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          CI/CD pipeline health for{" "}
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

      {/* Anomaly alerts at the top for visibility */}
      <AnomalyAlerts anomalies={anomalies} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <StatCard
          title="Total Runs"
          value={stats.totalRuns}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title="Successes"
          value={stats.successCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title="Failures"
          value={stats.failureCount}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          title="Avg Duration"
          value={formatDuration(stats.avgDurationSeconds)}
          icon={<Timer className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="P95 Duration"
          value={formatDuration(stats.p95DurationSeconds)}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          title="MTTR"
          value={mttr ? formatDuration(mttr.mttrSeconds) : "—"}
          subtitle={mttr ? `${mttr.recoveryCount} recoveries` : "No data"}
          icon={<Shield className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Flaky"
          value={flaky.length}
          subtitle="workflows detected"
          icon={<Zap className="h-5 w-5" />}
          color={flaky.length > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SuccessRateChart data={trends} />
        <RunVolumeChart data={trends} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DurationChart data={trends} />
        <WorkflowHealthChart data={workflows} />
      </div>

      {/* Heatmap + Branch Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityHeatmap data={heatmap} />
        <BranchComparison branches={branches} />
      </div>

      {/* Recent Runs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          Recent Runs
        </h2>
        <RunsList runs={runs} limit={15} />
      </div>
    </div>
  );
}
