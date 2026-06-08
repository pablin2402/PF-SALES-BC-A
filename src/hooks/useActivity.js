import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { getCurrentDateUTCMinus4 } from "../constants/activityConfigs";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../utils/MapDetails";

export const useActivity = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [vendedores, setVendedores] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedSaler, setSelectedSaler] = useState("");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getCurrentDateUTCMinus4());
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.post(API_URL + "/whatsapp/sales/list/id",
          { id_owner: user }, { headers: { Authorization: `Bearer ${token}` } });
        setVendedores(res.data.data);
      } catch (e) { setVendedores([]); }
    };
    fetch();
  }, [user, token]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(salesData);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredData(salesData.filter(item =>
        item.clientName.name.toLowerCase().includes(q) ||
        item.clientName.lastName.toLowerCase().includes(q) ||
        String(item.number || "").includes(q)
      ));
    }
  }, [searchTerm, salesData]);

  const fetchActivities = useCallback(async (salerId, currentPage) => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/salesman/date/id", {
        id_owner: user, salesMan: salerId, startDate, details: "", page: currentPage,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSalesData(res.data.data || []);
      setFilteredData(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (e) {
      setSalesData([]); setFilteredData([]);
    } finally { setLoading(false); }
  }, [startDate, user, token]);

  useEffect(() => { fetchActivities(selectedSaler, page); }, [fetchActivities, selectedSaler, page]);

  const findLocation = (client) => {
    if (!client) return;
    const lat = parseFloat(client.latitude);
    const lng = parseFloat(client.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapZoom(18); setCenter({ lat, lng }); setSelectedClientId(client._id);
    }
  };

  // Build directions
  const buildDirections = useCallback((data) => {
    if (data.length <= 1 || !window.google) { setDirectionsResponse(null); return; }
    const origin = { lat: data[0].latitude, lng: data[0].longitude };
    const destination = { lat: data[data.length - 1].latitude, lng: data[data.length - 1].longitude };
    const waypoints = data.slice(1, -1).map(c => ({ location: { lat: c.latitude, lng: c.longitude }, stopover: true }));
    setDirectionsResponse(null);
    const svc = new window.google.maps.DirectionsService();
    svc.route({ origin, destination, waypoints, travelMode: window.google.maps.TravelMode.DRIVING, optimizeWaypoints: true },
      (result, status) => { if (status === "OK") setDirectionsResponse(result); }
    );
  }, []);

  const visitsCompletadas = salesData.filter(c => c.details === "Termina la visita").length;
  const visitsEnCurso = salesData.filter(c => c.details === "Visita al cliente").length;

  return {
    salesData, filteredData, searchTerm, setSearchTerm,
    center, mapZoom, vendedores, selectedClientId, selectedSaler, setSelectedSaler,
    loading, startDate, setStartDate, directionsResponse, totalPages, page, setPage,
    fetchActivities, findLocation, buildDirections,
    visitsCompletadas, visitsEnCurso,
  };
};