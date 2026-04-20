"use client";

import { AlertTriangle, AlertOctagon, TrendingDown, Zap, BarChart3 } from "lucide-react";
import type { Anomaly } from "@/lib/analytics";

interface Props {
  anomalies: Anomaly[];
}

const typeIcons = {
  failure_spike: TrendingDown,
  duration_regression: Zap,
  unusual_volume: BarChart3,
};

export default function AnomalyAlerts({ anomalies }: Props) {
  if (anomalies.length === 0) return null;

  return (
    <div className="space-y-3">
      {anomalies.map((anomaly, idx) => {
        const Icon = typeIcons[anomaly.type];
        const isCritical = anomaly.severity === "critical";

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 p-4 rounded-xl border ${
              isCritical
                ? "bg-red-500/5 border-red-500/20"
                : "bg-amber-500/5 border-amber-500/20"
            }`}
          >
            <div className={`mt-0.5 ${isCritical ? "text-red-400" : "text-amber-400"}`}>
              {isCritical ? (
                <AlertOctagon className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isCritical ? "text-red-400" : "text-amber-400"}`} />
                <span className={`text-sm font-medium ${isCritical ? "text-red-300" : "text-amber-300"}`}>
                  {anomaly.message}
                </span>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isCritical
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {anomaly.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{anomaly.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
