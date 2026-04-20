"use client";

import Link from "next/link";
import { Settings, Activity } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-gray-800/30 rounded-full p-6 mb-6">
        <Activity className="h-12 w-12 text-gray-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-200 mb-2">
        No repository configured
      </h2>
      <p className="text-gray-500 max-w-md mb-6">
        Add a GitHub personal access token and at least one repository to start
        monitoring your CI/CD pipelines.
      </p>
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        <Settings className="h-4 w-4" />
        Go to Settings
      </Link>
    </div>
  );
}
