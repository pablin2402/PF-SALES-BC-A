import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_API_KEY } from "../config";

import { useDeliveryRoute } from "../hooks/useDeliveryRoute";
import { RouteSidebar } from "../Components/delivery-route/RouteSidebar";
import { RouteMap } from "../Components/delivery-route/RouteMap";
import { RouteControls } from "../Components/delivery-route/RouteControls";
import { PlanPanel } from "../Components/delivery-route/PlanPanel";
import { PedidosPanel } from "../Components/delivery-route/PedidosPanel";
import { SelectedRouteBar } from "../Components/delivery-route/SelectedRouteBar";
import { CreateRouteModal } from "../Components/delivery-route/CreateRouteModal";
import { PlanSkeletonLoader } from "../Components/delivery-route/RouteSkeletons";
import AlertModal from "../Components/modal/AlertModal";
import { TABS, GOOGLE_MAPS_LIBRARIES } from "../constants/routeConfigs";

export default function DeliveryRouteView() {
  const navigate = useNavigate();
  const rt = useDeliveryRoute();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMunicipios, setShowMunicipios] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    if (rt.selectedMarkers.length > 1) {
      const pts = rt.selectedMarkers.filter(c => c.client_location);
      if (pts.length < 2) { rt.setDirectionsResponse(null); return; }
      const origin = { lat: Number(pts[0].client_location.latitud), lng: Number(pts[0].client_location.longitud) };
      const dest = { lat: Number(pts[pts.length - 1].client_location.latitud), lng: Number(pts[pts.length - 1].client_location.longitud) };
      const waypoints = pts.slice(1, -1).map(c => ({ location: { lat: Number(c.client_location.latitud), lng: Number(c.client_location.longitud) }, stopover: true }));
      new window.google.maps.DirectionsService().route(
        { origin, destination: dest, waypoints, travelMode: window.google.maps.TravelMode.DRIVING, optimizeWaypoints: false },
        (result, status) => { if (status === "OK") rt.setDirectionsResponse(result); }
      );
    } else { rt.setDirectionsResponse(null); }
  }, [rt.selectedMarkers, isLoaded]);

  const goToClientDetails = (client) => navigate(`/client/${client._id}`, { state: { client } });

  const sidebarContent = rt.isOptimizing ? (
    <PlanSkeletonLoader />
  ) : rt.optimizationResult && rt.activeTab === TABS.PLAN ? (
    <PlanPanel
      optimizationResult={rt.optimizationResult}
      selectedTripView={rt.selectedTripView}
      onViewTrip={rt.handleViewTrip}
      onClearOptimization={() => { rt.setOptimizationResult(null); rt.setSelectedTripView(null); rt.setActiveTab(TABS.PEDIDOS); }}
      onCreate={() => rt.setIsOpen(true)}
    />
  ) : (
    <PedidosPanel
      loading={rt.loading} markers={rt.filteredMarkers} totalOrders={rt.totalOrders}
      isClientSelected={rt.isClientSelected} panToLocation={rt.panToLocation}
      goToClientDetails={goToClientDetails} handleDelete={rt.handleDelete}
      handleMarkerClick={rt.handleMarkerClick} page={rt.page} setPage={rt.setPage}
      totalPages={rt.totalPages} pageSize={rt.pageSize} setPageSize={rt.setPageSize}
      selectedMunicipio={rt.selectedMunicipio}
    />
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <RouteSidebar
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
        vendedores={rt.vendedores} selectedSaler={rt.selectedSaler}
        onSalerChange={e => { rt.setSelectedSaler(e.target.value); rt.setPage(1); rt.setOptimizationResult(null); rt.setCustomCapacity(null); rt.setActiveTab(TABS.PEDIDOS); }}
        totalOrders={rt.totalOrders} truckCapacity={rt.truckCapacity}
        currentLoad={rt.currentLoad} utilizationPct={rt.utilizationPct} isOverCapacity={rt.isOverCapacity}
        searchTerm={rt.searchTerm} setSearchTerm={rt.setSearchTerm} onSearch={rt.loadMarkersFromAPI}
        selectedMunicipio={rt.selectedMunicipio} setSelectedMunicipio={rt.setSelectedMunicipio}
        fitMunicipio={rt.fitMunicipio} municipioGroups={rt.municipioGroups}
        canOptimize={rt.canOptimize} isOptimizing={rt.isOptimizing} onOptimize={rt.handleOptimize}
        markers={rt.markers} selectedMarkers={rt.selectedMarkers}
        onCreateManual={() => rt.setIsOpen(true)}
        optimizationResult={rt.optimizationResult} activeTab={rt.activeTab} setActiveTab={rt.setActiveTab}
      >
        {sidebarContent}
      </RouteSidebar>

      <div className="flex-1 h-full relative bg-gray-200">
        <RouteMap
          isLoaded={isLoaded} center={rt.center} mapZoom={rt.mapZoom} mapRef={rt.mapRef}
          showMunicipios={showMunicipios} selectedMunicipio={rt.selectedMunicipio}
          setSelectedMunicipio={rt.setSelectedMunicipio} fitMunicipio={rt.fitMunicipio}
          filteredMarkers={rt.filteredMarkers} selectedMarkers={rt.selectedMarkers}
          selectedTripView={rt.selectedTripView} iconsReady={rt.iconsReady}
          handleMarkerClick={rt.handleMarkerClick} handleDelete={rt.handleDelete}
          directionsResponse={rt.directionsResponse}
        />

        <RouteControls
          mapRef={rt.mapRef} showMunicipios={showMunicipios} setShowMunicipios={setShowMunicipios}
          filteredMarkers={rt.filteredMarkers} selectedMarkers={rt.selectedMarkers}
          fitToMarkers={rt.fitToMarkers} optimizationResult={rt.optimizationResult}
          municipioGroups={rt.municipioGroups}
        />

        {rt.selectedMarkers.length > 0 && (
          <SelectedRouteBar
            selectedMarkers={rt.selectedMarkers} selectedTripView={rt.selectedTripView}
            currentLoad={rt.currentLoad} totalAmount={rt.totalAmount}
            moveClient={rt.moveClient} panToLocation={rt.panToLocation} handleDelete={rt.handleDelete}
          />
        )}
      </div>

      <CreateRouteModal
        isOpen={rt.isOpen} onClose={() => rt.setIsOpen(false)}
        optimizationResult={rt.optimizationResult} selectedMarkers={rt.selectedMarkers}
        totalAmount={rt.totalAmount} currentLoad={rt.currentLoad} truckCapacity={rt.truckCapacity}
        vendedores={rt.vendedores} selectedSaler={rt.selectedSaler}
        routeName={rt.routeName} setRouteName={rt.setRouteName}
        startDate={rt.startDate} setStartDate={rt.setStartDate}
        endDate={rt.endDate} setEndDate={rt.setEndDate}
        creating={rt.creating} validateForm={rt.validateForm} handleCreateRoute={rt.handleCreateRoute}
      />

      <AlertModal show={rt.alertModal} onClose={() => rt.setAlertModal(false)} message={rt.alertMessage} />
    </div>
  );
}