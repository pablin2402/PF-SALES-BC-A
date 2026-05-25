const SHIMMER_STYLE = {
  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s linear infinite",
};
const SkeletonStats = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex-shrink-0" style={SHIMMER_STYLE} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded" style={SHIMMER_STYLE} />
          <div className="h-5 w-10 rounded" style={SHIMMER_STYLE} />
        </div>
      </div>
    ))}
  </div>
);
const SkeletonTable = () => (
  <div className="hidden lg:block overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          {["", "Nombre", "Correo", "Teléfono", "Ciudad", "Estado", ""].map((h, i) => (
            <th key={i} className="px-4 py-3 text-left">
              {h && <div className="h-3 w-16 rounded" style={SHIMMER_STYLE} />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <tr key={i} className="border-b border-gray-100">
            <td className="px-6 py-4">
              <div className="w-11 h-11 rounded-full" style={SHIMMER_STYLE} />
            </td>
            <td className="px-4 py-4">
              <div className="space-y-1.5">
                <div className="h-3 w-32 rounded" style={SHIMMER_STYLE} />
                <div className="h-2 w-20 rounded" style={SHIMMER_STYLE} />
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="h-3 w-40 rounded" style={SHIMMER_STYLE} />
            </td>
            <td className="px-4 py-4">
              <div className="h-3 w-24 rounded" style={SHIMMER_STYLE} />
            </td>
            <td className="px-4 py-4">
              <div className="h-6 w-20 rounded-full" style={SHIMMER_STYLE} />
            </td>
            <td className="px-4 py-4">
              <div className="h-6 w-11 rounded-full mx-auto" style={SHIMMER_STYLE} />
            </td>
            <td className="px-4 py-4">
              <div className="h-6 w-6 rounded" style={SHIMMER_STYLE} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="lg:hidden">
      <SkeletonCards />
    </div>
  </div>
);
const SkeletonCards = () => (
  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex-shrink-0" style={SHIMMER_STYLE} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded" style={SHIMMER_STYLE} />
            <div className="h-4 w-16 rounded-full" style={SHIMMER_STYLE} />
          </div>
          <div className="w-7 h-7 rounded-lg" style={SHIMMER_STYLE} />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded" style={SHIMMER_STYLE} />
          <div className="h-3 w-3/4 rounded" style={SHIMMER_STYLE} />
          <div className="h-3 w-1/2 rounded" style={SHIMMER_STYLE} />
        </div>
      </div>
    ))}
  </div>
);
export { SkeletonTable,SkeletonStats, SkeletonCards };