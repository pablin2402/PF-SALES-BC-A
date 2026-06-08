import React from "react";
import { SHIMMER } from "../../constants/activityConfigs";

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const ActivityCardSkeleton = ({ idx }) => (
  <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 space-y-3" style={{ opacity: 1 - idx * 0.12 }}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 flex-1">
        <SBox className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <SBox className="h-4 w-36" />
          <SBox className="h-3 w-28" />
        </div>
      </div>
      <SBox className="h-6 w-24 rounded-full flex-shrink-0" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <SBox className="h-8 rounded-lg" />
      <SBox className="h-8 rounded-lg" />
    </div>
  </div>
);

export const ActivitySidebarSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => <ActivityCardSkeleton key={i} idx={i} />)}
  </div>
);

export const ActivityMapSkeleton = () => (
  <div className="w-full h-full relative overflow-hidden bg-gray-100">
    <div className="absolute inset-0" style={{
      background: "linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 2s infinite",
    }} />
    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6b7280" strokeWidth="1" />
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#9ca3af" strokeWidth="3" />
      <line x1="60%" y1="0" x2="55%" y2="100%" stroke="#9ca3af" strokeWidth="5" />
      <line x1="0" y1="40%" x2="100%" y2="38%" stroke="#9ca3af" strokeWidth="3" />
    </svg>
    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
      <path d="M 15% 70% Q 30% 50% 45% 55% Q 60% 60% 75% 35%"
        fill="none" stroke="#D3423E" strokeWidth="4" strokeDasharray="8 4" strokeLinecap="round" />
    </svg>
    {[{ x: "15%", y: "70%" }, { x: "45%", y: "55%" }, { x: "75%", y: "35%" }, { x: "30%", y: "42%" }, { x: "60%", y: "62%" }].map((pos, i) => (
      <div key={i} className="absolute" style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}>
        <div className="w-9 h-9 rounded-full border-2 border-white shadow-md" style={{
          background: "linear-gradient(90deg, #d1d5db 25%, #e5e7eb 50%, #d1d5db 75%)",
          backgroundSize: "200% 100%", animation: `shimmer ${1.2 + i * 0.15}s infinite`,
        }} />
      </div>
    ))}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#D3423E]" />
        <p className="text-gray-600 font-semibold text-sm">Cargando mapa...</p>
      </div>
    </div>
  </div>
);