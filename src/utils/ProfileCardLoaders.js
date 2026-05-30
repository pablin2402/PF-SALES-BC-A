const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

export const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

export const ProfileHeaderSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
    <div className="h-32 bg-gradient-to-br from-[#D3423E] to-red-700 opacity-30" />
    <div className="px-6 pb-6 -mt-16 relative">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <SBox className="w-32 h-32 rounded-2xl border-4 border-white flex-shrink-0" />
        <div className="flex-1 sm:pt-12 space-y-2.5">
          <div className="flex gap-2">
            <SBox className="h-5 w-20 rounded-full" />
            <SBox className="h-5 w-14 rounded-full" />
          </div>
          <SBox className="h-7 w-52" />
          <div className="flex gap-3 flex-wrap">
            <SBox className="h-3 w-36" />
            <SBox className="h-3 w-28" />
            <SBox className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ProfileStatsSkeleton = ({ cols = 4 }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-${cols} gap-3 mb-6`}>
    {[...Array(cols)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
        <SBox className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SBox className="h-2.5 w-20" />
          <SBox className="h-5 w-28" />
        </div>
      </div>
    ))}
  </div>
);

export const ProfileTableFilterSkeleton = () => (
  <div className="p-5 border-b border-gray-200">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-1.5">
        <SBox className="h-5 w-44" />
        <SBox className="h-3 w-32" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <SBox className="h-10 w-28 rounded-xl" />
        <SBox className="h-10 w-28 rounded-xl" />
        <SBox className="h-10 w-24 rounded-xl" />
        <SBox className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

export const ProfileTableSkeleton = ({ rows = 6, cols = 8 }) => {
  const colWidths = ["w-12", "w-28", "w-36", "w-20", "w-24", "w-24", "w-24", "w-12"];
  const isPill = (i) => i === 3 || i === cols - 1;
  const isDate = (i) => i === 1;
  const isRight = (i) => i >= 4 && i <= 6;

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[...Array(cols)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <SBox className="h-3 w-14" style={{ background: "#e5e7eb" }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {[...Array(cols)].map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    {isDate(j) ? (
                      <div className="space-y-1.5">
                        <SBox className="h-4 w-28" />
                        <SBox className="h-3 w-16" />
                      </div>
                    ) : isPill(j) ? (
                      <SBox className={`h-6 ${colWidths[j] || "w-16"} rounded-full ${isRight(j) ? "ml-auto" : "mx-auto"}`} />
                    ) : (
                      <SBox className={`h-4 ${colWidths[j] || "w-16"} ${isRight(j) ? "ml-auto" : ""}`} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <SBox className="h-4 w-16" />
                <SBox className="h-3 w-24" />
              </div>
              <SBox className="h-6 w-20 rounded-full" />
            </div>
            <SBox className="h-3 w-40" />
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <SBox className="h-4 w-24" />
              <SBox className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
        <SBox className="h-4 w-48" />
        <SBox className="h-9 w-64 rounded-xl" />
      </div>
    </>
  );
};

export const ProfileFullSkeleton = ({ bg = "bg-white" }) => (
  <div className={`${bg} min-h-screen p-4 sm:p-6`}>
    <style>{`
      @keyframes shimmer {
        0%   { background-position:  200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
    <div className="max-w-[1600px] mx-auto">
      <ProfileHeaderSkeleton />
      <ProfileStatsSkeleton />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <ProfileTableFilterSkeleton />
        <ProfileTableSkeleton />
      </div>
    </div>
  </div>
);

export const SHIMMER_STYLE_TAG = `
  <style>
    @keyframes shimmer {
      0%   { background-position:  200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>
`;