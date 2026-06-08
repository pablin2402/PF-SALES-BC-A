import React from "react";
import { GoogleMap, Marker, OverlayView, Polygon } from "@react-google-maps/api";
import { FaMapMarkerAlt, FaBuilding, FaUser, FaTimes } from "react-icons/fa";
import { getChannelConfig } from "../../utils/ClientMarkerIcons";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";
import { MAP_STYLE_MODERN, CONTAINER_STYLE } from "../../utils/MapDetails";
import { MapSkeleton } from "../../utils/MapSkeleton";
import deliveryIcon from "../../icons/entrega-rapida.png";
import vendedoraIcon from "../../icons/vendedora.png";

export const MapGoogleMap = ({
  isLoaded, center, mapZoom, mapRef,
  showMunicipios, selectedMunicipio, setSelectedMunicipio, fitMunicipio,
  filteredMarkers, markerIcons, selectedClient, setSelectedClient,
  showActivePeople, locations,
  navigate,
}) => {
  const goToClientDetails = (client) => navigate(`/client/${client._id}`, { state: { client } });

  if (!isLoaded) return <MapSkeleton />;

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={mapZoom}
      onLoad={map => { mapRef.current = map; }}
      onClick={() => setSelectedClient(null)}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: MAP_STYLE_MODERN,
      }}
    >
      {/* Municipio polygons */}
      {showMunicipios && Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
        <React.Fragment key={m.id}>
          <Polygon
            paths={m.paths}
            options={{
              fillColor: m.fillColor,
              fillOpacity: selectedMunicipio === m.id ? 0.16 : m.fillOpacity,
              strokeColor: m.strokeColor,
              strokeOpacity: m.strokeOpacity,
              strokeWeight: selectedMunicipio === m.id ? 2.5 : m.strokeWeight,
              clickable: true,
            }}
            onClick={() => {
              setSelectedMunicipio(selectedMunicipio === m.id ? "" : m.id);
              if (selectedMunicipio !== m.id) fitMunicipio(m.id);
            }}
          />
          <OverlayView position={m.center} mapPaneName={OverlayView.OVERLAY_LAYER}>
            <div className="pointer-events-none select-none" style={{
              transform: "translate(-50%, -50%)",
              color: "#475569", fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
              textTransform: "uppercase",
              textShadow: "1px 1px 3px white, -1px -1px 3px white, 1px -1px 3px white, -1px 1px 3px white",
              opacity: 0.8,
            }}>
              {m.name}
            </div>
          </OverlayView>
        </React.Fragment>
      ))}

      {/* Client markers */}
      {filteredMarkers.map((location, index) => {
        if (!location.client_location?.latitud || !location.client_location?.longitud) return null;
        return (
          <Marker
            key={location._id || index}
            position={{ lat: Number(location.client_location.latitud), lng: Number(location.client_location.longitud) }}
            icon={markerIcons[location._id]}
            onClick={() => setSelectedClient(location)}
            zIndex={selectedClient?._id === location._id ? 1000 : 1}
          />
        );
      })}

      {/* Selected client popup */}
      {selectedClient?.client_location && (
        <OverlayView
          position={{ lat: Number(selectedClient.client_location.latitud), lng: Number(selectedClient.client_location.longitud) }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height + 28) })}
        >
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ minWidth: 220, maxWidth: 260 }}>
            <div className="px-3 py-2.5 flex items-center gap-2.5 text-white"
              style={{ backgroundColor: getChannelConfig(selectedClient.userCategory).color }}>
              <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center text-base">
                {getChannelConfig(selectedClient.userCategory).emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm truncate">{selectedClient.name} {selectedClient.lastName}</div>
                <div className="text-[10px] font-semibold opacity-90">{selectedClient.userCategory || "Sin canal"}</div>
              </div>
              <button onClick={() => setSelectedClient(null)}
                className="w-6 h-6 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <FaTimes size={10} />
              </button>
            </div>
            <div className="p-3 space-y-1.5">
              {selectedClient.company && (
                <div className="flex items-start gap-1.5 text-xs text-gray-700">
                  <FaBuilding className="text-gray-400 mt-0.5 flex-shrink-0" size={10} />
                  <span className="break-words">{selectedClient.company}</span>
                </div>
              )}
              {selectedClient.client_location?.direction && (
                <div className="flex items-start gap-1.5 text-xs text-gray-600">
                  <FaMapMarkerAlt className="text-[#D3423E] mt-0.5 flex-shrink-0" size={10} />
                  <span className="break-words">{selectedClient.client_location.direction}</span>
                </div>
              )}
              {selectedClient.sales_id && (
                <div className="flex items-start gap-1.5 text-xs text-gray-500">
                  <FaUser className="text-gray-400 mt-0.5 flex-shrink-0" size={10} />
                  <span className="break-words">{selectedClient.sales_id?.fullName} {selectedClient.sales_id?.lastName}</span>
                </div>
              )}
              <button onClick={() => goToClientDetails(selectedClient)}
                className="w-full mt-2 bg-gradient-to-r from-[#D3423E] to-red-600 text-white text-xs font-black py-2 rounded-xl hover:shadow-md transition-all">
                Ver detalle
              </button>
            </div>
          </div>
        </OverlayView>
      )}

      {/* Active people (salesmen + delivery) */}
      {showActivePeople && locations.map(loc => {
        const hasDelivery = loc.delivery && typeof loc.delivery === "object";
        const hasSalesman = loc.salesManId && typeof loc.salesManId === "object";
        const initials = hasSalesman
          ? ((loc.salesManId.fullName?.slice(0, 1) || "X") + (loc.salesManId.lastName?.slice(0, 1) || "X")).toUpperCase()
          : hasDelivery
            ? ((loc.delivery.fullName?.slice(0, 1) || "X") + (loc.delivery.lastName?.slice(0, 1) || "X")).toUpperCase()
            : "";
        const name = hasSalesman
          ? `${loc.salesManId.fullName} ${loc.salesManId.lastName}`
          : hasDelivery ? `${loc.delivery.fullName} ${loc.delivery.lastName}` : "";

        return (
          <OverlayView key={loc._id}
            position={{ lat: parseFloat(loc.latitud), lng: parseFloat(loc.longitud) }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative flex flex-col items-center group cursor-pointer">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                {name}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
                <div className={`relative rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 ${hasSalesman ? "border-blue-500 bg-white" : "border-orange-500 bg-white"}`}>
                  <img src={hasSalesman ? vendedoraIcon : deliveryIcon} alt={hasSalesman ? "vendedor" : "repartidor"} className="w-8 h-8" />
                </div>
                {(hasDelivery || hasSalesman) && (
                  <div className={`absolute -top-1 -right-1 z-10 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white ${hasSalesman ? "bg-blue-500" : "bg-orange-500"}`}>
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </OverlayView>
        );
      })}
    </GoogleMap>
  );
};