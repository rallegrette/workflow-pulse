"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/runs", label: "Recent Runs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { activeRepo, loading, refresh, lastFetched } = useDashboard();

  return (
    <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-emerald-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">
            Workflow Pulse
          </h1>
        </div>
        {activeRepo && (
          <p className="text-xs text-gray-500 mt-2 font-mono truncate">
            {activeRepo.owner}/{activeRepo.repo}
          </p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 w-full"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh data"}
        </button>
        {lastFetched && (
          <p className="text-[10px] text-gray-600 mt-1">
            Updated {lastFetched.toLocaleTimeString()}
          </p>
        )}
      </div>
    </aside>
  );
}
