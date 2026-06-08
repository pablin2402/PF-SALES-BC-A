import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const useClients = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [vendedores, setVendedores] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const searchTimeoutRef = useRef(null);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchInput]);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const r = await axios.post(API_URL + "/whatsapp/sales/list/id",
          { id_owner: user }, { headers: { Authorization: `Bearer ${token}` } });
        setVendedores(r.data.data || []);
      } catch (e) { setVendedores([]); }
    };
    if (user && token) fetchVendedores();
  }, [user, token]);

  const fetchClients = useCallback(async (pageNum) => {
    setLoading(true);
    const payload = { id_owner: user, page: pageNum, limit: itemsPerPage, clientName: searchTerm };
    if (selectedSaler) payload.sales_id = selectedSaler;
    if (selectedRegion) payload.region = selectedRegion;
    try {
      const r = await axios.post(API_URL + "/whatsapp/client/list/id", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalesData(r.data.clients || []);
      setTotalPages(r.data.totalPages || 1);
      setItems(r.data.totalItems || 0);
    } catch (e) {
      setSalesData([]);
    } finally { setLoading(false); }
  }, [user, searchTerm, selectedSaler, selectedRegion, itemsPerPage, token]);

  useEffect(() => { fetchClients(page); }, [page, fetchClients]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const sortedData = useMemo(() => {
    return [...salesData].sort((a, b) => {
      let vA, vB;
      switch (sortBy) {
        case "name": vA = `${a.name || ""} ${a.lastName || ""}`.toLowerCase(); vB = `${b.name || ""} ${b.lastName || ""}`.toLowerCase(); break;
        case "category": vA = (a.userCategory || "").toLowerCase(); vB = (b.userCategory || "").toLowerCase(); break;
        case "region": vA = (a.region || "").toLowerCase(); vB = (b.region || "").toLowerCase(); break;
        case "salesman": vA = a.sales_id ? a.sales_id.fullName.toLowerCase() : ""; vB = b.sales_id ? b.sales_id.fullName.toLowerCase() : ""; break;
        default: return 0;
      }
      if (vA < vB) return sortOrder === "asc" ? -1 : 1;
      if (vA > vB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [salesData, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: items,
    assigned: salesData.filter((s) => s.sales_id).length,
    unassigned: salesData.filter((s) => !s.sales_id).length,
    regions: new Set(salesData.map((s) => s.region).filter(Boolean)).size,
  }), [salesData, items]);

  const hasActiveFilters = searchInput !== "" || selectedSaler !== "" || selectedRegion !== "";

  const clearAllFilters = () => {
    setSearchInput("");
    setSelectedSaler("");
    setSelectedRegion("");
  };

  return {
    salesData, sortedData, loading, page, setPage, totalPages, items, itemsPerPage, setItemsPerPage,
    vendedores, searchInput, setSearchInput, selectedSaler, setSelectedSaler,
    selectedRegion, setSelectedRegion, sortBy, sortOrder, handleSort,
    stats, hasActiveFilters, clearAllFilters, fetchClients,
  };
};