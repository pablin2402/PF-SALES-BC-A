import React from "react";

const StatCard = ({ label, value, icon, color, onClick, active }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-3 text-left ${onClick ? "cursor-pointer hover:shadow-md" : "cursor-default"} ${active ? "border-[#D3423E] ring-2 ring-red-100" : "border-gray-200"}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </button>
);

export default StatCard;