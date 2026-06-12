import React, { useState } from "react";
import { FaPlus, FaMinus, FaCog, FaChevronRight, FaCity, FaEye, FaEyeSlash, FaLayerGroup, FaExpand, FaRoute, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { CHANNEL_CONFIG, CHANNEL_LIST } from "../../utils/ClientMarkerIcons";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";
import { getTripColor } from "../../utils/RouteOptimizer";

export const RouteControls = ({
  mapRef, showMunicipios, setShowMunicipios,
  filteredMarkers, selectedMarkers, fitToMarkers,
  optimizationResult, municipioGroups,
}) => {
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  const handleZoomIn = () => { const z = mapRef.current?.getZoom() || 13; mapRef.current?.setZoom(Math.min(z + 1, 22)); };
  const handleZoomOut = () => { const z = mapRef.current?.getZoom() || 13; mapRef.current?.setZoom(Math.max(z - 1, 3)); };

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <button onClick={handleZoomIn} className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 border-b border-gray-200"><FaPlus size={13} /></button>
        <button onClick={handleZoomOut} className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100"><FaMinus size={13} /></button>
      </div>

      <div className="absolute top-4 right-4 z-20 relative">
        <button onClick={() => setShowViewOptions(!showViewOptions)}
          className="bg-white rounded-xl shadow-xl p-3 border border-gray-200 flex items-center gap-2 hover:shadow-2xl transition-all">
          <FaCog className="text-gray-600" size={13} /><span className="text-xs font-bold text-gray-700">Vista</span>
          <FaChevronRight className={`text-gray-400 transition-transform ${showViewOptions ? "rotate-90" : ""}`} size={9} />
        </button>
        {showViewOptions && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowViewOptions(false)} />
            <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-20">
              <div className="p-2 border-b border-gray-100"><p className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">Capas</p></div>
              <button onClick={() => setShowMunicipios(!showMunicipios)} className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-2"><FaCity className="text-gray-600" size={12} /><span className="text-xs font-bold text-gray-700">Zonas</span></div>
                {showMunicipios ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
              </button>
              <button onClick={() => setShowLegend(!showLegend)} className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2"><FaLayerGroup className="text-gray-600" size={12} /><span className="text-xs font-bold text-gray-700">Leyenda</span></div>
                {showLegend ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
              </button>
              <div className="border-t border-gray-100">
                <button onClick={() => { fitToMarkers(filteredMarkers); setShowViewOptions(false); }} className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50">
                  <FaExpand className="text-gray-600" size={12} /><span className="text-xs font-bold text-gray-700">Ver todos</span>
                </button>
                {selectedMarkers.length > 0 && <button onClick={() => { fitToMarkers(selectedMarkers); setShowViewOptions(false); }} className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 border-t border-gray-100">
                  <FaRoute className="text-[#D3423E]" size={12} /><span className="text-xs font-bold text-gray-700">Ver ruta</span>
                </button>}
              </div>
            </div>
          </>
        )}
      </div>

      {showLegend && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className={`absolute right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[210px] max-h-[55vh] overflow-y-auto ${selectedMarkers.length > 0 ? "bottom-[150px]" : "bottom-4"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1"><FaLayerGroup size={10} /> Leyenda</p>
            <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-700 p-0.5"><FaTimes size={10} /></button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs"><div className="w-5 h-5 rounded-full bg-gray-900 border-2 border-white shadow-sm flex items-center justify-center"><span className="text-white text-[8px]">⌂</span></div><span className="text-gray-700 font-medium">Depósito</span></div>
            {CHANNEL_LIST.map(ch => {
              const c = CHANNEL_CONFIG[ch];
              return <div key={ch} className="flex items-center gap-2 text-xs"><div className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[9px]" style={{ backgroundColor: c.color }}>{c.emoji}</div><span className="text-gray-700 font-medium">{ch}</span></div>;
            })}
            {optimizationResult && <div className="pt-1.5 mt-1 border-t border-gray-100"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Viajes</p>
              {optimizationResult.trips.map(t => <div key={t.tripNumber} className="flex items-center gap-2 text-xs mb-1"><div className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: getTripColor(t.tripNumber) }}>{t.tripNumber}</div><span className="text-gray-700">Viaje {t.tripNumber}</span></div>)}
            </div>}
            {showMunicipios && <div className="pt-1.5 mt-1 border-t border-gray-100"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Zonas</p>
              {Object.values(MUNICIPIOS_COCHABAMBA).map(m => <div key={m.id} className="flex items-center gap-2 text-xs mb-0.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.accent }} /><span className="text-gray-700 flex-1">{m.name}</span><span className="text-[10px] font-bold text-gray-500">{municipioGroups[m.id]?.count || 0}</span></div>)}
            </div>}
          </div>
        </motion.div>
      )}
      {!showLegend && <button onClick={() => setShowLegend(true)} className={`absolute right-4 z-10 bg-white rounded-full shadow-lg p-2.5 border border-gray-200 hover:shadow-xl ${selectedMarkers.length > 0 ? "bottom-[150px]" : "bottom-4"}`}><FaLayerGroup className="text-gray-600" size={13} /></button>}
    </>
  );
};