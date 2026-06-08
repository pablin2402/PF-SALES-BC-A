import React from "react";
import { motion } from "framer-motion";
import { FaBoxOpen, FaChartLine, FaTrophy, FaRocket, FaBrain } from "react-icons/fa";

const KPICard = ({ icon: Icon, label, value, sub, gradient, delay, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `linear-gradient(135deg, ${gradient[0]}08, ${gradient[1]}04)` }} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}>
          <Icon size={18} className="text-white" />
        </div>
        {badge && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${gradient[0]}15`, color: gradient[0] }}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 leading-tight truncate">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

export const StatsKPIRow = ({
  totalUnidades, items, topProducto, selectedYear, mesLabel, avgUnidades, totalForecast,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
    <KPICard icon={FaBoxOpen} label="Unidades vendidas" value={totalUnidades.toLocaleString()}
      sub="en el período" gradient={["#16a34a", "#22c55e"]} delay={0} badge="Total" />
    <KPICard icon={FaChartLine} label="Productos activos" value={items?.toLocaleString() || 0}
      sub={`Año ${selectedYear}`} gradient={["#2563eb", "#3b82f6"]} delay={0.06} />
    <KPICard icon={FaTrophy} label="Producto top" value={topProducto.slice(0, 16) || "—"}
      sub="Mayor volumen" gradient={["#d97706", "#f59e0b"]} delay={0.12} badge="#1" />
    <KPICard icon={FaBrain} label="Próximo mes ML" value={totalForecast.toLocaleString()}
      sub="Predicción XGBoost" gradient={["#D3423E", "#ef4444"]} delay={0.18} badge="IA" />
    <KPICard icon={FaRocket} label="Promedio por producto" value={avgUnidades.toLocaleString()}
      sub={`Mes: ${mesLabel}`} gradient={["#9333ea", "#a855f7"]} delay={0.24} />
  </div>
);