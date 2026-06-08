import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_API_KEY } from "../config";

import { useLocalization } from "../hooks/useLocalization";
import { MapSidebar } from "../Components/localization/MapSidebar";
import { MapGoogleMap } from "../Components/localization/MapGoogleMap";
import { MapControls } from "../Components/localization/MapControls";

export default function LocalizationView() {
  const navigate = useNavigate();
  const loc = useLocalization();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMunicipios, setShowMunicipios] = useState(true);
  const [showActivePeople, setShowActivePeople] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <MapSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        searchInput={loc.searchInput}
        setSearchInput={loc.setSearchInput}
        loading={loc.loading}
        salesManData={loc.salesManData}
        selectedSalesmen={loc.selectedSalesmen}
        setSelectedSalesmen={loc.setSelectedSalesmen}
        selectedCategories={loc.selectedCategories}
        setSelectedCategories={loc.setSelectedCategories}
        channelStats={loc.channelStats}
        selectedMunicipio={loc.selectedMunicipio}
        setSelectedMunicipio={loc.setSelectedMunicipio}
        fitMunicipio={loc.fitMunicipio}
        municipioGroups={loc.municipioGroups}
        sortBy={loc.sortBy}
        setSortBy={loc.setSortBy}
        hasLocationOnly={loc.hasLocationOnly}
        setHasLocationOnly={loc.setHasLocationOnly}
        hasActiveFilters={loc.hasActiveFilters}
        clearFilters={loc.clearFilters}
        sidebarClients={loc.sidebarClients}
        selectedClient={loc.selectedClient}
        findLocation={loc.findLocation}
        viewAllMode={loc.viewAllMode}
        allClientsCache={loc.allClientsCache}
        total={loc.total}
        page={loc.page}
        setPage={loc.setPage}
        limit={loc.limit}
        setLimit={loc.setLimit}
        totalPages={loc.totalPages}
        visiblePages={loc.visiblePages}
        activeSalesmen={loc.activeSalesmen}
        activeDeliveries={loc.activeDeliveries}
      />

      <div className="flex-1 h-full relative bg-gray-200">
        <MapGoogleMap
          isLoaded={isLoaded}
          center={loc.center}
          mapZoom={loc.mapZoom}
          mapRef={loc.mapRef}
          showMunicipios={showMunicipios}
          selectedMunicipio={loc.selectedMunicipio}
          setSelectedMunicipio={loc.setSelectedMunicipio}
          fitMunicipio={loc.fitMunicipio}
          filteredMarkers={loc.filteredMarkers}
          markerIcons={loc.markerIcons}
          selectedClient={loc.selectedClient}
          setSelectedClient={loc.setSelectedClient}
          showActivePeople={showActivePeople}
          locations={loc.locations}
          navigate={navigate}
        />

        <MapControls
          viewAllMode={loc.viewAllMode}
          loadAllClients={loc.loadAllClients}
          exitViewAllMode={loc.exitViewAllMode}
          allClientsCache={loc.allClientsCache}
          loadingAll={loc.loadingAll}
          filteredMarkers={loc.filteredMarkers}
          fitAllMarkers={loc.fitAllMarkers}
          resetView={loc.resetView}
          showMunicipios={showMunicipios}
          setShowMunicipios={setShowMunicipios}
          showActivePeople={showActivePeople}
          setShowActivePeople={setShowActivePeople}
          selectedCategories={loc.selectedCategories}
          setSelectedCategories={loc.setSelectedCategories}
          channelStats={loc.channelStats}
          municipioGroups={loc.municipioGroups}
        />
      </div>
    </div>
  );
}