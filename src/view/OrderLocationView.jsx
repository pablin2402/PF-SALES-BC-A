import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function OrderLocationView() {
    const navigate = useNavigate();

    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [markers, setMarkers] = useState([]);

    const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
    const [mapZoom, setMapZoom] = useState(13);

    const [salesData, setSalesData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);


    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedPaymentType, setSelectedPaymentType] = useState("");
    const [selectedSaler, setSelectedSaler] = useState("");
    const limit = 8;
    const [page, setPage] = useState(1);
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
  


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
                console.error("Error: Ubicación inválida", location.client_location);
            }
        } else {
            console.error("Error: Cliente sin ubicación", location);
        }
    };
    const goToClientDetails = (client) => {
        navigate(`/client/${client._id}`, { state: { client } });
    };


    const loadMarkersFromAPI = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/maps/list/id", {
                id_owner: user,
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
    }, []);
    const fetchOrders = useCallback(async (pageNumber) => {
        setLoading(true);
        try {
            const filters = {
                id_owner: user,
                page: pageNumber,
                limit: limit,
                status_order:"aproved"
            };

            const response = await axios.post(API_URL + "/whatsapp/order/id", filters,
                {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                }
            );
            setSalesData(response.data.orders);
            setFilteredData(response.data.orders);
            setTotalPages(response.data.totalPages);
        } catch (error) {
                console.error("Error fetching orders:", error.response ? error.response.data : error.message);

        } finally {
            setLoading(false);
        }
    }, [selectedStatus, selectedPaymentType, selectedSaler, limit]);
    useEffect(() => {
        fetchOrders(page);
    }, [page, fetchOrders]);
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredData(salesData);
        } else {
            const filtered = salesData.filter((item) =>
                item.id_client.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, salesData]);
    return (
        <div className="h-screen w-full flex">
            <div className="w-2/6 overflow-y-auto border-r-2 border-gray-200">
                <div className="px-4 py-4">
                    <div className="relative justify-center">
                        <TextInputFilter
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por Nombre, apellido, teléfono..."
                        />
                       
                    </div>
                </div>
                <div className="px-4 py-4 grid grid-cols-1 gap-6">
                    {filteredData.map((client) => (
                        <a key={client._id} onClick={() => findLocation(client)} href="#" className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow-lg md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                            <img
                                className="w-32 h-32 object-cover rounded-full md:w-48 md:h-48 md:rounded-none"
                                src={client.id_client.profilePicture || "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg"}
                                alt={client._id}
                            />
                            <div className="flex flex-col justify-between p-4 leading-normal">
                                <h5 onClick={() => goToClientDetails(client)} className="mb-2 text-l font-bold tracking-tight text-gray-900 dark:text-white">
                                    {client.id_client.name + " " + client.id_client.lastName}
                                </h5>
                                <p className="mb-3 font-normal text-m text-gray-700 dark:text-gray-400 flex items-center">
                                    <FaMapMarkerAlt className="text-red-500 mr-2" />
                                    {client.direction || "No disponible"}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <div className="w-4/6 bg-white overflow-y-auto">
                <LoadScript googleMapsApiKey={GOOGLE_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={mapZoom}
                    >
                        {markers.map((location, index) => (
                            <Marker
                                key={index}
                                icon={{
                                    url: location.client_location.iconType,
                                    scaledSize: new window.google.maps.Size(40, 40),
                                }}
                                position={{ lat: location.client_location.latitud, lng: location.client_location.longitud }}
                            />
                        ))}
                    </GoogleMap>
                </LoadScript>
            </div>
        </div>
    );
}
