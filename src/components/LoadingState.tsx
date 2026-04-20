"use client";

import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-4" />
      <p className="text-gray-500 text-sm">Fetching workflow data...</p>
    </div>
  );
}
