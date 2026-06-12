import React from "react";
import {
  FaTruck, FaChevronLeft, FaChevronRight, FaRoute, FaBoxes,
  FaInfoCircle, FaMagic, FaReceipt, FaTimes,
} from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";
import { MIN_ORDERS_TO_OPTIMIZE } from "../../utils/RouteOptimizer";
import TextInputFilter from "../../Components/LittleComponents/TextInputFilter";
import { TABS } from "../../constants/routeConfigs";

const capacityColor = (pct, over) => {
  if (over) return { bar: "#DC2626", text: "text-red-600", chip: "bg-red-50 text-red-700" };
  if (pct >= 85) return { bar: "#D97706", text: "text-amber-600", chip: "bg-amber-50 text-amber-700" };
  return { bar: "#059669", text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700" };
};

export const RouteSidebar = ({
  collapsed, setCollapsed, children,
  vendedores, selectedSaler, onSalerChange,
  totalOrders, truckCapacity, currentLoad, utilizationPct, isOverCapacity,
  searchTerm, setSearchTerm, onSearch,
  selectedMunicipio, setSelectedMunicipio, fitMunicipio, municipioGroups,
  canOptimize, isOptimizing, onOptimize, markers,
  selectedMarkers, onCreateManual,
  optimizationResult, activeTab, setActiveTab,
}) => {
  const reducedMotion = useReducedMotion();
  const cap = capacityColor(utilizationPct, isOverCapacity);

  return (
    <div
      className={`${collapsed ? "w-0 lg:w-14" : "w-full lg:w-[460px]"} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}
    >
      {!collapsed && (
        <>
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D3423E] flex items-center justify-center shadow-sm shadow-red-200">
                  <FaTruck size={16} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-gray-900 leading-tight tracking-tight">Rutas de entrega</h1>
                  <p className="text-xs text-gray-500 font-medium">
                    {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} disponible{totalOrders !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Contraer panel"
                className="hidden lg:flex p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/40"
              >
                <FaChevronLeft size={12} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
              <label htmlFor="rs-repartidor" className="sr-only">Repartidor</label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <FaTruck size={13} className="text-gray-500" aria-hidden="true" />
                </div>
                <select
                  id="rs-repartidor"
                  value={selectedSaler}
                  onChange={onSalerChange}
                  className="flex-1 min-w-0 px-3 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl cursor-pointer transition focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Sin repartidor asignado</option>
                  {vendedores.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.fullName} {v.lastName}{v.truckCapacity ? ` · ${v.truckCapacity} cajas` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSaler && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <FaBoxes size={10} className="text-gray-400" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Capacidad del camión</span>
                    </div>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${cap.chip}`}>
                      {Math.round(utilizationPct)}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className={`text-2xl font-black tabular-nums ${cap.text}`}>{currentLoad}</span>
                    <span className="text-xs text-gray-500 font-bold">/ {truckCapacity} cajas</span>
                  </div>
                  <div
                    className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(utilizationPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Uso de capacidad"
                  >
                    <motion.div
                      initial={reducedMotion ? false : { width: 0 }}
                      animate={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      transition={{ duration: reducedMotion ? 0 : 0.4 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cap.bar }}
                    />
                  </div>
                  {isOverCapacity && (
                    <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-start gap-1" role="alert">
                      <FaInfoCircle className="mt-0.5 shrink-0" size={10} aria-hidden="true" />
                      Excede la capacidad por {currentLoad - truckCapacity} cajas.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pt-3 pb-3 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="relative mb-2.5">
              <TextInputFilter value={searchTerm} onChange={setSearchTerm} onEnter={onSearch} placeholder="Buscar pedido por cliente…" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <label htmlFor="rs-zona" className="sr-only">Zona</label>
              <select
                id="rs-zona"
                value={selectedMunicipio}
                onChange={(e) => { setSelectedMunicipio(e.target.value); if (e.target.value) fitMunicipio(e.target.value); }}
                className="flex-1 px-3 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer transition focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
              >
                <option value="">Todas las zonas</option>
                {Object.values(MUNICIPIOS_COCHABAMBA).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({municipioGroups[m.id]?.count || 0})</option>
                ))}
              </select>
              {selectedMunicipio && (
                <button
                  type="button"
                  onClick={() => setSelectedMunicipio("")}
                  aria-label="Quitar filtro de zona"
                  className="p-2.5 text-gray-400 hover:text-[#D3423E] hover:bg-red-50 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/40"
                >
                  <FaTimes size={12} aria-hidden="true" />
                </button>
              )}
            </div>

            <motion.button
              type="button"
              whileHover={canOptimize && !reducedMotion ? { scale: 1.01 } : {}}
              whileTap={canOptimize && !reducedMotion ? { scale: 0.99 } : {}}
              onClick={onOptimize}
              disabled={!canOptimize || isOptimizing}
              className={`w-full px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 ${
                !canOptimize
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#D3423E] text-white shadow-lg shadow-red-200 hover:bg-[#bb3330]"
              }`}
            >
              {isOptimizing ? (
                <>
                  <motion.span
                    animate={reducedMotion ? {} : { rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-flex"
                  >
                    <FaMagic size={13} aria-hidden="true" />
                  </motion.span>
                  Optimizando…
                </>
              ) : (
                <>
                  <FaMagic size={13} aria-hidden="true" />
                  {!selectedSaler
                    ? "Selecciona un repartidor"
                    : markers.length < MIN_ORDERS_TO_OPTIMIZE
                      ? `Mínimo ${MIN_ORDERS_TO_OPTIMIZE} pedidos (tienes ${markers.length})`
                      : "Optimizar ruta automáticamente"}
                </>
              )}
            </motion.button>

            {selectedMarkers.length > 0 && !optimizationResult && (
              <button
                type="button"
                onClick={onCreateManual}
                className="w-full mt-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-2xl hover:border-[#D3423E] hover:text-[#D3423E] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/40"
              >
                <FaRoute size={12} aria-hidden="true" />
                Crear ruta manual ({selectedMarkers.length})
              </button>
            )}
          </div>

          {optimizationResult && (
            <div className="px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
              <div role="tablist" aria-label="Vista del panel" className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                {[
                  { id: TABS.PLAN, icon: FaMagic, label: `Plan (${optimizationResult.trips.length})` },
                  { id: TABS.PEDIDOS, icon: FaReceipt, label: `Pedidos (${totalOrders})` },
                ].map(({ id, icon: Icon, label }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(id)}
                      className="relative flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50"
                    >
                      {active && (
                        <motion.span
                          layoutId="route-tab-pill"
                          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                          className="absolute inset-0 rounded-lg bg-white shadow-sm"
                          aria-hidden="true"
                        />
                      )}
                      <span className={`relative inline-flex items-center justify-center gap-1.5 transition-colors ${active ? "text-[#D3423E]" : "text-gray-500 hover:text-gray-700"}`}>
                        <Icon size={11} aria-hidden="true" /> {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">{children}</div>
        </>
      )}

      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expandir panel de rutas"
          className="hidden lg:flex h-full w-full bg-white items-center justify-center hover:bg-gray-50 flex-col gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D3423E]/40"
        >
          <FaChevronRight className="text-gray-400" aria-hidden="true" />
          {selectedMarkers.length > 0 && (
            <span className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-red-200">
              {selectedMarkers.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
};