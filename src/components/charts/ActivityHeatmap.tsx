"use client";

import { useMemo } from "react";
import type { HeatmapCell } from "@/lib/analytics";

interface Props {
  data: HeatmapCell[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensityColor(count: number, max: number): string {
  if (count === 0) return "bg-gray-800/40";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-emerald-500";
  if (ratio > 0.5) return "bg-emerald-600";
  if (ratio > 0.25) return "bg-emerald-700";
  return "bg-emerald-900";
}

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

export default function ActivityHeatmap({ data }: Props) {
  const maxCount = useMemo(
    () => Math.max(1, ...data.map((c) => c.count)),
    [data]
  );

  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    data.forEach((c) => map.set(`${c.day}-${c.hour}`, c));
    return map;
  }, [data]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">
        Build Activity Heatmap
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {HOURS.filter((h) => h % 3 === 0).map((h) => (
              <div
                key={h}
                className="text-[10px] text-gray-600 font-mono"
                style={{ width: `${(3 / 24) * 100}%` }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] text-gray-500 w-8 text-right font-mono">
                {day}
              </span>
              <div className="flex-1 flex gap-px">
                {HOURS.map((hour) => {
                  const cell = cellMap.get(`${dayIdx}-${hour}`);
                  const count = cell?.count || 0;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-4 rounded-sm ${getIntensityColor(count, maxCount)} transition-colors cursor-default`}
                      title={`${day} ${formatHour(hour)}: ${count} runs${count > 0 ? `, ${cell!.successRate.toFixed(0)}% pass` : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-10">
            <span className="text-[10px] text-gray-600">Less</span>
            {["bg-gray-800/40", "bg-emerald-900", "bg-emerald-700", "bg-emerald-600", "bg-emerald-500"].map(
              (c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              )
            )}
            <span className="text-[10px] text-gray-600">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
