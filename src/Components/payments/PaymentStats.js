import React from "react";
import { motion } from "framer-motion";
import {
  FaReceipt,
  FaCheckCircle,
  FaTimesCircle,
  FaLink,
} from "react-icons/fa";

const CARDS = [
  {
    key: "total",
    label: "Total",
    icon: FaReceipt,
    color: "bg-slate-500",
  },
  {
    key: "ingresados",
    label: "Ingresados",
    icon: FaReceipt,
    color: "bg-blue-500",
  },
  {
    key: "confirmados",
    label: "Confirmados",
    icon: FaCheckCircle,
    color: "bg-green-500",
  },
  {
    key: "rechazados",
    label: "Rechazados",
    icon: FaTimesCircle,
    color: "bg-red-500",
  },
];

export const PaymentsStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.key}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl p-5"
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${card.color}`} />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  {card.label}
                </p>

                <h3 className="text-3xl font-bold text-gray-900">
                  {stats?.[card.key] || 0}
                </h3>
              </div>

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${card.color}`}
              >
                <Icon size={22} />
              </div>
            </div>
          </motion.div>
        );
      })}

      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-2xl p-5 shadow-xl bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#4F46E5] text-white"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <FaLink size={22} />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-purple-100">
                Activo
              </span>
            </div>
          </div>

          <p className="text-sm text-purple-100 font-medium">
            Verificados Blockchain
          </p>

          <h3 className="text-4xl font-extrabold mt-1">
            {stats?.enBlockchain || 0}
          </h3>

          <div className="mt-3">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full"
                style={{
                  width: `${
                    stats?.total > 0
                      ? (stats.enBlockchain / stats.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <p className="text-xs text-purple-100 mt-2">
              {stats?.total > 0
                ? `${Math.round(
                    (stats.enBlockchain / stats.total) * 100
                  )}% de pagos registrados`
                : "Sin registros"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};