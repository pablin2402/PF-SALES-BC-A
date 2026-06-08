import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaCity, FaRedo } from "react-icons/fa";
import { REGION_LABELS } from "../../constants/salesmenConfigs";

const FilterChip = ({ label, onRemove }) => (
  <span className="bg-red-50 border border-red-200 text-[#D3423E] px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm">
    {label}
    <button onClick={onRemove} className="hover:bg-red-100 rounded-full p-0.5 transition-colors">
      <FaTimes size={9} />
    </button>
  </span>
);

export const SalesmenFilters = ({
  searchInput, setSearchInput,
  regionFilter, setRegionFilter,
  statusFilter, setStatusFilter,
  availableRegions, viewMode, setViewMode,
  hasActiveFilters, clearAllFilters, setPage,
}) => (
  <div className="p-5 border-b border-gray-200 bg-gradient-to-b from-gray-50/50 to-white">
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
      <div className="relative flex-1 max-w-md">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder="Buscar vendedor por nombre..."
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] transition-all shadow-sm" />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <FaTimes size={12} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={11} />
          <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm hover:border-gray-300">
            <option value="all">Todas las ciudades</option>
            {availableRegions.map(r => <option key={r} value={r}>{REGION_LABELS[r] || r}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shadow-inner">
          <button onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "table" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
            Tabla
          </button>
          <button onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "cards" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
            Tarjetas
          </button>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {hasActiveFilters && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="flex items-center gap-2 mt-4 flex-wrap pt-4 border-t border-gray-100">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Activos:</span>
            {searchInput && <FilterChip label={`"${searchInput}"`} onRemove={() => setSearchInput("")} />}
            {statusFilter !== "all" && (
              <FilterChip label={statusFilter === "active" ? "Solo activos" : "Solo inactivos"} onRemove={() => setStatusFilter("all")} />
            )}
            {regionFilter !== "all" && (
              <FilterChip label={REGION_LABELS[regionFilter] || regionFilter} onRemove={() => setRegionFilter("all")} />
            )}
            <button onClick={clearAllFilters} className="text-xs font-bold text-[#D3423E] hover:underline flex items-center gap-1 ml-auto">
              <FaRedo size={9} /> Limpiar todo
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);