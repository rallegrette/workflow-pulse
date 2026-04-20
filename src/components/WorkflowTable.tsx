"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { CheckCircle2, XCircle, Clock, MinusCircle } from "lucide-react";
import { formatDuration, type WorkflowBreakdown } from "@/lib/stats";

interface Props {
  workflows: WorkflowBreakdown[];
}

function ConclusionBadge({ conclusion }: { conclusion: string | null }) {
  switch (conclusion) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" /> Success
        </span>
      );
    case "failure":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
          <XCircle className="h-3 w-3" /> Failed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-500/10 px-2 py-1 rounded-full">
          <MinusCircle className="h-3 w-3" /> Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" /> Running
        </span>
      );
  }
}

function SuccessRateBar({ rate }: { rate: number }) {
  const color =
    rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 font-mono w-12">
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

export default function WorkflowTable({ workflows }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                Workflow
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                Runs
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                Last Run
              </th>
              <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {workflows.map((wf) => (
              <tr
                key={wf.workflowId}
                className="hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <span className="text-gray-200 font-medium">{wf.name}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-gray-400 font-mono">{wf.totalRuns}</span>
                </td>
                <td className="px-5 py-3.5">
                  <SuccessRateBar rate={wf.successRate} />
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-gray-400 font-mono">
                    {formatDuration(wf.avgDurationSeconds)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(parseISO(wf.lastRun), {
                      addSuffix: true,
                    })}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <ConclusionBadge conclusion={wf.lastConclusion} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
