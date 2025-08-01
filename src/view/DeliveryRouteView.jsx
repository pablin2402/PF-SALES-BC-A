import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import {
  useJsApiLoader, GoogleMap, Marker, OverlayView,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";
import { MdDelete } from "react-icons/md";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import AlertModal from "../Components/modal/AlertModal";
import DateInput from "../Components/LittleComponents/DateInput";

export default function DeliveryRouteView() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [routeName, setRouteName] = useState("");


  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [markers, setMarkers] = useState([]);

  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const [selectedSaler, setSelectedSaler] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const [vendedores, setVendedores] = useState([]);

  const [selecting] = useState(false);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [page, setPage] = useState(1);
  const [successModal, setSuccessModal] = useState(false);

  const fetchProducts = useCallback(async () => {
    const filters = {
      id_owner: user,
      page: page,
      limit: 1000,
      searchTerm: "",
      active: true
    };
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setVendedores(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
    }
  }, [user, token, page]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });
  const loadMarkersFromAPI = useCallback(async () => {
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMarkers(response.data.orders);
      setTotalPages(response.data.totalPages);

    } catch (error) {
    } finally {
    }
  }, [user, searchTerm, token, selectedSaler, page]);

  useEffect(() => {
    fetchProducts();
    loadMarkersFromAPI();
  }, [fetchProducts, loadMarkersFromAPI]);

  const validateForm = () => {
    const newErrors = {};
    if (!routeName) newErrors.routeName = "El nombre es obligatorio.";
    if (!startDate) newErrors.startDate = "La fecha de inicio es obligatoria.";
    if (!endDate) newErrors.endDate = "La fecha de fin es obligatoria.";
    return Object.keys(newErrors).length === 0;
  };
  const containerStyle = {
    width: "100%",
    height: "100%",
  };
  const findLocation = (location) => {
    if (location && location.client_location) {
      const lat = parseFloat(location.client_location.latitud);
      const lng = parseFloat(location.client_location.longitud);
      setMapZoom(18);

      if (!isNaN(lat) && !isNaN(lng)) {
        setCenter({ lat, lng });
      } else {
        //console.error("Error: Ubicación inválida", location.client_location);
      }
    } else {
    }
  };
  const goToClientDetails = (client) => {
    navigate(`/client/${client._id}`, { state: { client } });
  };
  const handleCreateRoute = async () => {
    if (!validateForm()) return;

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
        headers: {
          Authorization: `Bearer ${token}`
        }
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
            headers: {
              Authorization: `Bearer ${token}`
            }
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
              headers: {
                Authorization: `Bearer ${token}`
              }
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
      console.error("Error al crear la ruta o actualizar las órdenes:", error);
    }
  };

  const handleDelete = (clientId) => {
    setSelectedMarkers((prev) => prev.filter(client => client._id !== clientId));
  };

  const cleanData = () => {
    setRouteName("");
    setSelectedSaler("");
    setSelectedMarkers([]);
    setStartDate("");
    setEndDate("");
  }
  const toggleLocationSelection = (location) => {
    if (selectedMarkers.includes(location)) {
      setSelectedMarkers((prev) =>
        prev.filter((loc) => loc !== location)
      );
    } else {
      setSelectedMarkers((prev) => [...prev, location]);
    }
  };
  useEffect(() => {
    if (
      selectedMarkers.length > 1
    ) {
      const routePoints = selectedMarkers.filter(
        (client) => client.id_client?.client_location
      );

      if (routePoints.length < 2) return;

      const origin = {
        lat: routePoints[0].id_client.client_location.latitud,
        lng: routePoints[0].id_client.client_location.longitud,
      };

      const destination = {
        lat: routePoints[routePoints.length - 1].id_client.client_location.latitud,
        lng: routePoints[routePoints.length - 1].id_client.client_location.longitud,
      };

      const waypoints = routePoints.slice(1, -1).map((client) => ({
        location: {
          lat: client.id_client.client_location.latitud,
          lng: client.id_client.client_location.longitud,
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
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
          }
        }
      );
    } else {
      setDirectionsResponse(null);
    }
  }, [selectedMarkers]);
  const handleMarkerClick = (location) => {
    if (!selectedSaler) {
      setSuccessModal(true)
      return;
    }
    setSelectedMarkers((prev) => {
      if (!prev.find((item) => item._id === location._id)) {
        const newLocation = {
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
        };
        return [...prev, newLocation];
      }
      return prev;
    });
  };
  return (
    <div className="h-screen w-full flex overflow-hidden">
<div className="w-full lg:w-2/6 overflow-y-auto border-r-2 border-gray-200 max-h-screen">
        <div className="px-4 py-4 w-full">
          <div className="relative w-full mb-4">
            <TextInputFilter
              value={searchTerm}
              onChange={setSearchTerm}
              onEnter={() => loadMarkersFromAPI()}
              placeholder="Buscar por Nombre, apellido"
            />

          </div>
        </div>
        <div className="px-2 py-2 w-full">
          {markers.length > 0 ? (
            <>
              {markers.map((client, index) => (
               <div
               key={client._id}
               onClick={() => findLocation(client)}
               className="flex flex-col sm:flex-row w-full h-auto bg-white border-2 border-gray-300 rounded-2xl mb-4 shadow-md relative overflow-hidden"
               role="button"
               tabIndex={0}
             >
             

                  <span className="absolute top-2 left-2 text-gray-900 font-bold">
                    {client.orderStatus === "aproved" && (
                      <span className="bg-yellow-100 text-sm text-yellow-800 px-2.5 py-0.5 rounded-full">
                        ÓRDEN APROBADA
                      </span>
                    )}
                  </span>

                  <img
                    className="w-full sm:w-[150px] h-[200px] sm:h-[280px] object-cover rounded-t-lg sm:rounded-none sm:rounded-s-lg"
                    src={
                      client.id_client.identificationImage ||
                      "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"
                    }
                    alt={client.id_client.name}
                  />

                  <div className="flex flex-col justify-between p-4 w-full text-sm sm:text-base break-words">
                    <h5
                      onClick={(e) => {
                        e.stopPropagation();
                        goToClientDetails(client);
                      }}
                      className="mb-2 text-lg font-bold tracking-tight text-gray-900 dark:text-white cursor-pointer"
                    >
                      {client.id_client.name} {client.id_client.lastName}
                    </h5>
                    <h5 className="text-l mt-2 mb-2 font-bold tracking-tight text-gray-900 flex items-center">
                      {client.accountStatus === "Crédito" && (
                        <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                          CRÉDITO
                        </span>
                      )}
                      {client.accountStatus === "Contado" && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                          CONTADO
                        </span>
                      )}
                      {client.accountStatus === "Cheque" && (
                        <span className="bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                          CHEQUE
                        </span>
                      )}
                    </h5>
                    <h5 className="text-l mt-2 mb-2 font-normal tracking-tight text-gray-900 flex items-center">
                      #{client.receiveNumber}
                    </h5>

                    <h5 className="text-sm sm:text-base mt-2 mb-2 font-normal text-gray-900">
  {client.id_client.company || "Sin empresa"}
</h5>


<p className="text-sm sm:text-base mt-2 mb-2 font-normal text-gray-700 flex items-center truncate">
  <FaMapMarkerAlt className="text-red-500 mr-2 shrink-0" />
  <span className="whitespace-normal break-words">
    {client.id_client.client_location?.direction || "No disponible"}
  </span>
</p>

                    <h5 className="text-m mt-2 mb-2 font-normal tracking-tight text-gray-900 flex items-center">
                      {client.creationDate
                        ? "Fecha de creación: " + new Date(client.creationDate).toLocaleDateString()
                        : "Sin fecha"}
                    </h5>
                    <div className="mb-4 flex flex-col md:flex-row justify-between items-end">
                      <h5 className="text-2xl font-bold tracking-tight text-gray-900">
                        {"Bs. " + client.totalAmount}
                      </h5>
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center pt-4 space-x-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                      }`}
                  >
                    ◀
                  </button>

                  {(() => {
                    let start = Math.max(1, page - 1);
                    let end = Math.min(totalPages, page + 1);

                    if (page === 1) {
                      end = Math.min(3, totalPages);
                    } else if (page === totalPages) {
                      start = Math.max(totalPages - 2, 1);
                    }

                    const pagesToShow = [];
                    for (let i = start; i <= end; i++) {
                      pagesToShow.push(i);
                    }

                    return pagesToShow.map((num) => (
                      <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`px-3 py-1 border border-gray-400 rounded-lg ${page === num ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                      >
                        {num}
                      </button>
                    ));
                  })()}


                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}>
                    ▶
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="flex flex-1 h-[calc(100vh-150px)] items-center justify-center border border-gray-400 rounded-lg text-gray-700 text-sm font-semibold">
              Ningún item seleccionado
            </div>
          )}
        </div>

      </div>
      <div className="w-full lg:w-4/6 h-[calc(105vh-4rem)] bg-white relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}
          >
            {markers.length > 0 && markers.map((location, index) => (
              <Marker
                key={index}
                position={{
                  lat: location.id_client.client_location.latitud,
                  lng: location.id_client.client_location.longitud,
                }}
                icon={{
                  url: selectedMarkers.includes(location)
                    ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    : tiendaIcon,
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                onClick={() => handleMarkerClick(location)}

              >
                {selecting && (
                  <OverlayView
                    position={{
                      lat: location.id_client.client_location.latitud,
                      lng: location.id_client.client_location.longitud,
                    }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      className="flex items-center gap-2 p-1 rounded-2xl"
                      style={{ position: "relative", top: "-50px", left: "-12px" }}
                    >
                      <input
                        id={`checkbox-${index}`}
                        type="checkbox"
                        className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-900 rounded-2xl"
                        checked={selectedMarkers.includes(location)}
                        onChange={() => toggleLocationSelection(location)}
                      />
                      <label htmlFor={`checkbox-${index}`} className="text-sm">
                        Seleccionar
                      </label>
                    </div>
                  </OverlayView>
                )}
              </Marker>
            ))}
            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  polylineOptions: {
                    strokeColor: "#000000",
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                  },
                  suppressMarkers: true,
                }}
              />
            )}


          </GoogleMap>
        ) : (
          <div className="text-center text-gray-500 text-sm">Cargando mapa...</div>
        )}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 z-10">
          <div className="flex overflow-x-auto space-x-4 p-2 rounded-2xl">
            {selectedMarkers.length > 0 &&
              selectedMarkers.map((client) =>
                client ? (
                  <div
                    key={client._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => findLocation(client)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        findLocation(client);
                      }
                    }}
                    className="flex flex-col items-center bg-white border-2 border-gray-700 rounded-2xl md:flex-row hover:bg-gray-100 gap-x-4 p-4 min-w-[250px]"
                  >
                    <img
                      className="w-16 h-16 object-cover rounded-md"
                      src={client.profilePicture || "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"}
                      alt={client.name}
                    />

                    <div className="flex flex-col justify-between leading-normal">
                      <h5
                        className="text-l font-bold tracking-tight text-gray-900 flex items-center"
                      >
                        {client.name} {client.lastName}
                      </h5>
                      <p className="text-m font-normal text-gray-700 flex items-center">
                        <FaMapMarkerAlt className="text-red-500 mr-2" />
                        {client.client_location.direction || "No disponible"}
                      </p>
                    </div>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete(client._id);
                    }} className="text-red-500 hover:text-red-700 ml-auto">
                      <MdDelete className="h-7 w-7" />
                    </button>
                  </div>
                ) : null
              )}
          </div>
        </div>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex justify-center items-center gap-x-6">
          <div className="w-1/2">
            <select
              className="block w-full p-2 text-lg text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
              name="vendedor"
              value={selectedSaler}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setSelectedSaler(selectedValue);
                loadMarkersFromAPI();
              }} required
            >
              <option value="">Filtrar por repartidor</option>
              <option value="">Mostrar Todos</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor._id} value={vendedor._id}>
                  {vendedor.fullName + " " + vendedor.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="w-1/2">
            <PrincipalBUtton
              onClick={() => setIsOpen(true)}
              disabled={selectedMarkers.length === 0}
            >
              CREAR RUTA
            </PrincipalBUtton>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Crear Ruta
                </h3>
                <button type="button" onClick={() => setIsOpen(false)} className="end-2.5 text-gray-700 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="authentication-modal">
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <div className="p-4 md:p-5">
                <form className="space-y-4" action="#">
                  <div className="text-left">
                    <label htmlFor="routeName" className="block mb-2 text-m font-medium text-gray-900">Nombre de la ruta</label>
                    <input
                      id="routeName"
                      type="text"
                      placeholder="Nombre de la ruta"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      className="w-full  px-3 py-2 border text-gray-900 rounded-2xl text-sm   focus:outline-none focus:ring-0 focus:border-red-500"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block mb-2 text-m font-medium text-gray-900 dark:text-white">Fecha de inicio</label>
                    <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />
                  </div>
                  <div className="text-left">
                    <label className="block mb-2 text-m font-medium text-gray-900 ">Fecha de fin</label>
                    <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />

                  </div>
                  <div className="w-full">
                    <button
                      type="button"
                      onClick={() => handleCreateRoute()}
                      disabled={!routeName || !startDate || !endDate}
                      className={`w-full  px-4 py-2 font-semibold uppercase rounded-3xl transition-colors ${!routeName || !startDate || !endDate
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-[#D3423E] text-white hover:bg-[#c73a36]'
                        }`}                  >
                      Crear Ruta
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
      <AlertModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Por favor, seleccione un repartidor antes de agregar clientes a la ruta."
      />
    </div>
  );
}
