"use client";

import { formatDistanceToNow, parseISO, differenceInSeconds } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { formatDuration } from "@/lib/stats";
import type { WorkflowRun } from "@/lib/github";

interface Props {
  runs: WorkflowRun[];
  limit?: number;
}

function StatusIcon({ run }: { run: WorkflowRun }) {
  if (run.status !== "completed") {
    return <Clock className="h-4 w-4 text-amber-400 animate-pulse" />;
  }
  switch (run.conclusion) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "failure":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "cancelled":
      return <MinusCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

export default function RunsList({ runs, limit }: Props) {
  const display = limit ? runs.slice(0, limit) : runs;

  if (display.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-500">No workflow runs found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800/50">
      {display.map((run) => {
        const duration = differenceInSeconds(
          parseISO(run.updated_at),
          parseISO(run.run_started_at || run.created_at)
        );

        return (
          <div
            key={run.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/30 transition-colors"
          >
            <StatusIcon run={run} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-200 font-medium truncate">
                  {run.name}
                </span>
                <span className="text-xs text-gray-600 font-mono">
                  #{run.run_number}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <GitBranch className="h-3 w-3" />
                  {run.head_branch}
                </span>
                <span className="text-xs text-gray-600">
                  {run.event}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400 font-mono">
                {formatDuration(Math.max(0, duration))}
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {formatDistanceToNow(parseISO(run.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>

            <a
              href={run.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        );
      })}
    </div>
  );
}
