import React from "react";
import { FaTruck, FaChevronLeft, FaChevronRight, FaRoute, FaBoxes, FaInfoCircle, FaMagic, FaReceipt, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";
import { MIN_ORDERS_TO_OPTIMIZE } from "../../utils/RouteOptimizer";
import TextInputFilter from "../../Components/LittleComponents/TextInputFilter";
import { TABS } from "../../constants/routeConfigs";

export const RouteSidebar = ({
  collapsed, setCollapsed, children,
  vendedores, selectedSaler, onSalerChange,
  totalOrders, truckCapacity, currentLoad, utilizationPct, isOverCapacity,
  searchTerm, setSearchTerm, onSearch,
  selectedMunicipio, setSelectedMunicipio, fitMunicipio, municipioGroups,
  canOptimize, isOptimizing, onOptimize, markers,
  selectedMarkers, onCreateManual,
  optimizationResult, activeTab, setActiveTab,
}) => (
  <div className={`${collapsed ? "w-0 lg:w-16" : "w-full lg:w-[460px]"} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
    {!collapsed && (
      <>
        {/* Header con capacidad */}
        <div className="px-5 pt-4 pb-3 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaTruck size={18} />
              <div>
                <h1 className="text-base font-bold leading-tight">Rutas de entrega</h1>
                <p className="text-[10px] text-red-100">{totalOrders} pedido{totalOrders !== 1 ? "s" : ""} disponible{totalOrders !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button onClick={() => setCollapsed(true)} className="hidden lg:flex p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <FaChevronLeft size={12} />
            </button>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><FaTruck size={13} /></div>
              <select value={selectedSaler} onChange={onSalerChange} className="app-select" style={{ colorScheme: "light" }}>
                <option value="">Sin repartidor asignado</option>
                {vendedores.map(v => <option key={v._id} value={v._id}>{v.fullName} {v.lastName}{v.truckCapacity ? ` · ${v.truckCapacity} cajas` : ""}</option>)}
              </select>
            </div>
            {selectedSaler && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-center gap-1.5"><FaBoxes size={10} className="text-red-100" /><span className="text-[10px] font-bold text-red-100 uppercase">Capacidad</span></div>
                  <span className="text-[10px] font-bold text-red-100">{Math.round(utilizationPct)}%</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-xl font-black ${isOverCapacity ? "text-yellow-200" : "text-white"}`}>{currentLoad}</span>
                  <span className="text-xs text-red-100 font-bold">/{truckCapacity} cajas</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${utilizationPct}%` }} transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${isOverCapacity ? "bg-yellow-300" : "bg-white"}`} />
                </div>
                {isOverCapacity && (
                  <p className="text-[10px] text-yellow-200 font-bold mt-1.5 flex items-start gap-1">
                    <FaInfoCircle className="mt-0.5 shrink-0" size={9} />Excede {currentLoad - truckCapacity} cajas.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="relative mb-2.5">
            <TextInputFilter value={searchTerm} onChange={setSearchTerm} onEnter={onSearch} placeholder="Buscar pedido por cliente..." />
          </div>
          <div className="flex items-center gap-2 mb-2.5">
            <select value={selectedMunicipio}
              onChange={e => { setSelectedMunicipio(e.target.value); if (e.target.value) fitMunicipio(e.target.value); }}
              className="app-select cursor-pointer">
              <option value="">Todas las zonas</option>
              {Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({municipioGroups[m.id]?.count || 0})</option>
              ))}
            </select>
            {selectedMunicipio && <button onClick={() => setSelectedMunicipio("")} className="px-2 py-2 text-xs text-gray-500 hover:text-[#D3423E]"><FaTimes size={11} /></button>}
          </div>
          <motion.button whileHover={canOptimize ? { scale: 1.01 } : {}} whileTap={canOptimize ? { scale: 0.99 } : {}}
            onClick={onOptimize} disabled={!canOptimize || isOptimizing}
            className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!canOptimize ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gradient-to-br from-[#D3423E] to-red-700 text-white shadow-md hover:shadow-lg"}`}>
            {isOptimizing ? (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><FaMagic size={13} /></motion.div>Optimizando...</>)
              : (<><FaMagic size={13} />{!selectedSaler ? "Selecciona un repartidor" : markers.length < MIN_ORDERS_TO_OPTIMIZE ? `Mínimo ${MIN_ORDERS_TO_OPTIMIZE} pedidos (${markers.length})` : "Optimizar ruta automáticamente"}</>)}
          </motion.button>
          {selectedMarkers.length > 0 && !optimizationResult && (
            <button onClick={onCreateManual}
              className="w-full mt-2 px-4 py-2 bg-white border-2 border-[#D3423E] text-[#D3423E] font-bold text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <FaRoute size={12} />Crear ruta manual ({selectedMarkers.length})
            </button>
          )}
        </div>

        {/* Tabs */}
        {optimizationResult && (
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            <button onClick={() => setActiveTab(TABS.PLAN)}
              className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${activeTab === TABS.PLAN ? "text-[#D3423E] border-b-2 border-[#D3423E] bg-red-50/30" : "text-gray-500 hover:text-gray-700"}`}>
              <FaMagic size={11} />Plan ({optimizationResult.trips.length})
            </button>
            <button onClick={() => setActiveTab(TABS.PEDIDOS)}
              className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${activeTab === TABS.PEDIDOS ? "text-[#D3423E] border-b-2 border-[#D3423E] bg-red-50/30" : "text-gray-500 hover:text-gray-700"}`}>
              <FaReceipt size={11} />Pedidos ({totalOrders})
            </button>
          </div>
        )}

        {/* Content slot */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </>
    )}
    {collapsed && (
      <button onClick={() => setCollapsed(false)}
        className="hidden lg:flex h-full w-full rounded-r-xl border-4 border-red-700 items-center justify-center hover:bg-gray-100 flex-col gap-2">
        <FaChevronRight className="text-red-700" />
        {selectedMarkers.length > 0 && <div className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-bold">{selectedMarkers.length}</div>}
      </button>
    )}
  </div>
);