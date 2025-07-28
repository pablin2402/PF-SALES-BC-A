import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY, UPLOAD_TIME } from "../config";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/pin-de-ubicacion.png";
import deliveryIcon from "../icons/entrega-rapida.png";
import vendedoraIcon from "../icons/vendedora.png";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import { OverlayView } from "@react-google-maps/api";

export default function LocalizationView() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const [salesManData, setSalesManData] = useState([]);
  const [canalesData, setCanalesData] = useState([]);
  const [markers, setMarkers] = useState([]);

  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);

  const [selectedCategories, setSelectedCategories] = useState("");
  const [selectedSalesmen, setSelectedSalesmen] = useState("");
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLastLocations = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/location/list/id", { id_owner: user },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });
        setLocations(response.data);
      } catch (error) {
        console.error("Error al obtener ubicaciones:", error);
      }
    };
    fetchLastLocations();
    const interval = setInterval(fetchLastLocations, UPLOAD_TIME);
    return () => clearInterval(interval);
  }, [user]);
  const fetchSalesMan = useCallback(async () => {
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

  useEffect(() => {
    fetchCanales();
  }, []);

  useEffect(() => {
    fetchSalesMan();
  }, [fetchSalesMan]);
  const loadMarkersFromAPI = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/maps/list/id", {
        id_owner: user,
        userCategory: selectedCategories,
        salesCategory: selectedSalesmen,
        nameClient: searchTerm
      },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMarkers(response.data.users);
    } catch (error) {
      console.error("Error al cargar los marcadores: ", error);
    }
  };
  useEffect(() => {
    loadMarkersFromAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedSalesmen]);

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

  return (
    <div>
    <div className="h-screen w-full flex overflow-hidden">
    <div className="w-full lg:w-2/6 overflow-y-auto border-r-2 border-gray-200 max-h-screen">
        <div className="w-full max-w-screen-lg mx-auto px-4">
          <div className="relative w-full mt-4 mb-4">
            <TextInputFilter
              value={searchTerm}
              onChange={setSearchTerm}
              onEnter={() => loadMarkersFromAPI()}
              placeholder="Buscar por nombre, apellido"
            />
          </div>
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              name="vendedor"
              value={selectedSalesmen}
              onChange={(e) => {
                setSelectedSalesmen(e.target.value);
              }}
              className="flex-1 min-w-[150px] p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            >
              <option value="">Mostrar todos</option>
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
              className="flex-1 min-w-[150px] p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            >
              <option value="">Canal de ventas</option>
              {canalesData.map((canal, index) => (
                <option key={index} value={canal.canal}>
                  {canal.canal}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            {markers.map((client) => (
             <div
             key={client._id}
             onClick={() => findLocation(client)}
             className="flex flex-col sm:flex-row w-full h-auto bg-white border-2 border-gray-300 rounded-2xl mb-4 shadow-md relative overflow-hidden"
             role="button"
             tabIndex={0}
           >
           
                <img
                    className="w-full sm:w-[150px] h-[200px] sm:h-[280px] object-cover rounded-t-lg sm:rounded-none sm:rounded-s-lg"
                    src={
                    client.identificationImage ||
                    "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"
                  }
                  alt={client.name}
                />
                <div className="flex flex-col justify-between p-4 leading-normal w-full">
                  <h5
                    onClick={(e) => {
                      e.stopPropagation();
                      goToClientDetails(client);
                    }}
                    className="mb-2 text-lg font-bold tracking-tight text-gray-900 cursor-pointer"
                  >
                    {client.name} {client.lastName}
                  </h5>
                  <h5
                    onClick={(e) => {
                      e.stopPropagation();
                      goToClientDetails(client);
                    }}
                    className="mb-2 text-lg font-semibold tracking-tight text-gray-900 cursor-pointer"
                  >
                    {"Vendedor: " + client.sales_id.fullName + " " + client.sales_id.lastName}
                  </h5>
                  <h5 className="text-l mt-2 mb-2 font-normal tracking-tight text-gray-900">
                    {client.company || "No tiene nombre de recinto registrado"}
                  </h5>
                  <p className="text-m mt-2 mb-2 font-normal text-gray-700 flex items-center">
                    <FaMapMarkerAlt className="text-red-500 mr-2" />
                    {client.client_location?.direction || "No disponible"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>a


      </div>
      <div className="w-full lg:w-4/6 h-[calc(105vh-4rem)] bg-white relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}>
            {markers.length > 0 &&
              markers.map((location, index) => (
                <Marker
                  key={index}
                  position={{
                    lat: location.client_location.latitud,
                    lng: location.client_location.longitud,
                  }}
                  icon={{
                    url: tiendaIcon,
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                />
              ))}
            {locations.map((loc) => {
              const hasDelivery = loc.delivery && typeof loc.delivery === "object";
              const hasSalesman = loc.salesManId && typeof loc.salesManId === "object";

              const deliveryInitials = hasDelivery
                ? (
                  (loc.delivery.fullName?.slice(0, 1) || "X") +
                  (loc.delivery.lastName?.slice(0, 1) || "X")
                ).toUpperCase()
                : "";

              const salesmanInitials = hasSalesman
                ? (
                  (loc.salesManId.fullName?.slice(0, 1) || "X") +
                  (loc.salesManId.lastName?.slice(0, 1) || "X")
                ).toUpperCase()
                : "";

              return (
                <OverlayView
                  key={loc._id}
                  position={{ lat: parseFloat(loc.latitud), lng: parseFloat(loc.longitud) }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className="relative flex flex-col items-center">
                    {(hasDelivery || hasSalesman) && (
                      <div className="absolute -top-4 -left-4 z-10 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        {hasDelivery ? deliveryInitials : salesmanInitials}
                      </div>
                    )}

                    <img
                      src={hasSalesman ? vendedoraIcon : deliveryIcon}
                      alt={hasSalesman ? "salesman icon" : "delivery icon"}
                      style={{ width: 40, height: 40 }}
                    />
                  </div>
                </OverlayView>
              );
            })}
          </GoogleMap>
        ) : (
          <div className="text-center text-gray-500 text-sm">Cargando mapa...</div>
        )}
      </div>
    </div>
    </div>
  );
}
