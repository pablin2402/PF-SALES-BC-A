import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { HiOutlineShoppingCart, HiOutlineCurrencyDollar, HiOutlineTrendingUp } from "react-icons/hi";
import { MdLocalShipping } from "react-icons/md";

const StatCard = ({ icon, label, value, bgColor, iconColor, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 ${bgColor} ${iconColor} rounded-xl`}>{icon}</div>
      {trend && (
        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {trend === "up" ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
          <span>activo</span>
        </div>
      )}
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
  </div>
);

export const HomeStats = ({ totalOrdersSum, totalAmountSum, averageTicket, numberOfOrdersNew }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard icon={<HiOutlineShoppingCart size={24} />} label="Pedidos del mes" value={totalOrdersSum}
      bgColor="bg-red-100" iconColor="text-[#D3423E]" trend={totalOrdersSum > 0 ? "up" : null} />
    <StatCard icon={<HiOutlineCurrencyDollar size={24} />} label="Total vendido"
      value={`Bs. ${totalAmountSum.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      bgColor="bg-green-100" iconColor="text-green-600" trend="up" />
    <StatCard icon={<HiOutlineTrendingUp size={24} />} label="Ticket promedio"
      value={`Bs. ${averageTicket.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      bgColor="bg-blue-100" iconColor="text-blue-600" />
    <StatCard icon={<MdLocalShipping size={24} />} label="En camino" value={numberOfOrdersNew}
      bgColor="bg-yellow-100" iconColor="text-yellow-600" />
  </div>
);