export default function WorkflowsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl animate-pulse">
      <div>
        <div className="h-7 w-40 bg-gray-800 rounded" />
        <div className="h-4 w-64 bg-gray-800/60 rounded mt-2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-900 border border-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
