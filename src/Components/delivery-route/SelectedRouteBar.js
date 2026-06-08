import React from "react";
import { FaBoxes, FaTrash } from "react-icons/fa";
import { getChannelConfig } from "../../utils/ClientMarkerIcons";
import { calculateOrderPacking, getTripColor } from "../../utils/RouteOptimizer";

export const SelectedRouteBar = ({
  selectedMarkers, selectedTripView, currentLoad, totalAmount,
  moveClient, panToLocation, handleDelete,
}) => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gray-700 uppercase">{selectedTripView ? `Viaje ${selectedTripView}` : "Ruta"}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E" }}>
            {selectedMarkers.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1"><FaBoxes size={10} className="text-gray-400" />{currentLoad}</p>
          <p className="text-xs font-bold text-[#D3423E]">Bs. {totalAmount.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex overflow-x-auto space-x-2 pb-1">
        {selectedMarkers.map((client, idx) => {
          const pk = calculateOrderPacking(client);
          const ch = getChannelConfig(client.userCategory);
          const color = selectedTripView ? getTripColor(selectedTripView) : "#D3423E";
          return (
            <div key={client._id} className="flex-shrink-0 flex items-center gap-2 p-2 border-2 bg-red-50/50 rounded-xl min-w-[240px]" style={{ borderColor: color }}>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveClient(idx, "up")} disabled={idx === 0}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${idx === 0 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"}`}>▲</button>
                <button onClick={() => moveClient(idx, "down")} disabled={idx === selectedMarkers.length - 1}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${idx === selectedMarkers.length - 1 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"}`}>▼</button>
              </div>
              <div className="w-8 h-8 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>{idx + 1}</div>
              <div onClick={() => panToLocation(client)} className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">{ch.emoji}</span>
                  <p className="text-xs font-bold text-gray-900 truncate">{client.name} {client.lastName}</p>
                </div>
                <p className="text-[10px] text-gray-500 truncate">#{client.receiveNumber} · {pk.physicalBoxes}c · {pk.totalBottles}b</p>
              </div>
              <button onClick={() => handleDelete(client._id)} className="w-7 h-7 text-red-500 hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><FaTrash size={11} /></button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);