const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const ClientCardSkeleton = () => (
  <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
    <div className="flex gap-3 p-3">
      <SBox className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 pt-1">
        <SBox className="h-4 w-36" />
        <SBox className="h-3 w-28" />
        <SBox className="h-3 w-24" />
        <div className="flex gap-1.5 pt-1">
          <SBox className="h-5 w-16 rounded-full" />
          <SBox className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
    <div className="px-3 pb-3">
      <SBox className="h-8 w-full rounded-lg" />
    </div>
  </div>
);

export const SidebarSkeleton = () => (
  <div className="space-y-3">
    <SBox className="h-3 w-48 mb-1" />
    {[...Array(6)].map((_, i) => (
      <ClientCardSkeleton key={i} />
    ))}
  </div>
);

export const MapSkeleton = () => (
  <div className="w-full h-full relative overflow-hidden bg-gray-100">
  
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite",
      }}
    />

   
    <svg
      className="absolute inset-0 w-full h-full opacity-10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6b7280" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>

    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#9ca3af" strokeWidth="3"/>
      <line x1="60%" y1="0" x2="55%" y2="100%" stroke="#9ca3af" strokeWidth="5"/>
      <line x1="0" y1="40%" x2="100%" y2="38%" stroke="#9ca3af" strokeWidth="3"/>
      <line x1="0" y1="65%" x2="100%" y2="67%" stroke="#9ca3af" strokeWidth="5"/>
      <line x1="45%" y1="0" x2="50%" y2="60%" stroke="#9ca3af" strokeWidth="2"/>
      <line x1="80%" y1="20%" x2="75%" y2="100%" stroke="#9ca3af" strokeWidth="2"/>
      <line x1="0" y1="20%" x2="100%" y2="18%" stroke="#9ca3af" strokeWidth="2"/>
    </svg>

    {[
      { x: "28%", y: "35%" },
      { x: "55%", y: "42%" },
      { x: "42%", y: "60%" },
      { x: "68%", y: "28%" },
      { x: "35%", y: "70%" },
      { x: "72%", y: "58%" },
    ].map((pos, i) => (
      <div
        key={i}
        className="absolute"
        style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-white shadow-md"
          style={{
            background: "linear-gradient(90deg, #d1d5db 25%, #e5e7eb 50%, #d1d5db 75%)",
            backgroundSize: "200% 100%",
            animation: `shimmer ${1.2 + i * 0.15}s infinite`,
          }}
        />
      </div>
    ))}

    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#D3423E]" />
        <p className="text-gray-600 font-semibold text-sm">Cargando mapa...</p>
      </div>
    </div>

    <div className="absolute top-4 left-4 flex flex-col gap-2">
      <SBox className="h-10 w-44 rounded-xl shadow-lg" />
      <SBox className="h-10 w-28 rounded-xl shadow-lg" />
      <SBox className="h-10 w-28 rounded-xl shadow-lg" />
    </div>

    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
      <SBox className="h-10 w-24 rounded-xl shadow-lg" />
      <div className="bg-white/90 rounded-2xl shadow-lg p-3 w-48 space-y-2.5">
        <SBox className="h-3 w-16" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SBox className="w-6 h-6 rounded-full flex-shrink-0" />
            <SBox className="h-3 flex-1" />
            <SBox className="h-4 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);