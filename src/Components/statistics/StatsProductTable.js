import React from "react";
import { motion } from "framer-motion";
import { FaBoxOpen, FaSearch, FaTrophy, FaMedal } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { ModernPagination } from "../../utils/ModernPagination";

const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
};
const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const RankBadge = ({ rank }) => {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md"><FaTrophy className="text-white" size={13} /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-sm"><FaMedal className="text-white" size={13} /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm"><FaMedal className="text-white" size={13} /></div>;
  return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-xs font-black text-gray-500">{rank}</span></div>;
};

export const StatsProductTable = ({
  salesData, loadingStats, items, page, setPage, totalPages,
  itemsPerPage, setItemsPerPage,
}) => {
  const maxValue = Math.max(...salesData.map(i => i.totalCantidad || 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <FaBoxOpen className="text-[#D3423E]" size={15} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">Ranking de productos</h2>
            <p className="text-xs text-gray-500 font-medium">{items || 0} productos en el período</p>
          </div>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          Pág. {page}/{totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3.5 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Volumen</th>
              <th className="px-4 py-3.5 text-right text-[10px] font-black text-gray-500 uppercase tracking-wider">Unidades</th>
            </tr>
          </thead>
          <tbody>
            {loadingStats ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.15 }}>
                  <td className="px-4 py-4"><SBox className="w-8 h-8 rounded-full" /></td>
                  <td className="px-4 py-4"><SBox className="h-4 w-48" /></td>
                  <td className="px-4 py-4"><SBox className="h-3 w-full" /></td>
                  <td className="px-4 py-4"><SBox className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))
            ) : salesData.length > 0 ? (
              salesData.map((item, idx) => {
                const rank = (page - 1) * itemsPerPage + idx + 1;
                const pct = Math.round((item.totalCantidad / maxValue) * 100);
                return (
                  <motion.tr key={item._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-gray-100 hover:bg-red-50/20 transition-colors">
                    <td className="px-4 py-3.5"><RankBadge rank={rank} /></td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-gray-900">{item._id}</span>
                    </td>
                    <td className="px-4 py-3.5 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.04 }}
                            className="h-full rounded-full"
                            style={{ background: rank === 1 ? "linear-gradient(90deg, #D3423E, #ef4444)" : rank <= 3 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #6b7280, #9ca3af)" }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-black text-gray-900">{item.totalCantidad?.toLocaleString()}</span>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <FaSearch size={32} className="mb-3 text-gray-200" />
                    <p className="font-bold text-gray-600">Sin resultados</p>
                    <p className="text-xs mt-1">Ajusta los filtros para ver datos</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gradient-to-b from-gray-50/50 to-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>Total: <strong className="text-gray-900">{items}</strong> productos</span>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold">Mostrar:</label>
            <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E]">
              {[5, 10, 20].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {totalPages > 1 && <ModernPagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>
    </motion.div>
  );
};