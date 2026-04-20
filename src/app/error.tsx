"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-5">
          <div className="bg-red-500/10 rounded-full p-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred while rendering this page."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
