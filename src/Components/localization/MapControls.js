import React, { useState } from "react";
import {
  FaMapMarkerAlt, FaGlobeAmericas, FaTimes, FaExpand,
  FaLayerGroup, FaCity, FaUsers, FaTruck, FaEye, FaEyeSlash,
  FaCog, FaChevronDown,
} from "react-icons/fa";
import { CHANNEL_CONFIG, CHANNEL_LIST } from "../../utils/ClientMarkerIcons";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";

export const MapControls = ({
  viewAllMode, loadAllClients, exitViewAllMode, allClientsCache, loadingAll,
  filteredMarkers, fitAllMarkers, resetView,
  showMunicipios, setShowMunicipios, showActivePeople, setShowActivePeople,
  selectedCategories, setSelectedCategories, channelStats, municipioGroups,
}) => {
  const [showViewOptions, setShowViewOptions] = useState(false);

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {!viewAllMode ? (
          <button onClick={loadAllClients} disabled={loadingAll}
            className="bg-gradient-to-r from-[#D3423E] to-red-600 text-white rounded-xl shadow-lg p-3 flex items-center gap-2 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-70"
            title="Ver todos en el mapa">
            {loadingAll
              ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" /><span className="text-xs font-bold">Cargando...</span></>
              : <><FaGlobeAmericas size={13} /><span className="text-xs font-bold">Ver todos</span></>
            }
          </button>
        ) : (
          <button onClick={exitViewAllMode}
            className="bg-gray-900 text-white rounded-xl shadow-lg p-3 flex items-center gap-2 transition-all hover:bg-gray-800 hover:shadow-xl">
            <FaTimes size={13} />
            <span className="text-xs font-bold">Salir vista completa</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">{allClientsCache.length}</span>
          </button>
        )}
        <button onClick={fitAllMarkers} disabled={filteredMarkers.length === 0}
          className={`bg-white rounded-xl shadow-lg p-3 border border-gray-200 flex items-center gap-2 transition-all ${filteredMarkers.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl hover:scale-105"}`}>
          <FaExpand className="text-[#D3423E]" size={13} />
          <span className="text-xs font-bold text-gray-700">Centrar</span>
        </button>
        <button onClick={resetView}
          className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 flex items-center gap-2 transition-all hover:shadow-xl hover:scale-105">
          <FaMapMarkerAlt className="text-gray-500" size={13} />
          <span className="text-xs font-bold text-gray-700">Limpiar</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
        <div className="relative z-50">
          <button onClick={() => setShowViewOptions(!showViewOptions)}
            className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 flex items-center gap-2 transition-all hover:shadow-xl">
            <FaCog className="text-gray-600" size={13} />
            <span className="text-xs font-bold text-gray-700">Vista</span>
            <FaChevronDown className={`text-gray-400 transition-transform ${showViewOptions ? "rotate-180" : ""}`} size={9} />
          </button>
          {showViewOptions && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="p-2 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase px-2 py-1 tracking-wider">Capas del mapa</p>
              </div>
              <button onClick={() => setShowMunicipios(!showMunicipios)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <FaCity className="text-gray-600" size={12} />
                  <span className="text-xs font-bold text-gray-700">Límites municipales</span>
                </div>
                {showMunicipios ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
              </button>
              <button onClick={() => setShowActivePeople(!showActivePeople)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-500" size={12} />
                  <span className="text-xs font-bold text-gray-700">Personas activas</span>
                </div>
                {showActivePeople ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[220px] relative z-10">
          <p className="text-[10px] font-black text-gray-700 mb-2 uppercase flex items-center gap-1 tracking-wider">
            <FaLayerGroup size={10} /> Canales
          </p>
          <div className="space-y-1.5">
            {CHANNEL_LIST.map(channel => {
              const conf = CHANNEL_CONFIG[channel];
              const count = channelStats[channel] || 0;
              return (
                <button key={channel}
                  onClick={() => setSelectedCategories(selectedCategories === channel ? "" : channel)}
                  className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors ${selectedCategories === channel ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                  <div className="w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ backgroundColor: conf.color }}>
                    {conf.emoji}
                  </div>
                  <span className="text-gray-700 font-medium flex-1 text-left">{channel}</span>
                  {count > 0 && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{count}</span>}
                </button>
              );
            })}
          </div>

          {showMunicipios && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-700 mb-1.5 uppercase flex items-center gap-1 tracking-wider">
                <FaCity size={10} /> Municipios
              </p>
              <div className="space-y-1">
                {Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-xs px-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.accent }} />
                    <span className="text-gray-700 flex-1 font-medium">{m.name}</span>
                    <span className="text-[10px] font-black text-gray-500">{municipioGroups[m.id]?.count || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showActivePeople && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-700 mb-1.5 uppercase tracking-wider">Personal</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                    <FaUsers className="text-blue-500" size={8} />
                  </div>
                  <span className="text-gray-700 font-medium">Vendedor activo</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full border-2 border-orange-500 bg-white flex items-center justify-center">
                    <FaTruck className="text-orange-500" size={8} />
                  </div>
                  <span className="text-gray-700 font-medium">Repartidor activo</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};