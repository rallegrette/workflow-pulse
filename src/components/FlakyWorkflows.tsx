"use client";

import { Shuffle } from "lucide-react";
import type { FlakyWorkflow } from "@/lib/analytics";

interface Props {
  workflows: FlakyWorkflow[];
}

function PatternDots({ pattern }: { pattern: string[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {pattern.map((result, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            result === "pass"
              ? "bg-emerald-500"
              : result === "fail"
              ? "bg-red-500"
              : "bg-gray-600"
          }`}
          title={result}
        />
      ))}
    </div>
  );
}

export default function FlakyWorkflows({ workflows }: Props) {
  if (workflows.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shuffle className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-medium text-gray-300">
          Flaky Workflows
        </h3>
        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
          {workflows.length} detected
        </span>
      </div>

      <div className="space-y-3">
        {workflows.map((wf) => (
          <div
            key={wf.workflowId}
            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
          >
            <div className="space-y-1.5">
              <p className="text-sm text-gray-200 font-medium">{wf.name}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {wf.alternations} flips in {wf.totalRuns} runs
                </span>
                <PatternDots pattern={wf.recentPattern} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-amber-400">
                {(wf.flakinessScore * 100).toFixed(0)}%
              </div>
              <p className="text-[10px] text-gray-600">flakiness</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
