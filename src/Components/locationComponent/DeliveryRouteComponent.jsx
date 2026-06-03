import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { GoogleMap, Marker, InfoWindow, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { FaMapMarkerAlt, FaCalendarAlt, FaTrash, FaChevronLeft, FaChevronRight, FaCheckCircle, FaPlayCircle, FaRegClock, FaEye, FaChevronDown, FaFilter, FaClock, FaTruck, FaRoad } from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import { motion, AnimatePresence } from "framer-motion";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM, FALLBACK_IMAGE } from "../../utils/MapDetails";
import depotLogo from "../../icons/bar.png";

const STATUS_CONFIG = {
  "Por iniciar": {
    label: "Por iniciar",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    icon: FaRegClock,
    iconColor: "text-yellow-500",
    progressColor: "bg-yellow-400"
  },
  "En progreso": {
    label: "En progreso",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    icon: FaPlayCircle,
    iconColor: "text-blue-500",
    progressColor: "bg-blue-500"
  },
  "Finalizado": {
    label: "Finalizado",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    icon: FaCheckCircle,
    iconColor: "text-green-500",
    progressColor: "bg-green-500"
  }
};
const DEPOT = { lat: -17.389974, lng: -66.163210 };

const VISIT_STATUS_CONFIG = {
  "LLego al destino": { color: "bg-green-500", text: "Llegó al destino" },
  "Pedido entregado": { color: "bg-green-600", text: "Pedido entregado" },
  "En camino": { color: "bg-yellow-500", text: "En camino" },
  "Sin visitar": { color: "bg-gray-400", text: "Sin visitar" }
};



const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const DeliveryRouteCardSkeleton = ({ idx }) => (
  <div
    className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden"
    style={{ opacity: 1 - idx * 0.12 }}
  >
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <SBox className="h-4 w-40" />
          <SBox className="h-3 w-28" />
        </div>
        <SBox className="h-6 w-24 rounded-full flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <SBox className="h-3 w-24" />
        <SBox className="h-3 w-4" />
        <SBox className="h-3 w-24" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <SBox className="h-3 w-16" />
          <SBox className="h-3 w-10" />
        </div>
        <SBox className="h-2 w-full rounded-full" />
      </div>
    </div>
  </div>
);

const DeliveryRouteSidebarSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <DeliveryRouteCardSkeleton key={i} idx={i} />
    ))}
  </div>
);

const DeliveryRouteMapSkeleton = () => (
  <div className="w-full h-full relative overflow-hidden bg-gray-100">
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite",
      }}
    />

    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6b7280" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>

    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#9ca3af" strokeWidth="3" />
      <line x1="60%" y1="0" x2="55%" y2="100%" stroke="#9ca3af" strokeWidth="5" />
      <line x1="0" y1="40%" x2="100%" y2="38%" stroke="#9ca3af" strokeWidth="3" />
      <line x1="0" y1="65%" x2="100%" y2="67%" stroke="#9ca3af" strokeWidth="5" />
      <line x1="45%" y1="0" x2="50%" y2="60%" stroke="#9ca3af" strokeWidth="2" />
    </svg>

    <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M 20% 75% Q 35% 55% 50% 50% Q 65% 45% 80% 30%"
        fill="none"
        stroke="#D3423E"
        strokeWidth="4"
        strokeDasharray="8 4"
        strokeLinecap="round"
      />
    </svg>

    {[
      { x: "20%", y: "75%" },
      { x: "50%", y: "50%" },
      { x: "80%", y: "30%" },
      { x: "35%", y: "58%" },
      { x: "65%", y: "40%" },
    ].map((pos, i) => (
      <div
        key={i}
        className="absolute"
        style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: i === 0 ? "#10b981" : i === 1 ? "#eab308" : "#9ca3af",
            animation: `shimmer ${1.2 + i * 0.15}s infinite`,
          }}
        >
          {i + 1}
        </div>
      </div>
    ))}

    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#D3423E]" />
        <p className="text-gray-600 font-semibold text-sm">Cargando mapa...</p>
      </div>
    </div>

    <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-2xl shadow-lg p-4 border border-gray-200 w-52 space-y-2.5">
      <SBox className="h-3 w-24" />
      <SBox className="h-4 w-40" />
      <SBox className="h-3 w-32" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <SBox className="h-14 rounded-lg" />
        <SBox className="h-14 rounded-lg" />
      </div>
    </div>

    <div className="absolute top-4 right-4 z-10 bg-white/90 rounded-2xl shadow-lg p-3 border border-gray-200 w-36 space-y-2.5">
      <SBox className="h-3 w-16" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <SBox className="w-5 h-5 rounded-full flex-shrink-0" />
          <SBox className="h-3 flex-1" />
        </div>
      ))}
    </div>

    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
        <div className="flex gap-2 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center gap-2 p-2 border-2 border-gray-100 rounded-xl min-w-[220px]"
              style={{ opacity: 1 - i * 0.2 }}
            >
              <SBox className="w-8 h-8 rounded-full flex-shrink-0" />
              <SBox className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SBox className="h-3 w-24" />
                <SBox className="h-2.5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
export default function DeliveryRouteComponent() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [vendedores, setVendedores] = useState([]);
  const [listRoutes, setListRoutes] = useState([]);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [selectedSaler2, setSelectedSaler2] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const mapRef = React.useRef(null);
  const buildDepotIcon = () => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><defs><filter id="depot-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="0" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="28" cy="28" r="24" fill="#111827" stroke="white" stroke-width="3" filter="url(#depot-shadow)"/><g transform="translate(15 14)" fill="white"><path d="M13 0 L0 10 L0 22 L26 22 L26 10 Z M11 22 L11 14 L15 14 L15 22" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g></svg>`)}`;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  const iconSize40 = useMemo(() => {
    if (!isLoaded || !window.google?.maps?.Size) return null;
    return new window.google.maps.Size(40, 40);
  }, [isLoaded]);

  const handleAccordionToggle = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/delivery/list",
          { id_owner: user, page: 1, limit: 1000, searchTerm: "" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendedores(response.data.data || []);
      } catch (error) {
        console.error("Error fetching repartidores:", error);
        setVendedores([]);
      }
    };
    fetchVendedores();
  }, [user, token]);

  const loadRoute = useCallback(async (sDate, eDate) => {
    setLoading(true);
    try {
      const status = selectedStatus === "" || selectedStatus === "todos" ? undefined : selectedStatus;
      const response = await axios.post(
        API_URL + "/whatsapp/delivery/list/route",
        {
          id_owner: user,
          startDate: sDate,
          endDate: eDate,
          delivery: selectedSaler2,
          page,
          excludeComplete: false,
          ...(status !== undefined && { status }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTotalPages(response.data.totalPages || 1);
      setListRoutes(response.data.data || []);
      setSelectedMarkers([]);
      setDirectionsResponse(null);
    } catch (error) {
      console.error("Error al cargar rutas:", error);
      setListRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedSaler2, page, selectedStatus, token]);

  useEffect(() => {
    loadRoute(startDate || null, endDate || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedStatus, selectedSaler2]);

  const findLocation = (client) => {
    if (client && client.client_location) {
      const lat = parseFloat(client.client_location.latitud);
      const lng = parseFloat(client.client_location.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapZoom(18);
        setCenter({ lat, lng });
      }
    }
  };

  const handleSelectRoute = (route) => {
    setSelectedMarkers([route]);
    if (route.route && route.route.length > 0) {
      const first = route.route.find(c => c.client_location);
      if (first) {
        setMapZoom(13);
        setCenter({
          lat: first.client_location.latitud,
          lng: first.client_location.longitud
        });
      }
    }
  };

  const formatDateToLocal = (isoDate) => {
    if (!isoDate) return "-";
    const date = new Date(isoDate);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const deleteRoutes = async (value) => {
    try {
      await axios.delete(API_URL + "/whatsapp/route/sales/id", {
        data: { _id: value, id_owner: user },
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteModal(null);
      loadRoute(startDate || null, endDate || null);
    } catch (error) {
      console.error("Error al eliminar la ruta:", error);
    }
  };
  useEffect(() => {
    const active = selectedMarkers[0];
    if (!active || !active.route || active.route.length === 0) return;
    if (!mapRef.current || !isLoaded || !window.google) return;

    const isVisited = (c) =>
      c.visitStatus === true ||
      c.visitStatus1 === "Pedido entregado" ||
      c.visitStatus1 === "LLego al destino";

    const stops = active.route
      .filter((c) => c.client_location && isVisited(c))
      .map((c) => ({
        lat: Number(c.client_location.latitud),
        lng: Number(c.client_location.longitud),
      }))
      .filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

    if (stops.length < 1) {
      mapRef.current.panTo(DEPOT);
      mapRef.current.setZoom(14);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(DEPOT);
    stops.forEach((s) => bounds.extend(s));
    mapRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 220, left: 80 });
  }, [selectedMarkers, isLoaded]);
  const activeRoute = selectedMarkers[0];
  const visitedCount = activeRoute?.route?.filter(r => r.visitStatus || r.visitStatus1 === "Pedido entregado" || r.visitStatus1 === "LLego al destino").length || 0;
  const totalStops = activeRoute?.route?.length || 0;

  const statsByStatus = listRoutes.reduce((acc, route) => {
    acc[route.status] = (acc[route.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <style>{`
                @keyframes shimmer {
                    0%   { background-position:  200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
      <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[480px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-[#D3423E] to-red-700 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <FaTruck />
                    Rutas de entrega
                  </h1>
                  <p className="text-xs text-red-100 mt-0.5">Seguimiento de repartidores</p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <FaChevronLeft />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                  <p className="text-[10px] text-red-100">Total</p>
                  <p className="text-lg font-bold">{listRoutes.length}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                  <p className="text-[10px] text-red-100">Por iniciar</p>
                  <p className="text-lg font-bold">{statsByStatus["Por iniciar"] || 0}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                  <p className="text-[10px] text-red-100">En ruta</p>
                  <p className="text-lg font-bold">{statsByStatus["En progreso"] || 0}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                  <p className="text-[10px] text-red-100">Terminadas</p>
                  <p className="text-lg font-bold">{statsByStatus["Finalizado"] || 0}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Repartidor</label>
                  <div className="relative">
                    <FaTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <select
                      value={selectedSaler2}
                      onChange={(e) => { setSelectedSaler2(e.target.value); setPage(1); }}
                      className="app-select"

                    >
                      <option value="">Todos</option>
                      <option value="todos">Todos</option>
                      {vendedores.map((v) => (
                        <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Estado</label>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <select
                      value={selectedStatus}
                      onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                      className="app-select"
                    >
                      <option value="">Todos</option>
                      <option value="Por iniciar">Por iniciar</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Rango de fechas</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                  />
                  <span className="text-gray-400 text-sm font-semibold">→</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                  />
                  <PrincipalBUtton
                    onClick={() => { setPage(1); loadRoute(startDate, endDate); }}
                    icon={HiFilter}
                  >
                  </PrincipalBUtton>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <DeliveryRouteSidebarSkeleton />
              ) : listRoutes.length > 0 ? (
                <div className="space-y-3">
                  {listRoutes.map((route, idx) => {
                    const config = STATUS_CONFIG[route.status];
                    const StatusIcon = config?.icon;
                    const isExpanded = expandedIndex === idx;
                    const isSelected = activeRoute?._id === route._id;
                    return (
                      <div
                        key={route._id}
                        className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${isSelected ? 'border-[#D3423E] shadow-md ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <button
                          onClick={() => {
                            handleAccordionToggle(idx);
                            if (!isExpanded) handleSelectRoute(route);
                          }}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 truncate">
                                {route.details || "Ruta sin nombre"}
                              </h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <FaTruck size={10} />
                                {route.delivery?.fullName} {route.delivery?.lastName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {config && StatusIcon && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-semibold`}>
                                  <StatusIcon className={config.iconColor} size={10} />
                                  {config.label}
                                </span>
                              )}
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                <FaChevronDown className="text-gray-400" size={12} />
                              </motion.div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt size={10} />
                              {formatDateToLocal(route.startDate)}
                            </span>
                            <span>→</span>
                            <span>{formatDateToLocal(route.endDate)}</span>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-gray-600">Progreso</span>
                              <span className={`text-xs font-bold ${config?.textColor || 'text-gray-900'}`}>{route.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${route.progress || 0}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-2 rounded-full ${config?.progressColor || 'bg-gray-400'}`}
                              />
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-gray-100"
                            >
                              <div className="p-4 bg-gray-50 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white rounded-lg p-2">
                                    <p className="text-gray-500">Creación</p>
                                    <p className="font-semibold text-gray-900 text-[11px]">
                                      {new Date(route.creationDate).toLocaleString("es-ES", {
                                        timeZone: "America/La_Paz",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-2">
                                    <p className="text-gray-500">Entregas</p>
                                    <p className="font-bold text-gray-900">{route.route?.length || 0}</p>
                                  </div>
                                </div>

                                {route.route && route.route.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-700 uppercase mb-2">Paradas</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {route.route.map((stop, stopIdx) => {
                                        const vConfig = VISIT_STATUS_CONFIG[stop.visitStatus1] || VISIT_STATUS_CONFIG["Sin visitar"];
                                        const isDelivered = stop.visitStatus1 === "Pedido entregado" || stop.visitStatus1 === "LLego al destino";
                                        return (
                                          <div
                                            key={stopIdx}
                                            className="bg-white rounded-lg p-2.5 border border-gray-200"
                                          >
                                            <div className="flex items-center gap-2 mb-2">
                                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${isDelivered ? 'bg-green-500' : stop.visitStatus1 === "En camino" ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                                                {stopIdx + 1}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">
                                                  {stop.name} {stop.lastName}
                                                </p>
                                              </div>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-white ${vConfig.color}`}>
                                                {vConfig.text}
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                                              {stop.distanceTrip && (
                                                <span className="flex items-center gap-1">
                                                  <FaRoad size={8} />
                                                  {stop.distanceTrip}
                                                </span>
                                              )}
                                              {stop.tripTime && (
                                                <span className="flex items-center gap-1">
                                                  <FaClock size={8} />
                                                  {stop.tripTime}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => handleSelectRoute(route)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#D3423E] text-[#D3423E] rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                                  >
                                    <FaEye size={10} /> Ver en mapa
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteModal(route)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                                  >
                                    <FaTrash size={10} /> Eliminar
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {totalPages > 1 && (
                    <nav className="flex items-center justify-center pt-4 gap-1">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`p-2 rounded-lg transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        <FaChevronLeft size={14} />
                      </button>
                      {(() => {
                        let start = Math.max(1, page - 1);
                        let end = Math.min(totalPages, page + 1);
                        if (page === 1) end = Math.min(3, totalPages);
                        else if (page === totalPages) start = Math.max(totalPages - 2, 1);
                        const pagesToShow = [];
                        for (let i = start; i <= end; i++) pagesToShow.push(i);
                        return pagesToShow.map((num) => (
                          <button
                            key={num}
                            onClick={() => setPage(num)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === num ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-100"}`}
                          >
                            {num}
                          </button>
                        ));
                      })()}
                      <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        <FaChevronRight size={14} />
                      </button>
                    </nav>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaTruck className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-700 font-semibold">Sin rutas de entrega</p>
                  <p className="text-sm text-gray-500 mt-1">No hay entregas para estos filtros</p>
                </div>
              )}
            </div>
          </>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex h-full w-full items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <FaChevronRight className="text-gray-600" />
          </button>
        )}
      </div>

      <div className="flex-1 h-full relative bg-gray-200">
        {isLoaded && (
          <div className="absolute bottom-32 right-4 z-10 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 13) + 1)}
              className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200 text-xl font-bold"
              title="Acercar"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 13) - 1)}
              className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors text-xl font-bold"
              title="Alejar"
            >
              −
            </button>
          </div>
        )}
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={CONTAINER_STYLE}
            center={center}
            zoom={mapZoom}
onLoad={(map) => {
              mapRef.current = map;
              map.panTo(DEPOT);
              map.setZoom(14);
            }}            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: MAP_STYLE_MODERN,

            }}
          >
         <Marker
              position={DEPOT}
              icon={window.google ? {
                url: depotLogo,
                scaledSize: new window.google.maps.Size(50, 50),
                anchor: new window.google.maps.Point(25, 25),
              } : null}
              title="Depósito"
              zIndex={2000}
            />

            {activeRoute && activeRoute.route && activeRoute.route
              .filter(c => {
                const isVisited = c.visitStatus === true || c.visitStatus1 === "Pedido entregado" || c.visitStatus1 === "LLego al destino";
                return c.client_location && isVisited;
              })
              .map((client, index) => {
                const isDelivered = client.visitStatus1 === "Pedido entregado" || client.visitStatus1 === "LLego al destino";
                const color = isDelivered ? "#10b981" : "#eab308";
                return (
                  <Marker
                    key={client._id || index}
                    position={{
                      lat: Number(client.client_location.latitud),
                      lng: Number(client.client_location.longitud),
                    }}
                    icon={{
                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg width="56" height="68" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 68">
                          <defs>
                            <filter id="sh${index}" x="-50%" y="-50%" width="200%" height="200%">
                              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                            </filter>
                          </defs>
                          <path d="M28 66 C28 66 6 40 6 24 A22 22 0 1 1 50 24 C50 40 28 66 28 66 Z" fill="${color}" stroke="white" stroke-width="3" filter="url(#sh${index})"/>
                          <circle cx="28" cy="24" r="13" fill="white"/>
                          <text x="28" y="29" text-anchor="middle" fill="${color}" font-size="15" font-weight="bold" font-family="Arial">${index + 1}</text>
                        </svg>
                      `)}`,
                      scaledSize: window.google ? new window.google.maps.Size(48, 58) : undefined,
                      anchor: window.google ? new window.google.maps.Point(24, 58) : undefined,
                    }}
                    onClick={() => setSelectedClient(client)}
                  />
                );
              })}

            {selectedClient && (
              <InfoWindow
                position={{
                  lat: selectedClient.client_location.latitud,
                  lng: selectedClient.client_location.longitud,
                }}
                onCloseClick={() => setSelectedClient(null)}
              >
                <div style={{ color: '#111', fontSize: '13px', maxWidth: '220px', padding: '4px' }}>
                  <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                    {selectedClient.name} {selectedClient.lastName}
                  </h2>
                  {selectedClient.tripTime && (
                    <p style={{ margin: '6px 0 0 0', color: '#666' }}>
                      <strong>Tiempo estimado:</strong> {selectedClient.tripTime}
                    </p>
                  )}
                  {selectedClient.distanceTrip && (
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      <strong>Distancia:</strong> {selectedClient.distanceTrip}
                    </p>
                  )}
                  {selectedClient.visitStatus1 && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: (selectedClient.visitStatus1 === "Pedido entregado" || selectedClient.visitStatus1 === "LLego al destino") ? '#d1fae5' : selectedClient.visitStatus1 === "En camino" ? '#fef3c7' : '#fee2e2',
                      color: (selectedClient.visitStatus1 === "Pedido entregado" || selectedClient.visitStatus1 === "LLego al destino") ? '#065f46' : selectedClient.visitStatus1 === "En camino" ? '#92400e' : '#991b1b'
                    }}>
                      {VISIT_STATUS_CONFIG[selectedClient.visitStatus1]?.text || selectedClient.visitStatus1}
                    </span>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <DeliveryRouteMapSkeleton />
        )}

        {activeRoute && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-4 left-4 z-10 bg-white rounded-2xl shadow-xl p-4 border border-gray-200 max-w-[260px]"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Ruta activa</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[activeRoute.status]?.bgColor} ${STATUS_CONFIG[activeRoute.status]?.textColor}`}>
                {activeRoute.status}
              </span>
            </div>
            <p className="font-bold text-gray-900 truncate text-sm mb-0.5">{activeRoute.details}</p>
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <FaTruck size={9} className="text-gray-400" />
              {activeRoute.delivery?.fullName} {activeRoute.delivery?.lastName}
            </p>

            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500 font-bold uppercase tracking-wide">Progreso</span>
                <span className="font-bold text-gray-900">{activeRoute.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activeRoute.progress || 0}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-2 rounded-full bg-[#D3423E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 rounded-xl p-2 text-center border border-green-100">
                <p className="text-green-700 font-black text-base leading-tight">{visitedCount}</p>
                <p className="text-green-600 text-[9px] font-bold uppercase">Entregados</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-2 text-center border border-amber-100">
                <p className="text-amber-700 font-black text-base leading-tight">{totalStops - visitedCount}</p>
                <p className="text-amber-600 text-[9px] font-bold uppercase">Pendientes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                <p className="text-gray-700 font-black text-base leading-tight">{totalStops}</p>
                <p className="text-gray-500 text-[9px] font-bold uppercase">Total</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3.5 border border-gray-200">
          <p className="text-[10px] font-black text-gray-500 mb-2.5 uppercase tracking-wide">Leyenda</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div>
              <span className="text-gray-700 font-medium">Entregado</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">!</div>
              <span className="text-gray-700 font-medium">Llegó al destino</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs pt-1 mt-1 border-t border-gray-100">
              <img src={depotLogo} alt="depósito" className="w-6 h-6 object-contain flex-shrink-0" />
              <span className="text-gray-700 font-medium">Depósito</span>
            </div>
          </div>
        </div>

        {activeRoute && activeRoute.route && activeRoute.route.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
              <div className="flex overflow-x-auto space-x-2 pb-1">
                {activeRoute.route
                  .filter(c => c.client_location)
                  .map((client, idx) => {
                    const isDelivered = client.visitStatus1 === "Pedido entregado" || client.visitStatus1 === "LLego al destino";
                    const isInTransit = client.visitStatus1 === "En camino";
                    return (
                      <div
                        key={client._id}
                        onClick={() => { findLocation(client); setSelectedClient(client); }}
                        className={`flex-shrink-0 flex items-center gap-2 p-2 border-2 rounded-xl cursor-pointer transition-all min-w-[220px] hover:shadow-md ${isDelivered ? 'border-green-200 bg-green-50' : isInTransit ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${isDelivered ? 'bg-green-500' : isInTransit ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                          {idx + 1}
                        </div>
                        <img
                          className="w-10 h-10 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                          src={client.profilePicture || FALLBACK_IMAGE}
                          alt={client.name}
                          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {client.name} {client.lastName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                            <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0" size={8} />
                            {client.client_location?.direction || "Sin dirección"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-2xl" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar ruta?</h2>
              <p className="text-sm text-gray-600 mb-1">
                <strong>{showDeleteModal.details}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteRoutes(showDeleteModal._id)}
                  className="flex-1 px-4 py-2.5 bg-[#D3423E] text-white font-bold rounded-xl hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}