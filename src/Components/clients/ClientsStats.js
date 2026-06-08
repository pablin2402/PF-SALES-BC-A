import React from "react";
import { FaUsers, FaUser, FaUserTie, FaMapMarkerAlt } from "react-icons/fa";
import { SkeletonStats } from "../../utils/SkeletonLoading";

const CARDS = [
  { key: "total", label: "Total clientes", icon: FaUsers, accent: "gray" },
  { key: "page", label: "En esta página", icon: FaUser, accent: "blue" },
  { key: "unassigned", label: "Sin vendedor", icon: FaUserTie, accent: "yellow" },
  { key: "regions", label: "Ciudades", icon: FaMapMarkerAlt, accent: "purple" },
];

const ACCENTS = {
  gray: { soft: "bg-gray-100", text: "text-gray-700" },
  blue: { soft: "bg-blue-100", text: "text-blue-700" },
  yellow: { soft: "bg-amber-100", text: "text-amber-700" },
  purple: { soft: "bg-purple-100", text: "text-purple-700" },
};

export const ClientsStats = ({ stats, salesData, loading }) => {
  if (loading && !salesData?.length) return <SkeletonStats />;

  const values = {
    total: stats.total,
    page: salesData?.length || 0,
    unassigned: stats.unassigned,
    regions: stats.regions,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {CARDS.map((c) => {
        const a = ACCENTS[c.accent];
        const Icon = c.icon;
        return (
          <div
            key={c.key}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 hover:shadow-md transition-all"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.soft}`}>
              <Icon className={a.text} size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider truncate">
                {c.label}
              </p>
              <p className="text-2xl font-black text-gray-900">{values[c.key]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};