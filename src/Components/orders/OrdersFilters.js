import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaFileExport } from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import { ORDER_STATUS_CONFIG, REGION_OPTIONS } from "../../constants/orderConfigs";

const FilterChip = ({ label, onRemove }) => (
  <span className="bg-red-50 border border-red-200 text-[#D3423E] px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm">
    {label}
    <button onClick={onRemove} className="hover:bg-red-100 rounded-full p-0.5 transition-colors">
      <FaTimes size={9} />
    </button>
  </span>
);

const FilterSelect = ({ label, value, onChange, options, placeholder = "Todos" }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer min-w-[180px] hover:border-gray-300"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const OrdersFilters = ({
  filters, updateFilter, vendedores, applyFilters,
  clearAllFilters, clearFilter, hasActiveFilters, onExport,
}) => {
  const [selectedFilter, setSelectedFilter] = useState("");

  return (
    <div className="p-5 border-b border-gray-200 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={filters.inputValue}
              onChange={(e) => updateFilter("inputValue", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] transition-all shadow-sm"
            />
            {filters.inputValue && (
              <button
                onClick={() => updateFilter("inputValue", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm hover:border-gray-300"
          >
            <option value="">Más filtros</option>
            <option value="seller">Vendedor</option>
            <option value="region">Ciudad</option>
            <option value="paymentType">Tipo de pago</option>
            <option value="payment">Estado de pago</option>
            <option value="date">Fecha</option>
          </select>
          <button
            onClick={applyFilters}
            className="px-4 py-2.5 bg-gradient-to-r from-[#D3423E] to-red-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 whitespace-nowrap shadow-md"
          >
            <HiFilter size={14} /> Filtrar
          </button>
        </div>

        <button
          onClick={onExport}
          className="px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 font-semibold text-sm shadow-sm"
        >
          <FaFileExport size={14} />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      <AnimatePresence>
        {selectedFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-gray-100">
              {selectedFilter === "seller" && (
                <FilterSelect
                  label="Vendedor"
                  value={filters.selectedSaler}
                  onChange={(v) => updateFilter("selectedSaler", v)}
                  placeholder="Todos los vendedores"
                  options={vendedores.map((v) => ({ value: v._id, label: `${v.fullName} ${v.lastName}` }))}
                />
              )}
              {selectedFilter === "region" && (
                <FilterSelect
                  label="Ciudad"
                  value={filters.selectedRegion}
                  onChange={(v) => updateFilter("selectedRegion", v)}
                  placeholder="Todas las ciudades"
                  options={REGION_OPTIONS}
                />
              )}
              {selectedFilter === "paymentType" && (
                <FilterSelect
                  label="Tipo de pago"
                  value={filters.selectedPaymentType}
                  onChange={(v) => updateFilter("selectedPaymentType", v)}
                  placeholder="Todos los tipos"
                  options={[{ value: "Crédito", label: "Crédito" }, { value: "Contado", label: "Contado" }, { value: "Cheque", label: "Cheque" }]}
                />
              )}
              {selectedFilter === "payment" && (
                <FilterSelect
                  label="Estado de pago"
                  value={filters.selectedPayment}
                  onChange={(v) => updateFilter("selectedPayment", v)}
                  placeholder="Todos los estados"
                  options={[{ value: "Pagado", label: "Pagado" }, { value: "Pendiente", label: "Pendiente" }]}
                />
              )}
              {selectedFilter === "date" && (
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Desde</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => updateFilter("startDate", e.target.value)}
                      className="px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hasta</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      min={filters.startDate}
                      onChange={(e) => updateFilter("endDate", e.target.value)}
                      className="px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                </div>
              )}
              <button
                onClick={applyFilters}
                className="px-4 py-2.5 bg-gradient-to-r from-[#D3423E] to-red-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <HiFilter size={14} /> Aplicar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-4 flex-wrap pt-4 border-t border-gray-100">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Activos:</span>
              {filters.inputValue && (
                <FilterChip label={`"${filters.inputValue}"`} onRemove={() => { updateFilter("inputValue", ""); setTimeout(applyFilters, 0); }} />
              )}
              {filters.selectedStatus && ORDER_STATUS_CONFIG[filters.selectedStatus] && (
                <FilterChip label={ORDER_STATUS_CONFIG[filters.selectedStatus].label} onRemove={() => clearFilter("status")} />
              )}
              {filters.selectedSaler && (
                <FilterChip label={`Vendedor: ${vendedores.find((v) => v._id === filters.selectedSaler)?.fullName || "?"}`} onRemove={() => clearFilter("seller")} />
              )}
              {filters.selectedPaymentType && <FilterChip label={`Tipo: ${filters.selectedPaymentType}`} onRemove={() => clearFilter("paymentType")} />}
              {filters.selectedPayment && <FilterChip label={`Pago: ${filters.selectedPayment}`} onRemove={() => clearFilter("payment")} />}
              {filters.startDate && filters.endDate && <FilterChip label={`${filters.startDate} → ${filters.endDate}`} onRemove={() => clearFilter("date")} />}
              {filters.selectedRegion && <FilterChip label={filters.selectedRegion} onRemove={() => clearFilter("region")} />}
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-[#D3423E] hover:underline flex items-center gap-1 ml-auto"
              >
                ↺ Limpiar todo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};