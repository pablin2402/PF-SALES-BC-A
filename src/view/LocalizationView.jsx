import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import axios from "axios";
import {
    useJsApiLoader, GoogleMap, Marker, OverlayView, Polygon,
} from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY, UPLOAD_TIME } from "../config";
import {
    FaMapMarkerAlt, FaUser, FaStore, FaChevronLeft, FaChevronRight,
    FaBuilding, FaUsers, FaTruck, FaFilter, FaSearch, FaSort,
    FaMapMarkedAlt, FaTimes, FaChevronDown, FaLayerGroup, FaExpand,
    FaEye, FaEyeSlash, FaCity, FaCog, FaGlobeAmericas,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import deliveryIcon from "../icons/entrega-rapida.png";
import vendedoraIcon from "../icons/vendedora.png";
import {
    CHANNEL_CONFIG, getChannelConfig, buildMarkerIcon, CHANNEL_LIST,
} from "../utils/ClientMarkerIcons";
import {
    MUNICIPIOS_COCHABAMBA, getMunicipioForPoint, groupClientsByMunicipio,
} from "../utils/CochabambaMunicipios";

const SORT_OPTIONS = [
    { value: "name", label: "Nombre (A-Z)" },
    { value: "nameDesc", label: "Nombre (Z-A)" },
    { value: "creationDate", label: "Más recientes" },
    { value: "creationDateAsc", label: "Más antiguos" },
    { value: "company", label: "Empresa (A-Z)" },
];

const containerStyle = { width: "100%", height: "100%" };

const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

const DEFAULT_CENTER = { lat: -17.3835, lng: -66.1568 };
const DEFAULT_ZOOM = 12;
const VIEW_ALL_LIMIT = 500;

export default function LocalizationView() {
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [salesManData, setSalesManData] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [allClientsCache, setAllClientsCache] = useState([]);
    const [viewAllMode, setViewAllMode] = useState(false);
    const [center, setCenter] = useState(DEFAULT_CENTER);
    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
    const [selectedCategories, setSelectedCategories] = useState("");
    const [selectedSalesmen, setSelectedSalesmen] = useState("");
    const [selectedMunicipio, setSelectedMunicipio] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingAll, setLoadingAll] = useState(false);
    const [locations, setLocations] = useState([]);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState("name");
    const [hasLocationOnly, setHasLocationOnly] = useState(false);
    const [channelStats, setChannelStats] = useState({});
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showMunicipios, setShowMunicipios] = useState(true);
    const [showActivePeople, setShowActivePeople] = useState(true);
    const [showViewOptions, setShowViewOptions] = useState(false);

    const debounceRef = useRef(null);
    const mapRef = useRef(null);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_API_KEY,
        id: "google-map-script",
    });

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchTerm(searchInput);
            setPage(1);
        }, 400);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [searchInput]);

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
                    nameClient: searchTerm,
                    page,
                    limit,
                    sortBy,
                    hasLocation: hasLocationOnly,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            setMarkers(data.users || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setChannelStats(data.channelStats || {});
        } catch (error) {
            console.error("Error al cargar los marcadores: ", error);
            setMarkers([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [user, token, selectedCategories, selectedSalesmen, searchTerm, page, limit, sortBy, hasLocationOnly]);

    const loadAllClients = useCallback(async () => {
        setLoadingAll(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/maps/list/id",
                {
                    id_owner: user,
                    userCategory: selectedCategories,
                    salesCategory: selectedSalesmen,
                    nameClient: "",
                    page: 1,
                    limit: VIEW_ALL_LIMIT,
                    sortBy: "name",
                    hasLocation: true,
                },  
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const allClients = response.data.users || [];
            setAllClientsCache(allClients);
            setViewAllMode(true);

            if (mapRef.current && window.google && allClients.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                let hasValid = false;
                allClients.forEach(c => {
                    const lat = Number(c.client_location?.latitud);
                    const lng = Number(c.client_location?.longitud);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        bounds.extend({ lat, lng });
                        hasValid = true;
                    }
                });
                if (hasValid) {
                    mapRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
                }
            }
        } catch (error) {
            console.error("Error al cargar todos los clientes:", error);
        } finally {
            setLoadingAll(false);
        }
    }, [user, token, selectedCategories, selectedSalesmen]);

    const exitViewAllMode = () => {
        setViewAllMode(false);
        setAllClientsCache([]);
        setCenter(DEFAULT_CENTER);
        setMapZoom(DEFAULT_ZOOM);
    };

    useEffect(() => {
        loadMarkersFromAPI();
    }, [loadMarkersFromAPI]);

    useEffect(() => {
        setPage(1);
    }, [selectedCategories, selectedSalesmen, sortBy, hasLocationOnly, selectedMunicipio]);

    const mapMarkers = viewAllMode ? allClientsCache : markers;

    const filteredMarkers = useMemo(() => {
        if (!selectedMunicipio) return mapMarkers;
        return mapMarkers.filter(client => {
            const lat = client?.client_location?.latitud;
            const lng = client?.client_location?.longitud;
            if (!lat || !lng) return false;
            const m = getMunicipioForPoint(lat, lng);
            return m?.id === selectedMunicipio;
        });
    }, [mapMarkers, selectedMunicipio]);

    const municipioGroups = useMemo(
        () => groupClientsByMunicipio(viewAllMode ? allClientsCache : markers),
        [markers, allClientsCache, viewAllMode]
    );
    const [markerIcons, setMarkerIcons] = useState({});
    const sidebarClients = viewAllMode ? filteredMarkers : markers;
    useEffect(() => {

        if (!window.google?.maps) return;

        async function loadIcons() {

            const icons = {};

            for (const location of filteredMarkers) {

                const isSelected =
                    selectedClient?._id === location._id;

                icons[location._id] =
                    await buildMarkerIcon(
                        location.userCategory,
                        window.google,
                        isSelected
                    );
            }

            setMarkerIcons(icons);
        }

        loadIcons();

    }, [filteredMarkers, selectedClient]);
    const findLocation = (location) => {
        if (location && location.client_location) {
            const lat = parseFloat(location.client_location.latitud);
            const lng = parseFloat(location.client_location.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapZoom(17);
                setCenter({ lat, lng });
                setSelectedClient(location);
            }
        }
    };

    const fitAllMarkers = useCallback(() => {
        if (!mapRef.current || !window.google || filteredMarkers.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        let hasValid = false;
        filteredMarkers.forEach(m => {
            const lat = Number(m.client_location?.latitud);
            const lng = Number(m.client_location?.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
                bounds.extend({ lat, lng });
                hasValid = true;
            }
        });
        if (hasValid) {
            mapRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
        }
    }, [filteredMarkers]);

    const fitMunicipio = useCallback((municipioId) => {
        if (!mapRef.current || !window.google) return;
        const m = MUNICIPIOS_COCHABAMBA[municipioId];
        if (!m) return;
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: m.bounds.north, lng: m.bounds.east });
        bounds.extend({ lat: m.bounds.south, lng: m.bounds.west });
        mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }, []);

    const resetView = () => {
        setCenter(DEFAULT_CENTER);
        setMapZoom(DEFAULT_ZOOM);
        setSelectedClient(null);
        setSelectedMunicipio("");
        if (viewAllMode) exitViewAllMode();
    };

    const goToClientDetails = (client) => {
        navigate(`/client/${client._id}`, { state: { client } });
    };

    const clearFilters = () => {
        setSelectedSalesmen("");
        setSelectedCategories("");
        setSearchInput("");
        setSearchTerm("");
        setHasLocationOnly(false);
        setSortBy("name");
        setSelectedMunicipio("");
        setPage(1);
    };

    const hasActiveFilters = selectedSalesmen || selectedCategories || searchTerm || hasLocationOnly || selectedMunicipio;
    const activeSalesmen = locations.filter(l => l.salesManId && typeof l.salesManId === "object").length;
    const activeDeliveries = locations.filter(l => l.delivery && typeof l.delivery === "object").length;

    const visiblePages = useMemo(() => {
        const maxVisible = 5;
        if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (page <= 3) return [1, 2, 3, 4, totalPages];
        if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, page - 1, page, page + 1, totalPages];
    }, [page, totalPages]);

    const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Ordenar";

    return (
        <div className="h-screen w-full flex overflow-hidden bg-gray-50">
            <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full lg:w-[440px]'} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                {!sidebarCollapsed && (
                    <>
                        <div className="p-5 border-b border-gray-200 bg-red-700 rounded-r-3xl text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-xl font-bold flex items-center gap-2">
                                        <FaMapMarkerAlt />
                                        Mapa de clientes
                                    </h1>
                                    <p className="text-xs text-white mt-0.5">
                                        {viewAllMode
                                            ? `${allClientsCache.length} clientes en el mapa (vista completa)`
                                            : total > 0
                                                ? `${total} cliente${total !== 1 ? "s" : ""} ${hasActiveFilters ? "encontrados" : ""}`
                                                : "Ubicaciones y actividad en tiempo real"
                                        }
                                    </p>
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
                                    <p className="text-xs text-white">Clientes</p>
                                    <p className="text-lg font-bold">{viewAllMode ? allClientsCache.length : total}</p>
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
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Nombre, empresa, NIT, teléfono..."
                                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all"
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => { setSearchInput(""); setSearchTerm(""); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D3423E]"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                )}
                                {loading && searchInput && (
                                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-200 border-t-[#D3423E]"></div>
                                    </div>
                                )}
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
                                            {CHANNEL_LIST.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                    {channelStats[c] ? ` (${channelStats[c]})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5 flex items-center gap-1">
                                    <FaCity size={9} /> Municipio
                                </label>
                                <div className="flex gap-1 flex-wrap">
                                    <button
                                        onClick={() => setSelectedMunicipio("")}
                                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all border ${selectedMunicipio === "" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}
                                    >
                                        Todos
                                    </button>
                                    {Object.values(MUNICIPIOS_COCHABAMBA).map(m => {
                                        const count = municipioGroups[m.id]?.count || 0;
                                        const isActive = selectedMunicipio === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setSelectedMunicipio(isActive ? "" : m.id);
                                                    if (!isActive) fitMunicipio(m.id);
                                                }}
                                                disabled={count === 0}
                                                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border ${isActive
                                                    ? "bg-gray-900 text-white border-gray-900"
                                                    : count === 0
                                                        ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: m.accent }}
                                                />
                                                {m.name}
                                                {count > 0 && (
                                                    <span className={`text-[10px] ${isActive ? "opacity-75" : "text-gray-500"}`}>
                                                        ({count})
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <button
                                        onClick={() => setShowSortMenu(!showSortMenu)}
                                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-xl bg-white text-gray-700 hover:border-[#D3423E] transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FaSort className="text-gray-400" size={11} />
                                            {sortLabel}
                                        </span>
                                        <FaChevronDown className={`text-gray-400 transition-transform ${showSortMenu ? "rotate-180" : ""}`} size={10} />
                                    </button>
                                    {showSortMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                                                {SORT_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                                                        className={`w-full px-3 py-2 text-xs text-left hover:bg-red-50 transition-colors ${sortBy === opt.value ? "bg-red-50 text-[#D3423E] font-bold" : "text-gray-700"}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${showAdvanced ? "bg-[#D3423E] text-white border-[#D3423E]" : "bg-white text-gray-700 border-gray-300 hover:border-[#D3423E]"}`}
                                >
                                    <FaFilter size={10} />
                                    {showAdvanced ? "Ocultar" : "Más"}
                                </button>
                            </div>

                            {showAdvanced && (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={hasLocationOnly}
                                            onChange={(e) => setHasLocationOnly(e.target.checked)}
                                            className="w-4 h-4 accent-[#D3423E] cursor-pointer"
                                        />
                                        <FaMapMarkedAlt className="text-[#D3423E]" size={11} />
                                        <span className="text-xs text-gray-700 font-medium">Solo con ubicación válida</span>
                                    </label>
                                </div>
                            )}

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full text-xs font-semibold text-gray-600 hover:text-[#D3423E] transition-colors flex items-center justify-center gap-1 py-1"
                                >
                                    <FaTimes size={10} /> Limpiar todos los filtros
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
                                    <p className="text-sm">Cargando clientes...</p>
                                </div>
                            ) : sidebarClients.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-gray-700 uppercase">
                                            {viewAllMode
                                                ? `${sidebarClients.length} clientes en vista completa`
                                                : selectedMunicipio
                                                    ? `${sidebarClients.length} en ${MUNICIPIOS_COCHABAMBA[selectedMunicipio]?.name}`
                                                    : `Mostrando ${((page - 1) * limit) + 1}-${Math.min(page * limit, total)} de ${total}`
                                            }
                                        </p>
                                    </div>

                                    {sidebarClients.slice(0, viewAllMode ? 50 : sidebarClients.length).map((client) => {
                                        const isSelected = selectedClient?._id === client._id;
                                        const channelConf = getChannelConfig(client.userCategory);
                                        const hasLoc = client.client_location?.latitud && client.client_location?.longitud;
                                        const muni = hasLoc ? getMunicipioForPoint(client.client_location.latitud, client.client_location.longitud) : null;
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
                                                        <div
                                                            className="absolute -top-1 -right-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-base shadow-md"
                                                            style={{ backgroundColor: channelConf.color }}
                                                        >
                                                            <span>{channelConf.emoji}</span>
                                                        </div>
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

                                                        {client.sales_id && (
                                                            <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                                                                <FaUser className="text-gray-400 flex-shrink-0" size={10} />
                                                                {client.sales_id?.fullName} {client.sales_id?.lastName}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                            <span
                                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                                                                style={{
                                                                    backgroundColor: `${channelConf.color}20`,
                                                                    color: channelConf.colorDark,
                                                                    borderColor: `${channelConf.color}50`,
                                                                }}
                                                            >
                                                                {channelConf.emoji} {client.userCategory || "Cliente"}
                                                            </span>
                                                            {muni && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full"
                                                                        style={{ backgroundColor: muni.accent }}
                                                                    />
                                                                    {muni.name}
                                                                </span>
                                                            )}
                                                            {!hasLoc && (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-300">
                                                                    Sin ubicación
                                                                </span>
                                                            )}
                                                        </div>
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

                                    {viewAllMode && sidebarClients.length > 50 && (
                                        <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-600">
                                            <p className="font-semibold">Mostrando los primeros 50 en lista</p>
                                            <p className="text-[10px] mt-1">Los {sidebarClients.length} están visibles en el mapa</p>
                                        </div>
                                    )}

                                    {!viewAllMode && !selectedMunicipio && totalPages > 1 && (
                                        <nav className="flex items-center justify-center pt-4 gap-1">
                                            <button
                                                onClick={() => setPage(p => Math.max(p - 1, 1))}
                                                disabled={page === 1}
                                                className={`p-2 rounded-lg transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                                            >
                                                <FaChevronLeft size={12} />
                                            </button>
                                            {visiblePages.map((num, idx) => {
                                                const isGap = idx > 0 && num - visiblePages[idx - 1] > 1;
                                                return (
                                                    <React.Fragment key={num}>
                                                        {isGap && <span className="text-gray-400 px-1">…</span>}
                                                        <button
                                                            onClick={() => setPage(num)}
                                                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === num ? "bg-[#D3423E] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}
                                                        >
                                                            {num}
                                                        </button>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <button
                                                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                                disabled={page === totalPages}
                                                className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                                            >
                                                <FaChevronRight size={12} />
                                            </button>
                                        </nav>
                                    )}
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
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="mt-4 text-xs font-semibold text-[#D3423E] hover:underline"
                                        >
                                            Limpiar filtros
                                        </button>
                                    )}
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
                        {total > 0 && (
                            <div className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {total}
                            </div>
                        )}
                    </button>
                )}
            </div>

            <div className="flex-1 h-full relative bg-gray-200">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={mapZoom}
                        onLoad={(map) => { mapRef.current = map; }}
                        onClick={() => setSelectedClient(null)}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true,
                            styles: [
                                { featureType: "poi", stylers: [{ visibility: "off" }] },
                                { featureType: "transit", stylers: [{ visibility: "off" }] },
                            ],
                        }}
                    >
                        {showMunicipios && Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                            <React.Fragment key={m.id}>
                                <Polygon
                                    paths={m.paths}
                                    options={{
                                        fillColor: m.fillColor,
                                        fillOpacity: selectedMunicipio === m.id ? 0.16 : m.fillOpacity,
                                        strokeColor: m.strokeColor,
                                        strokeOpacity: m.strokeOpacity,
                                        strokeWeight: selectedMunicipio === m.id ? 2.5 : m.strokeWeight,
                                        clickable: true,
                                    }}
                                    onClick={() => {
                                        setSelectedMunicipio(selectedMunicipio === m.id ? "" : m.id);
                                        if (selectedMunicipio !== m.id) fitMunicipio(m.id);
                                    }}
                                />
                                <OverlayView
                                    position={m.center}
                                    mapPaneName={OverlayView.OVERLAY_LAYER}
                                >
                                    <div
                                        className="pointer-events-none select-none"
                                        style={{
                                            transform: "translate(-50%, -50%)",
                                            color: "#475569",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            letterSpacing: 0.3,
                                            textTransform: "uppercase",
                                            textShadow: "1px 1px 3px white, -1px -1px 3px white, 1px -1px 3px white, -1px 1px 3px white",
                                            opacity: 0.8,
                                        }}
                                    >
                                        {m.name}
                                    </div>
                                </OverlayView>
                            </React.Fragment>
                        ))}

                        {
                            filteredMarkers.map((location, index) => {

                                if (
                                    !location.client_location?.latitud ||
                                    !location.client_location?.longitud
                                ) return null;

                                return (
                                    <Marker
                                        key={location._id || index}
                                        position={{
                                            lat: Number(
                                                location.client_location.latitud
                                            ),
                                            lng: Number(
                                                location.client_location.longitud
                                            ),
                                        }}
                                        icon={
                                            markerIcons[location._id]
                                        }
                                        onClick={() =>
                                            setSelectedClient(location)
                                        }
                                        zIndex={
                                            selectedClient?._id === location._id
                                                ? 1000
                                                : 1
                                        }
                                    />
                                );
                            })
                        }

                        {selectedClient && selectedClient.client_location && (
                            <OverlayView
                                position={{
                                    lat: Number(selectedClient.client_location.latitud),
                                    lng: Number(selectedClient.client_location.longitud),
                                }}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                getPixelPositionOffset={(width, height) => ({
                                    x: -(width / 2),
                                    y: -(height + 28),
                                })}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                                    style={{ minWidth: 220, maxWidth: 260 }}
                                >
                                    <div
                                        className="px-3 py-2.5 flex items-center gap-2.5 text-white"
                                        style={{ backgroundColor: getChannelConfig(selectedClient.userCategory).color }}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/25 flex items-center justify-center text-base">
                                            {getChannelConfig(selectedClient.userCategory).emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">
                                                {selectedClient.name} {selectedClient.lastName}
                                            </div>
                                            <div className="text-[10px] font-semibold opacity-90">
                                                {selectedClient.userCategory || "Sin canal"}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedClient(null)}
                                            className="w-6 h-6 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    </div>
                                    <div className="p-3 space-y-1.5">
                                        {selectedClient.company && (
                                            <div className="flex items-start gap-1.5 text-xs text-gray-700">
                                                <FaBuilding className="text-gray-400 mt-0.5 flex-shrink-0" size={10} />
                                                <span className="break-words">{selectedClient.company}</span>
                                            </div>
                                        )}
                                        {selectedClient.client_location?.direction && (
                                            <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                                <FaMapMarkerAlt className="text-[#D3423E] mt-0.5 flex-shrink-0" size={10} />
                                                <span className="break-words">{selectedClient.client_location.direction}</span>
                                            </div>
                                        )}
                                        {selectedClient.sales_id && (
                                            <div className="flex items-start gap-1.5 text-xs text-gray-500">
                                                <FaUser className="text-gray-400 mt-0.5 flex-shrink-0" size={10} />
                                                <span className="break-words">
                                                    {selectedClient.sales_id?.fullName} {selectedClient.sales_id?.lastName}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => goToClientDetails(selectedClient)}
                                            className="w-full mt-2 bg-[#D3423E] text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Ver detalle
                                        </button>
                                    </div>
                                </div>
                            </OverlayView>
                        )}

                        {showActivePeople && locations.map((loc) => {
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

                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {!viewAllMode ? (
                        <button
                            onClick={loadAllClients}
                            disabled={loadingAll}
                            className="bg-[#D3423E] text-white rounded-xl shadow-lg p-3 flex items-center gap-2 transition-all hover:bg-red-700 hover:shadow-xl hover:scale-105 disabled:opacity-70"
                            title="Ver todos los clientes en el mapa"
                        >
                            {loadingAll ? (
                                <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white"></div>
                                    <span className="text-xs font-bold">Cargando...</span>
                                </>
                            ) : (
                                <>
                                    <FaGlobeAmericas size={13} />
                                    <span className="text-xs font-bold">Ver todos los clientes</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={exitViewAllMode}
                            className="bg-gray-900 text-white rounded-xl shadow-lg p-3 flex items-center gap-2 transition-all hover:bg-gray-800 hover:shadow-xl"
                            title="Volver a vista paginada"
                        >
                            <FaTimes size={13} />
                            <span className="text-xs font-bold">Salir vista completa</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
                                {allClientsCache.length}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={fitAllMarkers}
                        disabled={filteredMarkers.length === 0}
                        className={`bg-white rounded-xl shadow-lg p-3 border border-gray-200 flex items-center gap-2 transition-all hover:shadow-xl ${filteredMarkers.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                        title="Encuadrar visibles"
                    >
                        <FaExpand className="text-[#D3423E]" size={13} />
                        <span className="text-xs font-bold text-gray-700">Centrar</span>
                    </button>

                    <button
                        onClick={resetView}
                        className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 flex items-center gap-2 transition-all hover:shadow-xl hover:scale-105"
                        title="Restablecer vista"
                    >
                        <FaMapMarkerAlt className="text-gray-600" size={13} />
                        <span className="text-xs font-bold text-gray-700">Limpiar filtros</span>
                    </button>
                </div>

                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowViewOptions(!showViewOptions)}
                            className="bg-white rounded-xl shadow-lg p-3 border border-gray-200 flex items-center gap-2 transition-all hover:shadow-xl"
                        >
                            <FaCog className="text-gray-600" size={13} />
                            <span className="text-xs font-bold text-gray-700">Vista</span>
                            <FaChevronDown
                                className={`text-gray-400 transition-transform ${showViewOptions ? "rotate-180" : ""}`}
                                size={9}
                            />
                        </button>

                        {showViewOptions && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                                <div className="p-2 border-b border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">Capas del mapa</p>
                                </div>
                                <button
                                    onClick={() => setShowMunicipios(!showMunicipios)}
                                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FaCity className="text-gray-600" size={12} />
                                        <span className="text-xs font-bold text-gray-700">Límites municipales</span>
                                    </div>
                                    {showMunicipios ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
                                </button>
                                <button
                                    onClick={() => setShowActivePeople(!showActivePeople)}
                                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100"
                                >
                                    <div className="flex items-center gap-2">
                                        <FaUsers className="text-blue-500" size={12} />
                                        <span className="text-xs font-bold text-gray-700">Personas activas</span>
                                    </div>
                                    {showActivePeople ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[220px]">
                        <p className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-1">
                            <FaLayerGroup size={10} /> Canales
                        </p>
                        <div className="space-y-1.5">
                            {CHANNEL_LIST.map(channel => {
                                const conf = CHANNEL_CONFIG[channel];
                                const count = channelStats[channel] || 0;
                                return (
                                    <button
                                        key={channel}
                                        onClick={() => setSelectedCategories(selectedCategories === channel ? "" : channel)}
                                        className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors ${selectedCategories === channel ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs flex-shrink-0"
                                            style={{ backgroundColor: conf.color }}
                                        >
                                            {conf.emoji}
                                        </div>
                                        <span className="text-gray-700 font-medium flex-1 text-left">{channel}</span>
                                        {count > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {showMunicipios && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-700 mb-1.5 uppercase flex items-center gap-1">
                                    <FaCity size={10} /> Municipios
                                </p>
                                <div className="space-y-1">
                                    {Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                                        <div key={m.id} className="flex items-center gap-2 text-xs px-1">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: m.accent }}
                                            />
                                            <span className="text-gray-700 flex-1">{m.name}</span>
                                            <span className="text-[10px] font-bold text-gray-500">
                                                {municipioGroups[m.id]?.count || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showActivePeople && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-700 mb-1.5 uppercase">Personal</p>
                                <div className="space-y-1">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}