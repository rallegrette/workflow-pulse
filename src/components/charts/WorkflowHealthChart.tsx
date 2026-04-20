"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { WorkflowBreakdown } from "@/lib/stats";

interface Props {
  data: WorkflowBreakdown[];
}

function getColor(rate: number): string {
  if (rate >= 90) return "#10b981";
  if (rate >= 70) return "#f59e0b";
  return "#ef4444";
}

export default function WorkflowHealthChart({ data }: Props) {
  const chartData = data.slice(0, 10).map((w) => ({
    name: w.name.length > 20 ? w.name.slice(0, 18) + "…" : w.name,
    successRate: Math.round(w.successRate * 10) / 10,
    fullName: w.name,
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">
        Workflow Health
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
                fontSize: "13px",
              }}
              formatter={(value) => [`${value}%`, "Success Rate"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullName || ""
              }
            />
            <Bar dataKey="successRate" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={getColor(entry.successRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
