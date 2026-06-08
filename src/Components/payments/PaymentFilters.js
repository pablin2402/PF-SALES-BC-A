import React from "react";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import TextInputFilter from "../../Components/LittleComponents/TextInputFilter";
import PrincipalBUtton from "../../Components/LittleComponents/PrincipalButton";

export const PaymentsFilters = ({
  searchTerm, setSearchTerm, selectedFilter, setSelectedFilter,
  startDate, setStartDate, endDate, setEndDate,
  dateFilterActive, clearDateFilter, applyDateFilter, totalAmount, fetchPayments,
}) => {
  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    if (value === "all" || value === "none") {
      clearDateFilter();
    }
  };

  return (
    <div className="p-5 border-b border-gray-200 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1 max-w-md">
          <TextInputFilter
            value={searchTerm}
            onChange={setSearchTerm}
            onEnter={() => fetchPayments(1)}
            placeholder="Buscar por cliente..."
          />
        </div>

        <select
          value={selectedFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-[44px] px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm"
        >
          <option value="none">Filtros</option>
          <option value="all">Mostrar todos</option>
          <option value="date">Por fecha</option>
        </select>

        {selectedFilter === "date" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Desde</label>
              <input
                type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[44px] px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Hasta</label>
              <input
                type="date" value={endDate} min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[44px] px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 shadow-sm"
              />
            </div>
            <PrincipalBUtton onClick={applyDateFilter} icon={HiFilter}>
              Aplicar
            </PrincipalBUtton>
          </div>
        )}

        <div className="lg:ml-auto text-right">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Monto total</p>
          <p className="text-lg font-black text-gray-900">Bs. {totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {dateFilterActive && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="bg-gradient-to-r from-[#D3423E] to-red-600 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm">
            <FaCalendarAlt size={10} />
            {startDate} → {endDate}
            <button onClick={clearDateFilter} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
              <FaTimes size={10} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};