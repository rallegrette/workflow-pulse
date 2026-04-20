"use client";

import { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { computeWorkflowBreakdowns, formatDuration } from "@/lib/stats";
import WorkflowTable from "@/components/WorkflowTable";
import ExportButton from "@/components/ExportButton";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";

export default function WorkflowsPage() {
  const { runs, filteredRuns, loading, error, activeRepo, token } = useDashboard();
  const workflows = useMemo(() => computeWorkflowBreakdowns(filteredRuns), [filteredRuns]);

  const exportHeaders = ["Workflow", "Runs", "Successes", "Failures", "Success Rate", "Avg Duration", "Last Run"];
  const exportRows = useMemo(
    () =>
      workflows.map((wf) => [
        wf.name,
        wf.totalRuns,
        wf.successCount,
        wf.failureCount,
        `${wf.successRate.toFixed(1)}%`,
        formatDuration(wf.avgDurationSeconds),
        wf.lastRun,
      ]),
    [workflows]
  );

  if (!token || !activeRepo) return <EmptyState />;
  if (loading && runs.length === 0) return <LoadingState />;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-sm text-gray-500 mt-1">
            Per-workflow breakdown for{" "}
            <span className="text-gray-400 font-mono">
              {activeRepo.owner}/{activeRepo.repo}
            </span>
          </p>
        </div>
        {workflows.length > 0 && (
          <ExportButton
            headers={exportHeaders}
            rows={exportRows}
            jsonData={workflows}
            filenameBase="workflows"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {workflows.length > 0 ? (
        <WorkflowTable workflows={workflows} />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500">No workflow data available</p>
        </div>
      )}
    </div>
  );
}
