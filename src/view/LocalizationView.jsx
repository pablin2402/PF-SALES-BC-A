import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";

export default function LocalizationView() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const [salesManData, setSalesManData] = useState([]);
  const [canalesData, setCanalesData] = useState([]);
  const [markers, setMarkers] = useState([]);

  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);
  const [mapInstance, setMapInstance] = useState(null);

  const [selectedCategories, setSelectedCategories] = useState("");
  const [selectedSalesmen, setSelectedSalesmen] = useState("");
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [googleMaps, setGoogleMaps] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

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
      console.log(selectedSalesmen)
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
                  loadMarkersFromAPI();
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
              value={selectedSalesmen}
              onChange={(e) => {
                setSelectedSalesmen(e.target.value);
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
        <div className="px-4 py-4 w-full">
          {markers.map((client, index) => (
            <div
              key={client._id}
              onClick={() => findLocation(client)}
              className="flex flex-col items-center bg-white md:flex-row gap-x-4 w-full max-w-screen-lg h-auto border-2 border-gray-300 rounded-2xl mb-4 shadow-md relative"
              role="button"
              tabIndex={0}
              aria-label={`Ver detalles de ${client.name} ${client.lastName}`}
              style={{ minHeight: "280px" }}
            >
              <img
                className="w-[150px] h-[280px] object-cover rounded-t-lg md:rounded-none md:rounded-s-lg"
                src={
                  client.profilePicture ||
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
                  className="mb-2 text-lg font-bold tracking-tight text-gray-900 dark:text-white cursor-pointer"
                >
                  {client.name} {client.lastName}
                </h5>
                <h5 className="text-l mt-2 mb-2 font-normal tracking-tight text-gray-900 flex items-center">
                  {client.company}
                </h5>
                <p className="text-m mt-2 mb-2 font-normal text-gray-700 flex items-center">
                  <FaMapMarkerAlt className="text-red-500 mr-2" />
                  {client.client_location?.direction || "No disponible"}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
      <div className="w-4/6 bg-white overflow-y-auto">
        {isLoaded ? (

          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}
            onLoad={(map) => {
              setMapInstance(map);
              setGoogleMaps(window.google);
            }}          >
            {mapInstance &&
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

          </GoogleMap>
        ) : (
          <div className="text-center text-gray-500 text-sm">Cargando mapa...</div>
        )}
      </div>
    </div>
  );
}
