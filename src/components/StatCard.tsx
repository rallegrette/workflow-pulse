"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: "emerald" | "red" | "amber" | "blue" | "purple";
}

const colorMap = {
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    trend: "text-emerald-400",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    trend: "text-red-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    trend: "text-amber-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    trend: "text-blue-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    icon: "text-purple-400",
    trend: "text-purple-400",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "emerald",
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-medium ${colors.trend}`}>
            {trend.value > 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
