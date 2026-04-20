"use client";

import { Flame, ExternalLink } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { FailureStreak } from "@/lib/analytics";

interface Props {
  streaks: FailureStreak[];
}

export default function FailureStreaks({ streaks }: Props) {
  if (streaks.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-4 w-4 text-red-400" />
        <h3 className="text-sm font-medium text-gray-300">
          Active Failure Streaks
        </h3>
      </div>

      <div className="space-y-3">
        {streaks.map((streak, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg"
          >
            <div className="space-y-1">
              <p className="text-sm text-gray-200 font-medium">{streak.workflow}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">
                  {streak.branch}
                </span>
                <span className="text-xs text-gray-600">
                  since {formatDistanceToNow(parseISO(streak.since), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg font-bold text-red-400">
                  {streak.consecutiveFailures}
                </div>
                <p className="text-[10px] text-gray-600">consecutive</p>
              </div>
              <a
                href={streak.runs[0]?.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-400 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
