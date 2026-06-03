import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import {
  useJsApiLoader, GoogleMap, Marker, OverlayView, Polyline,
} from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import {
  FaMapMarkerAlt, FaUser, FaCalendarAlt, FaRoute, FaTrash, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaPlayCircle, FaRegClock, FaEye, FaChevronDown, FaFilter, FaClock,
  FaPlus, FaMinus, FaTimes, FaCog, FaExpand, FaLayerGroup, FaBuilding,
  FaExclamationTriangle,
} from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import { motion, AnimatePresence } from "framer-motion";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from "../../utils/MapDetails";

const ROUTE_COLOR = "#D3423E";
const ROUTE_COLOR_DARK = "#991B1B";
const ROUTE_HALO_COLOR = "#FCA5A5";
const VISITED_COLOR = "#10B981";
const PENDING_COLOR = "#F59E0B";
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];


const STATUS_CONFIG = {
  "Por iniciar": {
    label: "Por iniciar",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    icon: FaRegClock,
    iconColor: "text-amber-500",
    progressColor: "bg-amber-400",
  },
  "En progreso": {
    label: "En progreso",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    icon: FaPlayCircle,
    iconColor: "text-blue-500",
    progressColor: "bg-blue-500",
  },
  Finalizado: {
    label: "Finalizado",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
    icon: FaCheckCircle,
    iconColor: "text-emerald-500",
    progressColor: "bg-emerald-500",
  },
};

const FALLBACK_IMAGE =
  "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

const SHIMMER_STYLE = {
  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s linear infinite",
};


const buildDepotIcon = () => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <defs>
      <filter id="depot-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
        <feOffset dx="0" dy="2" result="offsetblur"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="30" cy="30" r="27" fill="#D3423E" opacity="0.18"/>
    <circle cx="30" cy="30" r="22" fill="#111827" stroke="white" stroke-width="3" filter="url(#depot-shadow)"/>
    <g transform="translate(18 17)" fill="white">
      <path d="M12 0 L0 9 L0 22 L24 22 L24 9 Z M10 22 L10 14 L14 14 L14 22"
            stroke="white" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
  </svg>
`)}`;

export default function ShowRouteComponent() {
  const mapRef = useRef(null);
  const [vendedores, setVendedores] = useState([]);
  const [listRoutes, setListRoutes] = useState([]);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

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
        const response = await axios.post(
          API_URL + "/whatsapp/sales/list/id",
          { id_owner: user },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendedores(response.data.data || []);
      } catch (error) {
        console.error("Obteniendo vendedores", error);
        setVendedores([]);
      }
    };
    fetchVendedores();
  }, [user, token]);

  const loadRoute = useCallback(
    async (sDate, eDate, salerId) => {
      setLoading(true);
      try {
        const response = await axios.post(
          API_URL + "/whatsapp/salesman/list/route",
          {
            id_owner: user,
            startDate: sDate,
            salesMan: salerId,
            endDate: eDate,
            status: selectedStatus,
            page,
            limit: pageSize,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || response.data.data?.length || 0);
        setListRoutes(response.data.data || []);
        setSelectedMarkers([]);
        setDirectionsResponse(null);
        setRoutePath([]);
        setRouteStats({ distance: 0, duration: 0 });
      } catch (error) {
        console.error("Error al cargar rutas:", error);
        setListRoutes([]);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, selectedStatus, user, token]
  );

  useEffect(() => {
    loadRoute(startDate || null, endDate || null, selectedSaler || "todos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, selectedSaler, selectedStatus]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const findLocation = (client) => {
    if (client?.client_location) {
      const lat = parseFloat(client.client_location.latitud);
      const lng = parseFloat(client.client_location.longitud);
      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        mapRef.current.panTo({ lat, lng });
      }
    }
  };

const handleSelectRoute = (route) => {
    setSelectedMarkers([route]);
    if (route.route && route.route.length > 0 && mapRef.current && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(DEFAULT_CENTER);
      route.route.forEach((c) => {
        if (c.client_location?.latitud && c.client_location?.longitud) {
          bounds.extend({
            lat: Number(c.client_location.latitud),
            lng: Number(c.client_location.longitud),
          });
        }
      });
      setTimeout(() => {
        mapRef.current?.fitBounds(bounds, {
          top: 120,
          right: 240,
          bottom: 200,
          left: 60,
        });
      }, 200);
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
    setDeleting(true);
    try {
      await axios.delete(API_URL + "/whatsapp/route/sales/id", {
        data: { _id: value, id_owner: user },
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(null);
      loadRoute(startDate || null, endDate || null, selectedSaler || "todos");
    } catch (error) {
      console.error("Error al eliminar la ruta:", error);
    } finally {
      setDeleting(false);
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
      const routePoints = selectedMarkers[0].route.filter((c) => c.client_location);
      if (routePoints.length < 2) {
        setDirectionsResponse(null);
        setRoutePath([]);
        setRouteStats({ distance: 0, duration: 0 });
        return;
      }

      const origin = {
        lat: Number(routePoints[0].client_location.latitud),
        lng: Number(routePoints[0].client_location.longitud),
      };
      const destination = {
        lat: Number(routePoints[routePoints.length - 1].client_location.latitud),
        lng: Number(routePoints[routePoints.length - 1].client_location.longitud),
      };
      const waypoints = routePoints.slice(1, -1).map((c) => ({
        location: {
          lat: Number(c.client_location.latitud),
          lng: Number(c.client_location.longitud),
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
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === "OK") {
            setDirectionsResponse(result);
            const legs = result.routes[0].legs;
            const totalDistance = legs.reduce((s, l) => s + l.distance.value, 0);
            const totalDuration = legs.reduce((s, l) => s + l.duration.value, 0);
            setRouteStats({
              distance: (totalDistance / 1000).toFixed(1),
              duration: Math.round(totalDuration / 60),
            });

            const path = [];
            result.routes[0].legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                step.path.forEach((p) => path.push({ lat: p.lat(), lng: p.lng() }));
              });
            });
            setRoutePath(path);
          }
        }
      );
    } else {
      setDirectionsResponse(null);
      setRoutePath([]);
      setRouteStats({ distance: 0, duration: 0 });
    }
  }, [selectedMarkers, isLoaded]);

  const handleZoomIn = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(Math.min(z + 1, 22));
  };

  const handleZoomOut = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(Math.max(z - 1, 3));
  };

  const fitToRoute = () => {
    if (!mapRef.current || !window.google || !activeRoute) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(DEFAULT_CENTER);
    activeRoute.route?.forEach((c) => {
      if (c.client_location?.latitud && c.client_location?.longitud) {
        bounds.extend({
          lat: Number(c.client_location.latitud),
          lng: Number(c.client_location.longitud),
        });
      }
    });
    mapRef.current.fitBounds(bounds, { top: 120, right: 240, bottom: 200, left: 60 });
  };

  const buildPin = (orderIndex, visited) => {
    const fill = visited ? VISITED_COLOR : PENDING_COLOR;
    const fillDark = visited ? "#047857" : "#B45309";
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <defs>
          <filter id="ds-${orderIndex}-${visited}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="21" fill="white" stroke="${fill}" stroke-width="3" filter="url(#ds-${orderIndex}-${visited})"/>
        <circle cx="24" cy="24" r="15" fill="${fill}"/>
        <text x="24" y="29" text-anchor="middle" fill="white" font-size="14" font-weight="900" font-family="Arial, sans-serif">${orderIndex + 1}</text>
        ${visited ? `<circle cx="38" cy="10" r="8" fill="${fillDark}" stroke="white" stroke-width="2"/>
        <path d="M34 10 L37 13 L42 8" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      </svg>
    `)}`;
  };

  const activeRoute = selectedMarkers[0];
  const visitedCount = activeRoute?.route?.filter((r) => r.visitStatus).length || 0;
  const totalStops = activeRoute?.route?.length || 0;
  const completionPercent = totalStops > 0 ? Math.round((visitedCount / totalStops) * 100) : 0;

  const statsByStatus = useMemo(() => {
    return listRoutes.reduce((acc, route) => {
      acc[route.status] = (acc[route.status] || 0) + 1;
      return acc;
    }, {});
  }, [listRoutes]);

  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, page - 1, page, page + 1, totalPages];
  }, [page, totalPages]);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className={`${sidebarCollapsed ? "w-0 lg:w-16" : "w-full lg:w-[480px]"} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-[#D3423E] to-red-700 rounded-br-3xl text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FaRoute size={18} />
                  </div>
                  <div>
                    <h1 className="text-lg font-black leading-tight">
                      Rutas de vendedores
                    </h1>
                    <p className="text-[11px] text-red-100">Seguimiento y progreso</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <FaChevronLeft />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <StatPill label="Total" value={totalItems} />
                <StatPill label="Por iniciar" value={statsByStatus["Por iniciar"] || 0} />
                <StatPill label="Activas" value={statsByStatus["En progreso"] || 0} />
                <StatPill label="Finalizadas" value={statsByStatus["Finalizado"] || 0} />
              </div>
            </div>

            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-wide block mb-1.5">
                    Vendedor
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <select
                      value={selectedSaler}
                      onChange={(e) => {
                        setSelectedSaler(e.target.value);
                        setPage(1);
                      }}
                      className="app-select"
                    >
                      <option value="">Todos los vendedores</option>
                      {vendedores.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.fullName} {v.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-wide block mb-1.5">
                    Estado
                  </label>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setPage(1);
                      }}
                      className="app-select"
                    >
                      <option value="">Todos los estados</option>
                      <option value="Por iniciar">Por iniciar</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-wide block mb-1.5">
                  Rango de fechas
                </label>
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
                    onClick={() => {
                      setPage(1);
                      loadRoute(startDate, endDate, selectedSaler || "todos");
                    }}
                    icon={HiFilter}
                  >
                    Filtrar
                  </PrincipalBUtton>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <SkeletonRoutes />
              ) : listRoutes.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide px-1 mb-1">
                    Mostrando {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalItems)} de {totalItems} rutas
                  </p>

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
                          className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${isSelected ? "border-[#D3423E] shadow-lg ring-4 ring-red-100" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}`}
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
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                  Progreso
                                </span>
                                <span className={`text-xs font-bold ${config?.textColor || "text-gray-900"}`}>
                                  {route.progress || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${route.progress || 0}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={`h-2 rounded-full ${config?.progressColor || "bg-gray-400"}`}
                                />
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-gray-100"
                              >
                                <div className="p-4 bg-gray-50 space-y-3">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white rounded-lg p-2 border border-gray-100">
                                      <p className="text-gray-500 text-[10px] uppercase font-bold">Creación</p>
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
                                      <p className="text-gray-500 text-[10px] uppercase font-bold">Paradas</p>
                                      <p className="font-black text-gray-900 text-base">{route.route?.length || 0}</p>
                                    </div>
                                  </div>

                                  {route.route && route.route.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2">
                                        Clientes en ruta
                                      </p>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {route.route.map((client, clientIdx) => (
                                          <div
                                            key={clientIdx}
                                            className="bg-white rounded-lg p-2.5 border border-gray-200 flex items-center gap-2"
                                          >
                                            <div
                                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white shadow-sm"
                                              style={{
                                                backgroundColor: client.visitStatus ? VISITED_COLOR : PENDING_COLOR,
                                              }}
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
                                            <span
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${client.visitStatus ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                                            >
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
                    <div className="pt-4 space-y-3">
                      <nav className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                          title="Primera"
                        >
                          ‹‹
                        </button>
                        <button
                          onClick={() => setPage(Math.max(page - 1, 1))}
                          disabled={page === 1}
                          className={`p-2 rounded-lg transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          <FaChevronLeft size={12} />
                        </button>
                        {visiblePages.map((num, idx) => {
                          const isGap = idx > 0 && num - visiblePages[idx - 1] > 1;
                          return (
                            <React.Fragment key={num}>
                              {isGap && <span className="text-gray-400 px-1">…</span>}
                              <button
                                onClick={() => setPage(num)}
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === num ? "bg-gradient-to-br from-[#D3423E] to-red-700 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}
                              >
                                {num}
                              </button>
                            </React.Fragment>
                          );
                        })}
                        <button
                          onClick={() => setPage(Math.min(page + 1, totalPages))}
                          disabled={page === totalPages}
                          className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          <FaChevronRight size={12} />
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                          className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                          title="Última"
                        >
                          ››
                        </button>
                      </nav>

                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="text-gray-500 font-medium">Mostrar</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="app-select"
                        >
                          {PAGE_SIZE_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-gray-500 font-medium">por página</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaRoute className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-700 font-bold">Sin rutas</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs">
                    No hay rutas para los filtros seleccionados. Intenta ajustar las fechas o el vendedor.
                  </p>
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
            mapContainerStyle={CONTAINER_STYLE}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: MAP_STYLE_MODERN,

            }}
          >
            <Marker
              position={DEFAULT_ZOOM}
              icon={window.google ? {
                url: buildDepotIcon(),
                scaledSize: new window.google.maps.Size(60, 60),
                anchor: new window.google.maps.Point(30, 30),
              } : null}
              title="IMCABEZ — Plaza Cobija"
              zIndex={2000}
            />

            <OverlayView
              position={DEFAULT_ZOOM}
              mapPaneName={OverlayView.OVERLAY_LAYER}
            >
              <div
                className="pointer-events-none select-none"
                style={{
                  transform: "translate(-50%, 42px)",
                  textAlign: "center",
                }}
              >
                <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wide">
                  IMCABEZ
                </span>
              </div>
            </OverlayView>

            {activeRoute && activeRoute.route && activeRoute.route
              .filter((c) => c.client_location)
              .map((client, index) => (
                <Marker
                  key={client._id || index}
                  position={{
                    lat: Number(client.client_location.latitud),
                    lng: Number(client.client_location.longitud),
                  }}
                  icon={{
                    url: buildPin(index, client.visitStatus),
                    scaledSize: new window.google.maps.Size(48, 48),
                    anchor: new window.google.maps.Point(24, 24),
                  }}
                  onClick={() => {
                    setSelectedClient(client);
                    findLocation(client);
                  }}
                  zIndex={1000 + index}
                />
              ))}

            {selectedClient && selectedClient.client_location && (
              <OverlayView
                position={{
                  lat: Number(selectedClient.client_location.latitud),
                  lng: Number(selectedClient.client_location.longitud),
                }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  style={{ transform: "translate(-50%, calc(-100% - 32px))" }}
                  className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-64"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="p-3 text-white flex items-center justify-between"
                    style={{ backgroundColor: selectedClient.visitStatus ? VISITED_COLOR : PENDING_COLOR }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-xs font-black flex-shrink-0">
                        {selectedClient.visitStatus ? "✓" : "!"}
                      </div>
                      <p className="text-xs font-black truncate uppercase tracking-wide">
                        {selectedClient.visitStatus ? "Visitado" : "Pendiente"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="text-white hover:bg-white/20 rounded p-1"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 text-sm mb-1.5 truncate">
                      {selectedClient.name} {selectedClient.lastName}
                    </h3>
                    {selectedClient.client_location?.direction && (
                      <p className="text-[11px] text-gray-600 flex items-start gap-1 mb-2">
                        <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0 mt-0.5" size={9} />
                        <span className="break-words">{selectedClient.client_location.direction}</span>
                      </p>
                    )}
                    {(selectedClient.visitTime || selectedClient.visitEndTime) && (
                      <div className="space-y-1 pt-2 border-t border-gray-100 mt-2">
                        {selectedClient.visitTime && (
                          <p className="text-[11px] text-gray-700 flex items-center gap-1.5">
                            <FaClock className="text-gray-400 flex-shrink-0" size={9} />
                            <span><strong>Tiempo:</strong> {selectedClient.visitTime}</span>
                          </p>
                        )}
                        {selectedClient.visitEndTime && (
                          <p className="text-[11px] text-gray-700 flex items-center gap-1.5">
                            <FaCalendarAlt className="text-gray-400 flex-shrink-0" size={9} />
                            <span><strong>Fecha:</strong> {formatDateToLocal(selectedClient.visitEndTime)}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: -10,
                      left: "50%",
                      transform: "translateX(-50%) rotate(45deg)",
                      width: 20,
                      height: 20,
                      backgroundColor: "white",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              </OverlayView>
            )}

            {routePath.length > 0 && (
              <>
                <Polyline
                  path={routePath}
                  options={{
                    strokeColor: ROUTE_HALO_COLOR,
                    strokeOpacity: 0.5,
                    strokeWeight: 12,
                    zIndex: 1,
                  }}
                />
                <Polyline
                  path={routePath}
                  options={{
                    strokeColor: ROUTE_COLOR,
                    strokeOpacity: 1,
                    strokeWeight: 5,
                    zIndex: 2,
                    icons: [
                      {
                        icon: {
                          path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW,
                          scale: 3.5,
                          strokeColor: "#fff",
                          strokeWeight: 1.5,
                          fillColor: ROUTE_COLOR_DARK,
                          fillOpacity: 1,
                        },
                        offset: "0",
                        repeat: "120px",
                      },
                    ],
                  }}
                />
              </>
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

        <div className="absolute top-4 left-4 z-10 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-200"
            title="Acercar"
          >
            <FaPlus size={13} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            title="Alejar"
          >
            <FaMinus size={13} />
          </button>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <button
              onClick={() => setShowViewOptions(!showViewOptions)}
              className="bg-white rounded-xl shadow-xl p-3 border border-gray-200 flex items-center gap-2 hover:shadow-2xl transition-all"
            >
              <FaCog className="text-gray-600" size={13} />
              <span className="text-xs font-bold text-gray-700">Vista</span>
              <FaChevronRight
                className={`text-gray-400 transition-transform ${showViewOptions ? "rotate-90" : "rotate-0"}`}
                size={9}
              />
            </button>

            {showViewOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewOptions(false)} />
                <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-20">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">Opciones</p>
                  </div>
                  <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FaLayerGroup className="text-gray-600" size={12} />
                      <span className="text-xs font-bold text-gray-700">Mostrar leyenda</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors ${showLegend ? "bg-[#D3423E]" : "bg-gray-300"} relative`}>
                      <div className={`absolute top-0.5 ${showLegend ? "left-4" : "left-0.5"} w-4 h-4 bg-white rounded-full transition-all`}></div>
                    </div>
                  </button>
                  {activeRoute && (
                    <button
                      onClick={() => { fitToRoute(); setShowViewOptions(false); }}
                      className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <FaExpand className="text-gray-600" size={12} />
                      <span className="text-xs font-bold text-gray-700">Ajustar a la ruta</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      mapRef.current?.panTo(DEFAULT_CENTER);
                      mapRef.current?.setZoom(15);
                      setShowViewOptions(false);
                    }}
                    className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    <FaBuilding className="text-[#D3423E]" size={12} />
                    <span className="text-xs font-bold text-gray-700">Ir al depósito</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {showLegend && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[210px]"
            >
              <p className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-1">
                <FaLayerGroup size={10} /> Leyenda
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-white shadow flex items-center justify-center">
                    <FaBuilding className="text-white" size={9} />
                  </div>
                  <span className="text-gray-700 font-medium">IMCABEZ (depósito)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: VISITED_COLOR }}>
                    ✓
                  </div>
                  <span className="text-gray-700 font-medium">Visitado</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: PENDING_COLOR }}>
                    2
                  </div>
                  <span className="text-gray-700 font-medium">Pendiente</span>
                </div>
                {routePath.length > 0 && (
                  <div className="flex items-center gap-2 text-xs pt-1 mt-1 border-t border-gray-100">
                    <div className="w-5 h-1 rounded-full" style={{ backgroundColor: ROUTE_COLOR }} />
                    <span className="text-gray-700 font-medium">Recorrido</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      

        {activeRoute && activeRoute.route && activeRoute.route.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">
                  Recorrido de la ruta
                </p>
              </div>
              <div className="flex overflow-x-auto space-x-2 pb-1">
                {activeRoute.route
                  .filter((c) => c.client_location)
                  .map((client, idx) => (
                    <motion.div
                      key={client._id || idx}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        findLocation(client);
                        setSelectedClient(client);
                      }}
                      className={`flex-shrink-0 flex items-center gap-2 p-2 border-2 rounded-xl cursor-pointer transition-all min-w-[230px] hover:shadow-md ${client.visitStatus ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white shadow-md"
                        style={{
                          backgroundColor: client.visitStatus ? VISITED_COLOR : PENDING_COLOR,
                        }}
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
            onClick={() => !deleting && setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaExclamationTriangle className="text-[#D3423E]" size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar ruta?</h2>
                  <p className="text-sm text-gray-600">
                    Estás a punto de eliminar <strong>"{showDeleteModal.details}"</strong>.
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteRoutes(showDeleteModal._id)}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 ${deleting ? "bg-gray-300 cursor-not-allowed" : "bg-[#D3423E] hover:bg-red-700"}`}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <FaTrash size={11} /> Eliminar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StatPill = ({ label, value }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm"
  >
    <p className="text-[9px] text-red-100 font-bold uppercase tracking-wide">{label}</p>
    <p className="text-lg font-black">{value}</p>
  </motion.div>
);

const SkeletonRoutes = () => (
  <div className="space-y-3">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="bg-white border-2 border-gray-200 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded" style={SHIMMER_STYLE} />
            <div className="h-3 w-1/2 rounded" style={SHIMMER_STYLE} />
          </div>
          <div className="h-6 w-20 rounded-full" style={SHIMMER_STYLE} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-20 rounded" style={SHIMMER_STYLE} />
          <div className="h-3 w-3 rounded" style={SHIMMER_STYLE} />
          <div className="h-3 w-20 rounded" style={SHIMMER_STYLE} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-2.5 w-16 rounded" style={SHIMMER_STYLE} />
            <div className="h-2.5 w-8 rounded" style={SHIMMER_STYLE} />
          </div>
          <div className="h-2 w-full rounded-full" style={SHIMMER_STYLE} />
        </div>
      </div>
    ))}
  </div>
);