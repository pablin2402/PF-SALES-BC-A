import React from "react";
import { FaMagic, FaRoute, FaTimes, FaCheck, FaBuilding, FaInfoCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getTripColor } from "../../utils/RouteOptimizer";
import StackingPlanCard from "../../utils/StackingPlanCard";

const SummaryItem = ({ label, value, highlight }) => (
  <div>
    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">{label}</p>
    <p className={`text-sm font-bold ${highlight ? "text-[#D3423E]" : "text-gray-900"}`}>{value}</p>
  </div>
);

export const CreateRouteModal = ({
  isOpen, onClose, optimizationResult, selectedMarkers, totalAmount,
  currentLoad, truckCapacity, vendedores, selectedSaler,
  routeName, setRouteName, startDate, setStartDate, endDate, setEndDate,
  creating, validateForm, handleCreateRoute,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

          <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                {optimizationResult ? <><FaMagic /> Crear rutas optimizadas</> : <><FaRoute /> Crear ruta</>}
              </h3>
              <p className="text-xs text-red-100 mt-0.5 font-medium">
                {optimizationResult ? `${optimizationResult.trips.length} viajes · ${optimizationResult.stats.totalOrders} pedidos` : `${selectedMarkers.length} pedido${selectedMarkers.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center"><FaTimes /></button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">Nombre <span className="text-[#D3423E]">*</span></label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" placeholder="Ej: Entregas Lunes Zona Sur" value={routeName} onChange={e => setRouteName(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 font-medium" />
              </div>
              {optimizationResult?.trips?.length > 1 && (
                <p className="text-[10px] text-gray-600 mt-1.5 flex items-start gap-1"><FaInfoCircle className="mt-0.5 shrink-0 text-[#D3423E]" size={10} />
                  Se crearán {optimizationResult.trips.length} rutas con sufijo "Viaje 1/N"...</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Desde</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-3 text-sm text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Hasta</label>
                <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-3 text-sm text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100" />
              </div>
            </div>

            {optimizationResult ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-3 border border-red-200">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-2.5">Resumen</p>
                  <div className="grid grid-cols-3 gap-2">
                    <SummaryItem label="Viajes" value={optimizationResult.stats.totalTrips} />
                    <SummaryItem label="Pedidos" value={optimizationResult.stats.totalOrders} />
                    <SummaryItem label="Cajas" value={optimizationResult.stats.totalBoxes} />
                    <SummaryItem label="Botellas" value={optimizationResult.stats.totalBottles} />
                    <SummaryItem label="Distancia" value={`${optimizationResult.stats.totalDistance}km`} />
                    <SummaryItem label="Uso prom." value={`${optimizationResult.stats.avgUtilization}%`} highlight />
                  </div>
                </div>
                {optimizationResult.trips.map(trip => (
                  <div key={trip.tripNumber} className="border-2 rounded-xl overflow-hidden" style={{ borderColor: getTripColor(trip.tripNumber) }}>
                    <div className="p-3 flex items-center justify-between" style={{ backgroundColor: `${getTripColor(trip.tripNumber)}15` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: getTripColor(trip.tripNumber) }}>{trip.tripNumber}</div>
                        <div><p className="text-xs font-bold text-gray-900">Viaje {trip.tripNumber}</p><p className="text-[10px] text-gray-600">{trip.orders.length} entregas · {trip.distance} km</p></div>
                      </div>
                      <div className="text-right"><p className="text-sm font-black" style={{ color: getTripColor(trip.tripNumber) }}>{trip.boxes}/{trip.capacity}</p><p className="text-[10px] text-gray-500">cajas</p></div>
                    </div>
                    <div className="p-3"><StackingPlanCard stackingPlan={trip.stackingPlan} tripColor={getTripColor(trip.tripNumber)} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase">Resumen</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between"><span>Repartidor:</span><span className="font-bold text-gray-900 truncate ml-2">{vendedores.find(v => v._id === selectedSaler)?.fullName || "—"}</span></div>
                  <div className="flex justify-between"><span>Pedidos:</span><span className="font-bold text-gray-900">{selectedMarkers.length}</span></div>
                  <div className="flex justify-between"><span>Cajas:</span><span className="font-bold text-gray-900">{currentLoad}/{truckCapacity}</span></div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 mt-1"><span className="font-bold">Total:</span><span className="font-bold text-[#D3423E]">Bs. {totalAmount.toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-200 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleCreateRoute} disabled={!validateForm() || creating}
              className={`flex-1 px-4 py-3 rounded-xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 ${!validateForm() || creating ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-[#D3423E] to-red-600 hover:shadow-lg"}`}>
              {creating ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando...</> : <><FaCheck size={12} />{optimizationResult ? `Crear ${optimizationResult.trips.length} ruta${optimizationResult.trips.length !== 1 ? "s" : ""}` : "Crear ruta"}</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);