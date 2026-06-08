import React, { useState } from "react";
import { FaMagic, FaTimes, FaCheck, FaTruck, FaBoxes, FaWineBottle, FaChartLine, FaRoad, FaClock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getTripColor, formatDuration } from "../../utils/RouteOptimizer";
import StackingPlanCard from "../../utils/StackingPlanCard";

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-lg p-2 text-center border border-red-100">
    <Icon className="text-[#D3423E] mx-auto mb-0.5" size={11} />
    <p className="text-sm font-black text-gray-900 leading-tight">{value}</p>
    <p className="text-[9px] text-gray-500 uppercase font-bold">{label}</p>
  </div>
);

const TripCard = ({ trip, isSelected, onClick }) => {
  const [showStacking, setShowStacking] = useState(false);
  const color = getTripColor(trip.tripNumber);
  return (
    <div className={`rounded-xl border-2 transition-all overflow-hidden ${isSelected ? "bg-white shadow-md" : "bg-white/70 hover:bg-white"}`}
      style={{ borderColor: isSelected ? color : "transparent" }}>
      <div onClick={onClick} className="cursor-pointer p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0" style={{ backgroundColor: color }}>{trip.tripNumber}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Viaje {trip.tripNumber}{trip.oversized && <span className="ml-1 text-[9px] text-red-600">EXCEDE</span>}</p>
            <p className="text-[10px] text-gray-500">{trip.orders.length} entregas · {trip.totalBottles} botellas</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black" style={{ color }}>{trip.boxes}<span className="text-xs text-gray-400 font-bold">/{trip.capacity}</span></p>
            <p className="text-[10px] text-gray-500">cajas</p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${trip.utilization}%`, backgroundColor: color }} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {trip.fullBoxes > 0 && <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">{trip.fullBoxes} × 12</span>}
          {trip.halfBoxes > 0 && <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{trip.halfBoxes} × 6</span>}
          {trip.looseBottles > 0 && <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{trip.looseBottles} sueltas</span>}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><FaRoad size={9} /> {trip.distance} km</span>
          <span className="flex items-center gap-1"><FaClock size={9} /> {formatDuration(trip.estimatedTime)}</span>
          <button onClick={e => { e.stopPropagation(); setShowStacking(!showStacking); }}
            className="font-bold flex items-center gap-1 hover:underline" style={{ color }}>
            <FaBoxes size={9} />{showStacking ? "Ocultar" : "Ver apilado"}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showStacking && trip.stackingPlan && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-200">
            <div className="p-3 bg-gray-50"><StackingPlanCard stackingPlan={trip.stackingPlan} tripColor={color} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const PlanPanel = ({ optimizationResult, selectedTripView, onViewTrip, onClearOptimization, onCreate }) => (
  <div className="p-4">
    <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200 p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D3423E] to-red-700 flex items-center justify-center shadow-sm"><FaMagic className="text-white" size={11} /></div>
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase">Plan optimizado</p>
            <p className="text-[10px] text-gray-500">{optimizationResult.trips.length} viaje{optimizationResult.trips.length !== 1 ? "s" : ""} · {optimizationResult.stats.totalOrders} pedidos</p>
          </div>
        </div>
        <button onClick={onClearOptimization} className="text-gray-400 hover:text-[#D3423E] hover:bg-white p-1.5 rounded-lg transition-colors"><FaTimes size={11} /></button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <MetricCard icon={FaTruck} label="Viajes" value={optimizationResult.stats.totalTrips} />
        <MetricCard icon={FaBoxes} label="Cajas" value={optimizationResult.stats.totalBoxes} />
        <MetricCard icon={FaWineBottle} label="Botellas" value={optimizationResult.stats.totalBottles} />
        <MetricCard icon={FaChartLine} label="Uso" value={`${optimizationResult.stats.avgUtilization}%`} />
      </div>
    </div>
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">Viajes · click para visualizar</p>
    <div className="space-y-2 mb-4">
      {optimizationResult.trips.map(trip => (
        <TripCard key={trip.tripNumber} trip={trip} isSelected={selectedTripView === trip.tripNumber} onClick={() => onViewTrip(trip.tripNumber)} />
      ))}
    </div>
    <button onClick={onCreate}
      className="w-full px-4 py-3 bg-gradient-to-br from-[#D3423E] to-red-700 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm shadow-md">
      <FaCheck size={12} />Crear {optimizationResult.trips.length} ruta{optimizationResult.trips.length !== 1 ? "s" : ""}
    </button>
  </div>
);