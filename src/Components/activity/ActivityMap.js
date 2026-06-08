import React from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { MAP_STYLE_MODERN, CONTAINER_STYLE } from "../../utils/MapDetails";
import { ActivityMapSkeleton } from "./ActivitySkeletons";
import tiendaIcon2 from "../../icons/tienda.png";

export const ActivityMap = ({
  isLoaded, center, mapZoom, salesData, directionsResponse,
}) => {
  if (!isLoaded) return <ActivityMapSkeleton />;

  return (
    <GoogleMap
      mapContainerStyle={CONTAINER_STYLE}
      center={center}
      zoom={mapZoom}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: MAP_STYLE_MODERN,
      }}
    >
      {salesData.length > 0 && salesData.map((client, index) => {
        const latReal = client.latitude;
        const lngReal = client.longitude;
        const latExp = client.clientName.client_location.latitud;
        const lngExp = client.clientName.client_location.longitud;

        const svgIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="70" height="70" xmlns="http://www.w3.org/2000/svg">
            <defs><clipPath id="circleView"><circle cx="35" cy="35" r="26" /></clipPath></defs>
            <circle cx="35" cy="35" r="28" fill="white" stroke="#D3423E" strokeWidth="2" />
            <image href="${tiendaIcon2}" x="9" y="9" width="52" height="52" clip-path="url(#circleView)" />
            <circle cx="56" cy="14" r="10" fill="white" />
            <circle cx="56" cy="14" r="9" fill="#10b981" />
            <path d="M52.5 14l3 3.5L60 10" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        `)}`;

        return (
          <React.Fragment key={index}>
            <Marker
              position={{ lat: latExp, lng: lngExp }}
              icon={{ url: tiendaIcon2, scaledSize: new window.google.maps.Size(42, 42) }}
            />
            <Marker
              position={{ lat: latReal, lng: lngReal }}
              icon={{ url: svgIcon, scaledSize: new window.google.maps.Size(70, 70) }}
            />
          </React.Fragment>
        );
      })}

      {directionsResponse && (
        <DirectionsRenderer
          directions={directionsResponse}
          options={{
            polylineOptions: { strokeColor: "#D3423E", strokeOpacity: 0.8, strokeWeight: 5 },
            suppressMarkers: true,
          }}
        />
      )}
    </GoogleMap>
  );
};