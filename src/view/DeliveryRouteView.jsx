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
import { BsThreeDotsVertical } from "react-icons/bs";

export default function DeliveryRouteView() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [salesManData, setSalesManData] = useState([]);
  const [canalesData, setCanalesData] = useState([]);
  const [markers, setMarkers] = useState([]);

  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);

  const [selectedCategories, setSelectedCategories] = useState("");
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const [selectedSaler, setSelectedSaler] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const [openDropdownId, setOpenDropdownId] = useState(null);

 
  const [items, setItems] = useState();

  const [selecting, setSelecting] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedMarkers, setSelectedMarkers] = useState([]);

  const fetSalesMan = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
        { id_owner: user },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSalesManData(response.data.data);
    } catch (error) {
      console.error("Error al obtener datos", error);
    }
  }, [user, token]);
  const fetchCanales = async () => {
    const canales = [
      { canal: "Mayorista" },
      { canal: "Tienda" },
      { canal: "Bar" },
      { canal: "Restaurante" },
    ];
    setCanalesData(canales);
  };
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });
  useEffect(() => {
    fetchCanales();
  }, []);

  useEffect(() => {
    fetSalesMan();
  }, [fetSalesMan]);


  const fetchOrders = async (pageNumber) => {
    try {

      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: 10,
        fullName: searchTerm,
        salesId: selectedSaler,
      };

      const response = await axios.post(API_URL + "/whatsapp/order/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMarkers(response.data.orders);
      setTotalPages(response.data.totalPages);
      setItems(response.data.totalRecords);

    } catch (error) {
    } finally {
    }
  };
  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSaler]);

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
      //console.error("Error: Cliente sin ubicación", location);
    }
  };
  const goToClientDetails = (client) => {
    navigate(`/client/${client._id}`, { state: { client } });
  };
  const handleCreateRoute = () => {

    setSelecting(true);
    setSelectedLocations([]);
    setActiveMarker(null);
    setDirectionsResponse(null);
    setSelectedMarkers([]);

  };
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
            console.error("Error en DirectionsService:", status);
          }
        }
      );
    } else {
      setDirectionsResponse(null);
    }
  }, [selectedMarkers]);
  return (
    <div className="h-screen w-full flex">
      <div className="w-2/6 overflow-y-auto border-r-2 border-gray-200">
        <div className="px-4 py-4 w-full">
          <div className="relative w-full mb-4">
            <input
              type="text"
              placeholder="Buscar por Nombre, apellido, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchOrders(1);
                }
              }}
              className="block p-2 pl-10 text-sm text-gray-900 border border-gray-900 rounded-2xl w-full bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-red-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div className="flex gap-4">
            <select
              name="vendedor"
              value={selectedSaler}
              onChange={(e) => {
                setSelectedSaler(e.target.value);
              }}
              className="flex-1 block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            >
              <option value="">Vendedores</option>
              {salesManData.map((salesMan) => (
                <option key={salesMan._id} value={salesMan._id}>
                  {salesMan.fullName + " " + salesMan.lastName}
                </option>
              ))}
            </select>
            <select
              value={selectedCategories}
              onChange={(e) => {
                setSelectedCategories(e.target.value);
              }}
              className="flex-1 block p-2 text-sm text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            >
              <option value="">Canal de ventas</option>
              {canalesData.map((canal, index) => (
                <option key={index} value={canal.canal}>
                  {canal.canal}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-2 py-2 w-full">
          {markers.map((client, index) => (
            <div
              key={client._id}
              onClick={() => findLocation(client)}
              className="flex flex-col items-center bg-white md:flex-row gap-x-4 w-full max-w-screen-lg h-auto border-2 border-gray-300 rounded-2xl mb-4 shadow-md relative"
              role="button"
              tabIndex={0}
              style={{ minHeight: "280px" }}
            >
              <div className="absolute top-2 right-2 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === client._id ? null : client._id);
                  }}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <BsThreeDotsVertical size={20} />
                </button>

                {openDropdownId === client._id && (
                  <div
                    className="z-10 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 absolute right-0 mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ul className="py-2" aria-labelledby="dropdownButton">
                      <li>
                        <button
                          onClick={() => console.log("Asignar repartidor", client._id)}
                          className="block w-full font-bold text-left px-4 py-2 text-m text-gray-900"
                        >
                          Asignar repartidor
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => console.log("Reprogramar pedido", client._id)}
                          className="block w-full font-bold text-left px-4 py-2 text-m text-gray-900 "
                        >
                          Reprogramar pedido
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => console.log("Cancelar pedido", client._id)}
                          className="block w-full text-left font-bold px-4 py-2 text-m text-red-700 "
                        >
                          Cancelar pedido
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <span className="absolute top-2 left-2 text-gray-900 font-bold">
                {client.orderStatus === "deliver" && (
                  <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                    ÓRDEN CREADA
                  </span>
                )}
                {client.orderStatus === "pending" && (
                  <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                    ÓRDEN EN CAMINO
                  </span>
                )}
              </span>

              <img
                className="w-[150px] h-[280px] object-cover rounded-t-lg md:rounded-none md:rounded-s-lg"
                src={
                  client.id_client.profilePicture ||
                  "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"
                }
                alt={client.id_client.name}
              />

              <div className="flex flex-col justify-between p-4 leading-normal w-full">
                <h5
                  onClick={(e) => {
                    e.stopPropagation();
                    goToClientDetails(client);
                  }}
                  className="mb-2 mt-4 text-lg font-bold tracking-tight text-gray-900 cursor-pointer"
                >
                  {client.id_client.name} {client.id_client.lastName}
                </h5>
                <h5 className="text-l mt-2 mb-2 font-normal tracking-tight text-gray-900 flex items-center">
                  {client.id_client.company}
                </h5>
                <p className="text-m mt-2 mb-2 font-normal text-gray-700 flex items-center">
                  <FaMapMarkerAlt className="text-red-500 mr-2" />
                  {client.id_client.client_location?.direction || "No disponible"}
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
        </div>

      </div>
      <div className="w-4/6 h-[calc(105vh-4rem)] bg-white relative">
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
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex justify-center items-center gap-x-6">
          <div className="w-1/2">
            <select
              value={selectedCategories}
              onChange={(e) => {
                setSelectedCategories(e.target.value);
              }}
              className="block p-2 text-m w-full text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            >
              <option value="">Seleccionar distribuidor</option>
              {canalesData.map((canal, index) => (
                <option key={index} value={canal.canal}>
                  {canal.canal}
                </option>
              ))}
            </select>
          </div>
          <div className="w-1/2">
            <button onClick={handleCreateRoute}
              type="button" class="px-5 py-2.5 text-white text-lg rounded-3xl font-bold bg-red-700">CREAR RUTA</button>

          </div>
        </div>
      </div>
    </div>
  );
}
