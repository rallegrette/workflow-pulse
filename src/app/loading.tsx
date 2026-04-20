import { Activity } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Activity className="h-8 w-8 text-emerald-400 animate-pulse mx-auto" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
