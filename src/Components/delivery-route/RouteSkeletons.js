import React from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaMagic } from "react-icons/fa";
import { SHIMMER_STYLE } from "../../constants/routeConfigs";

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded ${className}`} style={{ ...SHIMMER_STYLE, ...style }} />
);

export const PedidoSkeleton = () => (
  <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
    <div className="flex gap-3 p-3">
      <SBox className="w-14 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SBox className="h-4 w-3/4" />
        <SBox className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <SBox className="h-4 w-12" /><SBox className="h-4 w-16" /><SBox className="h-4 w-10" />
        </div>
      </div>
    </div>
    <div className="px-3 pb-3 space-y-2">
      <SBox className="h-12 rounded-lg" />
      <SBox className="h-3 w-full" />
      <div className="flex justify-between items-center">
        <SBox className="h-4 w-20" /><SBox className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

export const PedidosSkeletonLoader = () => (
  <div className="p-4 space-y-3">
    <SBox className="h-3 w-32 mb-1" />
    {[0, 1, 2, 3].map(i => <PedidoSkeleton key={i} />)}
  </div>
);

export const PlanSkeletonLoader = () => (
  <div className="p-4">
    <div className="bg-gradient-to-br from-red-50 to-red-100/40 rounded-xl border border-red-200 p-3 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <SBox className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5"><SBox className="h-3 w-32" /><SBox className="h-2.5 w-24" /></div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-2 border border-red-100 text-center space-y-1">
            <SBox className="h-3 w-3 mx-auto" /><SBox className="h-3 w-8 mx-auto" /><SBox className="h-2 w-10 mx-auto" />
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2 mb-3 px-1">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <FaMagic className="text-[#D3423E]" size={11} />
      </motion.div>
      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide" style={{ animation: "pulse-soft 1.5s ease-in-out infinite" }}>
        Calculando viajes óptimos...
      </p>
    </div>
    <div className="space-y-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white rounded-xl border-2 border-gray-100 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <SBox className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-1"><SBox className="h-3 w-20" /><SBox className="h-2.5 w-28" /></div>
            <div className="text-right space-y-1"><SBox className="h-3 w-12 ml-auto" /><SBox className="h-2 w-8 ml-auto" /></div>
          </div>
          <SBox className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const MapSkeleton = () => (
  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-[#D3423E]" />
        <div className="absolute inset-0 flex items-center justify-center"><FaMapMarkerAlt className="text-[#D3423E]" size={24} /></div>
      </div>
      <p className="text-gray-700 font-bold text-sm">Cargando mapa...</p>
    </div>
  </div>
);