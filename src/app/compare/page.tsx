"use client";

import { useState, useEffect, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { computeStats, formatDuration } from "@/lib/stats";
import type { WorkflowRun } from "@/lib/github";
import type { RepoConfig } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface RepoData {
  repo: RepoConfig;
  runs: WorkflowRun[];
  loading: boolean;
  error: string | null;
}

export default function ComparePage() {
  const { repos, token, activeRepo } = useDashboard();
  const [repoDataMap, setRepoDataMap] = useState<Map<string, RepoData>>(new Map());

  const repoKey = (r: RepoConfig) => `${r.owner}/${r.repo}`;

  useEffect(() => {
    if (!token || repos.length === 0) return;

    repos.forEach((repo) => {
      const key = repoKey(repo);
      setRepoDataMap((prev) => {
        if (prev.has(key)) return prev;
        const next = new Map(prev);
        next.set(key, { repo, runs: [], loading: true, error: null });
        return next;
      });

      const params = new URLSearchParams({ owner: repo.owner, repo: repo.repo });
      fetch(`/api/github/runs?${params}`, {
        headers: { "x-github-token": token },
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(({ runs }) => {
          setRepoDataMap((prev) => {
            const next = new Map(prev);
            next.set(key, { repo, runs, loading: false, error: null });
            return next;
          });
        })
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : "Failed to fetch";
          setRepoDataMap((prev) => {
            const next = new Map(prev);
            next.set(key, { repo, runs: [], loading: false, error: message });
            return next;
          });
        });
    });
  }, [token, repos]);

  const repoStats = useMemo(() => {
    return Array.from(repoDataMap.values()).map((data) => ({
      ...data,
      stats: computeStats(data.runs),
    }));
  }, [repoDataMap]);

  if (!token || !activeRepo) return <EmptyState />;

  if (repos.length < 2) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Compare Repositories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Side-by-side comparison of CI/CD health across your repositories
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <BarChart3 className="h-8 w-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Add at least 2 repositories in Settings to compare them.</p>
        </div>
      </div>
    );
  }

  const allLoaded = repoStats.every((r) => !r.loading);
  const bestSuccessRate = allLoaded
    ? Math.max(...repoStats.filter((r) => r.runs.length > 0).map((r) => r.stats.successRate))
    : 0;
  const bestAvgDuration = allLoaded
    ? Math.min(...repoStats.filter((r) => r.runs.length > 0).map((r) => r.stats.avgDurationSeconds))
    : Infinity;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare Repositories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Side-by-side comparison of CI/CD health across {repos.length} repositories
        </p>
      </div>

      {/* Comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {repoStats.map(({ repo, runs, loading, error, stats }) => {
          const key = repoKey(repo);
          const isBestRate = allLoaded && runs.length > 0 && stats.successRate === bestSuccessRate;
          const isFastest = allLoaded && runs.length > 0 && stats.avgDurationSeconds === bestAvgDuration;

          return (
            <div
              key={key}
              className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors ${
                isBestRate ? "border-emerald-500/40" : "border-gray-800"
              }`}
            >
              <div className="p-5 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono text-gray-200 truncate">{key}</h3>
                  {isBestRate && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
                      Best
                    </span>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="p-5">
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Success Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-xs text-gray-500">Success Rate</span>
                      </div>
                      <span className={`text-sm font-mono font-bold ${
                        stats.successRate >= 90 ? "text-emerald-400" :
                        stats.successRate >= 70 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {stats.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stats.successRate >= 90 ? "bg-emerald-500" :
                          stats.successRate >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, stats.successRate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-gray-500 uppercase">Passes</span>
                      </div>
                      <p className="text-lg font-bold text-white font-mono">{stats.successCount}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <XCircle className="h-3 w-3 text-red-400" />
                        <span className="text-[10px] text-gray-500 uppercase">Failures</span>
                      </div>
                      <p className="text-lg font-bold text-white font-mono">{stats.failureCount}</p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className={`h-3 w-3 ${isFastest ? "text-emerald-400" : "text-gray-500"}`} />
                        <span className="text-[10px] text-gray-500 uppercase">Avg Time</span>
                      </div>
                      <p className={`text-sm font-bold font-mono ${isFastest ? "text-emerald-400" : "text-white"}`}>
                        {formatDuration(stats.avgDurationSeconds)}
                      </p>
                    </div>
                    <div className="bg-gray-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <BarChart3 className="h-3 w-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500 uppercase">Total</span>
                      </div>
                      <p className="text-lg font-bold text-white font-mono">{stats.totalRuns}</p>
                    </div>
                  </div>

                  {/* P95 */}
                  <div className="flex items-center justify-between text-xs border-t border-gray-800/50 pt-3">
                    <span className="text-gray-500">P95 Duration</span>
                    <span className="text-gray-300 font-mono">{formatDuration(stats.p95DurationSeconds)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary table */}
      {allLoaded && repoStats.some((r) => r.runs.length > 0) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-300">Quick Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">Repository</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">Runs</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">Success Rate</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">Avg Duration</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">P95 Duration</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">Failures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {repoStats
                  .filter((r) => r.runs.length > 0)
                  .sort((a, b) => b.stats.successRate - a.stats.successRate)
                  .map(({ repo, stats }) => (
                    <tr key={repoKey(repo)} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-gray-200 font-mono text-xs">{repoKey(repo)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400 font-mono">{stats.totalRuns}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                stats.successRate >= 90 ? "bg-emerald-500" :
                                stats.successRate >= 70 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(100, stats.successRate)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-mono ${
                            stats.successRate >= 90 ? "text-emerald-400" :
                            stats.successRate >= 70 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {stats.successRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400 font-mono text-xs">{formatDuration(stats.avgDurationSeconds)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-400 font-mono text-xs">{formatDuration(stats.p95DurationSeconds)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-red-400 font-mono text-xs">{stats.failureCount}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
