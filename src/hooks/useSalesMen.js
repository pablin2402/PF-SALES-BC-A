import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";
import { REGION_LABELS } from "../constants/salesmenConfigs";

export const useSalesmen = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [togglingId, setTogglingId] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const searchTimeoutRef = useRef(null);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchSalesmen = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/sales/list/id",
        { id_owner: user, page: pageNum, limit: itemsPerPage, searchTerm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setItems(res.data.items || res.data.data?.length || 0);
    } catch (e) { setSalesData([]); }
    finally { setLoading(false); }
  }, [user, token, itemsPerPage, searchTerm]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchInput]);

  useEffect(() => { fetchSalesmen(page); }, [page, fetchSalesmen]);

  const handleToggleConfirmed = async (newStatus, id, onError) => {
    setTogglingId(id);
    try {
      await axios.put(API_URL + "/whatsapp/salesman/status",
        { _id: id, active: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(prev => prev.map(s => s._id === id ? { ...s, active: newStatus } : s));
    } catch (e) {
      onError?.("No se pudo cambiar el estado del vendedor");
    } finally { setTogglingId(null); setConfirmToggle(null); }
  };

  const requestToggle = (salesman) => {
    if (salesman.active) setConfirmToggle(salesman);
    else handleToggleConfirmed(true, salesman._id);
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const availableRegions = useMemo(() => {
    const set = new Set();
    salesData.forEach(s => s.region && set.add(s.region));
    return Array.from(set);
  }, [salesData]);

  const filteredAndSorted = useMemo(() => {
    return salesData
      .filter(s => {
        if (statusFilter === "active" && !s.active) return false;
        if (statusFilter === "inactive" && s.active) return false;
        if (regionFilter !== "all" && s.region !== regionFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let vA, vB;
        switch (sortBy) {
          case "name": vA = `${a.fullName || ""} ${a.lastName || ""}`.toLowerCase(); vB = `${b.fullName || ""} ${b.lastName || ""}`.toLowerCase(); break;
          case "email": vA = (a.email || "").toLowerCase(); vB = (b.email || "").toLowerCase(); break;
          case "region": vA = (a.region || "").toLowerCase(); vB = (b.region || "").toLowerCase(); break;
          default: return 0;
        }
        if (vA < vB) return sortOrder === "asc" ? -1 : 1;
        if (vA > vB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [salesData, statusFilter, regionFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: salesData.length,
    active: salesData.filter(s => s.active).length,
    inactive: salesData.filter(s => !s.active).length,
    regions: new Set(salesData.map(s => s.region).filter(Boolean)).size,
  }), [salesData]);

  const hasActiveFilters = statusFilter !== "all" || regionFilter !== "all" || searchInput !== "";

  const clearAllFilters = () => { setSearchInput(""); setStatusFilter("all"); setRegionFilter("all"); };

  const exportToExcel = async (onError) => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/sales/list/id",
        { id_owner: user, page: 1, limit: 10000, searchTerm: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.data || [];
      if (!data.length) return;
      const ws = XLSX.utils.json_to_sheet(data.map(s => ({
        Nombre: `${s.fullName || ""} ${s.lastName || ""}`.trim(),
        Correo: s.email || "",
        Teléfono: s.phoneNumber || "",
        Ciudad: REGION_LABELS[s.region] || s.region || "",
        Estado: s.active ? "Activo" : "Inactivo",
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vendedores");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf], { type: "application/octet-stream" }), `Vendedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) { onError?.("No se pudo exportar la lista"); }
  };

  return {
    salesData, loading, page, setPage, totalPages, itemsPerPage, setItemsPerPage, items,
    searchInput, setSearchInput, statusFilter, setStatusFilter,
    regionFilter, setRegionFilter, sortBy, sortOrder, handleSort,
    togglingId, confirmToggle, setConfirmToggle,
    requestToggle, handleToggleConfirmed,
    availableRegions, filteredAndSorted, stats, hasActiveFilters, clearAllFilters,
    exportToExcel, fetchSalesmen,
  };
};