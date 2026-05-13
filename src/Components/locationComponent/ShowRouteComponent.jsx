import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { FaMapMarkerAlt, FaUser, FaCalendarAlt, FaRoute, FaTrash, FaChevronLeft, FaChevronRight, FaCheckCircle, FaPlayCircle, FaRegClock, FaEye, FaChevronDown, FaFilter, FaClock, FaPlus, FaMinus, FaTimes } from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import { motion, AnimatePresence } from "framer-motion";

const ROUTE_COLOR = "#000000";
const ROUTE_COLOR_DARK = "#d80404";
const VISITED_COLOR = "#10B981";
const PENDING_COLOR = "#F59E0B";

const STATUS_CONFIG = {
  "Por iniciar": {
    label: "Por iniciar",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    icon: FaRegClock,
    iconColor: "text-amber-500",
    progressColor: "bg-amber-400"
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
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
    icon: FaCheckCircle,
    iconColor: "text-emerald-500",
    progressColor: "bg-emerald-500"
  }
};

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

const containerStyle = {
  width: "100%",
  height: "100%"
};

export default function ShowRouteComponent() {
  const mapRef = useRef(null);
  const [vendedores, setVendedores] = useState([]);
  const [listRoutes, setListRoutes] = useState([]);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });
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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  const handleAccordionToggle = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
          { id_owner: user },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendedores(response.data.data);
      } catch (error) {
        console.error("Obteniendo vendedores", error);
        setVendedores([]);
      }
    };
    fetchVendedores();
  }, [user, token]);

  const loadRoute = useCallback(async (sDate, eDate, salerId) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/salesman/list/route", {
        id_owner: user,
        startDate: sDate,
        salesMan: salerId,
        endDate: eDate,
        status: selectedStatus,
        page,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTotalPages(response.data.totalPages || 1);
      setListRoutes(response.data.data || []);
      setSelectedMarkers([]);
      setDirectionsResponse(null);
      setRouteStats({ distance: 0, duration: 0 });
    } catch (error) {
      console.error("Error al cargar rutas:", error);
      setListRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, user, token]);

  useEffect(() => {
    loadRoute(startDate || null, endDate || null, selectedSaler || "todos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedSaler, selectedStatus]);

  const findLocation = (client) => {
    if (client?.client_location) {
      const lat = parseFloat(client.client_location.latitud);
      const lng = parseFloat(client.client_location.longitud);
      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        setTimeout(() => mapRef.current?.setZoom(17), 300);
      }
    }
  };

  const handleSelectRoute = (route) => {
    setSelectedMarkers([route]);
    if (route.route && route.route.length > 0) {
      const first = route.route.find(c => c.client_location);
      if (first && mapRef.current) {
        mapRef.current.panTo({
          lat: first.client_location.latitud,
          lng: first.client_location.longitud
        });
        setTimeout(() => mapRef.current?.setZoom(13), 300);
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
      loadRoute(startDate || null, endDate || null, selectedSaler || "todos");
    } catch (error) {
      console.error("Error al eliminar la ruta:", error);
    }
  };

  useEffect(() => {
    if (
      selectedMarkers.length > 0 &&
      selectedMarkers[0].route &&
      selectedMarkers[0].route.length > 1 &&
      isLoaded &&
      window.google
    ) {
      const routePoints = selectedMarkers[0].route.filter(c => c.client_location);
      if (routePoints.length < 2) {
        setDirectionsResponse(null);
        setRouteStats({ distance: 0, duration: 0 });
        return;
      }

      const origin = {
        lat: routePoints[0].client_location.latitud,
        lng: routePoints[0].client_location.longitud,
      };
      const destination = {
        lat: routePoints[routePoints.length - 1].client_location.latitud,
        lng: routePoints[routePoints.length - 1].client_location.longitud,
      };
      const waypoints = routePoints.slice(1, -1).map((c) => ({
        location: {
          lat: c.client_location.latitud,
          lng: c.client_location.longitud,
        },
        stopover: true,
      }));

      setDirectionsResponse(null);

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === "OK") {
            setDirectionsResponse(result);
            const legs = result.routes[0].legs;
            const totalDistance = legs.reduce((s, l) => s + l.distance.value, 0);
            const totalDuration = legs.reduce((s, l) => s + l.duration.value, 0);
            setRouteStats({
              distance: (totalDistance / 1000).toFixed(1),
              duration: Math.round(totalDuration / 60)
            });
          }
        }
      );
    } else {
      setDirectionsResponse(null);
      setRouteStats({ distance: 0, duration: 0 });
    }
  }, [selectedMarkers, isLoaded]);

  const handleZoomIn = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(z + 1);
  };

  const handleZoomOut = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(Math.max(z - 1, 3));
  };

  const buildPin = (orderIndex, visited) => {
    const fill = visited ? VISITED_COLOR : PENDING_COLOR;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="56" height="68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="ds" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.4"/>
          </filter>
        </defs>
        <path d="M28 4 C16 4 6 13 6 25 C6 41 28 64 28 64 C28 64 50 41 50 25 C50 13 40 4 28 4 Z"
              fill="${fill}" stroke="#ffffff" stroke-width="3" filter="url(#ds)"/>
        <circle cx="28" cy="24" r="12" fill="#ffffff"/>
        <text x="28" y="29" text-anchor="middle" fill="${fill}" font-size="16" font-weight="900" font-family="Arial, sans-serif">${orderIndex + 1}</text>
      </svg>
    `)}`;
  };

  const activeRoute = selectedMarkers[0];
  const visitedCount = activeRoute?.route?.filter(r => r.visitStatus).length || 0;
  const totalStops = activeRoute?.route?.length || 0;
  const completionPercent = totalStops > 0 ? Math.round((visitedCount / totalStops) * 100) : 0;

  const statsByStatus = listRoutes.reduce((acc, route) => {
    acc[route.status] = (acc[route.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[480px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="p-5 border-b border-gray-200 bg-red-700 rounded-r-3xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <FaRoute />
                    Rutas de vendedores
                  </h1>
                  <p className="text-xs text-red-100 mt-0.5">Seguimiento y progreso</p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <FaChevronLeft />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm"
                >
                  <p className="text-[10px] text-red-100">Total</p>
                  <p className="text-lg font-bold">{listRoutes.length}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm"
                >
                  <p className="text-[10px] text-red-100">Por iniciar</p>
                  <p className="text-lg font-bold">{statsByStatus["Por iniciar"] || 0}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm"
                >
                  <p className="text-[10px] text-red-100">Activas</p>
                  <p className="text-lg font-bold">{statsByStatus["En progreso"] || 0}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm"
                >
                  <p className="text-[10px] text-red-100">Finalizadas</p>
                  <p className="text-lg font-bold">{statsByStatus["Finalizado"] || 0}</p>
                </motion.div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Vendedor</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <select
                      value={selectedSaler}
                      onChange={(e) => { setSelectedSaler(e.target.value); setPage(1); }}
                      className="w-full pl-8 pr-2 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 appearance-none cursor-pointer"
                    >
                      <option value="">Todos</option>
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
                      className="w-full pl-8 pr-2 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 appearance-none cursor-pointer"
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="relative flex-1">
                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <PrincipalBUtton
                    onClick={() => { setPage(1); loadRoute(startDate, endDate, selectedSaler || "todos"); }}
                    icon={HiFilter}
                  >
                    Filtrar
                  </PrincipalBUtton>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
                  <p className="text-sm">Cargando rutas...</p>
                </div>
              ) : listRoutes.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence>
                    {listRoutes.map((route, idx) => {
                      const config = STATUS_CONFIG[route.status];
                      const StatusIcon = config?.icon;
                      const isExpanded = expandedIndex === idx;
                      const isSelected = activeRoute?._id === route._id;
                      return (
                        <motion.div
                          key={route._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${isSelected ? 'border-[#D3423E] shadow-lg ring-4 ring-red-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
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
                                  <FaUser size={10} />
                                  {route.salesMan?.fullName} {route.salesMan?.lastName}
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
                                    <div className="bg-white rounded-lg p-2 border border-gray-100">
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
                                    <div className="bg-white rounded-lg p-2 border border-gray-100">
                                      <p className="text-gray-500">Paradas</p>
                                      <p className="font-bold text-gray-900">{route.route?.length || 0}</p>
                                    </div>
                                  </div>

                                  {route.route && route.route.length > 0 && (
                                    <div>
                                      <p className="text-xs font-bold text-gray-700 uppercase mb-2">Clientes en ruta</p>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {route.route.map((client, clientIdx) => (
                                          <div
                                            key={clientIdx}
                                            className="bg-white rounded-lg p-2.5 border border-gray-200 flex items-center gap-2"
                                          >
                                            <div
                                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white shadow-sm"
                                              style={{ backgroundColor: client.visitStatus ? VISITED_COLOR : PENDING_COLOR }}
                                            >
                                              {clientIdx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-bold text-gray-900 truncate">
                                                {client.name} {client.lastName}
                                              </p>
                                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                {client.visitTime && (
                                                  <span className="flex items-center gap-0.5">
                                                    <FaClock size={8} />
                                                    {client.visitTime}
                                                  </span>
                                                )}
                                                {client.visitEndTime && (
                                                  <span>{formatDateToLocal(client.visitEndTime)}</span>
                                                )}
                                              </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${client.visitStatus ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                              {client.visitStatus ? "✓ Visitado" : "Pendiente"}
                                            </span>
                                          </div>
                                        ))}
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
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

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
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === num ? "bg-[#D3423E] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}`}
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
                    <FaRoute className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-700 font-semibold">Sin rutas</p>
                  <p className="text-sm text-gray-500 mt-1">No hay rutas para los filtros seleccionados</p>
                </div>
              )}
            </div>
          </>
        )}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex h-full w-full rounded-r-xl border-4 border-red-700 items-center justify-center hover:bg-gray-100 transition-colors flex-col gap-2"
          >
            <FaChevronRight className="text-red-700" />
          </button>
        )}
      </div>

      <div className="flex-1 h-full relative bg-gray-200">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: -17.3835, lng: -66.1568 }}
            zoom={10}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {activeRoute && activeRoute.route && activeRoute.route
              .filter(c => c.client_location)
              .map((client, index) => (
                <Marker
                  key={client._id || index}
                  position={{
                    lat: client.client_location.latitud,
                    lng: client.client_location.longitud,
                  }}
                  icon={{
                    url: buildPin(index, client.visitStatus),
                    scaledSize: new window.google.maps.Size(56, 68),
                    anchor: new window.google.maps.Point(28, 64),
                  }}
                  onClick={() => setSelectedClient(client)}
                />
              ))}

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
                  {selectedClient.visitTime && (
                    <p style={{ margin: '6px 0 0 0', color: '#666' }}>
                      <strong>Tiempo:</strong> {selectedClient.visitTime}
                    </p>
                  )}
                  {selectedClient.visitEndTime && (
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      <strong>Fecha:</strong> {formatDateToLocal(selectedClient.visitEndTime)}
                    </p>
                  )}
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: selectedClient.visitStatus ? '#D1FAE5' : '#FEF3C7',
                    color: selectedClient.visitStatus ? '#065F46' : '#92400E'
                  }}>
                    {selectedClient.visitStatus ? "✓ Visitado" : "Pendiente"}
                  </span>
                </div>
              </InfoWindow>
            )}

            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  polylineOptions: {
                    strokeColor: ROUTE_COLOR,
                    strokeOpacity: 0.9,
                    strokeWeight: 3,
                    icons: [{
                      icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 4,
                        strokeColor: ROUTE_COLOR_DARK,
                        fillColor: ROUTE_COLOR_DARK,
                        fillOpacity: 1,
                      },
                      offset: '0',
                      repeat: '120px',
                    }],
                  },
                  suppressMarkers: true,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">Cargando mapa...</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {activeRoute && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-4 left-4 z-10 bg-white rounded-2xl shadow-xl p-4 border border-gray-200 max-w-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-700 uppercase">Ruta activa</p>
                <button
                  onClick={() => { setSelectedMarkers([]); setDirectionsResponse(null); }}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
                >
                  <FaTimes size={10} />
                </button>
              </div>
              <p className="font-bold text-gray-900 truncate">{activeRoute.details}</p>
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <FaUser size={9} /> {activeRoute.salesMan?.fullName}
              </p>

              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-500 font-semibold uppercase">Cumplimiento</span>
                  <span className="font-bold text-gray-900">{completionPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: VISITED_COLOR }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2 text-center" style={{ backgroundColor: '#ECFDF5' }}>
                  <p className="font-bold text-lg" style={{ color: '#065F46' }}>{visitedCount}</p>
                  <p className="text-[10px]" style={{ color: '#047857' }}>Visitados</p>
                </div>
                <div className="rounded-lg p-2 text-center" style={{ backgroundColor: '#FFFBEB' }}>
                  <p className="font-bold text-lg" style={{ color: '#92400E' }}>{totalStops - visitedCount}</p>
                  <p className="text-[10px]" style={{ color: '#B45309' }}>Pendientes</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {directionsResponse && routeStats.distance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-xl border border-gray-200 px-5 py-3 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
                <FaRoute style={{ color: ROUTE_COLOR }} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Distancia</p>
                <p className="text-base font-bold text-gray-900">{routeStats.distance} km</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Tiempo</p>
                <p className="text-base font-bold text-gray-900 flex items-center gap-1">
                  <FaClock size={11} className="text-gray-400" />
                  ~{routeStats.duration} min
                </p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Paradas</p>
                <p className="text-base font-bold text-gray-900">{totalStops}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-xl p-3 border border-gray-200">
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Leyenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                style={{ backgroundColor: VISITED_COLOR }}
              >
                ✓
              </div>
              <span className="text-gray-700">Visitado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                style={{ backgroundColor: PENDING_COLOR }}
              >
                2
              </div>
              <span className="text-gray-700">Pendiente</span>
            </div>
            {directionsResponse && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: ROUTE_COLOR }} />
                <span className="text-gray-700">Recorrido</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-200"
            title="Acercar"
          >
            <FaPlus size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Alejar"
          >
            <FaMinus size={14} />
          </button>
        </div>

        {activeRoute && activeRoute.route && activeRoute.route.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3">
              <div className="flex overflow-x-auto space-x-2 pb-1">
                {activeRoute.route
                  .filter(c => c.client_location)
                  .map((client, idx) => (
                    <motion.div
                      key={client._id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { findLocation(client); setSelectedClient(client); }}
                      className={`flex-shrink-0 flex items-center gap-2 p-2 border-2 rounded-xl cursor-pointer transition-all min-w-[220px] hover:shadow-md ${client.visitStatus ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white shadow-md"
                        style={{ backgroundColor: client.visitStatus ? VISITED_COLOR : PENDING_COLOR }}
                      >
                        {idx + 1}
                      </div>
                      <img
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0 bg-white border border-gray-200"
                        src={client.identificationImage || FALLBACK_IMAGE}
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
                    </motion.div>
                  ))}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
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