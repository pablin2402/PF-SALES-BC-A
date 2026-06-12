import React from "react";
import { FaTimes } from "react-icons/fa";
import TextInputFilter from "../LittleComponents/TextInputFilter";

const VIEW_MODES = [
  { value: "table", label: "Tabla" },
  { value: "cards", label: "Tarjetas" },
];

const DeliveryToolbar = ({
  searchTerm, onSearchChange, onSearchEnter,
  statusFilter, onClearStatus,
  viewMode, onViewModeChange,
}) => (
  <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
    <div className="relative flex-1 max-w-md">
      <TextInputFilter
        value={searchTerm}
        onChange={onSearchChange}
        onEnter={onSearchEnter}
        placeholder="Buscar repartidor por nombre..."
      />
    </div>

    <div className="flex items-center gap-2">
      {statusFilter !== "all" && (
        <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
          {statusFilter === "active" ? "Solo activos" : "Solo inactivos"}
          <button onClick={onClearStatus} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
            <FaTimes size={10} />
          </button>
        </span>
      )}

      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
        {VIEW_MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onViewModeChange(value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === value ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default DeliveryToolbar;