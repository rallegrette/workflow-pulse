export default function InsightsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl animate-pulse">
      <div>
        <div className="h-7 w-36 bg-gray-800 rounded" />
        <div className="h-4 w-72 bg-gray-800/60 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-gray-900 border border-gray-800 rounded-xl" />
        <div className="h-56 bg-gray-900 border border-gray-800 rounded-xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-900 border border-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
