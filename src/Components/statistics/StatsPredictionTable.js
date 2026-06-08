import React from "react";
import { motion } from "framer-motion";
import { FaBrain, FaArrowUp, FaArrowDown, FaMinus, FaExclamationTriangle } from "react-icons/fa";

const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
};
const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const TrendIcon = ({ current, prev }) => {
  if (!prev) return <FaMinus className="text-gray-400" size={11} />;
  const diff = current - prev;
  const pct = Math.abs(Math.round((diff / prev) * 100));
  if (diff > 0) return (
    <span className="flex items-center gap-0.5 text-green-600 font-black text-[10px]">
      <FaArrowUp size={9} /> {pct}%
    </span>
  );
  if (diff < 0) return (
    <span className="flex items-center gap-0.5 text-red-500 font-black text-[10px]">
      <FaArrowDown size={9} /> {pct}%
    </span>
  );
  return <FaMinus className="text-gray-400" size={11} />;
};

const ForecastBadge = ({ valor, max }) => {
  const pct = max ? Math.round((valor / max) * 100) : 0;
  const color = pct >= 60 ? "from-green-500 to-emerald-600" : pct >= 30 ? "from-amber-500 to-orange-500" : "from-red-400 to-red-500";
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r ${color} text-white font-black text-xs shadow-sm`}>
        {valor.toLocaleString()}
      </span>
    </div>
  );
};

export const StatsPredictionTable = ({ products, loadingPredict, getNextMonthLabel }) => {
  const maxForecast0 = Math.max(...products.map(p => p.forecast?.[0]?.valor || 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
            <FaBrain className="text-purple-600" size={15} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">Predicción de ventas por IA</h2>
            <p className="text-xs text-gray-500 font-medium">Modelo XGBoost — proyección 3 meses</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-gray-500">Alto</span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
          <span className="text-[10px] font-bold text-gray-500">Medio</span>
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 ml-2" />
          <span className="text-[10px] font-bold text-gray-500">Bajo</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3.5 text-right text-[10px] font-black text-gray-500 uppercase tracking-wider">Vta. acumulada</th>
              <th className="px-4 py-3.5 text-right text-[10px] font-black text-[#D3423E] uppercase tracking-wider whitespace-nowrap">
                {getNextMonthLabel(0)} <span className="text-gray-400 font-medium normal-case">+1</span>
              </th>
              <th className="px-4 py-3.5 text-right text-[10px] font-black text-[#D3423E] uppercase tracking-wider whitespace-nowrap">
                {getNextMonthLabel(1)} <span className="text-gray-400 font-medium normal-case">+2</span>
              </th>
              <th className="px-4 py-3.5 text-right text-[10px] font-black text-[#D3423E] uppercase tracking-wider whitespace-nowrap">
                {getNextMonthLabel(2)} <span className="text-gray-400 font-medium normal-case">+3</span>
              </th>
              <th className="px-4 py-3.5 text-right text-[10px] font-black text-gray-500 uppercase tracking-wider">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {loadingPredict ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.1 }}>
                  <td className="px-5 py-4"><SBox className="h-4 w-48" /></td>
                  <td className="px-4 py-4"><SBox className="h-4 w-20 ml-auto" /></td>
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="px-4 py-4"><SBox className="h-7 w-16 ml-auto rounded-lg" /></td>
                  ))}
                </tr>
              ))
            ) : products.length > 0 ? (
              products.map((item, idx) => {
                const hasForecast = item.forecast?.length > 0;
                const f0 = item.forecast?.[0]?.valor;
                const f1 = item.forecast?.[1]?.valor;
                const f2 = item.forecast?.[2]?.valor;
                return (
                  <motion.tr key={idx}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className="border-b border-gray-100 hover:bg-purple-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `hsl(${(idx * 37) % 360}, 65%, 55%)` }} />
                        <span className="font-bold text-gray-900 text-sm">{item.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-black text-gray-900">{item.totalCantidad?.toLocaleString()}</span>
                    </td>
                    {hasForecast ? (
                      <>
                        <td className="px-4 py-4 text-right">
                          <ForecastBadge valor={f0} max={maxForecast0} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 font-black text-xs text-gray-700">
                            {f1?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 font-black text-xs text-gray-700">
                            {f2?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <TrendIcon current={f1} prev={f0} />
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                          <FaExclamationTriangle size={10} /> Datos insuficientes
                        </span>
                      </td>
                    )}
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <FaBrain size={40} className="mb-3 text-gray-200" />
                    <p className="font-bold text-gray-600">Sin predicciones disponibles</p>
                    <p className="text-xs text-gray-400 mt-1">El modelo necesita más datos históricos</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};