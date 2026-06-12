import React, { useState } from "react";
import { FaMagic, FaTimes, FaCheck, FaTruck, FaBoxes, FaWineBottle, FaChartLine, FaRoad, FaClock, FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getTripColor, formatDuration } from "../../utils/RouteOptimizer";
import StackingPlanCard from "../../utils/StackingPlanCard";

const Metric = ({ icon: Icon, label, value }) => (
  <div className="bg-white/10 rounded-xl py-2.5 px-1 flex flex-col items-center text-center">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="text-red-200" size={12} aria-hidden="true" />
      <p className="text-xs text-red-100 uppercase font-bold tracking-wide">{label}</p>
    </div>
    <p className="text-xl font-black text-white leading-tight tabular-nums">{value}</p>
  </div>
);

const PackChip = ({ children, accent }) => (
  <span
    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
      accent ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
    }`}
  >
    {children}
  </span>
);

const TripCard = ({ trip, isSelected, onClick, reducedMotion }) => {
  const [showStacking, setShowStacking] = useState(false);
  const color = getTripColor(trip.tripNumber);
  const utilization = Math.min(trip.utilization, 100);

  return (
    <div
      className={`relative rounded-2xl bg-white overflow-hidden transition-all ${
        isSelected ? "shadow-lg ring-1 ring-black/5" : "shadow-sm hover:shadow-md"
      }`}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-1.5 transition-opacity"
        style={{ backgroundColor: color, opacity: isSelected ? 1 : 0.35 }}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        aria-label={`Ver viaje ${trip.tripNumber} en el mapa`}
        className="w-full text-left cursor-pointer p-4 pl-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ "--tw-ring-color": color }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black shrink-0"
            style={{ backgroundColor: color }}
          >
            {trip.tripNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-extrabold text-gray-900">Viaje {trip.tripNumber}</p>
              {trip.oversized && (
                <span className="text-xs font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                  Excede
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {trip.orders.length} entregas · {trip.totalBottles} botellas
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black tabular-nums text-gray-900">
              {trip.boxes}
              <span className="text-sm text-gray-400 font-bold">/{trip.capacity}</span>
            </p>
            <p className="text-xs text-gray-400 font-semibold uppercase">cajas</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={reducedMotion ? false : { width: 0 }}
              animate={{ width: `${utilization}%` }}
              transition={{ duration: reducedMotion ? 0 : 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: trip.oversized ? "#DC2626" : color }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: trip.oversized ? "#DC2626" : color }}>
            {trip.utilization}%
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          {trip.fullBoxes > 0 && <PackChip>{trip.fullBoxes} cajas llenas</PackChip>}
          {trip.halfBoxes > 0 && <PackChip>{trip.halfBoxes} medias cajas</PackChip>}
          {trip.looseBottles > 0 && (
            <PackChip accent>
              {trip.looseBottles} botellas sueltas
              {trip.looseBoxes ? ` → ${trip.looseBoxes} caja${trip.looseBoxes !== 1 ? "s" : ""} extra` : ""}
            </PackChip>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1.5"><FaRoad size={11} aria-hidden="true" /> {trip.distance} km</span>
          <span className="flex items-center gap-1.5"><FaClock size={11} aria-hidden="true" /> {formatDuration(trip.estimatedTime)}</span>
        </div>
      </button>

      {trip.stackingPlan && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowStacking((v) => !v); }}
            aria-expanded={showStacking}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-t border-gray-100 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
          >
            <FaBoxes size={11} aria-hidden="true" />
            {showStacking ? "Ocultar apilado" : "Ver apilado en camión"}
            <FaChevronDown
              size={10}
              aria-hidden="true"
              className={`transition-transform ${showStacking ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {showStacking && (
              <motion.div
                initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <StackingPlanCard stackingPlan={trip.stackingPlan} tripColor={color} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export const PlanPanel = ({ optimizationResult, selectedTripView, onViewTrip, onClearOptimization, onCreate }) => {
  const reducedMotion = useReducedMotion();
  const { trips, stats } = optimizationResult;

  return (
    <div className="p-4 bg-gray-50/60 min-h-full">
      <div className="rounded-2xl bg-[#D3423E] text-white shadow-lg shadow-red-200 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <FaMagic className="text-white" size={13} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide">Plan optimizado</p>
              <p className="text-xs text-red-100 font-medium">
                {trips.length} viaje{trips.length !== 1 ? "s" : ""} · {stats.totalOrders} pedidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearOptimization}
            aria-label="Descartar plan"
            className="text-red-100 hover:text-white hover:bg-white/15 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <FaTimes size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 pb-3.5">
          <Metric icon={FaTruck} label="Viajes" value={stats.totalTrips} />
          <Metric icon={FaBoxes} label="Cajas" value={stats.totalBoxes} />
          <Metric icon={FaWineBottle} label="Botellas" value={stats.totalBottles} />
          <Metric icon={FaChartLine} label="Uso" value={`${stats.avgUtilization}%`} />
        </div>
      </div>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">
        Viajes · toca para ver en el mapa
      </p>
      <div className="space-y-3 mb-4">
        {trips.map((trip) => (
          <TripCard
            key={trip.tripNumber}
            trip={trip}
            isSelected={selectedTripView === trip.tripNumber}
            onClick={() => onViewTrip(trip.tripNumber)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="w-full px-4 py-3.5 bg-[#D3423E] text-white font-bold rounded-2xl hover:bg-[#bb3330] transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 active:scale-[0.99]"
      >
        <FaCheck size={14} aria-hidden="true" />
        Crear {trips.length} ruta{trips.length !== 1 ? "s" : ""}
      </button>
    </div>
  );
};