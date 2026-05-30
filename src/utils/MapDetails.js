import {
    FaUser, FaIdCard, FaMapMarkerAlt, FaCheck
} from "react-icons/fa";
export const MAP_STYLE_MODERN = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f3" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },

  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e3ece3" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#8aa88a" }] },

  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#8a4a48" }] },

  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fafafa" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0d9d8" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e8c4c2" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },

  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9dcea" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7a9bb5" }] },

  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#eef0ec" }] },
];
export const DEFAULT_CENTER = { lat: -17.3835, lng: -66.1568 };
export const DEFAULT_ZOOM = 12;
export const VIEW_ALL_LIMIT = 500;
export const DEFAULT_TRUCK_CAPACITY = 80;
export const DEPOT = { lat: -17.3835, lng: -66.1568 };
export const CONTAINER_STYLE = { width: "100%", height: "100%" };
export const CITIES = [
    { value: "TOTAL CBB", label: "Cochabamba" },
    { value: "TOTAL SC", label: "Santa Cruz" },
    { value: "TOTAL LP", label: "La Paz" },
    { value: "TOTAL OR", label: "Oruro" },
];

export const STEPS = [
    { id: 1, label: "Datos personales", icon: FaUser },
    { id: 2, label: "Documento", icon: FaIdCard },
    { id: 3, label: "Ubicación", icon: FaMapMarkerAlt },
    { id: 4, label: "Confirmar", icon: FaCheck },
];
export const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";
