import React from "react";
import { motion } from "framer-motion";
import { FaChartLine, FaBrain } from "react-icons/fa";
import VentasChart from "../../Components/charts/VentasChart";
import TrendLineChart from "../../Components/charts/TrendLineChart";

const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
};
const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const ChartSkeleton = () => (
  <div className="p-5 space-y-3 h-72 flex flex-col justify-end">
    <div className="flex items-end gap-3 flex-1">
      {[55, 80, 40, 90, 65, 75, 50, 85].map((h, i) => (
        <SBox key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
    <div className="flex gap-3">
      {[...Array(8)].map((_, i) => <SBox key={i} className="flex-1 h-3" />)}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, icon: Icon, iconBg, children, loading, delay }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="text-[#D3423E]" size={15} />
      </div>
      <div>
        <h2 className="text-base font-black text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="p-5">
      {loading ? <ChartSkeleton /> : children}
    </div>
  </motion.div>
);

export const StatsChartsRow = ({
  labels, values, selectedYear, products, loadingStats, loadingPredict,
}) => (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
    <ChartCard title="Ventas por producto" subtitle="Distribución del período seleccionado"
      icon={FaChartLine} iconBg="bg-red-50" loading={loadingStats} delay={0.12}>
      <VentasChart labels={labels} values={values} year={selectedYear} />
    </ChartCard>
    <ChartCard title="Predicción XGBoost" subtitle="Tendencia e inteligencia artificial — próximos 3 meses"
      icon={FaBrain} iconBg="bg-purple-50" loading={loadingPredict} delay={0.16}>
      <TrendLineChart products={products} />
    </ChartCard>
  </div>
);