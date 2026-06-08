import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { preloadChannelIcons } from "../utils/ClientMarkerIcons";
import { getMunicipioForPoint, groupClientsByMunicipio, MUNICIPIOS_COCHABAMBA } from "../utils/CochabambaMunicipios";
import { DEPOT, DEFAULT_TRUCK_CAPACITY, DEFAULT_ZOOM } from "../utils/MapDetails";
import {
  optimizeRoutes, calculateOrderBoxes, calculateOrderPacking,
  generateStackingPlan, MIN_ORDERS_TO_OPTIMIZE,
} from "../utils/RouteOptimizer";
import { TABS, OPTIMIZATION_METHOD, buildMarkerFromOrder, generateGroupId } from "../constants/routeConfigs";

export const useDeliveryRoute = () => {
  const mapRef = useRef(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [routeName, setRouteName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [markers, setMarkers] = useState([]);
  const [center] = useState(DEPOT);
  const [mapZoom] = useState(DEFAULT_ZOOM);
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
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [customCapacity, setCustomCapacity] = useState(null);
  const [selectedTripView, setSelectedTripView] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.PEDIDOS);
  const [selectedMunicipio, setSelectedMunicipio] = useState("");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => { preloadChannelIcons().then(() => setIconsReady(true)); }, []);

  const selectedVendor = useMemo(() => vendedores.find(v => v._id === selectedSaler), [vendedores, selectedSaler]);

  const truckCapacity = useMemo(() => {
    if (customCapacity !== null) return customCapacity;
    return Number(selectedVendor?.truckCapacity) || DEFAULT_TRUCK_CAPACITY;
  }, [selectedVendor, customCapacity]);

  const currentLoad = useMemo(() => selectedMarkers.reduce((s, m) => s + calculateOrderBoxes(m), 0), [selectedMarkers]);
  const utilizationPct = truckCapacity > 0 ? Math.min(100, (currentLoad / truckCapacity) * 100) : 0;
  const isOverCapacity = currentLoad > truckCapacity;
  const canOptimize = markers.length >= MIN_ORDERS_TO_OPTIMIZE && !!selectedSaler;

  const filteredMarkers = useMemo(() => {
    if (!selectedMunicipio) return markers;
    return markers.filter(c => {
      const loc = c.id_client?.client_location || c.client_location;
      if (!loc?.latitud || !loc?.longitud) return false;
      return getMunicipioForPoint(loc.latitud, loc.longitud)?.id === selectedMunicipio;
    });
  }, [markers, selectedMunicipio]);

  const municipioGroups = useMemo(() => {
    const transformed = markers.map(m => ({ ...m, client_location: m.id_client?.client_location || m.client_location }));
    return groupClientsByMunicipio(transformed);
  }, [markers]);

  const fetchVendedores = useCallback(async () => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/delivery/list",
        { id_owner: user, page: 1, limit: 1000, searchTerm: "", active: true },
        { headers: { Authorization: `Bearer ${token}` } });
      setVendedores(res.data.data || []);
    } catch (e) { setVendedores([]); }
  }, [user, token]);

  const loadMarkersFromAPI = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/order/status/id", {
        id_owner: user, page, limit: pageSize, fullName: searchTerm,
        salesId: selectedSaler, status: "aproved", region: "TOTAL CBB",
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMarkers(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalOrders(res.data.total || res.data.orders?.length || 0);
    } catch (e) { setMarkers([]); }
    finally { setLoading(false); }
  }, [user, searchTerm, token, selectedSaler, page, pageSize]);

  useEffect(() => { fetchVendedores(); }, [fetchVendedores]);
  useEffect(() => { loadMarkersFromAPI(); }, [loadMarkersFromAPI]);
  useEffect(() => { setPage(1); }, [pageSize, selectedMunicipio]);

  const validateForm = () => routeName && startDate && endDate;

  const panToLocation = (location) => {
    if (!location?.client_location) return;
    const lat = parseFloat(location.client_location.latitud);
    const lng = parseFloat(location.client_location.longitud);
    if (!isNaN(lat) && !isNaN(lng) && mapRef.current) mapRef.current.panTo({ lat, lng });
  };

  const cleanData = () => {
    setRouteName(""); setSelectedSaler(""); setSelectedMarkers([]);
    setStartDate(""); setEndDate(""); setOptimizationResult(null);
    setSelectedTripView(null); setCustomCapacity(null);
    setActiveTab(TABS.PEDIDOS); setDirectionsResponse(null);
  };

  const fitToMarkers = (clientList) => {
    if (!mapRef.current || !window.google || clientList.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    let has = false;
    clientList.forEach(c => {
      const loc = c.client_location || c.id_client?.client_location;
      const lat = Number(loc?.latitud), lng = Number(loc?.longitud);
      if (!isNaN(lat) && !isNaN(lng)) { bounds.extend({ lat, lng }); has = true; }
    });
    if (has) { bounds.extend(DEPOT); mapRef.current.fitBounds(bounds, { top: 100, right: 240, bottom: 200, left: 100 }); }
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

  const showAlert = (msg) => { setAlertMessage(msg); setAlertModal(true); };

  const handleOptimize = async () => {
    if (!selectedSaler) { showAlert("Selecciona un repartidor primero."); return; }
    if (markers.length < MIN_ORDERS_TO_OPTIMIZE) { showAlert(`Mínimo ${MIN_ORDERS_TO_OPTIMIZE} pedidos.`); return; }
    setIsOptimizing(true); setOptimizationResult(null);
    await new Promise(r => setTimeout(r, 600));
    const source = selectedMarkers.length > 0
      ? selectedMarkers.map(sm => markers.find(m => m._id === sm._id) || sm) : markers;
    if (!source.length) { showAlert("No hay pedidos."); setIsOptimizing(false); return; }
    const enriched = source.map(o => ({ ...o, client_location: o.client_location || o.id_client?.client_location }));
    const result = optimizeRoutes(enriched, truckCapacity, DEPOT);
    setOptimizationResult(result);
    setIsOptimizing(false);
    if (result.trips.length > 0) {
      setSelectedMarkers(result.trips[0].orders.map(buildMarkerFromOrder));
      setSelectedTripView(1); setActiveTab(TABS.PLAN);
      setTimeout(() => fitToMarkers(result.trips[0].orders), 400);
    }
  };

  const handleViewTrip = (tripNumber) => {
    if (!optimizationResult) return;
    const trip = optimizationResult.trips.find(t => t.tripNumber === tripNumber);
    if (!trip) return;
    setSelectedMarkers(trip.orders.map(buildMarkerFromOrder));
    setSelectedTripView(tripNumber);
    setTimeout(() => fitToMarkers(trip.orders), 200);
  };

  const handleMarkerClick = (location) => {
    if (!selectedSaler) { showAlert("Seleccione un repartidor antes."); return; }
    const boxes = calculateOrderBoxes(location);
    if (currentLoad + boxes > truckCapacity && !selectedMarkers.find(m => m._id === location._id)) {
      showAlert(`Excede capacidad.\nActual: ${currentLoad} · Pedido: ${boxes} · Máx: ${truckCapacity}\n\nUsa "Optimizar" para dividir.`);
      return;
    }
    setSelectedMarkers(prev => prev.find(i => i._id === location._id) ? prev : [...prev, buildMarkerFromOrder(location)]);
  };

  const handleDelete = (clientId) => setSelectedMarkers(prev => prev.filter(c => c._id !== clientId));

  const moveClient = (index, direction) => {
    setSelectedMarkers(prev => {
      const arr = [...prev];
      const t = direction === "up" ? index - 1 : index + 1;
      if (t < 0 || t >= arr.length) return prev;
      [arr[index], arr[t]] = [arr[t], arr[index]];
      return arr;
    });
  };

  const buildClientsZonesBreakdown = (orders) => {
    const bk = {};
    orders.forEach(o => {
      const loc = o.client_location || o.id_client?.client_location;
      if (!loc?.latitud || !loc?.longitud) return;
      const m = getMunicipioForPoint(loc.latitud, loc.longitud);
      const z = m?.name || "Sin zona";
      bk[z] = (bk[z] || 0) + 1;
    });
    return Object.entries(bk).map(([zone, count]) => ({ zone, count }));
  };

  const buildOperationalNotes = (trip, totalTrips) => {
    const n = [];
    if (totalTrips > 1) n.push(`Viaje ${trip.tripNumber} de ${totalTrips} (CVRP)`);
    if (trip.oversized) n.push(`Excede capacidad (${trip.boxes}/${trip.capacity})`);
    if (trip.orders.length === 1) n.push("Viaje con un solo cliente");
    if (trip.utilization >= 95) n.push("Utilización óptima (>=95%)");
    else if (trip.utilization < 50) n.push("Baja utilización (<50%)");
    return n;
  };

  const handleCreateAllRoutes = async () => {
    if (!optimizationResult || !validateForm()) return;
    setCreating(true);
    const groupId = generateGroupId(), createdAt = new Date().toISOString();
    try {
      let ok = 0;
      for (const trip of optimizationResult.trips) {
        const tripMarkers = trip.orders.map(buildMarkerFromOrder);
        const routeData = {
          details: `${routeName} · Viaje ${trip.tripNumber}/${optimizationResult.trips.length}`,
          delivery: selectedSaler, route: tripMarkers, id_owner: user,
          status: "Por iniciar", startDate, endDate, progress: 0,
          tripNumber: trip.tripNumber, totalTrips: optimizationResult.trips.length,
          estimatedDistance: trip.distance, estimatedTime: trip.estimatedTime,
          capacity: truckCapacity, totalBoxes: trip.boxes,
          fullBoxes: trip.fullBoxes, halfBoxes: trip.halfBoxes,
          looseBottles: trip.looseBottles, totalBottles: trip.totalBottles,
          utilization: trip.utilization, oversized: !!trip.oversized,
          optimizationMethod: OPTIMIZATION_METHOD, groupId, createdAt,
          depotCoords: DEPOT, truckCapacityUsed: truckCapacity,
          totalAmount: trip.orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
          stackingPlan: trip.stackingPlan || null,
          clientsZones: buildClientsZonesBreakdown(trip.orders),
          operationalNotes: buildOperationalNotes(trip, optimizationResult.trips.length),
          routeMetrics: {
            avgUtilization: optimizationResult.stats.avgUtilization,
            totalGroupDistance: optimizationResult.stats.totalDistance,
            totalGroupBoxes: optimizationResult.stats.totalBoxes,
            totalGroupOrders: optimizationResult.stats.totalOrders,
          },
        };
        const res = await axios.post(API_URL + "/whatsapp/delivert/route", routeData, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 200) {
          await Promise.all(tripMarkers.map(async (mk) => {
            const r2 = await axios.put(API_URL + "/whatsapp/order/status/id",
              { _id: mk._id, id_owner: user, receiveNumber: mk.receiveNumber, orderTrackId: selectedSaler, orderStatus: "En Ruta" },
              { headers: { Authorization: `Bearer ${token}` } });
            if (r2.status === 200) await axios.post(API_URL + "/whatsapp/order/track",
              { orderId: mk._id, eventType: `Asignado viaje ${trip.tripNumber}/${optimizationResult.trips.length} (CVRP)`, triggeredBySalesman: "", triggeredByDelivery: selectedSaler, triggeredByUser: "", location: { lat: 0, lng: 0 } },
              { headers: { Authorization: `Bearer ${token}` } });
          }));
          ok++;
        }
      }
      if (ok === optimizationResult.trips.length) { loadMarkersFromAPI(); setIsOpen(false); cleanData(); }
      else { showAlert(`${ok} de ${optimizationResult.trips.length} viajes creados.`); loadMarkersFromAPI(); }
    } catch (e) { showAlert("Error al crear las rutas."); }
    finally { setCreating(false); }
  };

  const handleCreateSingleRoute = async () => {
    if (!validateForm()) return;
    setCreating(true);
    const groupId = generateGroupId(), createdAt = new Date().toISOString();
    const stacking = generateStackingPlan(selectedMarkers);
    const routeData = {
      details: routeName, delivery: selectedSaler, route: selectedMarkers, id_owner: user,
      status: "Por iniciar", startDate, endDate, progress: 0,
      capacity: truckCapacity, totalBoxes: stacking.totalPhysicalBoxes,
      fullBoxes: stacking.bottom.count, halfBoxes: stacking.middle.count,
      looseBottles: stacking.top.looseBottles, totalBottles: stacking.totalBottles,
      utilization: Math.round((stacking.totalPhysicalBoxes / truckCapacity) * 100),
      optimizationMethod: "Manual", groupId, createdAt, depotCoords: DEPOT,
      truckCapacityUsed: truckCapacity,
      totalAmount: selectedMarkers.reduce((s, m) => s + (Number(m.totalAmount) || 0), 0),
      stackingPlan: stacking, clientsZones: buildClientsZonesBreakdown(selectedMarkers),
      operationalNotes: ["Ruta manual"],
    };
    try {
      const res = await axios.post(API_URL + "/whatsapp/delivert/route", routeData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 200) {
        await Promise.all(selectedMarkers.map(async (mk) => {
          const r2 = await axios.put(API_URL + "/whatsapp/order/status/id",
            { _id: mk._id, id_owner: user, receiveNumber: mk.receiveNumber, orderTrackId: selectedSaler, orderStatus: "En Ruta" },
            { headers: { Authorization: `Bearer ${token}` } });
          if (r2.status === 200) await axios.post(API_URL + "/whatsapp/order/track",
            { orderId: mk._id, eventType: "Ruta manual", triggeredBySalesman: "", triggeredByDelivery: selectedSaler, triggeredByUser: "", location: { lat: 0, lng: 0 } },
            { headers: { Authorization: `Bearer ${token}` } });
        }));
        loadMarkersFromAPI(); setIsOpen(false); cleanData();
      }
    } catch (e) {}
    finally { setCreating(false); }
  };

  const handleCreateRoute = optimizationResult?.trips?.length >= 1 ? handleCreateAllRoutes : handleCreateSingleRoute;
  const isClientSelected = (id) => selectedMarkers.some(m => m._id === id);
  const totalAmount = selectedMarkers.reduce((s, c) => s + (c.totalAmount || 0), 0);

  return {
    mapRef, center, mapZoom, markers, filteredMarkers, municipioGroups,
    selectedMarkers, setSelectedMarkers, selectedMunicipio, setSelectedMunicipio,
    selectedSaler, setSelectedSaler, selectedTripView, setSelectedTripView,
    vendedores, loading, creating, iconsReady, isOptimizing,
    searchTerm, setSearchTerm, page, setPage, pageSize, setPageSize,
    totalPages, totalOrders, startDate, setStartDate, endDate, setEndDate,
    routeName, setRouteName, isOpen, setIsOpen,
    alertModal, setAlertModal, alertMessage,
    directionsResponse, setDirectionsResponse,
    optimizationResult, setOptimizationResult,
    activeTab, setActiveTab,
    truckCapacity, currentLoad, utilizationPct, isOverCapacity, canOptimize,
    totalAmount, isClientSelected,
    validateForm, panToLocation, fitToMarkers, fitMunicipio,
    handleOptimize, handleViewTrip, handleMarkerClick,
    handleDelete, moveClient, handleCreateRoute,
    loadMarkersFromAPI, cleanData,
    setCustomCapacity,
  };
};