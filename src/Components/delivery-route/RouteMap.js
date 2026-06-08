import React from "react";
import { GoogleMap, Marker, DirectionsRenderer, OverlayView, Polygon } from "@react-google-maps/api";
import { buildMarkerIcon, CHANNEL_CONFIG, CHANNEL_LIST } from "../../utils/ClientMarkerIcons";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEPOT } from "../../utils/MapDetails";
import { getTripColor } from "../../utils/RouteOptimizer";
import { buildDepotIcon, buildOrderedChannelMarker } from "../../constants/routeConfigs";
import { MapSkeleton } from "./RouteSkeletons";

export const RouteMap = ({
  isLoaded, center, mapZoom, mapRef,
  showMunicipios, selectedMunicipio, setSelectedMunicipio, fitMunicipio,
  filteredMarkers, selectedMarkers, selectedTripView,
  iconsReady, handleMarkerClick, handleDelete,
  directionsResponse,
}) => {
  if (!isLoaded) return <MapSkeleton />;

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE} center={center} zoom={mapZoom}
      onLoad={map => { mapRef.current = map; }}
      options={{ disableDefaultUI: true, zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, styles: MAP_STYLE_MODERN }}>

      {showMunicipios && Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
        <React.Fragment key={m.id}>
          <Polygon paths={m.paths} options={{
            fillColor: m.fillColor, fillOpacity: selectedMunicipio === m.id ? 0.16 : m.fillOpacity,
            strokeColor: m.strokeColor, strokeOpacity: m.strokeOpacity,
            strokeWeight: selectedMunicipio === m.id ? 2.5 : m.strokeWeight, clickable: true,
          }} onClick={() => { setSelectedMunicipio(selectedMunicipio === m.id ? "" : m.id); if (selectedMunicipio !== m.id) fitMunicipio(m.id); }} />
          <OverlayView position={m.center} mapPaneName={OverlayView.OVERLAY_LAYER}>
            <div className="pointer-events-none select-none" style={{
              transform: "translate(-50%, -50%)", color: "#475569", fontWeight: 700, fontSize: 11,
              letterSpacing: 0.3, textTransform: "uppercase",
              textShadow: "1px 1px 3px white, -1px -1px 3px white, 1px -1px 3px white, -1px 1px 3px white", opacity: 0.75,
            }}>{m.name}</div>
          </OverlayView>
        </React.Fragment>
      ))}

      <Marker position={DEPOT} icon={window.google ? { url: buildDepotIcon(), scaledSize: new window.google.maps.Size(56, 56), anchor: new window.google.maps.Point(28, 28) } : null} title="Depósito" zIndex={2000} />

      {filteredMarkers.map((loc, i) => {
        const cl = loc.id_client?.client_location || loc.client_location;
        if (!cl?.latitud || !cl?.longitud) return null;
        if (selectedMarkers.some(m => m._id === loc._id)) return null;
        const ch = loc.id_client?.userCategory || loc.userCategory;
        const icon = window.google && iconsReady ? buildMarkerIcon(ch, window.google.maps, false) : null;
        return <Marker key={`a-${loc._id || i}`} position={{ lat: Number(cl.latitud), lng: Number(cl.longitud) }} icon={icon} onClick={() => handleMarkerClick(loc)} zIndex={1} />;
      })}

      {selectedMarkers.map((c, i) => {
        if (!c.client_location?.latitud || !c.client_location?.longitud) return null;
        const tc = selectedTripView ? getTripColor(selectedTripView) : "#D3423E";
        return <Marker key={`s-${c._id}`}
          position={{ lat: Number(c.client_location.latitud), lng: Number(c.client_location.longitud) }}
          icon={window.google ? { url: buildOrderedChannelMarker(i, c.userCategory, tc), scaledSize: new window.google.maps.Size(52, 52), anchor: new window.google.maps.Point(26, 26) } : null}
          onClick={() => handleDelete(c._id)} zIndex={1000 + i} />;
      })}

      {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{
        polylineOptions: { strokeColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E", strokeOpacity: 0.85, strokeWeight: 5 }, suppressMarkers: true,
      }} />}
    </GoogleMap>
  );
};