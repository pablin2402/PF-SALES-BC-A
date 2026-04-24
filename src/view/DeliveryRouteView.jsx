import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { FaMapMarkerAlt, FaUser, FaSearch, FaChevronLeft, FaChevronRight, FaRoute, FaTrash, FaCheck, FaPlus, FaBuilding, FaCalendarAlt, FaTimes, FaTruck, FaReceipt, FaDollarSign, FaInfoCircle, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import AlertModal from "../Components/modal/AlertModal";
import DateInput from "../Components/LittleComponents/DateInput";
import { motion, AnimatePresence } from "framer-motion";

export const GOOGLE_MAPS_LIBRARIES = ["maps"];

const ACCOUNT_STATUS_CONFIG = {
  "Crédito": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "CRÉDITO" },
  "Contado": { color: "bg-green-100 text-green-800 border-green-300", label: "CONTADO" },
  "Cheque": { color: "bg-blue-100 text-blue-800 border-blue-300", label: "CHEQUE" }
};

const containerStyle = {
  width: "100%",
  height: "100%"
};

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

export default function DeliveryRouteView() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [routeName, setRouteName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [vendedores, setVendedores] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [page, setPage] = useState(1);
  const [successModal, setSuccessModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", {
        id_owner: user,
        page: 1,
        limit: 1000,
        searchTerm: "",
        active: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        id_owner: user,
        page: page,
        limit: 5,
        fullName: searchTerm,
        salesId: selectedSaler,
        status: "aproved",
        region: "TOTAL CBB"
      };
      const response = await axios.post(API_URL + "/whatsapp/order/status/id", filters, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(response.data)
      setMarkers(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error cargando órdenes", error);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, token, selectedSaler,page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    loadMarkersFromAPI();
  }, [loadMarkersFromAPI]);

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
    setRouteName("");
    setSelectedSaler("");
    setSelectedMarkers([]);
    setStartDate("");
    setEndDate("");
  };

  const handleCreateRoute = async () => {
    if (!validateForm()) return;
    setCreating(true);

    const routeData = {
      details: routeName,
      delivery: selectedSaler,
      route: selectedMarkers,
      id_owner: user,
      status: "Por iniciar",
      startDate: startDate,
      endDate: endDate,
      progress: 0
    };

    try {
      const response = await axios.post(API_URL + "/whatsapp/delivert/route", routeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        const updatePromises = selectedMarkers.map(async (marker) => {
          const orderUpdate = {
            _id: marker._id,
            id_owner: user,
            receiveNumber: marker.receiveNumber,
            orderTrackId: selectedSaler,
            orderStatus: "En Ruta"
          };
          const res = await axios.put(API_URL + "/whatsapp/order/status/id", orderUpdate, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.status === 200) {
            await axios.post(API_URL + "/whatsapp/order/track", {
              orderId: marker._id,
              eventType: "Ha sido asignado como repartidor",
              triggeredBySalesman: "",
              triggeredByDelivery: selectedSaler,
              triggeredByUser: "",
              location: { lat: 0, lng: 0 }
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          return res;
        });

        const results = await Promise.all(updatePromises);
        const allSuccessful = results.every(r => r.status === 200);
        if (allSuccessful) {
          loadMarkersFromAPI();
          setIsOpen(false);
          cleanData();
        }
      }
    } catch (error) {
      console.error("Error al crear la ruta:", error);
    } finally {
      setCreating(false);
    }
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
      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === "OK") setDirectionsResponse(result);
        }
      );
    } else {
      setDirectionsResponse(null);
    }
  }, [selectedMarkers, isLoaded]);

  const handleMarkerClick = (location) => {
    if (!selectedSaler) {
      setSuccessModal(true);
      return;
    }
    setSelectedMarkers((prev) => {
      if (!prev.find((item) => item._id === location._id)) {
        return [...prev, {
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
          clientId: location.id_client._id,
          name: location.id_client.name,
          lastName: location.id_client.lastName,
          profilePicture: location.id_client.identificationImage,
          client_location: location.id_client.client_location,
          visitStatus: false,
          visitStatus1: "Sin visitar",
          visitTime: null,
          orderTaken: false,
          visitStartTime: null,
          visitEndTime: null,
          tripTime: null,
          distanceTrip: null,
          timeToPlace: null
        }];
      }
      return prev;
    });
    findLocation({ client_location: location.id_client.client_location });
  };

  const isClientSelected = (clientId) => selectedMarkers.some(m => m._id === clientId);
  const totalAmount = selectedMarkers.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-50">
      <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[460px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {!sidebarCollapsed && (
          <>
            <div className="p-5 border-b border-gray-200  bg-red-700 rounded-r-3xl text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <button
                    onClick={() => navigate(-1)}
                    className="text-xs text-red-100 hover:text-white flex items-center gap-1 mb-1 transition-colors"
                  >
                    <FaArrowLeft size={10} /> Volver
                  </button>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <FaTruck />
                    Rutas de entrega
                  </h1>
                  <p className="text-xs text-red-100 mt-0.5">Asigna pedidos a repartidores</p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <FaChevronLeft />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-xs text-red-100">Pedidos</p>
                  <p className="text-2xl font-bold">{markers.length}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-xs text-red-100">Seleccionados</p>
                  <p className="text-2xl font-bold">{selectedMarkers.length}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                  Repartidor asignado <span className="text-[#D3423E]">*</span>
                </label>
                <div className="relative">
                  <FaTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <select
                    value={selectedSaler}
                    onChange={(e) => {
                      setSelectedSaler(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar repartidor...</option>
                    {vendedores.map((v) => (
                      <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                    ))}
                  </select>
                </div>
                {!selectedSaler && (
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <FaInfoCircle size={10} />
                    Selecciona un repartidor antes de agregar pedidos
                  </p>
                )}
              </div>

              <div className="relative">
                <TextInputFilter
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onEnter={() => loadMarkersFromAPI()}
                  placeholder="Buscar pedido por cliente..."
                />
              </div>

              {selectedMarkers.length > 0 && selectedSaler && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="w-full px-4 py-3 bg-[#D3423E] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <FaRoute />
                  Crear ruta ({selectedMarkers.length})
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
                  <p className="text-sm">Cargando pedidos...</p>
                </div>
              ) : markers.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-2">
                    Pedidos aprobados ({markers.length})
                  </p>

                  {markers.map((client) => {
                    const isSelected = isClientSelected(client._id);
                    const accountConfig = ACCOUNT_STATUS_CONFIG[client.accountStatus];
                    return (
                      <div
                        key={client._id}
                        onClick={() => findLocation({ client_location: client.id_client.client_location })}
                        className={`bg-white border-2 rounded-2xl overflow-hidden transition-all cursor-pointer hover:shadow-md ${isSelected ? 'border-[#D3423E] shadow-md ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex gap-3 p-3">
                          <img
                            className="w-16 h-16 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                            src={client.id_client.identificationImage || FALLBACK_IMAGE}
                            alt={client.id_client.name}
                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goToClientDetails(client);
                                }}
                                className="font-bold text-gray-900 text-sm truncate hover:text-[#D3423E] transition-colors"
                              >
                                {client.id_client.name} {client.id_client.lastName}
                              </h3>
                              {isSelected && (
                                <span className="flex-shrink-0 w-6 h-6 bg-[#D3423E] text-white rounded-full flex items-center justify-center">
                                  <FaCheck size={10} />
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                              <FaReceipt size={10} className="text-gray-400 flex-shrink-0" />
                              Nota #{client.receiveNumber}
                            </p>

                            {client.id_client.company && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 truncate mt-0.5">
                                <FaBuilding size={10} className="text-gray-400 flex-shrink-0" />
                                {client.id_client.company}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {accountConfig && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accountConfig.color}`}>
                                  {accountConfig.label}
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">
                                APROBADA
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="px-3 pb-3 space-y-2">
                          <div className="flex items-start gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 text-xs text-gray-600">
                            <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0 mt-0.5" size={10} />
                            <span className="break-words">
                              {client.id_client.client_location?.direction || "Sin dirección"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaDollarSign size={10} className="text-gray-400" />
                              <span>Total</span>
                            </div>
                            <span className="font-bold text-gray-900">Bs. {Number(client.totalAmount).toFixed(2)}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                handleDelete(client._id);
                              } else {
                                handleMarkerClick(client);
                              }
                            }}
                            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${isSelected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#D3423E] text-white hover:bg-red-700'}`}
                          >
                            {isSelected ? (
                              <><FaTimes size={10} /> Quitar de la ruta</>
                            ) : (
                              <><FaPlus size={10} /> Agregar a la ruta</>
                            )}
                          </button>
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
                    <FaReceipt className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-700 font-semibold">Sin pedidos aprobados</p>
                  <p className="text-sm text-gray-500 mt-1 px-8">
                    No hay pedidos disponibles para asignar
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
            center={center}
            zoom={mapZoom}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {markers.length > 0 && markers.map((location, index) => {
              const isSelected = selectedMarkers.some(m => m._id === location._id);
              const orderIndex = selectedMarkers.findIndex(m => m._id === location._id);
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
                        <circle cx="25" cy="25" r="22" fill="#D3423E" stroke="white" strokeWidth="3"/>
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
                    strokeColor: "#D3423E",
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

        <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200">
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Leyenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <img src={tiendaIcon} alt="" className="w-5 h-5" />
              <span className="text-gray-700">Pedido aprobado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-[#D3423E] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">1</div>
              <span className="text-gray-700">En la ruta</span>
            </div>
            {directionsResponse && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-1 bg-[#D3423E]" />
                <span className="text-gray-700">Ruta optimizada</span>
              </div>
            )}
          </div>
        </div>

        {selectedMarkers.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-bold text-gray-700 uppercase">
                  Ruta seleccionada ({selectedMarkers.length})
                </p>
                <p className="text-xs font-bold text-[#D3423E]">
                  Total: Bs. {totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex overflow-x-auto space-x-2 pb-1">
                {selectedMarkers.map((client, idx) => (
                  <div
                    key={client._id}
                    className="flex-shrink-0 flex items-center gap-2 p-2 border-2 border-[#D3423E] bg-red-50 rounded-xl min-w-[220px]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveClient(idx, 'up')}
                        disabled={idx === 0}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveClient(idx, 'down')}
                        disabled={idx === selectedMarkers.length - 1}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${idx === selectedMarkers.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                        ▼
                      </button>
                    </div>
                    <div className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div
                      onClick={() => findLocation(client)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {client.name} {client.lastName}
                      </p>
                      <p className="text-[11px] text-gray-600 truncate">
                        #{client.receiveNumber} · Bs. {Number(client.totalAmount).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(client._id)}
                      className="w-7 h-7 text-red-500 hover:bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                ))}
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
                    <FaRoute /> Crear ruta de entrega
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5">
                    {selectedMarkers.length} pedido{selectedMarkers.length !== 1 ? 's' : ''} · Bs. {totalAmount.toFixed(2)}
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
                      placeholder="Ej: Entregas Lunes Zona Sur"
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
                    <DateInput value={startDate} onChange={setStartDate} label="Inicio" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                      Hasta <span className="text-[#D3423E]">*</span>
                    </label>
                    <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fin" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Resumen</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Repartidor:</span>
                      <span className="font-semibold text-gray-900 truncate ml-2">
                        {vendedores.find(v => v._id === selectedSaler)?.fullName || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pedidos:</span>
                      <span className="font-semibold text-gray-900">{selectedMarkers.length}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-[#D3423E]">Bs. {totalAmount.toFixed(2)}</span>
                    </div>
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
        message="Por favor, seleccione un repartidor antes de agregar pedidos a la ruta."
      />
    </div>
  );
}