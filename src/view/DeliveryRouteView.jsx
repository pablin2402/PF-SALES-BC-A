import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import axios from "axios";
import {
  useJsApiLoader, GoogleMap, Marker, DirectionsRenderer,
  OverlayView, Polygon,
} from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import {
  FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaRoute, FaTrash, FaCheck,
  FaPlus, FaMinus, FaBuilding, FaTimes, FaTruck, FaReceipt,
  FaInfoCircle, FaBoxes, FaMagic, FaClock, FaChartLine, FaRoad, FaWineBottle, FaCog, FaCity, FaLayerGroup, FaEye, FaEyeSlash, FaExpand,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import AlertModal from "../Components/modal/AlertModal";
import DateInput from "../Components/LittleComponents/DateInput";
import { motion, AnimatePresence } from "framer-motion";
import {
  optimizeRoutes,
  calculateOrderBoxes,
  calculateOrderPacking,
  getTripColor,
  formatDuration,
  MIN_ORDERS_TO_OPTIMIZE,
} from "../utils/RouteOptimizer";
import StackingPlanCard from "../utils/StackingPlanCard";
import {
  CHANNEL_CONFIG, getChannelConfig, buildMarkerIcon, CHANNEL_LIST,
  preloadChannelIcons,
} from "../utils/ClientMarkerIcons";
import {
  MUNICIPIOS_COCHABAMBA, getMunicipioForPoint, groupClientsByMunicipio,
} from "../utils/CochabambaMunicipios";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEPOT, DEFAULT_TRUCK_CAPACITY, DEFAULT_ZOOM } from "../utils/MapDetails";

export const GOOGLE_MAPS_LIBRARIES = ["maps"];

const ACCOUNT_STATUS_CONFIG = {
  "Crédito": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "CRÉDITO" },
  "Contado": { color: "bg-green-100 text-green-800 border-green-300", label: "CONTADO" },
  "Cheque": { color: "bg-blue-100 text-blue-800 border-blue-300", label: "CHEQUE" }
};

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const OPTIMIZATION_METHOD = "Nearest Neighbor + 2-opt + CVRP Capacity Split";

const SHIMMER_STYLE = {
  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s linear infinite",
};

const TABS = { PEDIDOS: "pedidos", PLAN: "plan" };

const buildOrderedChannelMarker = (orderIndex, channel, tripColor = "#D3423E", pulsing = false) => {
  const config = getChannelConfig(channel);
  const size = 52;
  const ringOpacity = pulsing ? 0.4 : 0;
  const imageSrc = config.imageBase64 || null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><filter id="ds-${orderIndex}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="0" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="ic-${orderIndex}"><circle cx="${size / 2}" cy="${size / 2}" r="20"/></clipPath></defs><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${tripColor}" opacity="${ringOpacity}"/><circle cx="${size / 2}" cy="${size / 2}" r="22" fill="white" stroke="${tripColor}" stroke-width="3" filter="url(#ds-${orderIndex})"/>${imageSrc ? `<image href="${imageSrc}" x="${size / 2 - 14}" y="${size / 2 - 14}" width="28" height="28" clip-path="url(#ic-${orderIndex})" preserveAspectRatio="xMidYMid meet"/>` : `<text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="${config.colorDark}">${config.emoji}</text>`}<circle cx="${size - 11}" cy="11" r="10" fill="${tripColor}" stroke="white" stroke-width="2"/><text x="${size - 11}" y="15" text-anchor="middle" fill="white" font-size="11" font-weight="900" font-family="Arial, sans-serif">${orderIndex + 1}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const buildDepotIcon = () => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><defs><filter id="depot-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="0" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="28" cy="28" r="24" fill="#111827" stroke="white" stroke-width="3" filter="url(#depot-shadow)"/><g transform="translate(15 14)" fill="white"><path d="M13 0 L0 10 L0 22 L26 22 L26 10 Z M11 22 L11 14 L15 14 L15 22" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g></svg>`)}`;

const generateGroupId = () => `OPT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export default function DeliveryRouteView() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [routeName, setRouteName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [markers, setMarkers] = useState([]);
  const [center,] = useState(DEPOT);
  const [mapZoom,] = useState(DEFAULT_ZOOM);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [vendedores, setVendedores] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  const [optimizationResult, setOptimizationResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [customCapacity, setCustomCapacity] = useState(null);
  const [selectedTripView, setSelectedTripView] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.PEDIDOS);

  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [showMunicipios, setShowMunicipios] = useState(true);
  const [showViewOptions, setShowViewOptions] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    preloadChannelIcons().then(() => setIconsReady(true));
  }, []);

  const selectedVendor = useMemo(
    () => vendedores.find(v => v._id === selectedSaler),
    [vendedores, selectedSaler]
  );

  const truckCapacity = useMemo(() => {
    if (customCapacity !== null) return customCapacity;
    return Number(selectedVendor?.truckCapacity) || DEFAULT_TRUCK_CAPACITY;
  }, [selectedVendor, customCapacity]);

  const currentLoad = useMemo(() => {
    return selectedMarkers.reduce((sum, m) => sum + calculateOrderBoxes(m), 0);
  }, [selectedMarkers]);

  const utilizationPct = Math.min(100, (currentLoad / truckCapacity) * 100);
  const isOverCapacity = currentLoad > truckCapacity;
  const canOptimize = markers.length >= MIN_ORDERS_TO_OPTIMIZE && selectedSaler;

  const filteredMarkers = useMemo(() => {
    if (!selectedMunicipio) return markers;
    return markers.filter(client => {
      const loc = client.id_client?.client_location || client.client_location;
      if (!loc?.latitud || !loc?.longitud) return false;
      const m = getMunicipioForPoint(loc.latitud, loc.longitud);
      return m?.id === selectedMunicipio;
    });
  }, [markers, selectedMunicipio]);

  const municipioGroups = useMemo(() => {
    const transformed = markers.map(m => ({
      ...m,
      client_location: m.id_client?.client_location || m.client_location,
    }));
    return groupClientsByMunicipio(transformed);
  }, [markers]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", {
        id_owner: user, page: 1, limit: 1000, searchTerm: "", active: true
      }, { headers: { Authorization: `Bearer ${token}` } });
      setVendedores(response.data.data || []);
    } catch (error) {
      console.error("Error fetching repartidores:", error);
      setVendedores([]);
    }
  }, [user, token]);

  const loadMarkersFromAPI = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user, page, limit: pageSize, fullName: searchTerm,
        salesId: selectedSaler, status: "aproved", region: "TOTAL CBB"
      };
      const response = await axios.post(API_URL + "/whatsapp/order/status/id", filters, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarkers(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalOrders(response.data.total || response.data.orders?.length || 0);
    } catch (error) {
      console.error("Error cargando órdenes", error);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, token, selectedSaler, page, pageSize]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { loadMarkersFromAPI(); }, [loadMarkersFromAPI]);
  useEffect(() => { setPage(1); }, [pageSize, selectedMunicipio]);

  const validateForm = () => routeName && startDate && endDate;

  const panToLocation = (location) => {
    if (location && location.client_location) {
      const lat = parseFloat(location.client_location.latitud);
      const lng = parseFloat(location.client_location.longitud);
      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        mapRef.current.panTo({ lat, lng });
      }
    }
  };

  const goToClientDetails = (client) => {
    navigate(`/client/${client._id}`, { state: { client } });
  };

  const cleanData = () => {
    setRouteName(""); setSelectedSaler(""); setSelectedMarkers([]);
    setStartDate(""); setEndDate(""); setOptimizationResult(null);
    setSelectedTripView(null); setCustomCapacity(null);
    setActiveTab(TABS.PEDIDOS);
  };

  const handleZoomIn = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(Math.min(z + 1, 22));
  };

  const handleZoomOut = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(Math.max(z - 1, 3));
  };

  const fitToMarkers = (clientList) => {
    if (!mapRef.current || !window.google || clientList.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    let has = false;
    clientList.forEach(c => {
      const loc = c.client_location || c.id_client?.client_location;
      const lat = Number(loc?.latitud);
      const lng = Number(loc?.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng });
        has = true;
      }
    });
    if (has) {
      bounds.extend(DEPOT);
      mapRef.current.fitBounds(bounds, { top: 100, right: 240, bottom: 200, left: 100 });
    }
  };

  const fitMunicipio = (municipioId) => {
    if (!mapRef.current || !window.google) return;
    const m = MUNICIPIOS_COCHABAMBA[municipioId];
    if (!m) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: m.bounds.north, lng: m.bounds.east });
    bounds.extend({ lat: m.bounds.south, lng: m.bounds.west });
    mapRef.current.fitBounds(bounds, { top: 100, right: 240, bottom: 200, left: 100 });
  };

  const handleOptimize = async () => {
    if (!selectedSaler) {
      setAlertMessage("Selecciona un repartidor primero para conocer su capacidad de camión.");
      setAlertModal(true);
      return;
    }
    if (markers.length < MIN_ORDERS_TO_OPTIMIZE) {
      setAlertMessage(`Necesitas al menos ${MIN_ORDERS_TO_OPTIMIZE} pedidos para optimizar la ruta automáticamente.`);
      setAlertModal(true);
      return;
    }
    setIsOptimizing(true);
    setOptimizationResult(null);
    await new Promise(resolve => setTimeout(resolve, 600));
    const sourceOrders = selectedMarkers.length > 0
      ? selectedMarkers.map(sm => markers.find(m => m._id === sm._id) || sm)
      : markers;
    if (sourceOrders.length === 0) {
      setAlertMessage("No hay pedidos disponibles para optimizar.");
      setAlertModal(true);
      setIsOptimizing(false);
      return;
    }
    const enrichedOrders = sourceOrders.map(o => ({
      ...o,
      client_location: o.client_location || o.id_client?.client_location,
    }));
    const result = optimizeRoutes(enrichedOrders, truckCapacity, DEPOT);
    setOptimizationResult(result);
    setIsOptimizing(false);
    if (result.trips.length > 0) {
      const firstTrip = result.trips[0];
      setSelectedMarkers(firstTrip.orders.map(buildMarkerFromOrder));
      setSelectedTripView(1);
      setActiveTab(TABS.PLAN);
      setTimeout(() => fitToMarkers(firstTrip.orders), 400);
    }
  };

  const buildMarkerFromOrder = (location) => ({
    _id: location._id,
    region: location.region,
    orderStatus: location.orderStatus,
    pagosAcumulados: location.pagosConAcumulado,
    products: location.products,
    salesId: location.salesId,
    receiveNumber: location.receiveNumber,
    totalAmount: location.totalAmount,
    totalPagado: location.totalPagado,
    accountStatus: location.accountStatus,
    clientId: location.id_client?._id,
    name: location.id_client?.name,
    lastName: location.id_client?.lastName,
    profilePicture: location.id_client?.identificationImage,
    userCategory: location.id_client?.userCategory || location.userCategory,
    client_location: location.id_client?.client_location || location.client_location,
    visitStatus: false, visitStatus1: "Sin visitar", visitTime: null,
    orderTaken: false, visitStartTime: null, visitEndTime: null,
    tripTime: null, distanceTrip: null, timeToPlace: null,
  });

  const handleViewTrip = (tripNumber) => {
    if (!optimizationResult) return;
    const trip = optimizationResult.trips.find(t => t.tripNumber === tripNumber);
    if (!trip) return;
    setSelectedMarkers(trip.orders.map(buildMarkerFromOrder));
    setSelectedTripView(tripNumber);
    setTimeout(() => fitToMarkers(trip.orders), 200);
  };

  const buildClientsZonesBreakdown = (orders) => {
    const breakdown = {};
    orders.forEach(o => {
      const loc = o.client_location || o.id_client?.client_location;
      if (!loc?.latitud || !loc?.longitud) return;
      const m = getMunicipioForPoint(loc.latitud, loc.longitud);
      const zoneName = m?.name || "Sin zona";
      breakdown[zoneName] = (breakdown[zoneName] || 0) + 1;
    });
    return Object.entries(breakdown).map(([zone, count]) => ({ zone, count }));
  };

  const buildOperationalNotes = (trip, totalTrips, isOversized) => {
    const notes = [];
    if (totalTrips > 1) {
      notes.push(`Viaje ${trip.tripNumber} de ${totalTrips} generado por división automática (CVRP)`);
    }
    if (isOversized) {
      notes.push(`Este viaje excede capacidad nominal del camión (${trip.boxes}/${trip.capacity} cajas)`);
    }
    if (trip.orders.length === 1) {
      notes.push("Viaje con un solo cliente — considerar agrupar con otros pedidos");
    }
    if (trip.utilization >= 95) {
      notes.push("Utilización óptima del camión (>=95%)");
    } else if (trip.utilization < 50) {
      notes.push("Baja utilización del camión (<50%) — capacidad disponible para más pedidos");
    }
    return notes;
  };

  const handleCreateAllRoutes = async () => {
    if (!optimizationResult || !validateForm()) return;
    setCreating(true);
    const groupId = generateGroupId();
    const createdAt = new Date().toISOString();

    try {
      let successCount = 0;
      for (const trip of optimizationResult.trips) {
        const tripMarkers = trip.orders.map(buildMarkerFromOrder);
        const clientsZones = buildClientsZonesBreakdown(trip.orders);
        const operationalNotes = buildOperationalNotes(
          trip,
          optimizationResult.trips.length,
          trip.oversized
        );

        const routeData = {
          details: `${routeName} · Viaje ${trip.tripNumber}/${optimizationResult.trips.length}`,
          delivery: selectedSaler,
          route: tripMarkers,
          id_owner: user,
          status: "Por iniciar",
          startDate,
          endDate,
          progress: 0,
          tripNumber: trip.tripNumber,
          totalTrips: optimizationResult.trips.length,
          estimatedDistance: trip.distance,
          estimatedTime: trip.estimatedTime,
          capacity: truckCapacity,
          totalBoxes: trip.boxes,
          fullBoxes: trip.fullBoxes,
          halfBoxes: trip.halfBoxes,
          looseBottles: trip.looseBottles,
          totalBottles: trip.totalBottles,
          utilization: trip.utilization,
          oversized: !!trip.oversized,
          optimizationMethod: OPTIMIZATION_METHOD,
          groupId,
          createdAt,
          depotCoords: DEPOT,
          truckCapacityUsed: truckCapacity,
          totalAmount: trip.orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
          stackingPlan: trip.stackingPlan || null,
          clientsZones,
          operationalNotes,
          routeMetrics: {
            avgUtilization: optimizationResult.stats.avgUtilization,
            totalGroupDistance: optimizationResult.stats.totalDistance,
            totalGroupBoxes: optimizationResult.stats.totalBoxes,
            totalGroupOrders: optimizationResult.stats.totalOrders,
          },
        };

        const response = await axios.post(API_URL + "/whatsapp/delivert/route", routeData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          await Promise.all(tripMarkers.map(async (marker) => {
            const res = await axios.put(API_URL + "/whatsapp/order/status/id", {
              _id: marker._id, id_owner: user,
              receiveNumber: marker.receiveNumber,
              orderTrackId: selectedSaler, orderStatus: "En Ruta"
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.status === 200) {
              await axios.post(API_URL + "/whatsapp/order/track", {
                orderId: marker._id,
                eventType: `Asignado a viaje ${trip.tripNumber}/${optimizationResult.trips.length} (CVRP)`,
                triggeredBySalesman: "", triggeredByDelivery: selectedSaler,
                triggeredByUser: "", location: { lat: 0, lng: 0 }
              }, { headers: { Authorization: `Bearer ${token}` } });
            }
          }));
          successCount++;
        }
      }

      if (successCount === optimizationResult.trips.length) {
        loadMarkersFromAPI();
        setIsOpen(false);
        cleanData();
      }
    } catch (error) {
      console.error("Error al crear rutas:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSingleRoute = async () => {
    if (!validateForm()) return;
    setCreating(true);
    const groupId = generateGroupId();
    const createdAt = new Date().toISOString();
    const clientsZones = buildClientsZonesBreakdown(selectedMarkers);

    const routeData = {
      details: routeName,
      delivery: selectedSaler,
      route: selectedMarkers,
      id_owner: user,
      status: "Por iniciar",
      startDate,
      endDate,
      progress: 0,
      capacity: truckCapacity,
      totalBoxes: currentLoad,
      utilization: Math.round((currentLoad / truckCapacity) * 100),
      optimizationMethod: "Manual",
      groupId,
      createdAt,
      depotCoords: DEPOT,
      truckCapacityUsed: truckCapacity,
      totalAmount: selectedMarkers.reduce((s, m) => s + (Number(m.totalAmount) || 0), 0),
      clientsZones,
      operationalNotes: ["Ruta creada manualmente por el administrador sin aplicar optimización automática"],
    };

    try {
      const response = await axios.post(API_URL + "/whatsapp/delivert/route", routeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        await Promise.all(selectedMarkers.map(async (marker) => {
          const res = await axios.put(API_URL + "/whatsapp/order/status/id", {
            _id: marker._id, id_owner: user,
            receiveNumber: marker.receiveNumber,
            orderTrackId: selectedSaler, orderStatus: "En Ruta"
          }, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 200) {
            await axios.post(API_URL + "/whatsapp/order/track", {
              orderId: marker._id,
              eventType: "Ha sido asignado como repartidor (ruta manual)",
              triggeredBySalesman: "", triggeredByDelivery: selectedSaler,
              triggeredByUser: "", location: { lat: 0, lng: 0 }
            }, { headers: { Authorization: `Bearer ${token}` } });
          }
        }));
        loadMarkersFromAPI();
        setIsOpen(false);
        cleanData();
      }
    } catch (error) {
      console.error("Error al crear la ruta:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateRoute = optimizationResult && optimizationResult.trips.length > 1
    ? handleCreateAllRoutes
    : handleCreateSingleRoute;

  const handleDelete = (clientId) => {
    setSelectedMarkers((prev) => prev.filter(client => client._id !== clientId));
  };

  const moveClient = (index, direction) => {
    setSelectedMarkers((prev) => {
      const newArr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr;
    });
  };

  useEffect(() => {
    if (!isLoaded || !window.google) return;
    if (selectedMarkers.length > 1) {
      const routePoints = selectedMarkers.filter(c => c.client_location);
      if (routePoints.length < 2) { setDirectionsResponse(null); return; }
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
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin, destination, waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      }, (result, status) => {
        if (status === "OK") setDirectionsResponse(result);
      });
    } else {
      setDirectionsResponse(null);
    }
  }, [selectedMarkers, isLoaded]);

  const handleMarkerClick = (location) => {
    if (!selectedSaler) {
      setAlertMessage("Por favor, seleccione un repartidor antes de agregar pedidos a la ruta.");
      setAlertModal(true);
      return;
    }
    const orderBoxes = calculateOrderBoxes(location);
    const newLoad = currentLoad + orderBoxes;
    if (newLoad > truckCapacity && !selectedMarkers.find(m => m._id === location._id)) {
      setAlertMessage(
        `Este pedido excede la capacidad del camión.\n\nCarga actual: ${currentLoad} cajas\nCarga del pedido: ${orderBoxes} cajas\nCapacidad máxima: ${truckCapacity} cajas\n\nUsa "Optimizar ruta" para dividir automáticamente en viajes.`
      );
      setAlertModal(true);
      return;
    }
    setSelectedMarkers((prev) => {
      if (!prev.find((item) => item._id === location._id)) {
        return [...prev, buildMarkerFromOrder(location)];
      }
      return prev;
    });
  };

  const isClientSelected = (clientId) => selectedMarkers.some(m => m._id === clientId);
  const totalAmount = selectedMarkers.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[460px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="px-5 pt-4 pb-3 bg-gradient-to-br from-[#D3423E] to-red-700 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaTruck size={18} />
                  <div>
                    <h1 className="text-base font-bold leading-tight">Rutas de entrega</h1>
                    <p className="text-[10px] text-red-100">
                      {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} disponible{totalOrders !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <FaChevronLeft size={12} />
                </button>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <FaTruck size={13} />
                    </div>
                    <select
                      value={selectedSaler}
                      onChange={(e) => {
                        setSelectedSaler(e.target.value);
                        setPage(1);
                        setOptimizationResult(null);
                        setCustomCapacity(null);
                        setActiveTab(TABS.PEDIDOS);
                      }}
                      className="app-select"
                      style={{ colorScheme: "light" }}
                    >
                      <option value="" className="text-gray-700 bg-white">Sin repartidor asignado</option>
                      {vendedores.map((v) => (
                        <option key={v._id} value={v._id} className="text-gray-900 bg-white">
                          {v.fullName} {v.lastName}
                          {v.truckCapacity && ` · ${v.truckCapacity} cajas`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedSaler && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <FaBoxes size={10} className="text-red-100" />
                        <span className="text-[10px] font-bold text-red-100 uppercase">Capacidad</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-100">{Math.round(utilizationPct)}%</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-xl font-black ${isOverCapacity ? 'text-yellow-200' : 'text-white'}`}>
                        {currentLoad}
                      </span>
                      <span className="text-xs text-red-100 font-bold">/{truckCapacity} cajas</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${utilizationPct}%` }}
                        transition={{ duration: 0.4 }}
                        className={`h-full rounded-full ${isOverCapacity ? 'bg-yellow-300' : 'bg-white'}`}
                      />
                    </div>
                    {isOverCapacity && (
                      <p className="text-[10px] text-yellow-200 font-bold mt-1.5 flex items-start gap-1">
                        <FaInfoCircle className="mt-0.5 shrink-0" size={9} />
                        Excede {currentLoad - truckCapacity} cajas. Optimiza para dividir.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 pt-3 pb-2 border-b border-gray-200 bg-white">
              <div className="relative mb-2.5">
                <TextInputFilter
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onEnter={() => loadMarkersFromAPI()}
                  placeholder="Buscar pedido por cliente..."
                />
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <select
                  value={selectedMunicipio}
                  onChange={(e) => {
                    setSelectedMunicipio(e.target.value);
                    if (e.target.value) fitMunicipio(e.target.value);
                  }}
                  className="app-select"
                >
                  <option value="">Todas las zonas</option>
                  {Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({municipioGroups[m.id]?.count || 0})
                    </option>
                  ))}
                </select>
                {selectedMunicipio && (
                  <button
                    onClick={() => setSelectedMunicipio("")}
                    className="px-2 py-2 text-xs text-gray-500 hover:text-[#D3423E]"
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>

              <motion.button
                whileHover={canOptimize ? { scale: 1.01 } : {}}
                whileTap={canOptimize ? { scale: 0.99 } : {}}
                onClick={handleOptimize}
                disabled={!canOptimize || isOptimizing}
                className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden ${!canOptimize
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-[#D3423E] to-red-700 text-white shadow-md hover:shadow-lg'
                  }`}
              >
                {isOptimizing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <FaMagic size={13} />
                    </motion.div>
                    Optimizando rutas...
                  </>
                ) : (
                  <>
                    <FaMagic size={13} />
                    {!selectedSaler ? "Selecciona un repartidor"
                      : markers.length < MIN_ORDERS_TO_OPTIMIZE ? `Mínimo ${MIN_ORDERS_TO_OPTIMIZE} pedidos (${markers.length} actuales)`
                        : `Optimizar ruta automáticamente`}
                  </>
                )}
              </motion.button>

              {selectedMarkers.length > 0 && !optimizationResult && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="w-full mt-2 px-4 py-2 bg-white border-2 border-[#D3423E] text-[#D3423E] font-bold text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FaRoute size={12} />
                  Crear ruta manual ({selectedMarkers.length})
                </button>
              )}
            </div>

            {optimizationResult && (
              <div className="flex border-b border-gray-200 bg-white">
                <button
                  onClick={() => setActiveTab(TABS.PLAN)}
                  className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${activeTab === TABS.PLAN
                    ? "text-[#D3423E] border-b-2 border-[#D3423E] bg-red-50/30"
                    : "text-gray-500 hover:text-gray-700"}`}
                >
                  <FaMagic size={11} />
                  Plan ({optimizationResult.trips.length})
                </button>
                <button
                  onClick={() => setActiveTab(TABS.PEDIDOS)}
                  className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${activeTab === TABS.PEDIDOS
                    ? "text-[#D3423E] border-b-2 border-[#D3423E] bg-red-50/30"
                    : "text-gray-500 hover:text-gray-700"}`}
                >
                  <FaReceipt size={11} />
                  Pedidos ({totalOrders})
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {isOptimizing ? (
                <PlanSkeletonLoader />
              ) : optimizationResult && activeTab === TABS.PLAN ? (
                <PlanOptimizadoPanel
                  optimizationResult={optimizationResult}
                  selectedTripView={selectedTripView}
                  onViewTrip={handleViewTrip}
                  onClearOptimization={() => {
                    setOptimizationResult(null);
                    setSelectedTripView(null);
                    setActiveTab(TABS.PEDIDOS);
                  }}
                  onCreate={() => setIsOpen(true)}
                />
              ) : (
                <PedidosListPanel
                  loading={loading}
                  markers={filteredMarkers}
                  totalOrders={totalOrders}
                  isClientSelected={isClientSelected}
                  panToLocation={panToLocation}
                  goToClientDetails={goToClientDetails}
                  handleDelete={handleDelete}
                  handleMarkerClick={handleMarkerClick}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  selectedMunicipio={selectedMunicipio}
                />
              )}
            </div>
          </>
        )}

        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex h-full w-full rounded-r-xl border-4 border-red-700 items-center justify-center hover:bg-gray-100 flex-col gap-2"
          >
            <FaChevronRight className="text-red-700" />
            {selectedMarkers.length > 0 && (
              <div className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-bold">
                {selectedMarkers.length}
              </div>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 h-full relative bg-gray-200">
        {isLoaded ? (
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
              styles: MAP_STYLE_MODERN,

            }}
          >
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
                  <div
                    className="pointer-events-none select-none"
                    style={{
                      transform: "translate(-50%, -50%)",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      textShadow: "1px 1px 3px white, -1px -1px 3px white, 1px -1px 3px white, -1px 1px 3px white",
                      opacity: 0.75,
                    }}
                  >
                    {m.name}
                  </div>
                </OverlayView>
              </React.Fragment>
            ))}

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

            {filteredMarkers.length > 0 && filteredMarkers.map((location, index) => {
              const loc = location.id_client?.client_location || location.client_location;
              if (!loc?.latitud || !loc?.longitud) return null;
              const isSelected = selectedMarkers.some(m => m._id === location._id);
              if (isSelected) return null;
              const channel = location.id_client?.userCategory || location.userCategory;
              const icon = window.google && iconsReady
                ? buildMarkerIcon(channel, window.google.maps, false)
                : null;
              return (
                <Marker
                  key={`avail-${location._id || index}`}
                  position={{ lat: Number(loc.latitud), lng: Number(loc.longitud) }}
                  icon={icon}
                  onClick={() => handleMarkerClick(location)}
                  zIndex={1}
                />
              );
            })}

            {selectedMarkers.map((client, index) => {
              if (!client.client_location?.latitud || !client.client_location?.longitud) return null;
              const tripColor = selectedTripView ? getTripColor(selectedTripView) : "#D3423E";
              return (
                <Marker
                  key={`sel-${client._id}`}
                  position={{
                    lat: Number(client.client_location.latitud),
                    lng: Number(client.client_location.longitud),
                  }}
                  icon={window.google ? {
                    url: buildOrderedChannelMarker(index, client.userCategory, tripColor),
                    scaledSize: new window.google.maps.Size(52, 52),
                    anchor: new window.google.maps.Point(26, 26),
                  } : null}
                  onClick={() => handleDelete(client._id)}
                  zIndex={1000 + index}
                />
              );
            })}

            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  polylineOptions: {
                    strokeColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E",
                    strokeOpacity: 0.85,
                    strokeWeight: 5,
                  },
                  suppressMarkers: true,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <MapSkeleton />
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <button onClick={handleZoomIn} className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-200" title="Acercar">
            <FaPlus size={13} />
          </button>
          <button onClick={handleZoomOut} className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors" title="Alejar">
            <FaMinus size={13} />
          </button>
        </div>

        <div className="absolute top-4 right-4 z-20">
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
                    <p className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">Capas del mapa</p>
                  </div>
                  <button
                    onClick={() => setShowMunicipios(!showMunicipios)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FaCity className="text-gray-600" size={12} />
                      <span className="text-xs font-bold text-gray-700">Zonas municipales</span>
                    </div>
                    {showMunicipios ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
                  </button>
                  <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <FaLayerGroup className="text-gray-600" size={12} />
                      <span className="text-xs font-bold text-gray-700">Leyenda</span>
                    </div>
                    {showLegend ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
                  </button>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => { fitToMarkers(filteredMarkers); setShowViewOptions(false); }}
                      className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <FaExpand className="text-gray-600" size={12} />
                      <span className="text-xs font-bold text-gray-700">Ver todos los pedidos</span>
                    </button>
                    {selectedMarkers.length > 0 && (
                      <button
                        onClick={() => { fitToMarkers(selectedMarkers); setShowViewOptions(false); }}
                        className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-t border-gray-100"
                      >
                        <FaRoute className="text-[#D3423E]" size={12} />
                        <span className="text-xs font-bold text-gray-700">Ver ruta completa</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`absolute right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[210px] max-h-[55vh] overflow-y-auto ${selectedMarkers.length > 0 ? 'bottom-[150px]' : 'bottom-4'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                <FaLayerGroup size={10} /> Leyenda
              </p>
              <button
                onClick={() => setShowLegend(false)}
                className="text-gray-400 hover:text-gray-700 p-0.5 hover:bg-gray-100 rounded"
              >
                <FaTimes size={10} />
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-gray-900 border-2 border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-[8px]">⌂</span>
                </div>
                <span className="text-gray-700 font-medium">Depósito</span>
              </div>
              {CHANNEL_LIST.map(channel => {
                const conf = CHANNEL_CONFIG[channel];
                return (
                  <div key={channel} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[9px]"
                      style={{ backgroundColor: conf.color }}
                    >
                      {conf.emoji}
                    </div>
                    <span className="text-gray-700 font-medium">{channel}</span>
                  </div>
                );
              })}
              {optimizationResult && (
                <div className="pt-1.5 mt-1 border-t border-gray-100">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Viajes</p>
                  {optimizationResult.trips.map(trip => (
                    <div key={trip.tripNumber} className="flex items-center gap-2 text-xs mb-1">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: getTripColor(trip.tripNumber) }}
                      >
                        {trip.tripNumber}
                      </div>
                      <span className="text-gray-700">Viaje {trip.tripNumber}</span>
                    </div>
                  ))}
                </div>
              )}
              {showMunicipios && (
                <div className="pt-1.5 mt-1 border-t border-gray-100">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Zonas</p>
                  {Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-xs mb-0.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.accent }} />
                      <span className="text-gray-700 flex-1">{m.name}</span>
                      <span className="text-[10px] font-bold text-gray-500">
                        {municipioGroups[m.id]?.count || 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className={`absolute right-4 z-10 bg-white rounded-full shadow-lg p-2.5 border border-gray-200 hover:shadow-xl transition-all ${selectedMarkers.length > 0 ? 'bottom-[150px]' : 'bottom-4'
              }`}
            title="Mostrar leyenda"
          >
            <FaLayerGroup className="text-gray-600" size={13} />
          </button>
        )}

        {selectedMarkers.length > 0 && (
          <SelectedRouteBar
            selectedMarkers={selectedMarkers}
            selectedTripView={selectedTripView}
            currentLoad={currentLoad}
            totalAmount={totalAmount}
            moveClient={moveClient}
            panToLocation={panToLocation}
            handleDelete={handleDelete}
          />
        )}
      </div>

      <CreateRouteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        optimizationResult={optimizationResult}
        selectedMarkers={selectedMarkers}
        totalAmount={totalAmount}
        currentLoad={currentLoad}
        truckCapacity={truckCapacity}
        vendedores={vendedores}
        selectedSaler={selectedSaler}
        routeName={routeName}
        setRouteName={setRouteName}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        creating={creating}
        validateForm={validateForm}
        handleCreateRoute={handleCreateRoute}
      />

      <AlertModal show={alertModal} onClose={() => setAlertModal(false)} message={alertMessage} />
    </div>
  );
}

const PedidoSkeleton = () => (
  <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
    <div className="flex gap-3 p-3">
      <div className="w-14 h-14 rounded-xl flex-shrink-0" style={SHIMMER_STYLE} />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded" style={SHIMMER_STYLE} />
        <div className="h-3 w-1/2 rounded" style={SHIMMER_STYLE} />
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded" style={SHIMMER_STYLE} />
          <div className="h-4 w-16 rounded" style={SHIMMER_STYLE} />
          <div className="h-4 w-10 rounded" style={SHIMMER_STYLE} />
        </div>
      </div>
    </div>
    <div className="px-3 pb-3 space-y-2">
      <div className="h-12 rounded-lg" style={SHIMMER_STYLE} />
      <div className="h-3 w-full rounded" style={SHIMMER_STYLE} />
      <div className="flex justify-between items-center">
        <div className="h-4 w-20 rounded" style={SHIMMER_STYLE} />
        <div className="h-7 w-20 rounded-lg" style={SHIMMER_STYLE} />
      </div>
    </div>
  </div>
);

const PedidosSkeletonLoader = () => (
  <div className="p-4 space-y-3">
    <div className="flex justify-between items-center px-1 mb-1">
      <div className="h-3 w-32 rounded" style={SHIMMER_STYLE} />
    </div>
    {[0, 1, 2, 3].map(i => <PedidoSkeleton key={i} />)}
  </div>
);

const PlanSkeletonLoader = () => (
  <div className="p-4">
    <div className="bg-gradient-to-br from-red-50 to-red-100/40 rounded-xl border border-red-200 p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg" style={SHIMMER_STYLE} />
          <div className="space-y-1.5">
            <div className="h-3 w-32 rounded" style={SHIMMER_STYLE} />
            <div className="h-2.5 w-24 rounded" style={SHIMMER_STYLE} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-2 border border-red-100 text-center space-y-1">
            <div className="h-3 w-3 rounded mx-auto" style={SHIMMER_STYLE} />
            <div className="h-3 w-8 rounded mx-auto" style={SHIMMER_STYLE} />
            <div className="h-2 w-10 rounded mx-auto" style={SHIMMER_STYLE} />
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-2 mb-3 px-1">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <FaMagic className="text-[#D3423E]" size={11} />
      </motion.div>
      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide" style={{ animation: "pulse-soft 1.5s ease-in-out infinite" }}>
        Calculando viajes óptimos...
      </p>
    </div>

    <div className="space-y-2 mb-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white rounded-xl border-2 border-gray-100 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg" style={SHIMMER_STYLE} />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-20 rounded" style={SHIMMER_STYLE} />
              <div className="h-2.5 w-28 rounded" style={SHIMMER_STYLE} />
            </div>
            <div className="text-right space-y-1">
              <div className="h-3 w-12 rounded ml-auto" style={SHIMMER_STYLE} />
              <div className="h-2 w-8 rounded ml-auto" style={SHIMMER_STYLE} />
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full" style={SHIMMER_STYLE} />
          <div className="flex gap-1.5">
            <div className="h-4 w-12 rounded" style={SHIMMER_STYLE} />
            <div className="h-4 w-12 rounded" style={SHIMMER_STYLE} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MapSkeleton = () => (
  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-[#D3423E]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <FaMapMarkerAlt className="text-[#D3423E]" size={24} />
        </div>
      </div>
      <p className="text-gray-700 font-bold text-sm">Cargando mapa...</p>
      <p className="text-gray-500 text-xs mt-1">Esto puede tardar unos segundos</p>
    </div>
  </div>
);



const PlanOptimizadoPanel = ({
  optimizationResult, selectedTripView, onViewTrip, onClearOptimization, onCreate
}) => (
  <div className="p-4">
    <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200 p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D3423E] to-red-700 flex items-center justify-center shadow-sm">
            <FaMagic className="text-white" size={11} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase">Plan optimizado</p>
            <p className="text-[10px] text-gray-500">
              {optimizationResult.trips.length} viaje{optimizationResult.trips.length !== 1 ? "s" : ""} · {optimizationResult.stats.totalOrders} pedidos
            </p>
          </div>
        </div>
        <button
          onClick={onClearOptimization}
          className="text-gray-400 hover:text-[#D3423E] hover:bg-white p-1.5 rounded-lg transition-colors"
          title="Limpiar optimización"
        >
          <FaTimes size={11} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <MetricCard icon={FaTruck} label="Viajes" value={optimizationResult.stats.totalTrips} />
        <MetricCard icon={FaBoxes} label="Cajas" value={optimizationResult.stats.totalBoxes} />
        <MetricCard icon={FaWineBottle} label="Botellas" value={optimizationResult.stats.totalBottles} />
        <MetricCard icon={FaChartLine} label="Uso" value={`${optimizationResult.stats.avgUtilization}%`} />
      </div>
    </div>

    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
      Viajes propuestos · click para visualizar
    </p>

    <div className="space-y-2 mb-4">
      {optimizationResult.trips.map((trip) => (
        <TripCard
          key={trip.tripNumber}
          trip={trip}
          isSelected={selectedTripView === trip.tripNumber}
          onClick={() => onViewTrip(trip.tripNumber)}
        />
      ))}
    </div>

    <button
      onClick={onCreate}
      className="w-full px-4 py-3 bg-gradient-to-br from-[#D3423E] to-red-700 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm shadow-md"
    >
      <FaCheck size={12} />
      Crear {optimizationResult.trips.length} ruta{optimizationResult.trips.length !== 1 ? 's' : ''}
    </button>
  </div>
);

const TripCard = ({ trip, isSelected, onClick }) => {
  const [showStacking, setShowStacking] = useState(false);
  return (
    <div
      className={`rounded-xl border-2 transition-all overflow-hidden ${isSelected ? 'bg-white shadow-md' : 'bg-white/70 hover:bg-white'}`}
      style={{ borderColor: isSelected ? getTripColor(trip.tripNumber) : 'transparent' }}
    >
      <div onClick={onClick} className="cursor-pointer p-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0"
            style={{ backgroundColor: getTripColor(trip.tripNumber) }}
          >
            {trip.tripNumber}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              Viaje {trip.tripNumber}
              {trip.oversized && <span className="ml-1 text-[9px] text-red-600">EXCEDE</span>}
            </p>
            <p className="text-[10px] text-gray-500">
              {trip.orders.length} entregas · {trip.totalBottles} botellas
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black" style={{ color: getTripColor(trip.tripNumber) }}>
              {trip.boxes}<span className="text-xs text-gray-400 font-bold">/{trip.capacity}</span>
            </p>
            <p className="text-[10px] text-gray-500">cajas</p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${trip.utilization}%`, backgroundColor: getTripColor(trip.tripNumber) }} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {trip.fullBoxes > 0 && (
            <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">{trip.fullBoxes} × 12</span>
          )}
          {trip.halfBoxes > 0 && (
            <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{trip.halfBoxes} × 6</span>
          )}
          {trip.looseBottles > 0 && (
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{trip.looseBottles} sueltas</span>
          )}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><FaRoad size={9} /> {trip.distance} km</span>
          <span className="flex items-center gap-1"><FaClock size={9} /> {formatDuration(trip.estimatedTime)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowStacking(!showStacking); }}
            className="font-bold flex items-center gap-1 hover:underline transition-colors"
            style={{ color: getTripColor(trip.tripNumber) }}
          >
            <FaBoxes size={9} />
            {showStacking ? "Ocultar apilado" : "Ver apilado"}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showStacking && trip.stackingPlan && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200"
          >
            <div className="p-3 bg-gray-50">
              <StackingPlanCard stackingPlan={trip.stackingPlan} tripColor={getTripColor(trip.tripNumber)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PedidosListPanel = ({
  loading, markers, totalOrders, isClientSelected, panToLocation, goToClientDetails,
  handleDelete, handleMarkerClick, page, setPage, totalPages,
  pageSize, setPageSize, selectedMunicipio,
}) => {
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, page - 1, page, page + 1, totalPages];
  }, [page, totalPages]);

  if (loading) return <PedidosSkeletonLoader />;

  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FaReceipt className="text-gray-300 text-3xl" />
        </div>
        <p className="text-gray-700 font-semibold">
          {selectedMunicipio ? "Sin pedidos en esta zona" : "Sin pedidos aprobados"}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {selectedMunicipio ? "Prueba con otra zona o limpia el filtro" : "No hay pedidos disponibles para asignar"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide px-1">
        <span>
          {selectedMunicipio
            ? `${markers.length} en esta zona`
            : `Mostrando ${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, totalOrders)} de ${totalOrders}`}
        </span>
      </div>

      {markers.map((client) => {
        const isSelected = isClientSelected(client._id);
        const accountConfig = ACCOUNT_STATUS_CONFIG[client.accountStatus];
        const packing = calculateOrderPacking(client);
        const channelConf = getChannelConfig(client.id_client?.userCategory);
        const loc = client.id_client?.client_location;
        const muni = loc?.latitud ? getMunicipioForPoint(loc.latitud, loc.longitud) : null;
        return (
          <div
            key={client._id}
            onClick={() => panToLocation({ client_location: loc })}
            className={`bg-white border-2 rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-md ${isSelected ? 'border-[#D3423E] shadow-md ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex gap-3 p-3">
              <div className="relative flex-shrink-0">
                <img
                  className="w-14 h-14 object-cover rounded-xl bg-gray-100"
                  src={client.id_client.identificationImage || FALLBACK_IMAGE}
                  alt={client.id_client.name}
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[11px] shadow-sm"
                  style={{ backgroundColor: channelConf.color }}
                >
                  {channelConf.emoji}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={(e) => { e.stopPropagation(); goToClientDetails(client); }}
                    className="font-bold text-gray-900 text-sm truncate hover:text-[#D3423E]"
                  >
                    {client.id_client.name} {client.id_client.lastName}
                  </h3>
                  {isSelected && (
                    <span className="flex-shrink-0 w-5 h-5 bg-[#D3423E] text-white rounded-full flex items-center justify-center">
                      <FaCheck size={9} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                  <FaReceipt size={9} /> #{client.receiveNumber}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {accountConfig && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${accountConfig.color}`}>
                      {accountConfig.label}
                    </span>
                  )}
                  {muni && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: muni.accent }} />
                      {muni.name}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-[#D3423E] border border-red-200 flex items-center gap-0.5">
                    <FaBoxes size={8} />
                    {packing.physicalBoxes}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5">
                    <FaWineBottle size={8} />
                    {packing.totalBottles}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-3 pb-3 space-y-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-bold text-gray-500 uppercase">Empaque</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {packing.fullBoxes > 0 && (
                    <span className="text-[10px] bg-gray-700 text-white px-1.5 py-0.5 rounded font-bold">
                      {packing.fullBoxes} × 12
                    </span>
                  )}
                  {packing.halfBoxes > 0 && (
                    <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded font-bold">
                      {packing.halfBoxes} × 6
                    </span>
                  )}
                  {packing.looseBottles > 0 && (
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                      {packing.looseBottles} sueltas
                    </span>
                  )}
                  {packing.physicalBoxes === 0 && (
                    <span className="text-[10px] text-gray-400 italic">Sin productos</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-gray-600">
                <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0 mt-0.5" size={10} />
                <span className="break-words text-[11px]">
                  {client.id_client.client_location?.direction || "Sin dirección"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">
                  Bs. {Number(client.totalAmount).toFixed(2)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) handleDelete(client._id);
                    else handleMarkerClick(client);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${isSelected
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-[#D3423E] text-white hover:bg-red-700'}`}
                >
                  {isSelected ? (<><FaTimes size={9} /> Quitar</>) : (<><FaPlus size={9} /> Agregar</>)}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {!selectedMunicipio && totalPages > 1 && (
        <div className="pt-4 space-y-3">
          <nav className="flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
              title="Primera página"
            >‹‹</button>
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                  >{num}</button>
                </React.Fragment>
              );
            })}
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <FaChevronRight size={12} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
              title="Última página"
            >››</button>
          </nav>

          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="app-select"
            >
              {PAGE_SIZE_OPTIONS.map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
            <span className="text-gray-500 font-medium">por página</span>
          </div>
        </div>
      )}
    </div>
  );
};

const SelectedRouteBar = ({
  selectedMarkers, selectedTripView, currentLoad, totalAmount,
  moveClient, panToLocation, handleDelete
}) => (
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gray-700 uppercase">
            {selectedTripView ? `Viaje ${selectedTripView}` : "Ruta"}
          </p>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E" }}
          >
            {selectedMarkers.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <FaBoxes size={10} className="text-gray-400" />
            {currentLoad}
          </p>
          <p className="text-xs font-bold text-[#D3423E]">
            Bs. {totalAmount.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex overflow-x-auto space-x-2 pb-1">
        {selectedMarkers.map((client, idx) => {
          const packing = calculateOrderPacking(client);
          const channelConf = getChannelConfig(client.userCategory);
          return (
            <div
              key={client._id}
              className="flex-shrink-0 flex items-center gap-2 p-2 border-2 bg-red-50/50 rounded-xl min-w-[240px]"
              style={{ borderColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E" }}
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveClient(idx, 'up')}
                  disabled={idx === 0}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${idx === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                >▲</button>
                <button
                  onClick={() => moveClient(idx, 'down')}
                  disabled={idx === selectedMarkers.length - 1}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${idx === selectedMarkers.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                >▼</button>
              </div>
              <div
                className="w-8 h-8 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E" }}
              >
                {idx + 1}
              </div>
              <div onClick={() => panToLocation(client)} className="flex-1 min-w-0 cursor-pointer">
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">{channelConf.emoji}</span>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {client.name} {client.lastName}
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 truncate">
                  #{client.receiveNumber} · {packing.physicalBoxes}c · {packing.totalBottles}b
                </p>
              </div>
              <button
                onClick={() => handleDelete(client._id)}
                className="w-7 h-7 text-red-500 hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <FaTrash size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const CreateRouteModal = ({
  isOpen, onClose, optimizationResult, selectedMarkers, totalAmount,
  currentLoad, truckCapacity, vendedores, selectedSaler, routeName, setRouteName,
  startDate, setStartDate, endDate, setEndDate, creating, validateForm, handleCreateRoute
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                {optimizationResult ? <><FaMagic /> Crear rutas optimizadas</> : <><FaRoute /> Crear ruta</>}
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                {optimizationResult
                  ? `${optimizationResult.trips.length} viajes · ${optimizationResult.stats.totalOrders} pedidos`
                  : `${selectedMarkers.length} pedido${selectedMarkers.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                Nombre de la ruta <span className="text-[#D3423E]">*</span>
              </label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Ej: Entregas Lunes Zona Sur"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                />
              </div>
              {optimizationResult && optimizationResult.trips.length > 1 && (
                <p className="text-[10px] text-gray-600 mt-1.5 flex items-start gap-1">
                  <FaInfoCircle className="mt-0.5 shrink-0 text-[#D3423E]" size={10} />
                  Se crearán {optimizationResult.trips.length} rutas con sufijo "Viaje 1/N", "Viaje 2/N"...
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                  Desde <span className="text-[#D3423E]">*</span>
                </label>
                <DateInput value={startDate} onChange={setStartDate} label="Inicio" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                  Hasta <span className="text-[#D3423E]">*</span>
                </label>
                <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fin" />
              </div>
            </div>

            {optimizationResult ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-3 border border-red-200">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-2.5">Resumen</p>
                  <div className="grid grid-cols-3 gap-2">
                    <SummaryItem label="Viajes" value={optimizationResult.stats.totalTrips} />
                    <SummaryItem label="Pedidos" value={optimizationResult.stats.totalOrders} />
                    <SummaryItem label="Cajas" value={optimizationResult.stats.totalBoxes} />
                    <SummaryItem label="Botellas" value={optimizationResult.stats.totalBottles} />
                    <SummaryItem label="Distancia" value={`${optimizationResult.stats.totalDistance}km`} />
                    <SummaryItem label="Uso prom." value={`${optimizationResult.stats.avgUtilization}%`} highlight />
                  </div>
                </div>

                {optimizationResult.trips.map(trip => (
                  <div
                    key={trip.tripNumber}
                    className="border-2 rounded-xl overflow-hidden"
                    style={{ borderColor: getTripColor(trip.tripNumber) }}
                  >
                    <div
                      className="p-3 flex items-center justify-between"
                      style={{ backgroundColor: `${getTripColor(trip.tripNumber)}15` }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                          style={{ backgroundColor: getTripColor(trip.tripNumber) }}
                        >
                          {trip.tripNumber}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Viaje {trip.tripNumber}</p>
                          <p className="text-[10px] text-gray-600">
                            {trip.orders.length} entregas · {trip.distance} km
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: getTripColor(trip.tripNumber) }}>
                          {trip.boxes}/{trip.capacity}
                        </p>
                        <p className="text-[10px] text-gray-500">cajas</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <StackingPlanCard stackingPlan={trip.stackingPlan} tripColor={getTripColor(trip.tripNumber)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase">Resumen</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Repartidor:</span>
                    <span className="font-bold text-gray-900 truncate ml-2">
                      {vendedores.find(v => v._id === selectedSaler)?.fullName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedidos:</span>
                    <span className="font-bold text-gray-900">{selectedMarkers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cajas:</span>
                    <span className="font-bold text-gray-900">{currentLoad}/{truckCapacity}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-[#D3423E]">Bs. {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRoute}
              disabled={!validateForm() || creating}
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors flex items-center justify-center gap-2 ${!validateForm() || creating
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-br from-[#D3423E] to-red-700 hover:shadow-lg'}`}
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Creando...
                </>
              ) : (
                <>
                  <FaCheck size={12} />
                  {optimizationResult
                    ? `Crear ${optimizationResult.trips.length} ruta${optimizationResult.trips.length !== 1 ? 's' : ''}`
                    : 'Crear ruta'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-lg p-2 text-center border border-red-100">
    <Icon className="text-[#D3423E] mx-auto mb-0.5" size={11} />
    <p className="text-sm font-black text-gray-900 leading-tight">{value}</p>
    <p className="text-[9px] text-gray-500 uppercase font-bold">{label}</p>
  </div>
);

const SummaryItem = ({ label, value, highlight }) => (
  <div>
    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">{label}</p>
    <p className={`text-sm font-bold ${highlight ? 'text-[#D3423E]' : 'text-gray-900'}`}>{value}</p>
  </div>
);