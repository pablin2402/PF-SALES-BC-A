import React, { useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_API_KEY } from "../config";

import { useActivity } from "../hooks/useActivity";
import { ActivitySidebar } from "../Components/activity/ActivitySidebar";
import { ActivityMap } from "../Components/activity/ActivityMap";

export default function ActivityRouteComponent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const act = useActivity();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  useEffect(() => {
    if (isLoaded && act.salesData.length > 1) {
      act.buildDirections(act.salesData);
    }
  }, [act.salesData, isLoaded]);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <ActivitySidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        vendedores={act.vendedores}
        selectedSaler={act.selectedSaler}
        setSelectedSaler={act.setSelectedSaler}
        startDate={act.startDate}
        setStartDate={act.setStartDate}
        onFilter={() => { act.setPage(1); act.fetchActivities(act.selectedSaler, 1); }}
        searchTerm={act.searchTerm}
        setSearchTerm={act.setSearchTerm}
        loading={act.loading}
        filteredData={act.filteredData}
        selectedClientId={act.selectedClientId}
        findLocation={act.findLocation}
        salesData={act.salesData}
        visitsEnCurso={act.visitsEnCurso}
        visitsCompletadas={act.visitsCompletadas}
        page={act.page}
        setPage={act.setPage}
        totalPages={act.totalPages}
      />

      <div className="flex-1 h-full relative bg-gray-200">
        <ActivityMap
          isLoaded={isLoaded}
          center={act.center}
          mapZoom={act.mapZoom}
          salesData={act.salesData}
          directionsResponse={act.directionsResponse}
        />

        <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-xs">
          <p className="text-[10px] font-black text-gray-700 mb-2 uppercase tracking-wider">Leyenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-[#D3423E] flex-shrink-0" />
              <span className="text-gray-700 font-medium">Ubicación real visitada</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="text-gray-700 font-medium">Ubicación del cliente</span>
            </div>
            {act.directionsResponse && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-1 bg-[#D3423E] flex-shrink-0 rounded" />
                <span className="text-gray-700 font-medium">Ruta recorrida</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}