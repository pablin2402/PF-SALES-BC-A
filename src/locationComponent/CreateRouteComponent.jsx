import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";
import { MdDelete } from "react-icons/md";

export default function CreateRouteComponent() {
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
  const [mapZoom, setMapZoom] = useState(13);
  const [vendedores, setVendedores] = useState([]);

  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [routeName, setRouteName] = useState("");

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  

  const [isOpen, setIsOpen] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const handleCreateRoute = async () => {
    if (validateForm()) {
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
        try {
          const response = await axios.post(API_URL + "/whatsapp/salesman/route", routeData, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (response.status === 200) {
            setIsOpen(false);
            cleanData();
            goToClientDetails();
          }
        } catch (error) {
          console.error("Error en la solicitud:", error);
        }

      } catch (error) {
        console.error("Error al crear la ruta:", error);
      }
    }
  };
  const cleanData = () => {
    setRouteName("");
    setSelectedSaler("");
    setSelectedMarkers([]);
    setStartDate("");
    setEndDate("");
  }
  useEffect(() => {
    const fetchVendedores = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
                {
                    id_owner: user
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            setVendedores(response.data.data);
        } catch (error) {
            console.error("Obteniendo vendedores", error);
            setVendedores([]);
        }
    };

    if (user && token) { 
        fetchVendedores();
    }
}, [user, token]); 

const loadMarkersFromAPI = useCallback(async (sales_id) => {
  try {
      const response = await axios.post(API_URL + "/whatsapp/maps/list/id", {
          id_owner: user,
          sales_id: sales_id
      }, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      });
      setMarkers(response.data);
  } catch (error) {
      console.error("Error al cargar los marcadores: ", error);
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
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.number).includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, markers]);
  const findLocation = (location) => {
    if (location && location.client_location) {
      const lat = parseFloat(location.client_location.latitud);
      const lng = parseFloat(location.client_location.longitud);
      setMapZoom(18);

      if (!isNaN(lat) && !isNaN(lng)) {
        setCenter({ lat, lng });
      } else {
        console.error("Error: Ubicación inválida", location.client_location);
      }
    } else {
      console.error("Error: Cliente sin ubicación", location);
    }
  };
  const goToClientDetails = () => {
    navigate("/localization/list/route");
  };
  const containerStyle = {
    width: "100%",
    height: "calc(100vh - 4rem)",
  };
  const handleMarkerClick = (location) => {
    if (!selectedSaler) {
      alert("Por favor, seleccione un vendedor antes de agregar clientes a la ruta.");
      return;
    }
    setSelectedMarkers((prev) => {
      if (!prev.find((item) => item._id === location._id)) {
        const newLocation = {
          _id: location._id,
          name: location.name,
          lastName: location.lastName,
          profilePicture: location.profilePicture,
          client_location: location.client_location,
          visitStatus: false,
          visitTime: null,
          orderTaken: false,
          visitStartTime: null,
          visitEndTime: null 
        };
        return [...prev, newLocation];
      }
      return prev;
    });
  };
  const handleDelete = (clientId) => {
    setSelectedMarkers((prev) => prev.filter(client => client._id !== clientId));
  };
  const validateForm = () => {
    const newErrors = {};
    if (!routeName) newErrors.routeName = "El nombre es obligatorio.";
    if (!startDate) newErrors.startDate = "La fecha de inicio es obligatoria.";
    if (!endDate) newErrors.endDate = "La fecha de fin es obligatoria.";
    return Object.keys(newErrors).length === 0;
  };
  return (
    <div className="h-screen w-full flex overflow-hidden">
      <div className="w-2/6 h-full overflow-auto border-r-2 border-gray-200">
        <div className="px-4 py-4">
          <div className="space-y-4 mt-4">
            {selectedMarkers.length > 0 ? (
              <>
                <div className="flex justify-end items-center space-x-2 w-full">
                  <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-lg text-[#3A3737] font-bold rounded-lg hover:bg-[#FF7F7A] transition duration-200 flex-shrink-0 h-[40px] w-32"
                  >
                    Siguiente
                  </button>
                </div>
                {selectedMarkers.map((client, index) => (
                 <div
                    key={client._id}
                    onClick={() => findLocation(client)}
                    className={`flex flex-col items-center bg-white md:flex-row hover:bg-gray-100 gap-x-2 min-w-[250px] cursor-pointer 
                    ${index !== selectedMarkers.length - 1 ? "border-b border-gray-700" : "border-b border-gray-700"}`}
                  >
                 <img
                   className="w-16 h-16 object-cover rounded-md"
                   src={client.profilePicture || "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"}
                   alt={client.name || "Cliente"}
                 />
                 <div className="flex flex-col justify-between leading-normal">
                   <h5
                     onClick={() => goToClientDetails(client)}
                     className="text-l font-bold tracking-tight text-gray-900 flex items-center"
                   >
                     {client.name} {client.lastName}
                   </h5>
                   <p className="text-m font-normal text-gray-700 flex items-center">
                     <FaMapMarkerAlt className="text-red-500 mr-2" />
                     {client.client_location?.direction || "No disponible"}
                   </p>
                 </div>
                 <button onClick={(e) => {
                  e.stopPropagation();
                    e.preventDefault();
                    handleDelete(client._id);
                  }} className="text-red-500 hover:text-red-700 ml-auto">
                   <MdDelete className="h-5 w-5" />
                 </button>
               </div>
               
                ))}
              </>

            ) : (
              <div className="flex flex-1 h-[calc(100vh-150px)] items-center justify-center border border-gray-400 rounded-lg text-gray-700 text-sm font-semibold">
                Ningún item seleccionado
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-4/6 h-[calc(100vh-4rem)] bg-white relative">
        <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={mapZoom}
          >
            {filteredData.map((location, index) => (
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
                onClick={() => handleMarkerClick(location)}
              />
            ))}
          </GoogleMap>
        </LoadScript>

        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex justify-center items-center gap-x-4">
          <div className="relative w-1/2">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block p-2 pl-10 text-sm text-gray-900 border border-gray-900 rounded-2xl w-full bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-5 h-5 text-red-500"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
          </div>

          <div className="w-1/2">
            <select
              className="block w-full p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
              name="vendedor"
              value={selectedSaler}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setSelectedSaler(selectedValue);
                loadMarkersFromAPI(selectedValue);
              }} required
            >
              <option value="">Filtrar por vendedor</option>
              <option value="">Mostrar Todos</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor._id} value={vendedor._id}>
                  {vendedor.fullName + " " + vendedor.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>


        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 z-10">
          <div className="flex overflow-x-auto space-x-4 p-2 rounded-2xl">
            {filteredData.map((client) => (
              <div
                key={client._id}
                onClick={() => findLocation(client)}
                href="#"
                className="flex flex-col items-center bg-white border border-gray-700 rounded-2xl md:flex-row hover:bg-gray-100 gap-x-4 p-4 min-w-[250px] cursor-pointer"
              >
                <img
                  className="w-16 h-16 object-cover rounded-md"
                  src={client.profilePicture || "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"}
                  alt={client.name}
                />
                <div className="flex flex-col justify-between leading-normal">
                  <h5
                    onClick={(e) => {
                      e.stopPropagation(); 
                      goToClientDetails(client);
                    }}                    
                    className="text-l font-bold tracking-tight text-gray-900 flex items-center"
                  >
                    {client.name} {client.lastName}
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

      </div>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Crear Ruta
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="authentication-modal">
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor"  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <div className="p-4 md:p-5">
            <form className="space-y-4" action="#">
            <div className="text-left">
              <label htmlFor="routeName" className="block mb-2 text-sm font-medium text-gray-900">Nombre de la ruta</label>
              <input
                id="routeName"
                type="text"
                placeholder="Nombre de la ruta"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="w-full p-2 border text-gray-900 rounded-lg mb-2"
              />
            </div>
            <div className="text-left">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha de inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border text-gray-900 rounded-lg mb-2"
                />
            </div>
            <div className="text-left">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha de fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border text-gray-900 rounded-lg mb-4"
                />
            </div>
            <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => handleCreateRoute()} 
                  disabled={!routeName || !startDate || !endDate}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                    !routeName || !startDate || !endDate
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-[#D3423E] text-white hover:bg-[#c73a36]'
                  }`}                  >
                  Crear
                  </button>
            </div>
            </form>
            </div>
        
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
