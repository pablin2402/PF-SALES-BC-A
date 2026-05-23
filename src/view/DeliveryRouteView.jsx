import React, { useEffect, useCallback, useState, useMemo } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import {
  FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaRoute, FaTrash, FaCheck,
  FaPlus, FaBuilding, FaTimes, FaTruck, FaReceipt, FaDollarSign,
  FaInfoCircle, FaBoxes, FaMagic, FaClock, FaChartLine, FaRoad, FaWineBottle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";
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

export const GOOGLE_MAPS_LIBRARIES = ["maps"];

const ACCOUNT_STATUS_CONFIG = {
  "Crédito": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "CRÉDITO" },
  "Contado": { color: "bg-green-100 text-green-800 border-green-300", label: "CONTADO" },
  "Cheque": { color: "bg-blue-100 text-blue-800 border-blue-300", label: "CHEQUE" }
};

const containerStyle = { width: "100%", height: "100%" };

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

const DEFAULT_TRUCK_CAPACITY = 80;
const DEPOT = { lat: -17.3835, lng: -66.1568 };

const TABS = {
  PEDIDOS: "pedidos",
  PLAN: "plan",
};

export default function DeliveryRouteView() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [routeName, setRouteName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState(DEPOT);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [vendedores, setVendedores] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [page, setPage] = useState(1);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [optimizationResult, setOptimizationResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [customCapacity, setCustomCapacity] = useState(null);
  const [selectedTripView, setSelectedTripView] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.PEDIDOS);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

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
        id_owner: user, page, limit: 5, fullName: searchTerm,
        salesId: selectedSaler, status: "aproved", region: "TOTAL CBB"
      };
      const response = await axios.post(API_URL + "/whatsapp/order/status/id", filters, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarkers(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error cargando órdenes", error);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, token, selectedSaler, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { loadMarkersFromAPI(); }, [loadMarkersFromAPI]);

  const validateForm = () => routeName && startDate && endDate;

  const findLocation = (location) => {
    if (location && location.client_location) {
      const lat = parseFloat(location.client_location.latitud);
      const lng = parseFloat(location.client_location.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapZoom(18);
        setCenter({ lat, lng });
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
  };

  const handleCreateAllRoutes = async () => {
    if (!optimizationResult || !validateForm()) return;
    setCreating(true);

    try {
      let successCount = 0;
      for (const trip of optimizationResult.trips) {
        const tripMarkers = trip.orders.map(buildMarkerFromOrder);
        const routeData = {
          details: `${routeName} · Viaje ${trip.tripNumber}/${optimizationResult.trips.length}`,
          delivery: selectedSaler, route: tripMarkers,
          id_owner: user, status: "Por iniciar",
          startDate, endDate, progress: 0,
          tripNumber: trip.tripNumber,
          totalTrips: optimizationResult.trips.length,
          estimatedDistance: trip.distance,
          estimatedTime: trip.estimatedTime,
          capacity: trip.capacity, totalBoxes: trip.boxes,
          fullBoxes: trip.fullBoxes, halfBoxes: trip.halfBoxes,
          looseBottles: trip.looseBottles, totalBottles: trip.totalBottles,
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
                eventType: `Asignado a viaje ${trip.tripNumber}/${optimizationResult.trips.length}`,
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
    const routeData = {
      details: routeName, delivery: selectedSaler, route: selectedMarkers,
      id_owner: user, status: "Por iniciar", startDate, endDate, progress: 0,
      capacity: truckCapacity, totalBoxes: currentLoad,
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
              eventType: "Ha sido asignado como repartidor",
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
      if (routePoints.length < 2) {
        setDirectionsResponse(null);
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
    findLocation({ client_location: location.id_client.client_location });
  };

  const isClientSelected = (clientId) => selectedMarkers.some(m => m._id === clientId);
  const totalAmount = selectedMarkers.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[440px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="px-5 pt-4 pb-3 bg-gradient-to-br from-[#D3423E] to-red-700 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaTruck size={18} />
                  <div>
                    <h1 className="text-base font-bold leading-tight">Rutas de entrega</h1>
                    <p className="text-[10px] text-red-100">
                      {markers.length} pedido{markers.length !== 1 ? "s" : ""} disponible{markers.length !== 1 ? "s" : ""}
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
  className="flex-1 min-w-0 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-0 focus:border-transparent border-0 cursor-pointer appearance-none truncate rounded-lg px-2 py-1"
  style={{ colorScheme: "light" }}
>
  <option value="" className="text-gray-700 bg-white">
    Sin repartidor asignado
  </option>

  {vendedores.map((v) => (
    <option
      key={v._id}
      value={v._id}
      className="text-gray-900 bg-white"
    >
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
                        <span className="text-[10px] font-bold text-red-100 uppercase">
                          Capacidad
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-red-100">
                        {Math.round(utilizationPct)}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-xl font-black ${isOverCapacity ? 'text-yellow-200' : 'text-white'}`}>
                        {currentLoad}
                      </span>
                      <span className="text-xs text-red-100 font-bold">
                        /{truckCapacity} cajas
                      </span>
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

              <motion.button
                whileHover={canOptimize ? { scale: 1.01 } : {}}
                whileTap={canOptimize ? { scale: 0.99 } : {}}
                onClick={handleOptimize}
                disabled={!canOptimize || isOptimizing}
                className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                  !canOptimize
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#D3423E] to-red-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isOptimizing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FaMagic size={13} />
                    </motion.div>
                    Optimizando rutas...
                  </>
                ) : (
                  <>
                    <FaMagic size={13} />
                    {!selectedSaler
                      ? "Selecciona un repartidor"
                      : markers.length < MIN_ORDERS_TO_OPTIMIZE
                      ? `Mínimo ${MIN_ORDERS_TO_OPTIMIZE} pedidos (${markers.length} actuales)`
                      : `Optimizar ruta automáticamente`
                    }
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
                  className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === TABS.PLAN
                      ? "text-[#D3423E] border-b-2 border-[#D3423E] bg-red-50/30"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FaMagic size={11} />
                  Plan ({optimizationResult.trips.length})
                </button>
                <button
                  onClick={() => setActiveTab(TABS.PEDIDOS)}
                  className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === TABS.PEDIDOS
                      ? "text-[#D3423E] border-b-2 border-[#D3423E] bg-red-50/30"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FaReceipt size={11} />
                  Pedidos ({markers.length})
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {optimizationResult && activeTab === TABS.PLAN ? (
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
                  markers={markers}
                  isClientSelected={isClientSelected}
                  findLocation={findLocation}
                  goToClientDetails={goToClientDetails}
                  handleDelete={handleDelete}
                  handleMarkerClick={handleMarkerClick}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
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
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}
            options={{
              disableDefaultUI: false, zoomControl: true,
              streetViewControl: false, mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            <Marker
              position={DEPOT}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="25" r="22" fill="#1F2937" stroke="white" strokeWidth="3"/>
                    <text x="25" y="32" text-anchor="middle" fill="white" font-size="20">⌂</text>
                  </svg>
                `)}`,
                scaledSize: new window.google.maps.Size(50, 50),
              }}
              title="Depósito"
            />

            {markers.length > 0 && markers.map((location, index) => {
              const isSelected = selectedMarkers.some(m => m._id === location._id);
              const orderIndex = selectedMarkers.findIndex(m => m._id === location._id);
              const color = selectedTripView ? getTripColor(selectedTripView) : "#D3423E";
              return (
                <Marker
                  key={index}
                  position={{
                    lat: location.id_client.client_location.latitud,
                    lng: location.id_client.client_location.longitud,
                  }}
                  icon={isSelected ? {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                      <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="22" fill="${color}" stroke="white" strokeWidth="3"/>
                        <text x="25" y="31" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial">${orderIndex + 1}</text>
                      </svg>
                    `)}`,
                    scaledSize: new window.google.maps.Size(50, 50),
                  } : {
                    url: tiendaIcon,
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                  onClick={() => handleMarkerClick(location)}
                />
              );
            })}

            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  polylineOptions: {
                    strokeColor: selectedTripView ? getTripColor(selectedTripView) : "#D3423E",
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
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

        <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[200px]">
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Leyenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-gray-800 border-2 border-white flex items-center justify-center text-white text-[10px]">⌂</div>
              <span className="text-gray-700">Depósito</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <img src={tiendaIcon} alt="" className="w-5 h-5" />
              <span className="text-gray-700">Pedido</span>
            </div>
            {optimizationResult && optimizationResult.trips.map(trip => (
              <div key={trip.tripNumber} className="flex items-center gap-2 text-xs">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: getTripColor(trip.tripNumber) }}
                >
                  {trip.tripNumber}
                </div>
                <span className="text-gray-700">Viaje {trip.tripNumber}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedMarkers.length > 0 && (
          <SelectedRouteBar
            selectedMarkers={selectedMarkers}
            selectedTripView={selectedTripView}
            currentLoad={currentLoad}
            totalAmount={totalAmount}
            moveClient={moveClient}
            findLocation={findLocation}
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

      <AlertModal
        show={alertModal}
        onClose={() => setAlertModal(false)}
        message={alertMessage}
      />
    </div>
  );
}

const PlanOptimizadoPanel = ({
  optimizationResult, selectedTripView, onViewTrip,
  onClearOptimization, onCreate
}) => {
  return (
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
};

const TripCard = ({ trip, isSelected, onClick }) => {
  const [showStacking, setShowStacking] = useState(false);

  return (
    <div
      className={`rounded-xl border-2 transition-all overflow-hidden ${
        isSelected
          ? 'bg-white shadow-md'
          : 'bg-white/70 hover:bg-white'
      }`}
      style={{
        borderColor: isSelected ? getTripColor(trip.tripNumber) : 'transparent'
      }}
    >
      <div
        onClick={onClick}
        className="cursor-pointer p-3"
      >
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
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${trip.utilization}%`,
              backgroundColor: getTripColor(trip.tripNumber)
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {trip.fullBoxes > 0 && (
            <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {trip.fullBoxes} × 12
            </span>
          )}
          {trip.halfBoxes > 0 && (
            <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {trip.halfBoxes} × 6
            </span>
          )}
          {trip.looseBottles > 0 && (
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              {trip.looseBottles} sueltas
            </span>
          )}
        </div>

        <div className="flex justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><FaRoad size={9} /> {trip.distance} km</span>
          <span className="flex items-center gap-1"><FaClock size={9} /> {formatDuration(trip.estimatedTime)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStacking(!showStacking);
            }}
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
              <StackingPlanCard
                stackingPlan={trip.stackingPlan}
                tripColor={getTripColor(trip.tripNumber)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PedidosListPanel = ({
  loading, markers, isClientSelected, findLocation, goToClientDetails,
  handleDelete, handleMarkerClick, page, setPage, totalPages
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
        <p className="text-sm">Cargando pedidos...</p>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FaReceipt className="text-gray-300 text-3xl" />
        </div>
        <p className="text-gray-700 font-semibold">Sin pedidos aprobados</p>
        <p className="text-sm text-gray-500 mt-1">
          No hay pedidos disponibles para asignar
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {markers.map((client) => {
        const isSelected = isClientSelected(client._id);
        const accountConfig = ACCOUNT_STATUS_CONFIG[client.accountStatus];
        const packing = calculateOrderPacking(client);
        return (
          <div
            key={client._id}
            onClick={() => findLocation({ client_location: client.id_client.client_location })}
            className={`bg-white border-2 rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-md ${
              isSelected ? 'border-[#D3423E] shadow-md ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex gap-3 p-3">
              <img
                className="w-14 h-14 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                src={client.id_client.identificationImage || FALLBACK_IMAGE}
                alt={client.id_client.name}
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      : 'bg-[#D3423E] text-white hover:bg-red-700'
                  }`}
                >
                  {isSelected ? (
                    <><FaTimes size={9} /> Quitar</>
                  ) : (
                    <><FaPlus size={9} /> Agregar</>
                  )}
                </button>
              </div>
            </div>
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
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === num ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-100"}`}
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
  );
};

const SelectedRouteBar = ({
  selectedMarkers, selectedTripView, currentLoad, totalAmount,
  moveClient, findLocation, handleDelete
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
          return (
            <div
              key={client._id}
              className="flex-shrink-0 flex items-center gap-2 p-2 border-2 bg-red-50/50 rounded-xl min-w-[230px]"
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
              <div onClick={() => findLocation(client)} className="flex-1 min-w-0 cursor-pointer">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {client.name} {client.lastName}
                </p>
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
                  : `${selectedMarkers.length} pedido${selectedMarkers.length !== 1 ? 's' : ''}`
                }
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
                      <StackingPlanCard
                        stackingPlan={trip.stackingPlan}
                        tripColor={getTripColor(trip.tripNumber)}
                      />
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
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors flex items-center justify-center gap-2 ${
                !validateForm() || creating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-br from-[#D3423E] to-red-700 hover:shadow-lg'
              }`}
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
                    : 'Crear ruta'
                  }
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