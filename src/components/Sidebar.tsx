"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  Activity,
  RefreshCw,
  Sparkles,
  GitCompare,
  Menu,
  X,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/branches", label: "Branches", icon: GitCompare },
  { href: "/runs", label: "Recent Runs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { activeRepo, loading, refresh, lastFetched } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              Workflow Pulse
            </h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {activeRepo && (
          <p className="text-xs text-gray-500 mt-2 font-mono truncate">
            {activeRepo.owner}/{activeRepo.repo}
          </p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1" role="navigation" aria-label="Main navigation">
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
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {label}
              {label === "AI Insights" && (
                <span className="text-[9px] bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                  AI
                </span>
              )}
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
    </>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold text-white">Workflow Pulse</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar (slide-over) */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-gray-800 flex flex-col transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden lg:flex w-64 bg-gray-950 border-r border-gray-800 flex-col min-h-screen shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
