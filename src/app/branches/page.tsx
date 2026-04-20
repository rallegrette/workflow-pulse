"use client";

import { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { computeBranchBreakdowns } from "@/lib/stats";
import { computeActivityHeatmap } from "@/lib/analytics";
import BranchComparison from "@/components/BranchComparison";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import ExportButton from "@/components/ExportButton";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { GitBranch, ExternalLink } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export default function BranchesPage() {
  const { runs, filteredRuns, loading, error, activeRepo, token } = useDashboard();

  const branches = useMemo(() => computeBranchBreakdowns(filteredRuns), [filteredRuns]);
  const heatmap = useMemo(() => computeActivityHeatmap(filteredRuns), [filteredRuns]);

  const branchDetails = useMemo(() => {
    const groups = new Map<string, typeof filteredRuns>();
    for (const run of filteredRuns) {
      const existing = groups.get(run.head_branch) || [];
      existing.push(run);
      groups.set(run.head_branch, existing);
    }

    return Array.from(groups.entries())
      .map(([branch, branchRuns]) => {
        const sorted = [...branchRuns].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const completed = branchRuns.filter((r) => r.status === "completed");
        const successes = completed.filter((r) => r.conclusion === "success").length;
        const failures = completed.filter((r) => r.conclusion === "failure").length;

        return {
          branch,
          totalRuns: branchRuns.length,
          successes,
          failures,
          successRate: completed.length > 0 ? (successes / completed.length) * 100 : 0,
          lastRun: sorted[0],
          events: [...new Set(branchRuns.map((r) => r.event))],
          actors: [...new Set(branchRuns.map((r) => r.actor.login))],
        };
      })
      .sort((a, b) => b.totalRuns - a.totalRuns);
  }, [filteredRuns]);

  const exportHeaders = ["Branch", "Runs", "Successes", "Failures", "Success Rate", "Contributors"];
  const exportRows = useMemo(
    () =>
      branchDetails.map((b) => [
        b.branch,
        b.totalRuns,
        b.successes,
        b.failures,
        `${b.successRate.toFixed(1)}%`,
        b.actors.join("; "),
      ]),
    [branchDetails]
  );

  if (!token || !activeRepo) return <EmptyState />;
  if (loading && runs.length === 0) return <LoadingState />;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Branch Health</h1>
          <p className="text-sm text-gray-500 mt-1">
            CI/CD health comparison across branches for{" "}
            <span className="text-gray-400 font-mono">
              {activeRepo.owner}/{activeRepo.repo}
            </span>
          </p>
        </div>
        {branchDetails.length > 0 && (
          <ExportButton
            headers={exportHeaders}
            rows={exportRows}
            jsonData={branchDetails.map((b) => ({
              branch: b.branch,
              totalRuns: b.totalRuns,
              successes: b.successes,
              failures: b.failures,
              successRate: b.successRate,
              contributors: b.actors,
            }))}
            filenameBase="branches"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BranchComparison branches={branches} />
        <ActivityHeatmap data={heatmap} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                  Branch
                </th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                  Runs
                </th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                  Pass / Fail
                </th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                  Contributors
                </th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {branchDetails.map((b) => {
                const rateColor =
                  b.successRate >= 90
                    ? "text-emerald-400"
                    : b.successRate >= 70
                    ? "text-amber-400"
                    : "text-red-400";
                const barColor =
                  b.successRate >= 90
                    ? "bg-emerald-500"
                    : b.successRate >= 70
                    ? "bg-amber-500"
                    : "bg-red-500";

                return (
                  <tr key={b.branch} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-gray-200 font-mono text-xs">
                          {b.branch}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-400 font-mono">{b.totalRuns}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-mono text-xs">{b.successes}</span>
                        <span className="text-gray-700">/</span>
                        <span className="text-red-400 font-mono text-xs">{b.failures}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(100, b.successRate)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono ${rateColor}`}>
                          {b.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {b.actors.slice(0, 3).map((actor) => (
                          <span
                            key={actor}
                            className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono"
                          >
                            {actor}
                          </span>
                        ))}
                        {b.actors.length > 3 && (
                          <span className="text-[10px] text-gray-600">
                            +{b.actors.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(parseISO(b.lastRun.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <a
                          href={b.lastRun.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-400 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
