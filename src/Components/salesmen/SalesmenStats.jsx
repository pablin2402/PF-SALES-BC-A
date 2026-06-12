import React from "react";
import {
  FaUsers,
  FaToggleOn,
  FaToggleOff,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { SkeletonStats } from "../../utils/SkeletonLoading";

const CARDS = [
  {
    key: "total",
    label: "Total Vendedores",
    icon: FaUsers,
    color: "bg-slate-500",
    filter: "all",
  },
  {
    key: "active",
    label: "Activos",
    icon: FaToggleOn,
    color: "bg-green-500",
    filter: "active",
  },
  {
    key: "inactive",
    label: "Inactivos",
    icon: FaToggleOff,
    color: "bg-red-500",
    filter: "inactive",
  },
  {
    key: "regions",
    label: "Ciudades",
    icon: FaMapMarkerAlt,
    color: "bg-blue-500",
    filter: null,
  },
];

export const SalesmenStats = ({
  stats,
  loading,
  salesData,
  statusFilter,
  setStatusFilter,
}) => {
  if (loading && !salesData?.length) {
    return <SkeletonStats />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {CARDS.map((card) => {
        const Icon = card.icon;

        const isActive =
          card.filter &&
          (card.filter === "all"
            ? statusFilter === "all"
            : statusFilter === card.filter);

        return (
          <motion.div
            key={card.key}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={() =>
              card.filter &&
              setStatusFilter(
                isActive ? "all" : card.filter
              )
            }
            className={`
              relative
              overflow-hidden
              rounded-2xl
              bg-white
              border
              p-5
              shadow-sm
              hover:shadow-xl
              transition-all
              ${
                card.filter
                  ? "cursor-pointer"
                  : "cursor-default"
              }
              ${
                isActive
                  ? "border-[#D3423E] ring-2 ring-[#D3423E]/20"
                  : "border-gray-200"
              }
            `}
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 ${card.color}`}
            />

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  {card.label}
                </p>

                <h3 className="text-3xl font-bold text-gray-900">
                  {stats?.[card.key] || 0}
                </h3>

                {isActive && (
                  <span className="inline-flex mt-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-[#D3423E] border border-red-200">
                    Filtro activo
                  </span>
                )}
              </div>

              <div
                className={`
                  w-14 h-14
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  text-white
                  ${card.color}
                `}
              >
                <Icon size={22} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};