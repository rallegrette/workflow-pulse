"use client";

import { Calendar } from "lucide-react";
import { useDashboard, type DateRange } from "@/context/DashboardContext";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "All" },
];

export default function DateRangePicker() {
  const { dateRange, setDateRange } = useDashboard();

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-3.5 w-3.5 text-gray-500" />
      <div className="flex gap-0.5 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
        {RANGES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setDateRange(value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              dateRange === value
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
