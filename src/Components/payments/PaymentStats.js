import React from "react";
import { motion } from "framer-motion";
import { FaReceipt, FaCheckCircle, FaTimesCircle, FaLink } from "react-icons/fa";

const CARDS = [
  { key: "total", label: "Total", icon: FaReceipt, soft: "bg-gray-100", text: "text-gray-700" },
  { key: "ingresados", label: "Ingresados", icon: FaReceipt, soft: "bg-blue-100", text: "text-blue-700" },
  { key: "confirmados", label: "Confirmados", icon: FaCheckCircle, soft: "bg-green-100", text: "text-green-700" },
  { key: "rechazados", label: "Rechazados", icon: FaTimesCircle, soft: "bg-red-100", text: "text-red-700" },
];

export const PaymentsStats = ({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
    {CARDS.map((c) => {
      const Icon = c.icon;
      return (
        <div key={c.key} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 hover:shadow-md transition-all">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.soft}`}>
            <Icon className={c.text} size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider truncate">{c.label}</p>
            <p className="text-2xl font-black text-gray-900">{stats[c.key]}</p>
          </div>
        </div>
      );
    })}

    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 p-4 rounded-2xl shadow-xl text-white"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
            <FaLink size={16} />
          </div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        <p className="text-[10px] uppercase text-purple-100 font-black tracking-wider">On-chain</p>
        <h3 className="text-3xl font-black mt-1">{stats.enBlockchain}</h3>
        <p className="text-xs text-purple-100 mt-1">
          {stats.total > 0 ? `${Math.round((stats.enBlockchain / stats.total) * 100)}% verificados` : "0%"}
        </p>
      </div>
    </motion.div>
  </div>
);