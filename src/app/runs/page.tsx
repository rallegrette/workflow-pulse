"use client";

import { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import RunsList from "@/components/RunsList";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";

type Filter = "all" | "success" | "failure" | "cancelled" | "in_progress";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "in_progress", label: "In Progress" },
];

export default function RunsPage() {
  const { runs, loading, error, activeRepo, token } = useDashboard();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return runs;
    if (filter === "in_progress")
      return runs.filter((r) => r.status !== "completed");
    return runs.filter(
      (r) => r.status === "completed" && r.conclusion === filter
    );
  }, [runs, filter]);

  if (!token || !activeRepo) return <EmptyState />;
  if (loading && runs.length === 0) return <LoadingState />;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recent Runs</h1>
          <p className="text-sm text-gray-500 mt-1">
            All workflow runs for{" "}
            <span className="text-gray-400 font-mono">
              {activeRepo.owner}/{activeRepo.repo}
            </span>
          </p>
        </div>

        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === value
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Showing {filtered.length} of {runs.length} runs
        </p>
      </div>

      <RunsList runs={filtered} />
    </div>
  );
}
