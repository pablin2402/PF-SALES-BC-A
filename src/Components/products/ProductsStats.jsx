import React from "react";
import { FaBox, FaFire, FaPercent, FaTags } from "react-icons/fa";

const CARDS = [
  { key: "total", label: "Total productos", icon: FaBox, soft: "bg-blue-100", text: "text-blue-700" },
  { key: "onOffer", label: "En oferta", icon: FaFire, soft: "bg-orange-100", text: "text-orange-700" },
  { key: "withDiscount", label: "Con descuento", icon: FaPercent, soft: "bg-green-100", text: "text-green-700" },
  { key: "categories", label: "Categorías", icon: FaTags, soft: "bg-purple-100", text: "text-purple-700" },
];

export const ProductsStats = ({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
  </div>
);