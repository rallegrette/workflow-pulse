"use client";

import { GitBranch } from "lucide-react";
import type { BranchBreakdown } from "@/lib/stats";

interface Props {
  branches: BranchBreakdown[];
}

function getRateColor(rate: number): string {
  if (rate >= 90) return "text-emerald-400";
  if (rate >= 70) return "text-amber-400";
  return "text-red-400";
}

function getBarColor(rate: number): string {
  if (rate >= 90) return "bg-emerald-500";
  if (rate >= 70) return "bg-amber-500";
  return "bg-red-500";
}

export default function BranchComparison({ branches }: Props) {
  const top = branches.slice(0, 12);
  if (top.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-medium text-gray-300">
          Branch Health
        </h3>
      </div>

      <div className="space-y-2.5">
        {top.map((branch) => (
          <div key={branch.branch} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                {branch.branch}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{branch.totalRuns} runs</span>
                <span className={`text-xs font-medium font-mono ${getRateColor(branch.successRate)}`}>
                  {branch.successRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(branch.successRate)}`}
                style={{ width: `${Math.min(100, branch.successRate)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
