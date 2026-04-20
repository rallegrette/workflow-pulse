"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyTrend } from "@/lib/stats";

interface Props {
  data: DailyTrend[];
}

export default function RunVolumeChart({ data }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">
        Daily Run Volume
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
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
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
            />
            <Bar
              dataKey="success"
              stackId="a"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
              name="Success"
            />
            <Bar
              dataKey="failure"
              stackId="a"
              fill="#ef4444"
              radius={[0, 0, 0, 0]}
              name="Failure"
            />
            <Bar
              dataKey="cancelled"
              stackId="a"
              fill="#6b7280"
              radius={[2, 2, 0, 0]}
              name="Cancelled"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
