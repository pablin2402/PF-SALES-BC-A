import React from "react";
import {
  FaUsers,
  FaToggleOn,
  FaToggleOff,
  FaCity,
} from "react-icons/fa";
import { motion } from "framer-motion";

const CARDS = [
  {
    key: "total",
    label: "Total Repartidores",
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
    icon: FaCity,
    color: "bg-blue-500",
  },
];

const DeliveryStats = ({
  stats,
  statusFilter,
  onFilterChange,
}) => {
  const values = {
    total: stats?.total || 0,
    active: stats?.active || 0,
    inactive: stats?.inactive || 0,
    regions: stats?.regions || 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.key}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={() =>
              card.filter && onFilterChange(card.filter)
            }
            className={`
              relative
              overflow-hidden
              bg-white
              rounded-2xl
              border
              p-5
              shadow-sm
              hover:shadow-xl
              transition-all
              ${
                card.filter &&
                statusFilter === card.filter
                  ? "border-[#D3423E] ring-2 ring-[#D3423E]/20"
                  : "border-gray-200"
              }
              ${
                card.filter
                  ? "cursor-pointer"
                  : "cursor-default"
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
                  {values[card.key]}
                </h3>
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

export default DeliveryStats;