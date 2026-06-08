import React from "react";
import { motion } from "framer-motion";
import { FaFileExport, FaCalendarAlt, FaSyncAlt } from "react-icons/fa";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const StatsFilters = ({
  years, selectedYear, setSelectedYear,
  selectedMonth, setSelectedMonth,
  onExport, onRefresh, loadingStats,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
    className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6"
  >
    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
      <div className="flex items-center gap-2 mr-1">
        <FaCalendarAlt className="text-[#D3423E]" size={14} />
        <span className="text-sm font-black text-gray-700 uppercase tracking-wider">Filtros</span>
      </div>

      <div className="flex flex-1 gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Año</label>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Mes</label>
          <select value={selectedMonth || ""}
            onChange={e => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm">
            <option value="">Todos los meses</option>
            {MONTHS.map((m, idx) => <option key={idx + 1} value={idx + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 ml-auto">
        <button onClick={onRefresh} disabled={loadingStats}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
          <FaSyncAlt className={loadingStats ? "animate-spin" : ""} size={13} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
        <button onClick={onExport}
          className="px-4 py-2.5 bg-gradient-to-r from-[#D3423E] to-red-600 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 shadow-md">
          <FaFileExport size={13} />
          <span className="hidden sm:inline">Exportar Excel</span>
        </button>
      </div>
    </div>
  </motion.div>
);