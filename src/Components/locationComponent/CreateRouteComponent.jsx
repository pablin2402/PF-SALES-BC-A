import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import axios from "axios";
import {
    useJsApiLoader, GoogleMap, Marker,
    OverlayView, Polygon, Polyline,
} from "@react-google-maps/api";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import {
    FaMapMarkerAlt, FaUser, FaChevronLeft, FaChevronRight, FaRoute, FaTrash,
    FaPlus, FaMinus, FaCheck, FaBuilding, FaCalendarAlt, FaTimes, FaInfoCircle,
    FaClock, FaMagic, FaCity, FaCog, FaLayerGroup, FaExpand, FaEye, FaEyeSlash,
    FaSearch,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AlertModal from "../modal/AlertModal";
import {
    CHANNEL_CONFIG, getChannelConfig, buildMarkerIcon, CHANNEL_LIST,
    preloadChannelIcons,
} from "../../utils/ClientMarkerIcons";
import {
    MUNICIPIOS_COCHABAMBA, getMunicipioForPoint, groupClientsByMunicipio,
} from "../../utils/CochabambaMunicipios";
import {
    optimizeByProximity, optimizeByZones, checkCapacity, ZONE_PRESETS, DEPOT,
} from "../../utils/SalesRouteOptimizer";
import { MAP_STYLE_MODERN, CONTAINER_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM, FALLBACK_IMAGE } from "../../utils/MapDetails";


const ROUTE_COLOR = "#D3423E";
const ROUTE_HALO_COLOR = "#FCA5A5";
const ROUTE_COLOR_DARK = "#991B1B";


const buildOrderedChannelMarker = (orderIndex, channel, isSelected = true, pulsing = false) => {
    const config = getChannelConfig(channel);
    const size = 52;
    const color = config.color;
    const colorDark = config.colorDark;
    const ringOpacity = pulsing ? 0.4 : 0;
    const imageSrc = config.imageBase64 || null;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="ds-${orderIndex}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="ic-${orderIndex}">
          <circle cx="${size / 2}" cy="${size / 2}" r="20"/>
        </clipPath>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" opacity="${ringOpacity}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="22" fill="white" stroke="${color}" stroke-width="3" filter="url(#ds-${orderIndex})"/>
      ${imageSrc
        ? `<image href="${imageSrc}" x="${size / 2 - 14}" y="${size / 2 - 14}" width="28" height="28" clip-path="url(#ic-${orderIndex})" preserveAspectRatio="xMidYMid meet"/>`
        : `<text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="${colorDark}">${config.emoji}</text>`
    }
      <circle cx="${size - 11}" cy="11" r="10" fill="${colorDark}" stroke="white" stroke-width="2"/>
      <text x="${size - 11}" y="15" text-anchor="middle" fill="white" font-size="11" font-weight="900" font-family="Arial, sans-serif">${orderIndex + 1}</text>
    </svg>
  `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function CreateRouteComponent() {
    const navigate = useNavigate();
    const mapRef = useRef(null);

    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [markers, setMarkers] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [selectedSaler, setSelectedSaler] = useState("");
    const [, setSelectedSalerData] = useState(null);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [selectedMunicipio, setSelectedMunicipio] = useState("");

    const [routeName, setRouteName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [vendorCapacity, setVendorCapacity] = useState(30);

    const [successModal, setSuccessModal] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [optimizerOpen, setOptimizerOpen] = useState(false);
    const [optimizerMode, setOptimizerMode] = useState("zones");
    const [zonePresetKey, setZonePresetKey] = useState("full_metropolitan");

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [iconsReady, setIconsReady] = useState(false);

    const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });
    const [lastAddedId, setLastAddedId] = useState(null);
    const [routePath, setRoutePath] = useState([]);

    const [showMunicipios, setShowMunicipios] = useState(true);
    const [showAvailable, setShowAvailable] = useState(true);
    const [showViewOptions, setShowViewOptions] = useState(false);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_API_KEY,
        id: "google-map-script",
    });

    useEffect(() => {
        preloadChannelIcons().then(() => setIconsReady(true));
    }, []);

    const cleanData = () => {
        setRouteName("");
        setSelectedSaler("");
        setSelectedSalerData(null);
        setSelectedMarkers([]);
        setStartDate("");
        setEndDate("");
    };

    const goToRouteList = () => {
        navigate("/localization/list/route");
    };

    const validateForm = () => routeName && startDate && endDate;

    const handleCreateRoute = async () => {
        if (!validateForm()) return;
        setCreating(true);

        const routeData = {
            details: routeName,
            salesMan: selectedSaler,
            route: selectedMarkers,
            id_owner: user,
            status: "Por iniciar",
            startDate,
            endDate,
            progress: 0,
            visitCapacity: vendorCapacity,
        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/salesman/route", routeData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                setIsOpen(false);
                cleanData();
                goToRouteList();
            }
        } catch (error) {
            console.error("Error al crear la ruta:", error);
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        const fetchVendedores = async () => {
            try {
                const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
                    { id_owner: user },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setVendedores(response.data.data);
            } catch (error) {
                console.error("Obteniendo vendedores", error);
                setVendedores([]);
            }
        };
        if (user && token) fetchVendedores();
    }, [user, token]);

    const loadMarkersFromAPI = useCallback(async (sales_id) => {
        setLoading(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/maps/list/id",
                {
                    id_owner: user,
                    salesCategory: sales_id,
                    limit: 10000,
                    hasLocation: true,
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
    }, [user, token]);

    useEffect(() => {
        loadMarkersFromAPI("todos");
    }, [loadMarkersFromAPI]);

    useEffect(() => {
        let result = markers;

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            result = result.filter((item) =>
                item.name?.toLowerCase().includes(q) ||
                item.lastName?.toLowerCase().includes(q) ||
                item.company?.toLowerCase().includes(q) ||
                String(item.number || "").includes(q)
            );
        }

        if (selectedChannel) {
            result = result.filter((item) => item.userCategory === selectedChannel);
        }

        if (selectedMunicipio) {
            result = result.filter((item) => {
                const lat = item.client_location?.latitud;
                const lng = item.client_location?.longitud;
                if (!lat || !lng) return false;
                const m = getMunicipioForPoint(lat, lng);
                return m?.id === selectedMunicipio;
            });
        }

        setFilteredData(result);
    }, [searchTerm, markers, selectedChannel, selectedMunicipio]);

    const municipioGroups = useMemo(
        () => groupClientsByMunicipio(markers),
        [markers]
    );

    const channelStats = useMemo(() => {
        const stats = {};
        markers.forEach(c => {
            const cat = c.userCategory || "Otro";
            stats[cat] = (stats[cat] || 0) + 1;
        });
        return stats;
    }, [markers]);

    const capacityCheck = useMemo(
        () => checkCapacity(selectedMarkers, vendorCapacity),
        [selectedMarkers, vendorCapacity]
    );

    useEffect(() => {
        if (selectedMarkers.length > 1 && isLoaded && window.google) {
            const validMarkers = selectedMarkers.filter(m =>
                m.client_location?.latitud && m.client_location?.longitud
            );

            if (validMarkers.length < 2) {
                setRouteStats({ distance: 0, duration: 0 });
                setRoutePath([]);
                return;
            }

            const origin = {
                lat: validMarkers[0].client_location.latitud,
                lng: validMarkers[0].client_location.longitud,
            };
            const destination = {
                lat: validMarkers[validMarkers.length - 1].client_location.latitud,
                lng: validMarkers[validMarkers.length - 1].client_location.longitud,
            };
            const waypoints = validMarkers.slice(1, -1).map((client) => ({
                location: {
                    lat: client.client_location.latitud,
                    lng: client.client_location.longitud,
                },
                stopover: true,
            }));

            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin,
                    destination,
                    waypoints,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                    optimizeWaypoints: false,
                },
                (result, status) => {
                    if (status === "OK") {
                        const legs = result.routes[0].legs;
                        const totalDistance = legs.reduce((s, l) => s + l.distance.value, 0);
                        const totalDuration = legs.reduce((s, l) => s + l.duration.value, 0);
                        setRouteStats({
                            distance: (totalDistance / 1000).toFixed(1),
                            duration: Math.round(totalDuration / 60),
                        });

                        const path = [];
                        result.routes[0].legs.forEach(leg => {
                            leg.steps.forEach(step => {
                                step.path.forEach(p => path.push({ lat: p.lat(), lng: p.lng() }));
                            });
                        });
                        setRoutePath(path);
                    }
                }
            );
        } else {
            setRouteStats({ distance: 0, duration: 0 });
            setRoutePath([]);
        }
    }, [selectedMarkers, isLoaded]);

    const findLocation = (location) => {
        if (location?.client_location) {
            const lat = parseFloat(location.client_location.latitud);
            const lng = parseFloat(location.client_location.longitud);
            if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
                mapRef.current.panTo({ lat, lng });
            }
        }
    };

    const handleMarkerClick = (location) => {
        if (!selectedSaler) {
            setAlertMsg("Por favor seleccione un vendedor antes de agregar clientes a la ruta");
            setSuccessModal(true);
            return;
        }
        setSelectedMarkers((prev) => {
            if (prev.find((item) => item._id === location._id)) {
                return prev.filter(c => c._id !== location._id);
            }
            setLastAddedId(location._id);
            setTimeout(() => setLastAddedId(null), 1500);
            return [...prev, {
                _id: location._id,
                name: location.name,
                lastName: location.lastName,
                identificationImage: location.identificationImage,
                client_location: location.client_location,
                company: location.company,
                userCategory: location.userCategory,
                visitStatus: false,
                visitStatus1: "Sin visitar",
                visitTime: null,
                orderTaken: false,
                visitStartTime: null,
                visitEndTime: null,
            }];
        });
        findLocation(location);
    };

    const handleDelete = (clientId) => {
        setSelectedMarkers((prev) => prev.filter(client => client._id !== clientId));
    };

    const moveClient = (index, direction) => {
        setSelectedMarkers((prev) => {
            const newArr = [...prev];
            const targetIndex = direction === "up" ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
            [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
            return newArr;
        });
    };

    const isClientSelected = (clientId) => selectedMarkers.some(m => m._id === clientId);

    const handleZoomIn = () => {
        const z = mapRef.current?.getZoom() || 13;
        mapRef.current?.setZoom(z + 1);
    };

    const handleZoomOut = () => {
        const z = mapRef.current?.getZoom() || 13;
        mapRef.current?.setZoom(Math.max(z - 1, 3));
    };

    const fitToMarkers = (clientList) => {
        if (!mapRef.current || !window.google || clientList.length === 0) return;
        const bounds = new window.google.maps.LatLngBounds();
        let has = false;
        clientList.forEach(c => {
            const lat = Number(c.client_location?.latitud);
            const lng = Number(c.client_location?.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
                bounds.extend({ lat, lng });
                has = true;
            }
        });
        if (has) {
            mapRef.current.fitBounds(bounds, { top: 120, right: 240, bottom: 200, left: 60 });
        }
    };

    const fitMunicipio = (municipioId) => {
        if (!mapRef.current || !window.google) return;
        const m = MUNICIPIOS_COCHABAMBA[municipioId];
        if (!m) return;
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: m.bounds.north, lng: m.bounds.east });
        bounds.extend({ lat: m.bounds.south, lng: m.bounds.west });
        mapRef.current.fitBounds(bounds, { top: 100, right: 240, bottom: 200, left: 60 });
    };

    const handleOptimize = () => {
        if (selectedMarkers.length < 2) {
            setAlertMsg("Selecciona al menos 2 clientes para optimizar la ruta");
            setSuccessModal(true);
            return;
        }

        let result;
        if (optimizerMode === "proximity") {
            result = optimizeByProximity(selectedMarkers, DEPOT);
        } else {
            const preset = ZONE_PRESETS[zonePresetKey];
            result = optimizeByZones(selectedMarkers, DEPOT, preset?.order);
        }

        setSelectedMarkers(result.route);
        setOptimizerOpen(false);
        setTimeout(() => fitToMarkers(result.route), 300);
    };

    const onSelectVendor = (vendorId) => {
        setSelectedSaler(vendorId);
        const v = vendedores.find(x => x._id === vendorId);
        setSelectedSalerData(v);
        if (v?.visitCapacity) setVendorCapacity(v.visitCapacity);
        loadMarkersFromAPI(vendorId || "todos");
    };

    const clearAll = () => setSelectedMarkers([]);

    const exceedsCapacity = capacityCheck.exceeded;

    return (
        <div className="h-screen w-full flex overflow-hidden bg-white">
            <div className={`${sidebarCollapsed ? "w-0 lg:w-16" : "w-full lg:w-[440px]"} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                {!sidebarCollapsed && (
                    <>
                        <div className="p-5 border-b border-gray-200 bg-red-700 rounded-r-3xl text-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-xl font-bold flex items-center gap-2">
                                        <FaRoute />
                                        Crear nueva ruta
                                    </h1>
                                    <p className="text-xs text-red-100 mt-0.5">
                                        Selecciona los clientes en el mapa
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSidebarCollapsed(true)}
                                    className="hidden lg:flex p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                                >
                                    <FaChevronLeft />
                                </button>
                            </div>

                            <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-xs text-red-100">Clientes seleccionados</p>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                        <motion.p
                                            key={selectedMarkers.length}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className="text-2xl font-bold"
                                        >
                                            {selectedMarkers.length}
                                        </motion.p>
                                        <span className="text-xs text-red-100">/ {vendorCapacity} cap.</span>
                                    </div>
                                </div>
                                {selectedMarkers.length > 0 && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        onClick={() => setIsOpen(true)}
                                        className="px-4 py-2 bg-white text-[#D3423E] font-bold rounded-xl text-sm hover:bg-red-50 transition-colors shadow-md flex items-center gap-2"
                                    >
                                        Siguiente <FaChevronRight size={12} />
                                    </motion.button>
                                )}
                            </div>

                            {selectedMarkers.length >= 2 && (
                                <motion.button
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setOptimizerOpen(true)}
                                    className="w-full bg-white text-red-700 rounded-xl py-2.5 px-3 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-md"
                                >
                                    <FaMagic />
                                    Optimizar orden automáticamente
                                </motion.button>
                            )}

                            {exceedsCapacity && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-2 bg-yellow-400/30 border border-yellow-300 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2"
                                >
                                    <FaInfoCircle />
                                    Excede capacidad por {capacityCheck.overflow} cliente{capacityCheck.overflow !== 1 ? "s" : ""}
                                </motion.div>
                            )}
                        </div>

                        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                    Vendedor asignado <span className="text-[#D3423E]">*</span>
                                </label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                                    <select
                                        value={selectedSaler}
                                        onChange={(e) => onSelectVendor(e.target.value)}
                                        className="app-select"
                                    >
                                        <option value="">Seleccionar vendedor...</option>
                                        {vendedores.map((v) => (
                                            <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                {!selectedSaler && (
                                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                        <FaInfoCircle size={10} />
                                        Selecciona un vendedor para empezar
                                    </p>
                                )}
                            </div>

                            {selectedSaler && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                        Capacidad de visitas
                                    </label>
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
                                        <button
                                            onClick={() => setVendorCapacity(Math.max(1, vendorCapacity - 5))}
                                            className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors"
                                        >
                                            <FaMinus size={10} />
                                        </button>
                                        <input
                                            type="number"
                                            value={vendorCapacity}
                                            onChange={(e) => setVendorCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="flex-1 text-center font-bold text-base text-gray-900 bg-white border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                            min="1"
                                        />
                                        <button
                                            onClick={() => setVendorCapacity(vendorCapacity + 5)}
                                            className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors"
                                        >
                                            <FaPlus size={10} />
                                        </button>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase pr-2">
                                            visitas
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={selectedChannel}
                                    onChange={(e) => setSelectedChannel(e.target.value)}
                                    className="app-select"
                                >
                                    <option value="">Canal: Todos</option>
                                    {CHANNEL_LIST.map(c => (
                                        <option key={c} value={c}>{c} ({channelStats[c] || 0})</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMunicipio}
                                    onChange={(e) => {
                                        setSelectedMunicipio(e.target.value);
                                        if (e.target.value) fitMunicipio(e.target.value);
                                    }}
                                    className="app-select"
                                >
                                    <option value="">Zona: Todas</option>
                                    {Object.values(MUNICIPIOS_COCHABAMBA).map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({municipioGroups[m.id]?.count || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {selectedMarkers.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-gray-700 uppercase">Orden de visita</p>
                                        <button
                                            onClick={clearAll}
                                            className="text-xs text-red-600 hover:underline font-semibold"
                                        >
                                            Limpiar todo
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {selectedMarkers.map((client, index) => {
                                            const channelConf = getChannelConfig(client.userCategory);
                                            const muni = client.client_location?.latitud
                                                ? getMunicipioForPoint(client.client_location.latitud, client.client_location.longitud)
                                                : null;
                                            return (
                                                <motion.div
                                                    key={client._id}
                                                    layout
                                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                    onClick={() => findLocation(client)}
                                                    className={`bg-white border-2 rounded-2xl p-3 cursor-pointer hover:shadow-md transition-all ${client._id === lastAddedId
                                                        ? "border-[#D3423E] shadow-lg ring-4 ring-red-100"
                                                        : "border-gray-200 hover:border-[#D3423E]"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col gap-0.5">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); moveClient(index, "up"); }}
                                                                disabled={index === 0}
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] ${index === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); moveClient(index, "down"); }}
                                                                disabled={index === selectedMarkers.length - 1}
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] ${index === selectedMarkers.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100"}`}
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>

                                                        <div
                                                            className="w-8 h-8 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-md"
                                                            style={{ backgroundColor: channelConf.color }}
                                                        >
                                                            {index + 1}
                                                        </div>

                                                        <div className="relative flex-shrink-0">
                                                            <img
                                                                src={client.identificationImage || FALLBACK_IMAGE}
                                                                alt={client.name}
                                                                className="w-11 h-11 rounded-lg object-cover bg-gray-100"
                                                                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                                                            />
                                                            <div
                                                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-sm"
                                                                style={{ backgroundColor: channelConf.color }}
                                                            >
                                                                {channelConf.emoji}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-gray-900 text-sm truncate">
                                                                {client.name} {client.lastName}
                                                            </h3>
                                                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                                                {muni && (
                                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 flex items-center gap-0.5">
                                                                        <span
                                                                            className="w-1.5 h-1.5 rounded-full"
                                                                            style={{ backgroundColor: muni.accent }}
                                                                        />
                                                                        {muni.name}
                                                                    </span>
                                                                )}
                                                                {client.userCategory && (
                                                                    <span
                                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                                                        style={{
                                                                            backgroundColor: `${channelConf.color}20`,
                                                                            color: channelConf.colorDark,
                                                                        }}
                                                                    >
                                                                        {client.userCategory}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-1">
                                                                <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0" size={8} />
                                                                {client.client_location?.direction || "Sin dirección"}
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(client._id);
                                                            }}
                                                            className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FaRoute className="text-gray-300 text-3xl" />
                                    </div>
                                    <p className="text-gray-700 font-semibold">Sin clientes seleccionados</p>
                                    <p className="text-sm text-gray-500 mt-1 px-8">
                                        {selectedSaler
                                            ? "Haz clic en los pines del mapa para agregar clientes"
                                            : "Primero selecciona un vendedor"}
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
                        {selectedMarkers.length > 0 && (
                            <div className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {selectedMarkers.length}
                            </div>
                        )}
                    </button>
                )}
            </div>

            <div className="flex-1 h-full relative bg-gray-200">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={CONTAINER_STYLE}
                        center={DEFAULT_CENTER}
                        zoom={DEFAULT_ZOOM}
                        onLoad={(map) => { mapRef.current = map; }}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: false,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                            styles: MAP_STYLE_MODERN,
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
                                            fontSize: 11,
                                            letterSpacing: 0.3,
                                            textTransform: "uppercase",
                                            textShadow: "1px 1px 3px white, -1px -1px 3px white, 1px -1px 3px white, -1px 1px 3px white",
                                            opacity: 0.75,
                                        }}
                                    >
                                        {m.name}
                                    </div>
                                </OverlayView>
                            </React.Fragment>
                        ))}

                        {showAvailable && filteredData.map((location, index) => {
                            if (!location.client_location?.latitud || !location.client_location?.longitud) return null;
                            const selected = isClientSelected(location._id);
                            if (selected) return null;
                            const icon = window.google && iconsReady
                                ? buildMarkerIcon(location.userCategory, window.google.maps, false)
                                : null;
                            return (
                                <Marker
                                    key={`avail-${location._id || index}`}
                                    position={{
                                        lat: Number(location.client_location.latitud),
                                        lng: Number(location.client_location.longitud),
                                    }}
                                    icon={icon}
                                    onClick={() => handleMarkerClick(location)}
                                    zIndex={1}
                                />
                            );
                        })}

                        {selectedMarkers.map((client, index) => {
                            if (!client.client_location?.latitud || !client.client_location?.longitud) return null;
                            const isPulsing = client._id === lastAddedId;
                            return (
                                <Marker
                                    key={`sel-${client._id}`}
                                    position={{
                                        lat: Number(client.client_location.latitud),
                                        lng: Number(client.client_location.longitud),
                                    }}
                                    icon={window.google ? {
                                        url: buildOrderedChannelMarker(index, client.userCategory, true, isPulsing),
                                        scaledSize: new window.google.maps.Size(52, 52),
                                        anchor: new window.google.maps.Point(26, 26),
                                    } : null}
                                    animation={isPulsing ? window.google.maps.Animation.DROP : null}
                                    onClick={() => handleMarkerClick(client)}
                                    zIndex={1000 + index}
                                />
                            );
                        })}

                        {routePath.length > 0 && (
                            <>
                                <Polyline
                                    path={routePath}
                                    options={{
                                        strokeColor: ROUTE_HALO_COLOR,
                                        strokeOpacity: 0.5,
                                        strokeWeight: 12,
                                        zIndex: 1,
                                    }}
                                />
                                <Polyline
                                    path={routePath}
                                    options={{
                                        strokeColor: ROUTE_COLOR,
                                        strokeOpacity: 1,
                                        strokeWeight: 5,
                                        zIndex: 2,
                                        icons: [{
                                            icon: {
                                                path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW,
                                                scale: 3.5,
                                                strokeColor: "#fff",
                                                strokeWeight: 1.5,
                                                fillColor: ROUTE_COLOR_DARK,
                                                fillOpacity: 1,
                                            },
                                            offset: "0",
                                            repeat: "100px",
                                        }],
                                    }}
                                />
                            </>
                        )}
                    </GoogleMap>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-3"></div>
                            <p className="text-gray-600 font-medium">Cargando mapa...</p>
                        </div>
                    </div>
                )}

                <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-3">
                    <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2 max-w-2xl">
                        <FaSearch className="text-gray-400 flex-shrink-0" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar cliente, empresa..."
                            className="flex-1 text-sm text-gray-900 bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus:border-transparent"
                            style={{ boxShadow: "none" }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="text-gray-400 hover:text-gray-700"
                            >
                                <FaTimes size={12} />
                            </button>
                        )}
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {filteredData.length}
                        </span>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowViewOptions(!showViewOptions)}
                            className="bg-white rounded-2xl shadow-lg p-2.5 border border-gray-200 flex items-center gap-2 hover:shadow-xl transition-all"
                        >
                            <FaCog className="text-gray-600" size={13} />
                            <span className="text-xs font-bold text-gray-700">Vista</span>
                            <FaChevronRight
                                className={`text-gray-400 transition-transform ${showViewOptions ? "rotate-90" : "rotate-0"}`}
                                size={9}
                            />
                        </button>

                        {showViewOptions && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowViewOptions(false)} />
                                <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-20">
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
                                        onClick={() => setShowAvailable(!showAvailable)}
                                        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors border-t border-gray-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FaLayerGroup className="text-gray-600" size={12} />
                                            <span className="text-xs font-bold text-gray-700">Clientes disponibles</span>
                                        </div>
                                        {showAvailable ? <FaEye className="text-[#D3423E]" size={11} /> : <FaEyeSlash className="text-gray-400" size={11} />}
                                    </button>
                                    <div className="border-t border-gray-100">
                                        <button
                                            onClick={() => { fitToMarkers(filteredData); setShowViewOptions(false); }}
                                            className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                        >
                                            <FaExpand className="text-gray-600" size={12} />
                                            <span className="text-xs font-bold text-gray-700">Ver todos en mapa</span>
                                        </button>
                                        {selectedMarkers.length > 0 && (
                                            <button
                                                onClick={() => { fitToMarkers(selectedMarkers); setShowViewOptions(false); }}
                                                className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-t border-gray-100"
                                            >
                                                <FaRoute className="text-[#D3423E]" size={12} />
                                                <span className="text-xs font-bold text-gray-700">Ver ruta completa</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {selectedMarkers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-20 left-4 z-10 bg-white rounded-2xl shadow-xl border border-gray-200 px-4 py-2.5 flex items-center gap-3"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                                    <FaRoute className="text-[#D3423E]" size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Paradas</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedMarkers.length}</p>
                                </div>
                            </div>
                            {routeStats.distance > 0 && (
                                <>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                                            <FaMapMarkerAlt className="text-blue-600" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Distancia</p>
                                            <p className="text-sm font-bold text-gray-900">{routeStats.distance} km</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                                            <FaClock className="text-amber-600" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Tiempo</p>
                                            <p className="text-sm font-bold text-gray-900">~{routeStats.duration} min</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex items-center gap-2">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${exceedsCapacity ? "bg-yellow-50" : "bg-emerald-50"}`}>
                                    <FaUser className={exceedsCapacity ? "text-yellow-600" : "text-emerald-600"} size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wide">Capacidad</p>
                                    <p className={`text-sm font-bold ${exceedsCapacity ? "text-yellow-600" : "text-gray-900"}`}>
                                        {capacityCheck.count}/{capacityCheck.capacity}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                    <button
                        onClick={handleZoomIn}
                        className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-gray-200"
                        title="Acercar"
                    >
                        <FaPlus size={14} />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="w-11 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        title="Alejar"
                    >
                        <FaMinus size={14} />
                    </button>
                </div>

                <div className="absolute bottom-4 right-4 z-10 bg-white rounded-2xl shadow-lg p-3 border border-gray-200 max-w-[200px]">
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
                                    onClick={() => setSelectedChannel(selectedChannel === channel ? "" : channel)}
                                    className={`w-full flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors ${selectedChannel === channel ? "bg-gray-100" : "hover:bg-gray-50"}`}
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
                </div>

                {filteredData.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-[230px] z-10 hidden lg:block">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
                            <div className="flex items-center justify-between px-2 py-1 mb-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase">
                                    {filteredData.length} clientes disponibles
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    Desliza para ver más →
                                </p>
                            </div>
                            <div
                                className="flex overflow-x-auto gap-2 pb-1"
                                style={{ scrollbarWidth: "thin", scrollbarColor: "#D3423E #f3f4f6" }}
                            >
                                {filteredData.map((client) => {
                                    const selected = isClientSelected(client._id);
                                    const channelConf = getChannelConfig(client.userCategory);
                                    return (
                                        <div
                                            key={client._id}
                                            onClick={() => handleMarkerClick(client)}
                                            className={`flex-shrink-0 flex flex-col items-center border-2 rounded-xl p-2 min-w-[100px] cursor-pointer transition-all hover:shadow-md ${selected ? "border-[#D3423E] bg-red-50" : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}
                                        >
                                            <div className="relative">
                                                <img
                                                    className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                                                    src={client.identificationImage || FALLBACK_IMAGE}
                                                    alt={client.name}
                                                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                                                />
                                                <div
                                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] shadow-sm"
                                                    style={{ backgroundColor: channelConf.color }}
                                                >
                                                    {channelConf.emoji}
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-900 truncate mt-1 w-full text-center">
                                                {client.name}
                                            </p>
                                            {selected ? (
                                                <span className="text-[9px] text-[#D3423E] font-bold flex items-center gap-0.5 mt-0.5">
                                                    <FaCheck size={7} /> En ruta
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                                                    <FaPlus size={7} /> Agregar
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {optimizerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4"
                        onClick={() => setOptimizerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FaMagic /> Optimizar ruta
                                    </h3>
                                    <p className="text-xs text-red-100 mt-0.5">
                                        Reordenar {selectedMarkers.length} clientes automáticamente
                                    </p>
                                </div>
                                <button
                                    onClick={() => setOptimizerOpen(false)}
                                    className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
                                        Estrategia de optimización
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setOptimizerMode("proximity")}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${optimizerMode === "proximity" ? "border-[#D3423E] bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <FaRoute className={optimizerMode === "proximity" ? "text-[#D3423E]" : "text-gray-400"} size={14} />
                                                <span className="font-bold text-sm text-gray-900">Por cercanía</span>
                                            </div>
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                                Ruta más corta sin importar zona. Ideal cuando los clientes están dispersos.
                                            </p>
                                        </button>
                                        <button
                                            onClick={() => setOptimizerMode("zones")}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${optimizerMode === "zones" ? "border-[#D3423E] bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <FaCity className={optimizerMode === "zones" ? "text-[#D3423E]" : "text-gray-400"} size={14} />
                                                <span className="font-bold text-sm text-gray-900">Por zonas</span>
                                            </div>
                                            <p className="text-[10px] text-gray-600 leading-tight">
                                                Agrupa por municipio. Ideal para cubrir Cercado → Quillacollo → Sacaba.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {optimizerMode === "zones" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                    >
                                        <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
                                            Orden geográfico
                                        </label>
                                        <select
                                            value={zonePresetKey}
                                            onChange={(e) => setZonePresetKey(e.target.value)}
                                            className="app-select"
                                        >
                                            {Object.entries(ZONE_PRESETS).map(([key, preset]) => (
                                                <option key={key} value={key}>{preset.label}</option>
                                            ))}
                                        </select>
                                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                                            {ZONE_PRESETS[zonePresetKey]?.order.map((zoneId, idx) => {
                                                const m = MUNICIPIOS_COCHABAMBA[zoneId];
                                                if (!m) return null;
                                                return (
                                                    <React.Fragment key={zoneId}>
                                                        <span
                                                            className="text-[10px] font-bold px-2 py-1 rounded-md text-white"
                                                            style={{ backgroundColor: m.accent }}
                                                        >
                                                            {idx + 1}. {m.name}
                                                        </span>
                                                        {idx < ZONE_PRESETS[zonePresetKey].order.length - 1 && (
                                                            <FaChevronRight className="text-gray-400" size={9} />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Clientes a optimizar:</span>
                                        <span className="font-bold text-gray-900">{selectedMarkers.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Capacidad vendedor:</span>
                                        <span className={`font-bold ${exceedsCapacity ? "text-yellow-600" : "text-gray-900"}`}>
                                            {capacityCheck.count} / {capacityCheck.capacity}
                                            {exceedsCapacity && ` (excede ${capacityCheck.overflow})`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Punto de inicio:</span>
                                        <span className="font-bold text-gray-900">Depósito (Cochabamba)</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setOptimizerOpen(false)}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleOptimize}
                                        className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-[#D3423E] hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaMagic size={12} />
                                        Optimizar ahora
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FaRoute /> Crear Ruta
                                    </h3>
                                    <p className="text-xs text-red-100 mt-0.5">
                                        {selectedMarkers.length} cliente{selectedMarkers.length !== 1 ? "s" : ""} en la ruta
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                        Nombre de la ruta <span className="text-[#D3423E]">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                        <input
                                            type="text"
                                            placeholder="Ej: Ruta Centro - Lunes"
                                            value={routeName}
                                            onChange={(e) => setRouteName(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                            Desde <span className="text-[#D3423E]">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                            Hasta <span className="text-[#D3423E]">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                min={startDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                    <p className="text-xs font-semibold text-gray-700 uppercase">Resumen</p>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Vendedor:</span>
                                            <span className="font-semibold text-gray-900">
                                                {vendedores.find(v => v._id === selectedSaler)?.fullName || "-"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Clientes:</span>
                                            <span className="font-semibold text-gray-900">{selectedMarkers.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Capacidad:</span>
                                            <span className={`font-semibold ${exceedsCapacity ? "text-yellow-600" : "text-gray-900"}`}>
                                                {capacityCheck.count}/{capacityCheck.capacity}
                                            </span>
                                        </div>
                                        {routeStats.distance > 0 && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Distancia:</span>
                                                    <span className="font-semibold text-gray-900">{routeStats.distance} km</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tiempo estimado:</span>
                                                    <span className="font-semibold text-gray-900">~{routeStats.duration} min</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {exceedsCapacity && (
                                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2 text-xs flex items-start gap-2">
                                        <FaInfoCircle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-yellow-800">
                                            La ruta supera la capacidad del vendedor por {capacityCheck.overflow} cliente{capacityCheck.overflow !== 1 ? "s" : ""}. Puedes crearla igual, pero considera dividirla.
                                        </span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateRoute}
                                        disabled={!validateForm() || creating}
                                        className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${!validateForm() || creating ? "bg-gray-300 cursor-not-allowed" : "bg-[#D3423E] hover:bg-red-700"}`}
                                    >
                                        {creating ? "Creando..." : "Crear Ruta"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AlertModal
                show={successModal}
                onClose={() => setSuccessModal(false)}
                message={alertMsg || "Por favor seleccione un vendedor antes de agregar clientes a la ruta"}
            />
        </div>
    );
}