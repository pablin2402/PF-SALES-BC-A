import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { API_URL, UPLOAD_TIME } from "../config";
import { buildMarkerIcon } from "../utils/ClientMarkerIcons";
import { getMunicipioForPoint, groupClientsByMunicipio, MUNICIPIOS_COCHABAMBA } from "../utils/CochabambaMunicipios";
import { DEFAULT_CENTER, DEFAULT_ZOOM, VIEW_ALL_LIMIT } from "../utils/MapDetails";

export const useLocalization = () => {
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
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [locations, setLocations] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [hasLocationOnly, setHasLocationOnly] = useState(false);
  const [channelStats, setChannelStats] = useState({});
  const [markerIcons, setMarkerIcons] = useState({});

  const debounceRef = useRef(null);
  const mapRef = useRef(null);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchInput]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.post(API_URL + "/whatsapp/location/list/id",
          { id_owner: user }, { headers: { Authorization: `Bearer ${token}` } });
        setLocations(res.data);
      } catch (e) {}
    };
    fetchLocations();
    const interval = setInterval(fetchLocations, UPLOAD_TIME);
    return () => clearInterval(interval);
  }, [user, token]);

  const fetchSalesMan = useCallback(async () => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/sales/list/id",
        { id_owner: user }, { headers: { Authorization: `Bearer ${token}` } });
      setSalesManData(res.data.data);
    } catch (e) {}
  }, [user, token]);
  useEffect(() => { fetchSalesMan(); }, [fetchSalesMan]);

  const loadMarkersFromAPI = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/maps/list/id", {
        id_owner: user, userCategory: selectedCategories, salesCategory: selectedSalesmen,
        nameClient: searchTerm, page, limit, sortBy, hasLocation: hasLocationOnly,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMarkers(res.data.users || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setChannelStats(res.data.channelStats || {});
    } catch (e) { setMarkers([]); setTotal(0); setTotalPages(1); }
    finally { setLoading(false); }
  }, [user, token, selectedCategories, selectedSalesmen, searchTerm, page, limit, sortBy, hasLocationOnly]);

  useEffect(() => { loadMarkersFromAPI(); }, [loadMarkersFromAPI]);
  useEffect(() => { setPage(1); }, [selectedCategories, selectedSalesmen, sortBy, hasLocationOnly, selectedMunicipio]);

  const loadAllClients = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/maps/list/id", {
        id_owner: user, userCategory: selectedCategories, salesCategory: selectedSalesmen,
        nameClient: "", page: 1, limit: VIEW_ALL_LIMIT, sortBy: "name", hasLocation: true,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const all = res.data.users || [];
      setAllClientsCache(all);
      setViewAllMode(true);
      if (mapRef.current && window.google && all.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValid = false;
        all.forEach(c => {
          const lat = Number(c.client_location?.latitud);
          const lng = Number(c.client_location?.longitud);
          if (!isNaN(lat) && !isNaN(lng)) { bounds.extend({ lat, lng }); hasValid = true; }
        });
        if (hasValid) mapRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
      }
    } catch (e) {}
    finally { setLoadingAll(false); }
  }, [user, token, selectedCategories, selectedSalesmen]);

  const exitViewAllMode = () => {
    setViewAllMode(false); setAllClientsCache([]);
    setCenter(DEFAULT_CENTER); setMapZoom(DEFAULT_ZOOM);
  };

  const filteredMarkers = useMemo(() => {
    const base = viewAllMode ? allClientsCache : markers;
    if (!selectedMunicipio) return base;
    return base.filter(c => {
      const lat = c?.client_location?.latitud;
      const lng = c?.client_location?.longitud;
      if (!lat || !lng) return false;
      return getMunicipioForPoint(lat, lng)?.id === selectedMunicipio;
    });
  }, [markers, allClientsCache, viewAllMode, selectedMunicipio]);

  const municipioGroups = useMemo(
    () => groupClientsByMunicipio(viewAllMode ? allClientsCache : markers),
    [markers, allClientsCache, viewAllMode]
  );

  useEffect(() => {
    if (!window.google?.maps) return;
    async function loadIcons() {
      const icons = {};
      for (const loc of filteredMarkers) {
        icons[loc._id] = await buildMarkerIcon(loc.userCategory, window.google, selectedClient?._id === loc._id);
      }
      setMarkerIcons(icons);
    }
    loadIcons();
  }, [filteredMarkers, selectedClient]);

  const findLocation = (location) => {
    if (!location?.client_location) return;
    const lat = parseFloat(location.client_location.latitud);
    const lng = parseFloat(location.client_location.longitud);
    if (!isNaN(lat) && !isNaN(lng)) { setMapZoom(17); setCenter({ lat, lng }); setSelectedClient(location); }
  };

  const fitAllMarkers = useCallback(() => {
    if (!mapRef.current || !window.google || filteredMarkers.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    let hasValid = false;
    filteredMarkers.forEach(m => {
      const lat = Number(m.client_location?.latitud);
      const lng = Number(m.client_location?.longitud);
      if (!isNaN(lat) && !isNaN(lng)) { bounds.extend({ lat, lng }); hasValid = true; }
    });
    if (hasValid) mapRef.current.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
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
    setCenter(DEFAULT_CENTER); setMapZoom(DEFAULT_ZOOM);
    setSelectedClient(null); setSelectedMunicipio("");
    if (viewAllMode) exitViewAllMode();
  };

  const clearFilters = () => {
    setSelectedSalesmen(""); setSelectedCategories("");
    setSearchInput(""); setSearchTerm("");
    setHasLocationOnly(false); setSortBy("name");
    setSelectedMunicipio(""); setPage(1);
  };

  const hasActiveFilters = !!(selectedSalesmen || selectedCategories || searchTerm || hasLocationOnly || selectedMunicipio);
  const activeSalesmen = locations.filter(l => l.salesManId && typeof l.salesManId === "object").length;
  const activeDeliveries = locations.filter(l => l.delivery && typeof l.delivery === "object").length;
  const sidebarClients = viewAllMode ? filteredMarkers : markers;

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, page - 1, page, page + 1, totalPages];
  }, [page, totalPages]);

  return {
    searchInput, setSearchInput, salesManData, markers, filteredMarkers, allClientsCache,
    viewAllMode, center, mapZoom, selectedCategories, setSelectedCategories,
    selectedSalesmen, setSelectedSalesmen, selectedMunicipio, setSelectedMunicipio,
    selectedClient, setSelectedClient, sidebarClients, loading, loadingAll, locations,
    page, setPage, limit, setLimit, totalPages, total, sortBy, setSortBy,
    hasLocationOnly, setHasLocationOnly, channelStats, markerIcons, mapRef,
    municipioGroups, hasActiveFilters, activeSalesmen, activeDeliveries, visiblePages,
    loadAllClients, exitViewAllMode, findLocation, fitAllMarkers, fitMunicipio,
    resetView, clearFilters,
  };
};