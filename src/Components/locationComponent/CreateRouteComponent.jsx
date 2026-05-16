import React, { useEffect, useCallback, useState, useRef } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { FaMapMarkerAlt, FaUser, FaChevronLeft, FaChevronRight, FaRoute, FaTrash, FaPlus, FaMinus, FaCheck, FaBuilding, FaCalendarAlt, FaTimes, FaInfoCircle, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../../icons/tienda.png";
import TextInputFilter from "../LittleComponents/TextInputFilter";
import AlertModal from "../modal/AlertModal";
import { motion, AnimatePresence } from "framer-motion";

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

const ROUTE_COLOR = "#040001";
const ROUTE_COLOR_DARK = "#f90808";

const containerStyle = {
  width: "100%",
  height: "100%"
};

export default function CreateRouteComponent() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [markers, setMarkers] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [routeName, setRouteName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [successModal, setSuccessModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });
  const [lastAddedId, setLastAddedId] = useState(null);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  const cleanData = () => {
    setRouteName("");
    setSelectedSaler("");
    setSelectedMarkers([]);
    setStartDate("");
    setEndDate("");
  };

  const goToRouteList = () => {
    navigate("/localization/list/route");
  };

  const validateForm = () => {
    return routeName && startDate && endDate;
  };

  const handleCreateRoute = async () => {
    if (!validateForm()) return;
    setCreating(true);

    const routeData = {
      details: routeName,
      salesMan: selectedSaler,
      route: selectedMarkers,
      id_owner: user,
      status: "Por iniciar",
      startDate: startDate,
      endDate: endDate,
      progress: 0
    };

    try {
      const response = await axios.post(API_URL + "/whatsapp/salesman/route", routeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        setIsOpen(false);
        cleanData();
        goToRouteList();
      }
    } catch (error) {
      console.error("Error al crear la ruta:", error);
    } finally {
      setCreating(false);
    }
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

    if (user && token) fetchVendedores();
  }, [user, token]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadMarkersFromAPI = useCallback(async (sales_id) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/maps/list/id",
        { id_owner: user, sales_id: sales_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMarkers(response.data.users || []);
      setFilteredData(response.data.users || []);
    } catch (error) {
      console.error("Error al cargar los marcadores: ", error);
      setMarkers([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    loadMarkersFromAPI("todos");
  }, [loadMarkersFromAPI]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(markers);
    } else {
      const filtered = markers.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.number || "").includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, markers]);

  useEffect(() => {
    if (selectedMarkers.length > 1 && isLoaded && window.google) {
      const validMarkers = selectedMarkers.filter(m =>
        m.client_location?.latitud && m.client_location?.longitud
      );

      if (validMarkers.length < 2) {
        setDirectionsResponse(null);
        setRouteStats({ distance: 0, duration: 0 });
        return;
      }

      const origin = {
        lat: validMarkers[0].client_location.latitud,
        lng: validMarkers[0].client_location.longitud
      };
      const destination = {
        lat: validMarkers[validMarkers.length - 1].client_location.latitud,
        lng: validMarkers[validMarkers.length - 1].client_location.longitud
      };
      const waypoints = validMarkers.slice(1, -1).map((client) => ({
        location: {
          lat: client.client_location.latitud,
          lng: client.client_location.longitud
        },
        stopover: true,
      }));

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

  const findLocation = (location) => {
    if (location?.client_location) {
      const lat = parseFloat(location.client_location.latitud);
      const lng = parseFloat(location.client_location.longitud);
      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        setTimeout(() => mapRef.current?.setZoom(14), 300);
      }
    }
  };

  const handleMarkerClick = (location) => {
    if (!selectedSaler) {
      setSuccessModal(true);
      return;
    }
    setSelectedMarkers((prev) => {
      if (!prev.find((item) => item._id === location._id)) {
        setLastAddedId(location._id);
        setTimeout(() => setLastAddedId(null), 1500);
        return [...prev, {
          _id: location._id,
          name: location.name,
          lastName: location.lastName,
          identificationImage: location.identificationImage,
          client_location: location.client_location,
          company: location.company,
          visitStatus: false,
          visitStatus1: "Sin visitar",
          visitTime: null,
          orderTaken: false,
          visitStartTime: null,
          visitEndTime: null
        }];
      }
      return prev;
    });
    findLocation(location);
  };

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

  const isClientSelected = (clientId) => selectedMarkers.some(m => m._id === clientId);

  const handleZoomIn = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(z + 1);
  };

  const handleZoomOut = () => {
    const z = mapRef.current?.getZoom() || 13;
    mapRef.current?.setZoom(Math.max(z - 1, 3));
  };

  const buildSelectedPinUrl = (orderIndex, pulsing) => {
    const ringOpacity = pulsing ? 0.6 : 0;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="56" height="68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="ds" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.4"/>
          </filter>
        </defs>
        <circle cx="28" cy="26" r="24" fill="#D3423E" opacity="${ringOpacity}"/>
        <path d="M28 4 C16 4 6 13 6 25 C6 41 28 64 28 64 C28 64 50 41 50 25 C50 13 40 4 28 4 Z"
              fill="#D3423E" stroke="#ffffff" stroke-width="3" filter="url(#ds)"/>
        <circle cx="28" cy="24" r="12" fill="#ffffff"/>
        <text x="28" y="29" text-anchor="middle" fill="#D3423E" font-size="16" font-weight="900" font-family="Arial, sans-serif">${orderIndex + 1}</text>
      </svg>
    `)}`;
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[440px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="p-5 border-b border-gray-200 bg-red-700 rounded-r-3xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                 
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <FaRoute />
                    Crear nueva ruta
                  </h1>
                  <p className="text-xs text-red-100 mt-0.5">Selecciona los clientes en el mapa</p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <FaChevronLeft />
                </button>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-100">Clientes seleccionados</p>
                  <motion.p
                    key={selectedMarkers.length}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="text-2xl font-bold"
                  >
                    {selectedMarkers.length}
                  </motion.p>
                </div>
                {selectedMarkers.length > 0 && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setIsOpen(true)}
                    className="px-4 py-2 bg-white text-[#D3423E] font-bold rounded-xl text-sm hover:bg-red-50 transition-colors shadow-md flex items-center gap-2"
                  >
                    Siguiente <FaChevronRight size={12} />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-gray-200 bg-white">
              <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                Vendedor asignado <span className="text-[#D3423E]">*</span>
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <select
                  value={selectedSaler}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedSaler(v);
                    loadMarkersFromAPI(v || "todos");
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendedores.map((v) => (
                    <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                  ))}
                </select>
              </div>
              {!selectedSaler && (
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <FaInfoCircle size={10} />
                  Selecciona un vendedor para empezar
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedMarkers.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-700 uppercase">Orden de visita</p>
                    <button
                      onClick={() => setSelectedMarkers([])}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Limpiar todo
                    </button>
                  </div>

                  <AnimatePresence>
                    {selectedMarkers.map((client, index) => (
                      <motion.div
                        key={client._id}
                        layout
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={() => findLocation(client)}
                        className={`bg-white border-2 rounded-2xl p-3 cursor-pointer hover:shadow-md transition-all ${
                          client._id === lastAddedId
                            ? 'border-[#D3423E] shadow-lg ring-4 ring-red-100'
                            : 'border-gray-200 hover:border-[#D3423E]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveClient(index, 'up'); }}
                              disabled={index === 0}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              ▲
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveClient(index, 'down'); }}
                              disabled={index === selectedMarkers.length - 1}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${index === selectedMarkers.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              ▼
                            </button>
                          </div>

                          <div className="w-8 h-8 bg-gradient-to-br from-[#D3423E] to-red-700 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-md">
                            {index + 1}
                          </div>

                          <img
                            src={client.identificationImage || FALLBACK_IMAGE}
                            alt={client.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                          />

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">
                              {client.name} {client.lastName}
                            </h3>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                              <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0" size={9} />
                              {client.client_location?.direction || "Sin dirección"}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client._id);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaRoute className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-700 font-semibold">Sin clientes seleccionados</p>
                  <p className="text-sm text-gray-500 mt-1 px-8">
                    {selectedSaler
                      ? "Haz clic en los pines del mapa para agregar clientes"
                      : "Primero selecciona un vendedor"}
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
            center={{ lat: -17.3835, lng: -66.1568 }}
            zoom={13}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              disableDefaultUI: false,
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {filteredData.map((location, index) => {
              const isSelected = isClientSelected(location._id);
              const orderIndex = selectedMarkers.findIndex(m => m._id === location._id);
              const isPulsing = location._id === lastAddedId;
              return (
                <Marker
                  key={index}
                  position={{
                    lat: location.client_location.latitud,
                    lng: location.client_location.longitud,
                  }}
                  icon={isSelected ? {
                    url: buildSelectedPinUrl(orderIndex, isPulsing),
                    scaledSize: new window.google.maps.Size(56, 68),
                    anchor: new window.google.maps.Point(28, 64),
                  } : {
                    url: tiendaIcon,
                    scaledSize: new window.google.maps.Size(42, 42),
                  }}
                  animation={isPulsing ? window.google.maps.Animation.DROP : null}
                  onClick={() => handleMarkerClick(location)}
                />
              );
            })}
            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  polylineOptions: {
                    strokeColor: ROUTE_COLOR,
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                    icons: [{
                      icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 3.5,
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

        <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-3">
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-2 flex items-center gap-2">
            <div className="relative flex-1">
              <TextInputFilter
                value={searchTerm}
                onChange={setSearchTerm}
                onEnter={() => loadMarkersFromAPI(selectedSaler || "todos")}
                placeholder="Buscar cliente..."
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 flex-shrink-0">
            <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Leyenda</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <img src={tiendaIcon} alt="" className="w-5 h-5" />
                <span className="text-gray-700">Disponible</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-[#D3423E] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm">1</div>
                <span className="text-gray-700">En ruta</span>
              </div>
              {directionsResponse && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-1 rounded" style={{ backgroundColor: ROUTE_COLOR }} />
                  <span className="text-gray-700">Recorrido</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <AnimatePresence>
          {directionsResponse && routeStats.distance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-32 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-xl border border-gray-200 px-5 py-3 flex items-center gap-4"
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
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Tiempo estimado</p>
                <p className="text-base font-bold text-gray-900 flex items-center gap-1">
                  <FaClock size={11} className="text-gray-400" />
                  ~{routeStats.duration} min
                </p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Paradas</p>
                <p className="text-base font-bold text-gray-900">{selectedMarkers.length}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {filteredData.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-10 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
              <div className="flex overflow-x-auto space-x-3">
                {filteredData.slice(0, 10).map((client) => {
                  const selected = isClientSelected(client._id);
                  return (
                    <div
                      key={client._id}
                      onClick={() => handleMarkerClick(client)}
                      className={`flex-shrink-0 flex flex-col items-center border-2 rounded-xl p-2 min-w-[130px] cursor-pointer transition-all hover:shadow-md ${
                        selected ? 'border-[#D3423E] bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <img
                        className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                        src={client.identificationImage || FALLBACK_IMAGE}
                        alt={client.name}
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                      <p className="text-xs font-bold text-gray-900 truncate mt-1 w-full text-center">
                        {client.name}
                      </p>
                      {selected ? (
                        <span className="text-xs text-[#D3423E] font-semibold flex items-center gap-1 mt-0.5">
                          <FaCheck size={8} /> Agregado
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <FaPlus size={8} /> Agregar
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FaRoute /> Crear Ruta
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5">
                    {selectedMarkers.length} cliente{selectedMarkers.length !== 1 ? 's' : ''} en la ruta
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                    Nombre de la ruta <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Ej: Ruta Centro - Lunes"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                      Desde <span className="text-[#D3423E]">*</span>
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                      Hasta <span className="text-[#D3423E]">*</span>
                    </label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Resumen</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Vendedor:</span>
                      <span className="font-semibold text-gray-900">
                        {vendedores.find(v => v._id === selectedSaler)?.fullName || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes:</span>
                      <span className="font-semibold text-gray-900">{selectedMarkers.length}</span>
                    </div>
                    {routeStats.distance > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Distancia:</span>
                          <span className="font-semibold text-gray-900">{routeStats.distance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tiempo estimado:</span>
                          <span className="font-semibold text-gray-900">~{routeStats.duration} min</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateRoute}
                    disabled={!validateForm() || creating}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${!validateForm() || creating ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#D3423E] hover:bg-red-700'}`}
                  >
                    {creating ? 'Creando...' : 'Crear Ruta'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Por favor seleccione un vendedor antes de agregar clientes a la ruta"
      />
    </div>
  );
}