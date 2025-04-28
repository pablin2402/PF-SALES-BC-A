import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";

export default function LocalizationView() {
  const navigate = useNavigate();

  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [salesManData, setSalesManData] = useState([]);
  const [canalesData, setCanalesData] = useState([]);
  const [markers, setMarkers] = useState([]);

  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);
  const [mapInstance, setMapInstance] = useState(null);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSalesmen, setSelectedSalesmen] = useState([]);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

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
      setSalesManData(response.data);
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
    fetSalesMan();
  }, [fetSalesMan]);  
  
  const loadMarkersFromAPI = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/maps/list/id", {
        id_owner: user,
        salesFullName: selectedSalesmen.map((s) => s.fullName),
        salesLastName: selectedSalesmen.map((s) => s.lastName),
        userCategory: selectedCategories,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
      setMarkers(response.data);
    } catch (error) {
      console.error("Error al cargar los marcadores: ", error);
    }
  };
  useEffect(() => {
    loadMarkersFromAPI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedSalesmen]);
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(markers);
    } else {
      const filtered = markers.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.number).includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, markers]);

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
  const handleCategoryChange = (canal) => {
    setSelectedCategories((prev) =>
      prev.includes(canal)
        ? prev.filter((c) => c !== canal)
        : [...prev, canal]
    );
  };
  

const handleSalesmanChange = (salesman) => {
  const isSelected = selectedSalesmen.some((s) => s._id === salesman._id);
  if (isSelected) {
    setSelectedSalesmen((prev) => prev.filter((s) => s._id !== salesman._id));
  } else {
    setSelectedSalesmen((prev) => [...prev, salesman]);
  }
};

  
  
  return (
    <div className="h-screen w-full flex">
      <div className="w-1/6  overflow-y-auto border-r-2 border-gray-200">
        <div className="px-4 py-4">
          <h1 className="mb-4 font-semibold text-gray-900 text-2xl text-left">Filtrar por: </h1>
          <h3 className="mb-4 ml-2 mr-2 font-semibold text-gray-900 text-left">Vendedor</h3>
          <ul className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg ml-2 mr-2">
            {salesManData.map((salesMan) => (
              <li key={salesMan.id} className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                <div className="flex items-center ps-3">
                <input
                  id={`salesman-checkbox-${salesMan._id}`}
                  type="checkbox"
                  value={salesMan._id}
                  checked={selectedSalesmen.some((s) => s._id === salesMan._id)}
                  onChange={() => handleSalesmanChange(salesMan)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-red-500 checked:bg-red-600 focus:ring-2"
                  />
                  <label
                    htmlFor={`salesman-checkbox-${salesMan._id}`}
                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    {salesMan.fullName + " " + salesMan.lastName}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-4 py-4">
          <h3 className="mb-4 ml-2 mr-2 font-semibold text-gray-900 text-left">Canales</h3>
          <ul className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {canalesData.map((canal, index) => (
              <li key={index} className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                <div className="flex items-center ps-3">
                <input
                  id={`canal-checkbox-${index}`}
                  type="checkbox"
                  value={canal.canal}
                  checked={selectedCategories.includes(canal.canal)}
                  onChange={() => handleCategoryChange(canal.canal)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-red-500 checked:bg-red-600 focus:ring-2"
                />
                  <label
                    htmlFor={`canal-checkbox-${index}`}
                    className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    {canal.canal}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-2/6 overflow-y-auto border-r-2 border-gray-200">
        <div className="px-4 py-4">
          <div className="relative justify-center">
            <input
              type="text"
              placeholder="Buscar por Nombre, apellido, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block p-2 pl-10 text-sm text-gray-900 border border-gray-900 rounded-2xl w-full bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-red-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-4 mt-4">
          {filteredData.map((client, index) => (
            <div
            key={client._id}
            onClick={() => findLocation(client)}
            className={`flex flex-col items-center bg-white md:flex-row hover:bg-gray-100 gap-x-2 min-w-[250px] 
              ${index !== filteredData.length - 1 ? "border-b border-gray-300" : "border-b border-gray-300"}`}
            role="button"
            tabIndex={0} // Para que sea accesible con teclado
            aria-label={`Ver detalles de ${client.name} ${client.lastName}`}
          >
            <img
              className="w-16 h-16 mr-2 ml-2 object-cover rounded-md"
              src={client.profilePicture || "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"}
              alt={client.name}
            />
            <div className="flex flex-col justify-between leading-normal text-left">
              <h5
                onClick={(e) => {
                  e.stopPropagation();
                  goToClientDetails(client);
                }}
                className="text-l font-bold tracking-tight text-gray-900 flex items-center cursor-pointer"
              >
                {client.name} {client.lastName}
              </h5>
              <h5 className="text-l font-normal tracking-tight text-gray-900 flex items-center">
                {client.company}
              </h5>
              <p className="text-m font-normal text-gray-700 flex items-center">
                <FaMapMarkerAlt className="text-red-500 mr-2" />
                {client.client_location.direction || "No disponible"}
              </p>
            </div>
          </div>
          
          ))}
        </div>
      </div>
      <div className="w-3/6 bg-white overflow-y-auto">
        <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}
            onLoad={(map) => setMapInstance(map)}
          >
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
        </LoadScript>
      </div>
    </div>
  );
}
