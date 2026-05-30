import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../config";
import tiendaIcon2 from "../icons/tienda.png";
import { HiFilter } from "react-icons/hi";
import { FaMapMarkerAlt, FaClock, FaUser, FaCalendarAlt, FaRoute, FaCheckCircle, FaPlayCircle, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from "../utils/MapDetails";

const DETAILS_CONFIG = {
    "Visita al cliente": {
        label: "En visita",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-300",
        icon: FaPlayCircle,
        iconColor: "text-green-500"
    },
    "Termina la visita": {
        label: "Visita finalizada",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-300",
        icon: FaCheckCircle,
        iconColor: "text-blue-500"
    }
};

const SHIMMER = {
    background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
    <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const ActivityCardSkeleton = ({ idx }) => (
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 space-y-3" style={{ opacity: 1 - idx * 0.12 }}>
        <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
                <SBox className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <SBox className="h-4 w-36" />
                    <SBox className="h-3 w-28" />
                </div>
            </div>
            <SBox className="h-6 w-24 rounded-full flex-shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-2">
            <SBox className="h-8 rounded-lg" />
            <SBox className="h-8 rounded-lg" />
        </div>
    </div>
);

const ActivitySidebarSkeleton = () => (
    <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
            <ActivityCardSkeleton key={i} idx={i} />
        ))}
    </div>
);

const ActivityMapSkeleton = () => (
    <div className="w-full h-full relative overflow-hidden bg-gray-100">
        <div
            className="absolute inset-0"
            style={{
                background: "linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite",
            }}
        />

        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6b7280" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#9ca3af" strokeWidth="3" />
            <line x1="60%" y1="0" x2="55%" y2="100%" stroke="#9ca3af" strokeWidth="5" />
            <line x1="0" y1="40%" x2="100%" y2="38%" stroke="#9ca3af" strokeWidth="3" />
            <line x1="0" y1="65%" x2="100%" y2="67%" stroke="#9ca3af" strokeWidth="5" />
            <line x1="45%" y1="0" x2="50%" y2="60%" stroke="#9ca3af" strokeWidth="2" />
        </svg>

        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M 15% 70% Q 30% 50% 45% 55% Q 60% 60% 75% 35%"
                fill="none"
                stroke="#D3423E"
                strokeWidth="4"
                strokeDasharray="8 4"
                strokeLinecap="round"
            />
        </svg>

        {[
            { x: "15%", y: "70%" },
            { x: "45%", y: "55%" },
            { x: "75%", y: "35%" },
            { x: "30%", y: "42%" },
            { x: "60%", y: "62%" },
        ].map((pos, i) => (
            <div
                key={i}
                className="absolute"
                style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
            >
                <div
                    className="w-9 h-9 rounded-full border-2 border-white shadow-md"
                    style={{
                        background: "linear-gradient(90deg, #d1d5db 25%, #e5e7eb 50%, #d1d5db 75%)",
                        backgroundSize: "200% 100%",
                        animation: `shimmer ${1.2 + i * 0.15}s infinite`,
                    }}
                />
            </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#D3423E]" />
                <p className="text-gray-600 font-semibold text-sm">Cargando mapa...</p>
            </div>
        </div>

        <div className="absolute top-4 right-4 z-10 bg-white/90 rounded-2xl shadow-lg p-3 border border-gray-200 w-44 space-y-2.5">
            <SBox className="h-3 w-16" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <SBox className="w-4 h-4 rounded-full flex-shrink-0" />
                    <SBox className="h-3 flex-1" />
                </div>
            ))}
        </div>
    </div>
);
export default function ActivityRouteComponent() {
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
    const [vendedores, setVendedores] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [selectedSaler, setSelectedSaler] = useState("");
    const [loading, setLoading] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_API_KEY,
        id: "google-map-script",
    });

    useEffect(() => {
        const fetchVendedores = async () => {
            try {
                const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
                    { id_owner: user },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setVendedores(response.data.data);
            } catch (error) {
                console.error("Error obteniendo vendedores", error);
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
                String(item.number || "").includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, salesData]);

    const fetchActivities = useCallback(async (salerId, currentPage) => {
        setLoading(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/salesman/date/id", {
                id_owner: user,
                salesMan: salerId,
                startDate: startDate,
                details: "",
                page: currentPage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalesData(response.data.data || []);
            setFilteredData(response.data.data || []);
            setTotalPages(response.data.pages || 1);
        } catch (error) {
            console.error("Error obteniendo actividades", error);
            setSalesData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, user, token]);

    useEffect(() => {
        fetchActivities(selectedSaler, page);
    }, [fetchActivities, selectedSaler, page]);

    const findLocation = (client) => {
        if (!client) return;
        const lat = parseFloat(client.latitude);
        const lng = parseFloat(client.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            setMapZoom(18);
            setCenter({ lat, lng });
            setSelectedClientId(client._id);
        }
    };

    useEffect(() => {
        if (salesData.length > 1 && isLoaded && window.google) {
            const origin = { lat: salesData[0].latitude, lng: salesData[0].longitude };
            const destination = {
                lat: salesData[salesData.length - 1].latitude,
                lng: salesData[salesData.length - 1].longitude
            };
            const waypoints = salesData.slice(1, -1).map((client) => ({
                location: { lat: client.latitude, lng: client.longitude },
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
                    if (status === "OK") setDirectionsResponse(result);
                    else console.error("Directions request failed:", status);
                }
            );
        } else {
            setDirectionsResponse(null);
        }
    }, [salesData, isLoaded]);

    const visitsCompletadas = salesData.filter(c => c.details === "Termina la visita").length;
    const visitsEnCurso = salesData.filter(c => c.details === "Visita al cliente").length;

    return (
        <div className="h-screen w-full flex overflow-hidden bg-gray-50">
            <style>{`
                @keyframes shimmer {
                    0%   { background-position:  200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
            <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[420px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                {!sidebarCollapsed && (
                    <>
                        <div className="p-5 border-b border-gray-200  bg-red-700 rounded-r-3xl text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-xl font-bold flex items-center gap-2">
                                        <FaRoute />
                                        Ruta de actividades
                                    </h1>
                                    <p className="text-xs text-red-100 mt-0.5">Seguimiento de visitas</p>
                                </div>
                                <button
                                    onClick={() => setSidebarCollapsed(true)}
                                    className="hidden lg:flex p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                                >
                                    <FaChevronLeft />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-red-100">Total</p>
                                    <p className="text-lg font-bold">{salesData.length}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-red-100">En curso</p>
                                    <p className="text-lg font-bold">{visitsEnCurso}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-red-100">Finalizadas</p>
                                    <p className="text-lg font-bold">{visitsCompletadas}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Vendedor</label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <select
                                        className="app-select"
                                        value={selectedSaler}
                                        onChange={(e) => {
                                            setSelectedSaler(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="">Todos los vendedores</option>
                                        {vendedores.map((vendedor) => (
                                            <option key={vendedor._id} value={vendedor._id}>
                                                {vendedor.fullName} {vendedor.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Fecha</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                        />
                                    </div>
                                    <PrincipalBUtton
                                        onClick={() => {
                                            setPage(1);
                                            fetchActivities(selectedSaler, 1);
                                        }}
                                        icon={HiFilter}
                                    >
                                        Filtrar
                                    </PrincipalBUtton>
                                </div>
                            </div>

                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar cliente..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <ActivitySidebarSkeleton />
                            ) : filteredData.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredData.map((client, index) => {
                                        const config = DETAILS_CONFIG[client.details];
                                        const Icon = config?.icon;
                                        const isSelected = selectedClientId === client._id;
                                        return (
                                            <div
                                                key={client._id}
                                                onClick={() => findLocation(client)}
                                                className={`relative bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[#D3423E] shadow-md ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className="absolute -left-0.5 top-4 bottom-4 w-1 bg-[#D3423E] rounded-r-full opacity-0 transition-opacity"
                                                    style={{ opacity: isSelected ? 1 : 0 }}
                                                />

                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="w-9 h-9 bg-gradient-to-br from-[#D3423E] to-red-700 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-900 truncate">
                                                                {client.clientName.name} {client.clientName.lastName}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {client.salesMan.fullName} {client.salesMan.lastName}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {config && Icon && (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-semibold whitespace-nowrap`}>
                                                            <Icon className={config.iconColor} size={10} />
                                                            {config.label}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                                                        <FaClock className="text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {new Date(client.creationDate).toLocaleTimeString("es-ES", {
                                                                timeZone: "America/La_Paz",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                hour12: false,
                                                            })}
                                                        </span>
                                                    </div>
                                                    {client.visitDuration && (
                                                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                                                            <FaRoute className="text-gray-400 flex-shrink-0" />
                                                            <span className="truncate font-medium">{client.visitDuration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {totalPages > 1 && searchTerm === "" && (
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
                                        <FaMapMarkerAlt className="text-gray-300 text-3xl" />
                                    </div>
                                    <p className="text-gray-700 font-semibold">Sin actividades</p>
                                    <p className="text-sm text-gray-500 mt-1">No hay rutas para este día</p>
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
                    </button>
                )}
            </div>

            <div className="flex-1 h-full relative bg-gray-200">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={CONTAINER_STYLE}
                        center={center}
                        zoom={mapZoom}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true,
                            styles: MAP_STYLE_MODERN,

                        }}
                    >
                        {salesData.length > 0 &&
                            salesData.map((client, index) => {
                                const latReal = client.latitude;
                                const lngReal = client.longitude;
                                const latEsperado = client.clientName.client_location.latitud;
                                const lngEsperado = client.clientName.client_location.longitud;
                                return (
                                    <React.Fragment key={index}>
                                        <Marker
                                            position={{ lat: latEsperado, lng: lngEsperado }}
                                            icon={{
                                                url: tiendaIcon2,
                                                scaledSize: new window.google.maps.Size(42, 42),
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
                                                        <circle cx="35" cy="35" r="28" fill="white" stroke="#D3423E" strokeWidth="2" />
                                                        <image href="${tiendaIcon2}" x="9" y="9" width="52" height="52" clip-path="url(#circleView)" />
                                                        <circle cx="56" cy="14" r="10" fill="white" />
                                                        <circle cx="56" cy="14" r="9" fill="#10b981" />
                                                        <path d="M52.5 14l3 3.5L60 10" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
                    <ActivityMapSkeleton />
                )}

                <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-xs">
                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Leyenda</p>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 rounded-full bg-[#D3423E] flex-shrink-0" />
                            <span className="text-gray-700">Ubicación real visitada</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                            <span className="text-gray-700">Ubicación del cliente</span>
                        </div>
                        {directionsResponse && (
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-4 h-1 bg-[#D3423E] flex-shrink-0" />
                                <span className="text-gray-700">Ruta recorrida</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}