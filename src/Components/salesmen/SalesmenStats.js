import React from "react";
import { FaUsers, FaToggleOn, FaToggleOff, FaMapMarkerAlt } from "react-icons/fa";
import { SkeletonStats } from "../../utils/SkeletonLoading";

const CARDS = [
  { key: "total", label: "Total", icon: FaUsers, soft: "bg-gray-100", text: "text-gray-700", filter: "all" },
  { key: "active", label: "Activos", icon: FaToggleOn, soft: "bg-green-100", text: "text-green-700", filter: "active" },
  { key: "inactive", label: "Inactivos", icon: FaToggleOff, soft: "bg-red-100", text: "text-red-700", filter: "inactive" },
  { key: "regions", label: "Ciudades", icon: FaMapMarkerAlt, soft: "bg-blue-100", text: "text-blue-700", filter: null },
];

export const SalesmenStats = ({ stats, loading, salesData, statusFilter, setStatusFilter }) => {
  if (loading && !salesData?.length) return <SkeletonStats />;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {CARDS.map(c => {
        const Icon = c.icon;
        const isActive = c.filter && statusFilter === c.filter;
        return (
          <button key={c.key}
            onClick={() => c.filter && setStatusFilter(isActive ? "all" : c.filter)}
            disabled={!c.filter}
            className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-3 text-left ${
              c.filter ? "cursor-pointer hover:shadow-md" : "cursor-default"
            } ${isActive ? "border-[#D3423E] ring-2 ring-red-100 scale-[1.02]" : "border-gray-200 hover:border-gray-300"}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-red-100" : c.soft}`}>
              <Icon className={isActive ? "text-[#D3423E]" : c.text} size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider truncate">{c.label}</p>
              <p className="text-2xl font-black text-gray-900">{stats[c.key]}</p>
            </div>
            {isActive && (
              <span className="ml-auto text-[9px] font-black text-[#D3423E] bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider flex-shrink-0">
                activo
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};