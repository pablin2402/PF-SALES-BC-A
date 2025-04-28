import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { LoadScript, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { FaMapMarkerAlt } from "react-icons/fa";
import tiendaIcon from "../icons/tienda.png";
import { HiFilter } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { DirectionsRenderer } from "@react-google-maps/api";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { FaFileExport } from "react-icons/fa6";

export default function ShowRouteComponent() {

    const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
    const [mapZoom, setMapZoom] = useState(10);
    const [vendedores, setVendedores] = useState([]);
    const [listRoutes, setListRoutes] = useState([]);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [selectedSaler, setSelectedSaler] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [directionsResponse, setDirectionsResponse] = useState(null);

    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);

    const [expandedIndex, setExpandedIndex] = useState(null);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const handleAccordionToggle = (index) => {
        setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
    };
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
                setVendedores(response.data);
            } catch (error) {
                console.error("Obteniendo vendedores", error);
                setVendedores([]);
            }
        };
    
        fetchVendedores();
    }, [user, token]);  
    
    const loadRoute = useCallback(async (startDate, endDate, selectedSaler2) => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/salesman/list/route", {
                id_owner: user,
                startDate,
                salesMan: selectedSaler2,
                endDate,
                status: selectedStatus,
                page,
            }, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
            setTotalPages(response.data.totalPages);
            setSelectedMarkers(response.data.data);
            setListRoutes(response.data.data);
            setDirectionsResponse(null);
        } catch (error) {
            console.error("Error al cargar los marcadores: ", error);
        }
    }, [page, selectedStatus, user, token]);
    
    useEffect(() => {
        loadRoute(null, null, "todos");
    }, [page, selectedSaler, selectedStatus, loadRoute]);
    
    const findLocation = (client) => {
        if (client && client.client_location) {
            const lat = parseFloat(client.client_location.latitud);
            const lng = parseFloat(client.client_location.longitud);
            setMapZoom(18);

            if (!isNaN(lat) && !isNaN(lng)) {
                setCenter({ lat, lng });
            } else {
                console.error("Error: Ubicación inválida", client.client_location);
            }
        } else {
            console.error("Error: Cliente sin ubicación", client);
        }
    };
    const handleSelectRoute = (salesman) => {
        setSelectedMarkers([salesman]);
    };
    const containerStyle = {
        width: "100%",
        height: "calc(100vh - 4rem)",
    };
    const formatDateToLocal = (isoDate) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    };
    const formatDateToLocalHour = (isoDate) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);

        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();

        const hours = String(date.getUTCHours()).padStart(2, "0") - 4;
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };
    const deleteRoutes = async (value) => {
        try {
            await axios.delete(API_URL + "/whatsapp/route/sales/id", {
                data: {
                    _id: value,
                    id_owner: user,
                }
            }, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
            loadRoute(null, null, "todos");
        } catch (error) {
            console.error("Error al eliminar la ruta:", error);
        }
    };
    useEffect(() => {
        if (
            selectedMarkers.length > 0 &&
            selectedMarkers[0].route &&
            selectedMarkers[0].route.length > 1 && window.google
        ) {
            const routePoints = selectedMarkers[0].route.filter(
                (client) => client.client_location
            );

            if (routePoints.length < 2) return;

            const origin = {
                lat: routePoints[0].client_location.latitud,
                lng: routePoints[0].client_location.longitud,
            };

            const destination = {
                lat: routePoints[routePoints.length - 1].client_location.latitud,
                lng: routePoints[routePoints.length - 1].client_location.longitud,
            };

            const waypoints = routePoints.slice(1, -1).map((client) => ({
                location: {
                    lat: client.client_location.latitud,
                    lng: client.client_location.longitud,
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
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirectionsResponse(result);
                    } else {
                        console.error("Error en DirectionsService:", status);
                    }
                }
            );
        }
    }, [selectedMarkers]);

    const exportToExcel = (data) => {
        const flatData = [];

        data.forEach((item) => {
            const vendedor = `${item.salesMan?.fullName || ""} ${item.salesMan?.lastName || ""}`;
            const nombreRuta = item.details || "";

            item.route?.forEach((client) => {
                flatData.push({
                    Vendedor: vendedor,
                    "Nombre de ruta": nombreRuta,
                    Sucursal: client.client_location?.sucursalName || "",
                    Cliente: `${client.name || ""} ${client.lastName || ""}` || "",
                    Ciudad: client.client_location?.city || "",
                    Dirección: client.client_location?.direction || "",
                    Visitado: client.visitStatus ? "Sí" : "No",
                    "Tiempo de visita": client.visitTime || "",
                    "Fecha de visita": client.visitEndTime
                        ? new Date(client.visitEndTime).toLocaleString("es-ES", {
                            timeZone: "America/La_Paz",
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        })
                        : "",
                    "Orden tomada": client.orderTaken ? "Sí" : "No",
                });
            });
        });

        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rutas por cliente");

        const excelFile = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([excelFile], { type: "application/octet-stream" }), "visitas_por_cliente.xlsx");
    };

    return (
        <div className="h-screen w-full flex overflow-hidden">
            <div className="w-2/6 h-[calc(100vh-4rem)] overflow-auto border-r-2 border-gray-200">
                <div className="px-4 py-4">
                    <div className="bg-white p-4 rounded-xl shadow-md w-full mb-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                className="w-full p-2 text-sm text-gray-900 border border-gray-400 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                name="vendedor"
                                value={selectedSaler}
                                onChange={(e) => setSelectedSaler(e.target.value)}
                                required
                            >
                                <option value="">Vendedor</option>
                                <option value="">Mostrar Todos</option>
                                {vendedores.map((vendedor) => (
                                    <option key={vendedor._id} value={vendedor._id}>
                                        {vendedor.fullName + " " + vendedor.lastName}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="w-full p-2 text-sm text-gray-900 border border-gray-400 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                name="estado"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                required
                            >
                                <option value="">Filtrar por estado</option>
                                <option value="">Mostrar Todos</option>
                                <option value="Por iniciar">Por iniciar</option>
                                <option value="En progreso">En progreso</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 p-2 text-sm text-gray-900 border border-gray-400 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 p-2 text-sm text-gray-900 border border-gray-400 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                             <button
                                onClick={() => exportToExcel(listRoutes)}
                                className="w-10 h-10 flex items-center justify-center text-green-600 hover:text-green-600 transition rounded-md"
                            >
                                <FaFileExport className="text-xl" />
                            </button>
                            <button
                                onClick={() => loadRoute(startDate, endDate, selectedSaler)}
                                className="w-10 h-10 flex items-center justify-center text-red-700 hover:text-red-600 transition rounded-md"
                            >
                                <HiFilter className="text-2xl" />
                            </button>
                        </div>
                    </div>



                    <div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">
                        {listRoutes.length > 0 ? (
                            <>
                                {listRoutes.map((client, idx) => (
                                    <div key={client._id}>
                                        <h2 id={`accordion-flush-heading-${idx}`}>
                                            <button
                                                type="button"
                                                className="flex items-center justify-between w-full py-5 font-medium text-left text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 gap-3"
                                                data-accordion-target={`#accordion-flush-body-${idx}`}
                                                aria-expanded={expandedIndex === idx ? "true" : "false"}
                                                onClick={(e) => {
                                                    handleAccordionToggle(idx);
                                                    if (expandedIndex !== idx) {
                                                        handleSelectRoute(client);
                                                    }
                                                }}

                                            >
                                                <span>
                                                    {client.salesMan.fullName} {client.salesMan.lastName} - {""}{formatDateToLocal(client.startDate)} - {""}
                                                    <span
                                                        className={`
                                                        ${client.status === "En progreso" ? "bg-green-200 text-green-800" : ""}
                                                        ${client.status === "Finalizado" ? "bg-blue-600 text-white" : ""}
                                                        ${client.status === "Por iniciar" ? "bg-yellow-100 text-yellow-800" : ""}
                                                        px-2.5 py-0.5 rounded-full text-sm font-medium
                                                    `}
                                                    >
                                                        {client.status}
                                                    </span>
                                                </span>
                                                <svg
                                                    data-accordion-icon
                                                    className="w-3 h-3 rotate-180 shrink-0"
                                                    aria-hidden="true"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 10 6"
                                                >
                                                    <path
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M9 5 5 1 1 5"
                                                    />
                                                </svg>

                                            </button>
                                        </h2>
                                        <div
                                            id={`accordion-flush-body-${idx}`}
                                            className={expandedIndex === idx ? "block" : "hidden"}
                                            aria-labelledby={`accordion-flush-heading-${idx}`}
                                        >
                                            <div className="py-5 px-4 border-b border-gray-200 dark:border-gray-700 text-sm space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-500">Nombre:</span>
                                                    <span className="text-gray-900">{client.details}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-500">Fecha de creación:</span>
                                                    <span className="text-gray-900">
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
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-500">Fecha de inicio:</span>
                                                    <span className="text-gray-900">{formatDateToLocal(client.startDate)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-500">Fecha programada de fin:</span>
                                                    <span className="text-gray-900">{formatDateToLocal(client.endDate)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-500">Fecha de inicio vendedor:</span>
                                                    <span className="text-gray-900">{formatDateToLocalHour(client.startDateRouteSales)}</span>
                                                </div>

                                                <div className="flex justify-between items-center mt-3">
                                                    <span className="font-semibold text-gray-500">Progreso:</span>
                                                    <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700 h-4 ml-4">
                                                        <div
                                                            className="bg-yellow-400 text-xs font-medium text-white text-center leading-4 rounded-full h-4"
                                                            style={{ width: `${client.progress}%` }}
                                                        >
                                                            {client.progress}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="pt-4 space-y-4">
                                                    {client.route && client.route.length > 0 ? (
                                                        client.route.map((route, routeIdx) => (
                                                            <div key={routeIdx} className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                                                                <div className="flex justify-between">
                                                                    <span className="font-semibold text-gray-500">Nombre:</span>
                                                                    <span className="text-gray-900">{route.name}{route.lastName}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-semibold text-gray-500">Fecha de visita:</span>
                                                                    <span className="text-gray-900">{formatDateToLocal(route.visitEndTime)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-semibold text-gray-500">Tiempo:</span>
                                                                    <span className="text-gray-900">{route.visitTime}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="font-semibold text-gray-500">Estado:</span>
                                                                    <span
                                                                        className={`
                                                                        ${route.visitStatus === true ? "bg-green-500 text-white" : ""}
                                                                        ${route.visitStatus === false ? "bg-red-600 text-white" : ""}
                                                                        px-2.5 py-0.5 rounded-full text-sm font-medium
                                                                        `}
                                                                    >
                                                                        {route.visitStatus === true ? "Visitado" : "Sin visitar"}
                                                                    </span>
                                                                </div>


                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-gray-500">No hay rutas asociadas a este cliente.</p>
                                                    )}
                                                </div>
                                                <div className="flex justify-between pt-4">
                                                    <button
                                                        onClick={() => handleSelectRoute(client)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Ver ruta
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta ruta?");
                                                            if (confirmDelete) deleteRoutes(client._id);
                                                        }}
                                                        className="text-red-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <MdDelete className="h-4 w-4" />
                                                        Eliminar
                                                    </button>
                                                </div>
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
            </div>
            <div className="w-4/6 h-[calc(100vh-4rem)] bg-white relative">
                <LoadScript googleMapsApiKey={GOOGLE_API_KEY} libraries={["marker"]}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={mapZoom}
                    >

                        {selectedMarkers.length > 0 && (() => {
                            const allVisited = selectedMarkers[0].route.every(client => client.visitStatus);

                            return selectedMarkers[0].route
                                .sort((a, b) => new Date(a.visitEndTime) - new Date(b.visitEndTime))
                                .map((client, index) =>
                                    client.client_location ? (
                                        <React.Fragment key={client._id}>
                                            <Marker
                                                position={{
                                                    lat: client.client_location.latitud,
                                                    lng: client.client_location.longitud,
                                                }}
                                                icon={{
                                                    url: tiendaIcon,
                                                    scaledSize: new window.google.maps.Size(40, 40),
                                                }}
                                                onClick={() => setSelectedClient(client)}
                                            />
                                            {allVisited && (
                                                <Marker
                                                    position={{
                                                        lat: client.client_location.latitud,
                                                        lng: client.client_location.longitud,
                                                    }}
                                                    onClick={() => setSelectedClient(client)}
                                                    icon={{
                                                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                                        <svg width="140" height="140" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <clipPath id="circleView">
                                                                    <circle cx="70" cy="70" r="52" />
                                                                </clipPath>
                                                            </defs>
                                                            <circle cx="112" cy="28" r="20" fill="white" />
                                                            <circle cx="112" cy="28" r="18" fill="red" />
                                                            <text x="112" y="30" font-size="24" text-anchor="middle" fill="white" font-weight="bold" dy=".35em">${index + 1}</text> 
                                                        </svg>
                                                        `)}`,
                                                        scaledSize: new window.google.maps.Size(80, 80),
                                                    }}
                                                />
                                            )}
                                        </React.Fragment>
                                    ) : null
                                );
                        })()}

                        {selectedClient && (
                            <InfoWindow
                                position={{
                                    lat: selectedClient.client_location.latitud,
                                    lng: selectedClient.client_location.longitud,
                                }}
                                onCloseClick={() => setSelectedClient(null)}
                            >
                                <div style={{ color: '#111', fontSize: '14px', maxWidth: '200px' }}>
                                    <h2 style={{ margin: 0, fontWeight: 'bold' }}>{selectedClient.name} {selectedClient.lastName}</h2>
                                    <p style={{ margin: '4px 0' }}>Tiempo de visita: {selectedClient.visitTime}</p>

                                </div>
                            </InfoWindow>

                        )}
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
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 z-10">
                    <div className="flex overflow-x-auto space-x-4 p-2 rounded-2xl">
                        {selectedMarkers.length > 0 &&
                            selectedMarkers[0].route.map((client) =>
                                client.client_location ? (
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
                                    </div>
                                ) : null
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
