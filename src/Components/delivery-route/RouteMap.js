import React, { useMemo } from "react";
import { GoogleMap, Marker, Polyline, OverlayView, Polygon } from "@react-google-maps/api";
import { buildMarkerIcon } from "../../utils/ClientMarkerIcons";
import { MUNICIPIOS_COCHABAMBA } from "../../utils/CochabambaMunicipios";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEPOT } from "../../utils/MapDetails";
import { getTripColor } from "../../utils/RouteOptimizer";
import { buildDepotIcon, buildOrderedChannelMarker } from "../../constants/routeConfigs";
import { MapSkeleton } from "./RouteSkeletons";

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const mixHex = (hexA, hexB, t) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

export const RouteMap = ({
  isLoaded, center, mapZoom, mapRef,
  showMunicipios, selectedMunicipio, setSelectedMunicipio, fitMunicipio,
  filteredMarkers, selectedMarkers, selectedTripView,
  iconsReady, handleMarkerClick, handleDelete,
  directionsResponse,
}) => {
  const routeColor = selectedTripView ? getTripColor(selectedTripView) : "#D3423E";
  const hasZoneFilter = Boolean(selectedMunicipio);
  const routeActive = Boolean(directionsResponse);

  const routeLegs = useMemo(() => {
    if (!directionsResponse?.routes?.[0]?.legs) return [];
    const legs = directionsResponse.routes[0].legs;
    const n = Math.max(legs.length - 1, 1);
    return legs.map((leg, i) => ({
      path: leg.steps.flatMap((s) => s.path || []),
      color: mixHex("#FCA5A5", routeColor, legs.length === 1 ? 1 : i / n),
      key: `${i}-${leg.start_address ?? i}`,
    }));
  }, [directionsResponse, routeColor]);

  const fullPath = useMemo(() => routeLegs.flatMap((l) => l.path), [routeLegs]);

  if (!isLoaded) return <MapSkeleton />;

  const arrowIcon = {
    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 2.6,
    strokeColor: "#FFFFFF",
    strokeWeight: 1.4,
    fillColor: routeColor,
    fillOpacity: 1,
  };

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={mapZoom}
      onLoad={(map) => { mapRef.current = map; }}
      options={{
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: "greedy",
        styles: MAP_STYLE_MODERN,
      }}
    >
      {showMunicipios && Object.values(MUNICIPIOS_COCHABAMBA).map((m) => {
        const isSelected = selectedMunicipio === m.id;
        const isDimmed = (hasZoneFilter && !isSelected) || routeActive;
        return (
          <React.Fragment key={m.id}>
            <Polygon
              paths={m.paths}
              options={{
                fillColor: m.fillColor,
                fillOpacity: isSelected && !routeActive ? 0.18 : isDimmed ? 0.02 : m.fillOpacity,
                strokeColor: isSelected ? m.strokeColor : "#94A3B8",
                strokeOpacity: isDimmed ? 0.18 : m.strokeOpacity,
                strokeWeight: isSelected ? 1.5 : 1,
                clickable: !routeActive,
              }}
              onClick={() => {
                setSelectedMunicipio(isSelected ? "" : m.id);
                if (!isSelected) fitMunicipio(m.id);
              }}
            />
            <OverlayView position={m.center} mapPaneName={OverlayView.OVERLAY_LAYER}>
              <div
                className="pointer-events-none select-none"
                style={{
                  transform: "translate(-50%, -50%)",
                  background: isSelected && !routeActive ? m.strokeColor : "rgba(255,255,255,0.92)",
                  color: isSelected && !routeActive ? "#FFFFFF" : "#475569",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: 999,
                  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.18)",
                  opacity: isDimmed ? 0.25 : 0.95,
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </div>
            </OverlayView>
          </React.Fragment>
        );
      })}

      <Marker
        position={DEPOT}
        icon={window.google ? {
          url: buildDepotIcon(),
          scaledSize: new window.google.maps.Size(56, 56),
          anchor: new window.google.maps.Point(28, 28),
        } : null}
        title="Depósito"
        zIndex={2000}
      />

      {filteredMarkers.map((loc, i) => {
        const cl = loc.id_client?.client_location || loc.client_location;
        if (!cl?.latitud || !cl?.longitud) return null;
        if (selectedMarkers.some((m) => m._id === loc._id)) return null;
        const ch = loc.id_client?.userCategory || loc.userCategory;
        const icon = window.google && iconsReady ? buildMarkerIcon(ch, window.google.maps, false) : null;
        return (
          <Marker
            key={`a-${loc._id || i}`}
            position={{ lat: Number(cl.latitud), lng: Number(cl.longitud) }}
            icon={icon}
            title={loc.id_client?.name ? `${loc.id_client.name} ${loc.id_client.lastName ?? ""}`.trim() : undefined}
            onClick={() => handleMarkerClick(loc)}
            opacity={routeActive ? 0.45 : 1}
            zIndex={1}
          />
        );
      })}

      {selectedMarkers.map((c, i) => {
        if (!c.client_location?.latitud || !c.client_location?.longitud) return null;
        return (
          <Marker
            key={`s-${c._id}`}
            position={{ lat: Number(c.client_location.latitud), lng: Number(c.client_location.longitud) }}
            icon={window.google ? {
              url: buildOrderedChannelMarker(i, c.userCategory, routeColor),
              scaledSize: new window.google.maps.Size(52, 52),
              anchor: new window.google.maps.Point(26, 26),
            } : null}
            title={`Parada ${i + 1} — clic para quitar de la ruta`}
            onClick={() => handleDelete(c._id)}
            zIndex={1000 + i}
          />
        );
      })}

      {fullPath.length > 0 && (
        <Polyline
          path={fullPath}
          options={{ strokeColor: "#FFFFFF", strokeOpacity: 1, strokeWeight: 10, zIndex: 10 }}
        />
      )}

      {routeLegs.map((leg) => (
        <Polyline
          key={leg.key}
          path={leg.path}
          options={{
            strokeColor: leg.color,
            strokeOpacity: 0.95,
            strokeWeight: 5,
            zIndex: 11,
            icons: [{ icon: { ...arrowIcon, fillColor: leg.color }, offset: "30px", repeat: "120px" }],
          }}
        />
      ))}
    </GoogleMap>
  );
};