export default function RunsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-gray-800 rounded" />
          <div className="h-4 w-56 bg-gray-800/60 rounded mt-2" />
        </div>
        <div className="h-9 w-72 bg-gray-800 rounded-lg" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-900 border border-gray-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
