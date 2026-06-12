import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaChartLine, FaBoxes, FaTrophy, FaMoneyBillWave,
  FaClock, FaCheckCircle, FaTruck, FaReceipt, FaShoppingCart,
  FaChartBar, FaHistory, FaUserFriends, FaStar, FaMedal,
} from "react-icons/fa";
import { HiOutlineTrendingUp, HiOutlineTrendingDown } from "react-icons/hi";
import { useSalesmanProfile } from "../../hooks/useSalesManProfile";

const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const COLOR_MAP = {
  "bg-gradient-to-br from-purple-500 to-purple-700": "#7C3AED",
  "bg-gradient-to-br from-indigo-500 to-indigo-700": "#6366F1",
  "bg-gradient-to-br from-blue-500 to-blue-700": "#3B82F6",
  "bg-gradient-to-br from-pink-500 to-pink-700": "#EC4899",
  "bg-gradient-to-br from-red-500 to-red-700": "#EF4444",
  "bg-gradient-to-br from-teal-500 to-teal-700": "#14B8A6",
  "bg-gradient-to-br from-orange-500 to-orange-700": "#F97316",
  "bg-gradient-to-br from-green-500 to-green-700": "#22C55E",
};

const TABS = [
  { id: "overview", label: "Resumen", icon: FaChartBar },
  { id: "timeline", label: "Actividad", icon: FaHistory },
  { id: "products", label: "Productos", icon: FaBoxes },
];

const RankBadge = ({ rank, total }) => {
  const config = rank === 1 ? { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", icon: "🥇" }
    : rank === 2 ? { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", icon: "🥈" }
    : rank === 3 ? { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", icon: "🥉" }
    : { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: "" };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${config.bg} ${config.text} border ${config.border} rounded-full`}>
      {config.icon && <span className="text-sm">{config.icon}</span>}
      <span className="text-xs font-black">#{rank}</span>
      <span className="text-[10px] font-medium opacity-70">de {total}</span>
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, color = "#D3423E", small }) => (
  <div className={`bg-white rounded-xl border border-gray-200 ${small ? "p-3" : "p-4"} hover:shadow-md transition-all`}>
    <div className="flex items-center gap-2 mb-1.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
        <Icon size={13} style={{ color }} />
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`font-black text-gray-900 ${small ? "text-lg" : "text-xl"}`}>{value}</p>
    {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

const MiniBarChart = ({ data, color = "#D3423E" }) => {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all relative group" style={{
            height: `${Math.max((d.amount / max) * 100, 4)}%`,
            backgroundColor: d.amount > 0 ? color : "#E5E7EB",
            opacity: d.amount > 0 ? 0.85 : 0.4,
          }}>
            {d.amount > 0 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Bs. {d.amount.toFixed(0)}
              </div>
            )}
          </div>
          <span className="text-[9px] text-gray-500 font-bold">{d.month}</span>
        </div>
      ))}
    </div>
  );
};

const TimelineItem = ({ event, isLast }) => {
  const config = event.type === "delivery" ? { color: "#22C55E", icon: FaCheckCircle, bg: "bg-green-50" }
    : event.type === "route" ? { color: "#F59E0B", icon: FaTruck, bg: "bg-yellow-50" }
    : { color: "#3B82F6", icon: FaReceipt, bg: "bg-blue-50" };
  const d = new Date(event.date);
  d.setHours(d.getHours() - 4);
  const timeStr = d.toLocaleDateString("es-BO", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
          <config.icon size={12} style={{ color: config.color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={`flex-1 pb-4 ${isLast ? "" : "border-b border-gray-100 mb-2"}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-gray-900">{event.title}</p>
            <p className="text-xs text-gray-500">{event.client} · #{event.receiveNumber}</p>
          </div>
          <span className="text-sm font-black text-gray-900 whitespace-nowrap">Bs. {event.amount?.toFixed(2)}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><FaClock size={8} />{timeStr}</p>
      </div>
    </div>
  );
};

const DrawerSkeleton = () => (
  <div className="p-5 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-full" style={SHIMMER} />
      <div className="space-y-2 flex-1"><div className="h-5 w-40 rounded" style={SHIMMER} /><div className="h-3 w-28 rounded" style={SHIMMER} /></div>
    </div>
    <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl" style={SHIMMER} />)}</div>
    <div className="h-40 rounded-xl" style={SHIMMER} />
    <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg" style={SHIMMER} />)}</div>
  </div>
);

export const SalesmanDrawer = ({ isOpen, onClose, salesman, avatarColor }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const salesmanId = salesman?.salesId?._id || salesman?._id;
  const { stats, timeline, monthlySales, topProducts, clients, loading } = useSalesmanProfile(salesmanId, isOpen);

  const fullName = salesman?.salesId?.fullName || salesman?.fullName || "";
  const lastName = salesman?.salesId?.lastName || salesman?.lastName || "";
  const email = salesman?.salesId?.email || salesman?.email || "";
  const name = `${fullName} ${lastName}`.trim();
  const initials = ((fullName[0] || "") + (lastName[0] || "")).toUpperCase();
  const hexColor = COLOR_MAP[avatarColor] || "#D3423E";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

            <div className="p-5 border-b border-gray-200 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexColor}08, ${hexColor}15)` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg ${avatarColor}`}>{initials}</div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{name}</h2>
                    <p className="text-xs text-gray-500 font-medium">{email || "Sin correo"}</p>
                    {stats && <RankBadge rank={stats.ranking} total={stats.totalSellers} />}
                  </div>
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <FaTimes className="text-gray-500" size={14} />
                </button>
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <tab.icon size={11} />{tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? <DrawerSkeleton /> : !stats ? (
                <div className="flex items-center justify-center h-64 text-gray-400"><p>Sin datos disponibles</p></div>
              ) : (
                <div className="p-5">
                  {activeTab === "overview" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <KPICard icon={FaMoneyBillWave} label="Ventas del mes" value={`Bs. ${stats.totalVentas.toFixed(2)}`} color="#22C55E" />
                        <KPICard icon={FaShoppingCart} label="Pedidos" value={stats.totalPedidos} sub={`Ticket prom: Bs. ${stats.ticketPromedio.toFixed(2)}`} color="#3B82F6" />
                        <KPICard icon={FaTrophy} label="Ranking" value={`#${stats.ranking}`} sub={`de ${stats.totalSellers} vendedores`} color="#F59E0B" />
                        <KPICard icon={FaUserFriends} label="Clientes" value={clients.length} sub="en su cartera" color="#8B5CF6" />
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-3">Estado de cobranza</p>
                        <div className="flex gap-3">
                          <div className="flex-1 bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-1.5 mb-1"><FaCheckCircle className="text-green-500" size={10} /><span className="text-[10px] font-bold text-green-700 uppercase">Cobrado</span></div>
                            <p className="text-lg font-black text-gray-900">Bs. {stats.cobrado.toFixed(2)}</p>
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-3 border border-amber-200">
                            <div className="flex items-center gap-1.5 mb-1"><FaClock className="text-amber-500" size={10} /><span className="text-[10px] font-bold text-amber-700 uppercase">Pendiente</span></div>
                            <p className="text-lg font-black text-gray-900">Bs. {stats.pendiente.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                            style={{ width: `${stats.totalVentas > 0 ? (stats.cobrado / stats.totalVentas) * 100 : 0}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-right font-bold">
                          {stats.totalVentas > 0 ? ((stats.cobrado / stats.totalVentas) * 100).toFixed(0) : 0}% cobrado
                        </p>
                      </div>

                      
                      <div className="grid grid-cols-2 gap-3">
                        <KPICard icon={FaTruck} label="En ruta" value={stats.enRuta} color="#F59E0B" small />
                        <KPICard icon={FaCheckCircle} label="Entregados" value={stats.entregados} color="#22C55E" small />
                      </div>
                    </div>
                  )}

                  {activeTab === "timeline" && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-4">Últimas {timeline.length} actividades</p>
                      {timeline.length > 0 ? timeline.map((ev, i) => (
                        <TimelineItem key={ev.id} event={ev} isLast={i === timeline.length - 1} />
                      )) : (
                        <div className="text-center py-12 text-gray-400">
                          <FaHistory size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="font-bold">Sin actividad reciente</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "products" && (
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-4">Top productos vendidos este mes</p>
                      {topProducts.length > 0 ? (
                        <div className="space-y-2">
                          {topProducts.map((p, i) => {
                            const maxMonto = topProducts[0]?.monto || 1;
                            return (
                              <div key={p.name} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
                                    style={{ backgroundColor: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : hexColor }}>
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                    <p className="text-[10px] text-gray-500">{p.cantidad} unidades</p>
                                  </div>
                                  <p className="text-sm font-black text-gray-900">Bs. {p.monto.toFixed(2)}</p>
                                </div>
                                <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{
                                    width: `${(p.monto / maxMonto) * 100}%`,
                                    backgroundColor: hexColor,
                                    opacity: 1 - i * 0.08,
                                  }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <FaBoxes size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="font-bold">Sin productos vendidos</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};