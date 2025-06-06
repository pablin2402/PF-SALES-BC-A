import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { LoadScript, GoogleMap, Marker} from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";

import tiendaIcon2 from "../icons/tienda.png";

import { HiFilter } from "react-icons/hi";
import { DirectionsRenderer } from "@react-google-maps/api";

export default function ActivityRouteComponent() {
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
    const [mapZoom, setMapZoom] = useState(12);
    const [vendedores, setVendedores] = useState([]);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [selectedSaler, setSelectedSaler] = useState("");
    const getCurrentDateUTCMinus4 = () => {
        const now = new Date();
        now.setUTCHours(now.getUTCHours() - 4);
        return now.toISOString().split("T")[0]; 
    };
    const [startDate, setStartDate] = useState(getCurrentDateUTCMinus4());
    const [salesData, setSalesData] = useState([]);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

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
                console.error(" obteniendo vendedores", error);
                setVendedores([]);
            }
        };
        fetchVendedores();
    }, [user, token]);
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredData(salesData);        
        } else {
            const filtered = salesData.filter((item) =>
                item.clientName.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.clientName.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(item.number).includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, salesData]);
    
    const findLocation = (client) => {
        if (client) {
            const lat = parseFloat(client.latitude);
            const lng = parseFloat(client.longitude);
            setMapZoom(18);

            if (!isNaN(lat) && !isNaN(lng)) {
                setCenter({ lat, lng });
                setSelectedMarkers([{ route: [client] }]);
            } else {
                console.error("Error: Ubicación inválida", client);
            }
        } else {
            console.error("Error: Cliente sin ubicación", client);
        }
    };
    const containerStyle = {
        width: "100%",
        height: "107%",
    };
    const fetchActivities = useCallback(async (selectedSaler, page) => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/salesman/date/id", {
                id_owner: user,
                salesMan: selectedSaler,
                startDate: startDate,
                details: "",
                page: page
            }, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
            setSalesData(response.data.data || []);
            setFilteredData(response.data.data || []);
            setTotalPages(response.data.pages);
            setDirectionsResponse(null);
        } catch (error) {
        } finally {
        }
    }, [startDate, user, token]); 
    
    useEffect(() => {
        fetchActivities(selectedSaler, page);
    }, [fetchActivities, selectedSaler, page]);
    useEffect(() => {
        if (salesData.length > 1 && window.google) {
            const origin = {
                lat: salesData[0].latitude,
                lng: salesData[0].longitude,
            };
            const destination = {
                lat: salesData[salesData.length - 1].latitude,
                lng: salesData[salesData.length - 1].longitude,
            };
            const waypoints = salesData.slice(1, -1).map((client) => ({
                location: {
                    lat: client.latitude,
                    lng: client.longitude,
                },
                stopover: true,
            }));
            setDirectionsResponse(null); 

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
                    } else {
                        console.error("Directions request failed:", status);
                    }
                }
            );
        }
    }, [salesData]);
    
    return (
        <div className="h-screen w-full flex overflow-hidden">
            <div className="w-2/6 h-full overflow-auto border-r-2 border-gray-200">
                <div className="px-4 py-4">
                    <div className="flex flex-col w-full mb-4 space-y-2">
                        <select
                            className="block w-full p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                            name="vendedor"
                            value={selectedSaler}
                            onChange={(e) => {
                                const selectedValue = e.target.value;
                                setSelectedSaler(selectedValue);
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
                        <div className="flex flex-row gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-2/5 p-2 border text-sm border-gray-900 rounded-lg text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500"
                            />
                           
                            <button
                                onClick={() => fetchActivities(selectedSaler)}
                                className="flex items-center justify-center px-4 py-2 bg-white rounded-lg transition duration-200 w-1/5 h-12"
                            >
                                <HiFilter className="text-black text-2xl hover:text-red-700 transition duration-200" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4 mt-4">
                        {filteredData.length > 0 ? (
                            <>
                                {filteredData.map((client, index) => (
                                    <div
                                        key={client._id}
                                        onClick={() => findLocation(client)}
                                        className={`flex flex-col bg-white hover:bg-gray-100 gap-x-2 min-w-[250px] cursor-pointer
                                        ${index !== selectedMarkers.length - 1 ? "border-b border-gray-700" : "border-b border-gray-700"}`}
                                    >
                                        <div className="flex flex-row w-full space-x-4 p-4">
                                            <div className="flex flex-col w-2/4 space-y-2 text-left">
                                                <h5 className="text-l font-bold tracking-tight text-gray-900 mb-4">
                                                    {client.clientName.name} {client.clientName.lastName}

                                                </h5>
                                               
                                                <h5 className="text-l font-bold tracking-tight">
                                                    <span
                                                        className={`
                                                            ${client.details === "Visita al cliente" ? "bg-green-500 text-white text-l font-medium px-2.5 py-0.5 rounded-full" : ""}
                                                            ${client.details === "Termina la visita" ? "bg-blue-600 text-white text-l font-medium px-2.5 py-0.5 rounded-full" : ""}  
                                                            `}
                                                    >
                                                        {client.details}
                                                    </span>
                                                </h5>
                                                <h5 className="text-base font-normal tracking-tight text-gray-500">Vendedor</h5>
                                                <h5 className="text-base font-normal tracking-tight text-gray-500">Tiempo de visita</h5>
                                            </div>

                                            <div className="flex flex-col w-2/4 space-y-2 text-right">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="text-l tracking-tight text-gray-500 mb-4">
                                                        {new Date(client.creationDate).toLocaleString("es-ES", {
                                                            timeZone: "America/La_Paz",
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        })}
                                                    </h5>
                                                </div>
                                                <h5 className="text-l tracking-tight font-bold text-white">
                                                    {client.clientName.name} {client.clientName.lastName}
                                                </h5>
                                                <h5 className="text-l tracking-tight font-bold text-gray-900">
                                                {client.salesMan.fullName} {client.salesMan.lastName}
                                                </h5>
                                                <h5 className="text-l tracking-tight font-bold text-gray-900">
                                                    {client.visitDuration}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {totalPages > 1 && searchTerm === "" && (
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
            </div>
            <div className="w-4/6 h-[calc(100vh-4rem)] bg-white relative">
                <LoadScript googleMapsApiKey={GOOGLE_API_KEY} >
                <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={mapZoom}>
                    {salesData.length > 0 &&
                        salesData.map((client, index) => {
                            const latReal = client.latitude;
                            const lngReal = client.longitude;
                            const latEsperado = client.clientName.client_location.latitud;
                            const lngEsperado = client.clientName.client_location.longitud;
                            return (
                                <React.Fragment key={index}>
                                    <Marker
                                        key={client._id}
                                        position={{ lat: latEsperado, lng: lngEsperado }}
                                        icon={{
                                            url: tiendaIcon2,
                                            scaledSize: new window.google.maps.Size(48, 48),
                                        }}
                                    />
                                    <Marker
                                        position={{ lat: latReal, lng: lngReal }}
                                                icon={{
                                                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                                        <svg width="70" height="70" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <clipPath id="circleView">
                                                                    <circle cx="35" cy="35" r="26" />
                                                                </clipPath>
                                                            </defs>
                                                            <image href="${tiendaIcon2}" x="9" y="9" width="52" height="52" clip-path="url(#circleView)" />
                                                            <circle cx="56" cy="14" r="10" fill="white" />
                                                            <circle cx="56" cy="14" r="9" fill="green" />
                                                            <path d="M52.5 14l3 3.5L60 10" stroke="white" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                                                        </svg>
                                                    `)}`,
                                                    scaledSize: new window.google.maps.Size(70, 70),
                                        }}
                                    />   
                                    
                                </React.Fragment>
                    );
                })}
            {directionsResponse && (
                <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                        polylineOptions: {
                            strokeColor: "#000000",
                            strokeOpacity: 0.8,
                            strokeWeight: 6,
                        },
                        suppressMarkers: true,
                    }}
                />
            )}
        </GoogleMap>
                </LoadScript>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex justify-center items-center gap-x-4">
                    <div className="relative">
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
                </div>
            </div>
        </div>
    );
}
