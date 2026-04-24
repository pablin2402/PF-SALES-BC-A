import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useJsApiLoader, GoogleMap, Marker, OverlayView } from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY, UPLOAD_TIME } from "../config";
import { FaMapMarkerAlt, FaUser, FaStore, FaSearch, FaChevronLeft, FaChevronRight, FaBuilding, FaUsers, FaTruck, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/pin-de-ubicacion.png";
import deliveryIcon from "../icons/entrega-rapida.png";
import vendedoraIcon from "../icons/vendedora.png";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";

const CANALES = [
    { canal: "Mayorista", icon: "🏭", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { canal: "Tienda", icon: "🏪", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { canal: "Bar", icon: "🍺", color: "bg-amber-100 text-amber-700 border-amber-300" },
    { canal: "Restaurante", icon: "🍽️", color: "bg-orange-100 text-orange-700 border-orange-300" }
];

const containerStyle = {
    width: "100%",
    height: "100%",
};

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

export default function LocalizationView() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [salesManData, setSalesManData] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [center, setCenter] = useState({ lat: -17.3835, lng: -66.1568 });
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedCategories, setSelectedCategories] = useState("");
    const [selectedSalesmen, setSelectedSalesmen] = useState("");
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState([]);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_API_KEY,
        id: "google-map-script",
    });

    useEffect(() => {
        const fetchLastLocations = async () => {
            try {
                const response = await axios.post(API_URL + "/whatsapp/location/list/id",
                    { id_owner: user },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setLocations(response.data);
            } catch (error) {
                console.error("Error al obtener ubicaciones:", error);
            }
        };
        fetchLastLocations();
        const interval = setInterval(fetchLastLocations, UPLOAD_TIME);
        return () => clearInterval(interval);
    }, [user, token]);

    const fetchSalesMan = useCallback(async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
                { id_owner: user },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSalesManData(response.data.data);
        } catch (error) {
            console.error("Error al obtener datos", error);
        }
    }, [user, token]);

    useEffect(() => {
        fetchSalesMan();
    }, [fetchSalesMan]);

    const loadMarkersFromAPI = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/maps/list/id",
                {
                    id_owner: user,
                    userCategory: selectedCategories,
                    salesCategory: selectedSalesmen,
                    nameClient: searchTerm
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMarkers(response.data.users || []);
        } catch (error) {
            console.error("Error al cargar los marcadores: ", error);
            setMarkers([]);
        } finally {
            setLoading(false);
        }
    }, [user, token, selectedCategories, selectedSalesmen, searchTerm]);

    useEffect(() => {
        loadMarkersFromAPI();
    }, [selectedCategories, selectedSalesmen, loadMarkersFromAPI]);

    const findLocation = (location) => {
        if (location && location.client_location) {
            const lat = parseFloat(location.client_location.latitud);
            const lng = parseFloat(location.client_location.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapZoom(18);
                setCenter({ lat, lng });
                setSelectedClientId(location._id);
            }
        }
    };

    const goToClientDetails = (client) => {
        navigate(`/client/${client._id}`, { state: { client } });
    };

    const clearFilters = () => {
        setSelectedSalesmen("");
        setSelectedCategories("");
        setSearchTerm("");
    };

    const hasActiveFilters = selectedSalesmen || selectedCategories || searchTerm;
    const activeSalesmen = locations.filter(l => l.salesManId && typeof l.salesManId === "object").length;
    const activeDeliveries = locations.filter(l => l.delivery && typeof l.delivery === "object").length;

    return (
        <div className="h-screen w-full flex overflow-hidden bg-gray-50">
            <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[440px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                {!sidebarCollapsed && (
                    <>
                        <div className="p-5 border-b border-gray-200  bg-red-700 rounded-r-3xl text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-xl font-bold flex items-center gap-2">
                                        <FaMapMarkerAlt />
                                        Mapa de clientes
                                    </h1>
                                    <p className="text-xs text-white mt-0.5">Ubicaciones y actividad en tiempo real</p>
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
                                    <p className="text-xs text-white-100">Clientes</p>
                                    <p className="text-lg font-bold">{markers.length}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-red-100">Vendedores</p>
                                    <p className="text-lg font-bold">{activeSalesmen}</p>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-xl p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-red-100">Repartidores</p>
                                    <p className="text-lg font-bold">{activeDeliveries}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
                            <div className="relative">
                                <TextInputFilter
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    onEnter={() => loadMarkersFromAPI()}
                                    placeholder="Buscar por nombre o apellido..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Vendedor</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                                        <select
                                            value={selectedSalesmen}
                                            onChange={(e) => setSelectedSalesmen(e.target.value)}
                                            className="w-full pl-8 pr-2 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Todos</option>
                                            {salesManData.map((s) => (
                                                <option key={s._id} value={s._id}>{s.fullName} {s.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">Canal</label>
                                    <div className="relative">
                                        <FaStore className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                                        <select
                                            value={selectedCategories}
                                            onChange={(e) => setSelectedCategories(e.target.value)}
                                            className="w-full pl-8 pr-2 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Todos</option>
                                            {CANALES.map((c, i) => (
                                                <option key={i} value={c.canal}>{c.icon} {c.canal}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full text-xs font-semibold text-gray-600 hover:text-[#D3423E] transition-colors flex items-center justify-center gap-1"
                                >
                                    <FaFilter size={10} /> Limpiar filtros
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
                                    <p className="text-sm">Cargando clientes...</p>
                                </div>
                            ) : markers.length > 0 ? (
                                <div className="space-y-3">
                                    {markers.map((client) => {
                                        const isSelected = selectedClientId === client._id;
                                        const canalConfig = CANALES.find(c => c.canal === client.userCategory);
                                        return (
                                            <div
                                                key={client._id}
                                                onClick={() => findLocation(client)}
                                                className={`bg-white border-2 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[#D3423E] shadow-md ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className="flex gap-3 p-3">
                                                    <div className="relative flex-shrink-0">
                                                        <img
                                                            className="w-20 h-20 object-cover rounded-xl bg-gray-100"
                                                            src={client.identificationImage || FALLBACK_IMAGE}
                                                            alt={client.name}
                                                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                                                        />
                                                        {canalConfig && (
                                                            <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-sm shadow-sm">
                                                                {canalConfig.icon}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                goToClientDetails(client);
                                                            }}
                                                            className="font-bold text-gray-900 truncate hover:text-[#D3423E] transition-colors cursor-pointer"
                                                        >
                                                            {client.name} {client.lastName}
                                                        </h3>

                                                        {client.company && (
                                                            <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                                                                <FaBuilding className="text-gray-400 flex-shrink-0" size={10} />
                                                                {client.company}
                                                            </p>
                                                        )}

                                                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                                                            <FaUser className="text-gray-400 flex-shrink-0" size={10} />
                                                            {client.sales_id?.fullName} {client.sales_id?.lastName}
                                                        </p>

                                                        {canalConfig && (
                                                            <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${canalConfig.color}`}>
                                                                {client.userCategory}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="px-3 pb-3">
                                                    <div className="flex items-start gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 text-xs text-gray-600">
                                                        <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0 mt-0.5" size={10} />
                                                        <span className="break-words">
                                                            {client.client_location?.direction || "Ubicación no disponible"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FaMapMarkerAlt className="text-gray-300 text-3xl" />
                                    </div>
                                    <p className="text-gray-700 font-semibold">Sin clientes</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {hasActiveFilters ? "Ajusta los filtros e intenta de nuevo" : "No hay clientes para mostrar"}
                                    </p>
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
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={mapZoom}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true,
                        }}
                    >
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
                                    onClick={() => setSelectedClientId(location._id)}
                                />
                            ))}

                        {locations.map((loc) => {
                            const hasDelivery = loc.delivery && typeof loc.delivery === "object";
                            const hasSalesman = loc.salesManId && typeof loc.salesManId === "object";
                            const deliveryInitials = hasDelivery
                                ? ((loc.delivery.fullName?.slice(0, 1) || "X") + (loc.delivery.lastName?.slice(0, 1) || "X")).toUpperCase()
                                : "";
                            const salesmanInitials = hasSalesman
                                ? ((loc.salesManId.fullName?.slice(0, 1) || "X") + (loc.salesManId.lastName?.slice(0, 1) || "X")).toUpperCase()
                                : "";
                            const name = hasSalesman
                                ? `${loc.salesManId.fullName} ${loc.salesManId.lastName}`
                                : hasDelivery
                                    ? `${loc.delivery.fullName} ${loc.delivery.lastName}`
                                    : "";
                            return (
                                <OverlayView
                                    key={loc._id}
                                    position={{ lat: parseFloat(loc.latitud), lng: parseFloat(loc.longitud) }}
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                >
                                    <div className="relative flex flex-col items-center group cursor-pointer">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                            {name}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping"></div>
                                            <div className={`relative rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 ${hasSalesman ? 'border-blue-500 bg-white' : 'border-orange-500 bg-white'}`}>
                                                <img
                                                    src={hasSalesman ? vendedoraIcon : deliveryIcon}
                                                    alt={hasSalesman ? "vendedor" : "repartidor"}
                                                    className="w-8 h-8"
                                                />
                                            </div>
                                            {(hasDelivery || hasSalesman) && (
                                                <div className={`absolute -top-1 -right-1 z-10 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white ${hasSalesman ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                                    {hasDelivery ? deliveryInitials : salesmanInitials}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </OverlayView>
                            );
                        })}
                    </GoogleMap>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-3"></div>
                            <p className="text-gray-600 font-medium">Cargando mapa...</p>
                        </div>
                    </div>
                )}

                <div className="absolute top-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-xs">
                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-1">
                        <FaFilter size={10} /> Leyenda
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                            <img src={tiendaIcon} alt="" className="w-5 h-5" />
                            <span className="text-gray-700">Cliente / Tienda</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                                <FaUsers className="text-blue-500" size={8} />
                            </div>
                            <span className="text-gray-700">Vendedor activo</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full border-2 border-orange-500 bg-white flex items-center justify-center">
                                <FaTruck className="text-orange-500" size={8} />
                            </div>
                            <span className="text-gray-700">Repartidor activo</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                        Actualización en tiempo real
                    </p>
                </div>
            </div>
        </div>
    );
}