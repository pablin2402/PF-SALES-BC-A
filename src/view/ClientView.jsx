import React, { useEffect, useCallback, useState, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import {
  FaUserEdit, FaSearch, FaTimes, FaCheckCircle, FaTimesCircle,
  FaUsers, FaUserTie, FaCity, FaPhone, FaMapMarkerAlt, FaTag,
  FaRedo, FaUser, FaSort, FaSortUp, FaSortDown,
  FaSave, FaUserFriends,
} from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import { motion, AnimatePresence } from "framer-motion";
import { ModernPagination } from "../utils/ModernPagination";
import { SkeletonCards, SkeletonTable, SkeletonStats } from "../utils/SkeletonLoading";
import { EmptyState } from "../utils/StatCard";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLOR_CLASSES = [
  "bg-gradient-to-br from-red-500 to-red-700",
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-green-500 to-green-700",
  "bg-gradient-to-br from-purple-500 to-purple-700",
  "bg-gradient-to-br from-yellow-500 to-orange-600",
  "bg-gradient-to-br from-pink-500 to-pink-700",
  "bg-gradient-to-br from-indigo-500 to-indigo-700",
  "bg-gradient-to-br from-teal-500 to-teal-700",
];

const REGIONS = ["Cochabamba", "Santa Cruz", "La Paz", "Oruro"];

const ClientView = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const searchTimeoutRef = useRef(null);

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [vendedores, setVendedores] = useState([]);

  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSaler1, setSelectedSaler1] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [, setExporting] = useState(false);

  const getInitials = (name, lastName) => {
    const firstInitial = name?.charAt(0).toUpperCase() || "";
    const lastInitial = lastName?.charAt(0).toUpperCase() || "";
    return firstInitial + lastInitial || "?";
  };

  const getColor = useCallback((name, lastName) => {
    const hash = ((name || "") + (lastName || ""))
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
  }, []);

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
        const response = await axios.post(
          API_URL + "/whatsapp/sales/list/id",
          { id_owner: user },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendedores(response.data.data || []);
      } catch (error) {
        console.error("Error obteniendo vendedores", error);
        setVendedores([]);
      }
    };

    if (user && token) fetchVendedores();
  }, [user, token]);

  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    const filters = {
      id_owner: user,
      page: pageNumber,
      limit: itemsPerPage,
      clientName: searchTerm,
    };
    if (selectedSaler) filters.sales_id = selectedSaler;
    if (selectedRegion) filters.region = selectedRegion;

    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id", filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalesData(response.data.clients || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.totalItems || 0);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedSaler, selectedRegion, itemsPerPage, token]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  const goToClientDetails = (client) => {
    navigate(`/client/${client._id}`, { state: { client, flag: false } });
  };

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setSelectedSaler1(item.sales_id?._id || "");
    setOpenDialog(true);
  };

  const handleUpdateClient = async () => {
    if (!selectedItem) return;
    setSavingClient(true);
    try {
      await axios.put(
        API_URL + "/whatsapp/client/user/id",
        {
          _id: selectedItem._id,
          id_owner: user,
          name: selectedItem.name,
          lastName: selectedItem.lastName,
          sales_id: selectedSaler1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowSuccessModal(true);
      setOpenDialog(false);
      fetchProducts(page);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo actualizar el cliente. Verifica los datos.");
      setShowErrorModal(true);
    } finally {
      setSavingClient(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const filters = {
        id_owner: user,
        page: 1,
        limit: 10000,
        clientName: searchTerm,
      };
      if (selectedSaler) filters.sales_id = selectedSaler;
      if (selectedRegion) filters.region = selectedRegion;

      const response = await axios.post(API_URL + "/whatsapp/client/list/id", filters, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allData = response.data.clients || [];
      if (!allData.length) {
        setExporting(false);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => ({
          Nombre: `${item.name || ""} ${item.lastName || ""}`.trim(),
          Categoría: item.userCategory || "",
          Dirección: item.client_location?.direction || "",
          Teléfono: item.number || "",
          Vendedor: item.sales_id
            ? `${item.sales_id.fullName} ${item.sales_id.lastName}`
            : "Sin asignar",
          Ciudad: item.region || "",
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clientes");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], { type: "application/octet-stream" }),
        `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exportando", error);
      setErrorMessage("No se pudo exportar la lista");
      setShowErrorModal(true);
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
    return sortOrder === "asc" ? (
      <FaSortUp className="text-[#D3423E]" size={10} />
    ) : (
      <FaSortDown className="text-[#D3423E]" size={10} />
    );
  };

  const sortedData = useMemo(() => {
    return [...salesData].sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "name":
          valA = `${a.name || ""} ${a.lastName || ""}`.toLowerCase();
          valB = `${b.name || ""} ${b.lastName || ""}`.toLowerCase();
          break;
        case "category":
          valA = (a.userCategory || "").toLowerCase();
          valB = (b.userCategory || "").toLowerCase();
          break;
        case "region":
          valA = (a.region || "").toLowerCase();
          valB = (b.region || "").toLowerCase();
          break;
        case "salesman":
          valA = a.sales_id ? `${a.sales_id.fullName}`.toLowerCase() : "";
          valB = b.sales_id ? `${b.sales_id.fullName}`.toLowerCase() : "";
          break;
        default:
          return 0;
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
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

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#D3423E] rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
              <FaUserFriends className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                Clientes
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gestiona todos los clientes desde un solo lugar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={!salesData.length}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-semibold text-sm transition-all ${salesData.length ? 'bg-white text-gray-700 border-gray-300 hover:border-[#D3423E] hover:text-[#D3423E]' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
            >
              <FaFileExport size={14} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <PrincipalBUtton
              onClick={() => navigate("/client/creation")}
              disabled={!salesData.length}
              icon={IoPersonAdd}
            >
              Nuevo Cliente
            </PrincipalBUtton>
          </div>
        </div>

        {loading && salesData.length === 0 ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Total clientes"
              value={stats.total}
              icon={<FaUsers />}
              color="bg-gray-100 text-gray-700"
            />
            <StatCard
              label="En esta página"
              value={salesData.length}
              icon={<FaUser />}
              color="bg-blue-100 text-blue-700"
            />
            <StatCard
              label="Sin vendedor"
              value={stats.unassigned}
              icon={<FaUserTie />}
              color="bg-yellow-100 text-yellow-700"
            />
            <StatCard
              label="Ciudades"
              value={stats.regions}
              icon={<FaMapMarkerAlt />}
              color="bg-purple-100 text-purple-700"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar cliente por nombre..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] focus:bg-white transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
                  <select
                    value={selectedSaler}
                    onChange={(e) => { setSelectedSaler(e.target.value); setPage(1); }}
                    className="app-select"
                  >
                    <option value="">Todos los vendedores</option>
                    {vendedores.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.fullName} {v.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
                  <select
                    value={selectedRegion}
                    onChange={(e) => { setSelectedRegion(e.target.value); setPage(1); }}
                    className="app-select"
                  >
                    <option value="">Todas las ciudades</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "table" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600"}`}
                  >
                    Tabla
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "cards" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600"}`}
                  >
                    Tarjetas
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 mt-3 flex-wrap pt-3 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Filtros activos:
                    </span>
                    {searchInput && (
                      <FilterChip
                        label={`"${searchInput}"`}
                        onRemove={() => setSearchInput("")}
                      />
                    )}
                    {selectedSaler && (
                      <FilterChip
                        label={`Vendedor: ${vendedores.find((v) => v._id === selectedSaler)?.fullName || "—"}`}
                        onRemove={() => setSelectedSaler("")}
                      />
                    )}
                    {selectedRegion && (
                      <FilterChip
                        label={selectedRegion}
                        onRemove={() => setSelectedRegion("")}
                      />
                    )}
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-[#D3423E] hover:underline flex items-center gap-1 ml-auto"
                    >
                      <FaRedo size={9} /> Limpiar todo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <>
              <div className="lg:hidden">
                <SkeletonCards />
              </div>
              <div className="hidden lg:block">
                {viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />}
              </div>
            </>
          ) : sortedData.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClear={clearAllFilters}
              onCreate={() => navigate("/client/creation")}
            />
          ) : (
            <>
              <div className="hidden lg:block">
                {viewMode === "table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3"></th>
                          <th
                            className="px-4 py-3 font-bold cursor-pointer hover:text-[#D3423E] select-none"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-1">Nombre {getSortIcon("name")}</div>
                          </th>
                          <th
                            className="px-4 py-3 font-bold cursor-pointer hover:text-[#D3423E] select-none"
                            onClick={() => handleSort("category")}
                          >
                            <div className="flex items-center gap-1">Categoría {getSortIcon("category")}</div>
                          </th>
                          <th className="px-4 py-3 font-bold">Dirección</th>
                          <th className="px-4 py-3 font-bold">Teléfono</th>
                          <th
                            className="px-4 py-3 font-bold cursor-pointer hover:text-[#D3423E] select-none"
                            onClick={() => handleSort("salesman")}
                          >
                            <div className="flex items-center gap-1">Vendedor {getSortIcon("salesman")}</div>
                          </th>
                          <th
                            className="px-4 py-3 font-bold cursor-pointer hover:text-[#D3423E] select-none"
                            onClick={() => handleSort("region")}
                          >
                            <div className="flex items-center gap-1">Ciudad {getSortIcon("region")}</div>
                          </th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {sortedData.map((item, idx) => (
                            <motion.tr
                              key={item._id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18, delay: idx * 0.02 }}
                              onClick={() => goToClientDetails(item)}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4">
                                <div
                                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getColor(item.name, item.lastName)}`}
                                >
                                  {getInitials(item.name, item.lastName)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-bold text-gray-900">
                                  {item.name} {item.lastName}
                                </p>
                              </td>
                              <td className="px-4 py-4">
                                {item.userCategory ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                                    <FaTag size={9} />
                                    {item.userCategory}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-gray-700 max-w-[200px]">
                                <p className="truncate text-xs" title={item.client_location?.direction}>
                                  {item.client_location?.direction || "—"}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-gray-700">
                                {item.number ? (
                                  <a
                                    href={`tel:${item.number}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-[#D3423E] transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <FaPhone size={10} className="text-gray-400" />
                                    {item.number}
                                  </a>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-4">
                                {item.sales_id ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${getColor(item.sales_id.fullName, item.sales_id.lastName)}`}>
                                      {getInitials(item.sales_id.fullName, item.sales_id.lastName)}
                                    </div>
                                    <span className="text-gray-700 truncate max-w-[120px]">
                                      {item.sales_id.fullName} {item.sales_id.lastName}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">
                                    Sin asignar
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {item.region ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                                    <FaMapMarkerAlt size={9} />
                                    {item.region}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDialog(item);
                                  }}
                                  className="p-2 text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors"
                                  title="Editar cliente"
                                >
                                  <FaUserEdit size={16} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {(viewMode === "cards" || viewMode === "table") && (
                <div
                  className={
                    viewMode === "cards"
                      ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                      : "lg:hidden p-4 space-y-3"
                  }
                >
                  <AnimatePresence>
                    {sortedData.map((item, idx) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        onClick={() => goToClientDetails(item)}
                        className="bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 ${getColor(item.name, item.lastName)}`}
                          >
                            {getInitials(item.name, item.lastName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {item.name} {item.lastName}
                            </p>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {item.userCategory && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-200">
                                  {item.userCategory}
                                </span>
                              )}
                              {item.region && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                                  {item.region}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(item);
                            }}
                            className="p-2 text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <FaUserEdit size={14} />
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600">
                          {item.number && (
                            <p className="flex items-center gap-2">
                              <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
                              {item.number}
                            </p>
                          )}
                          {item.client_location?.direction && (
                            <p className="flex items-start gap-2">
                              <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" size={11} />
                              <span className="line-clamp-2">{item.client_location.direction}</span>
                            </p>
                          )}
                          {item.sales_id ? (
                            <p className="flex items-center gap-2 pt-1.5 mt-1 border-t border-gray-100">
                              <FaUserTie className="text-gray-400 flex-shrink-0" size={11} />
                              <span className="truncate font-semibold text-gray-700">
                                {item.sales_id.fullName} {item.sales_id.lastName}
                              </span>
                            </p>
                          ) : (
                            <p className="pt-1.5 mt-1 border-t border-gray-100">
                              <span className="text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">
                                Sin vendedor asignado
                              </span>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
          {!loading && sortedData.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                  Total: <strong className="text-gray-900">{items}</strong> clientes
                </span>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="font-semibold">Mostrar:</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="app-select"
                  >
                    {[5, 10, 20, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <ModernPagination
                  page={page}
                  totalPages={totalPages}
                  onChange={setPage}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {openDialog && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => !savingClient && setOpenDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <FaUserEdit />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Editar cliente</h3>
                    <p className="text-xs text-red-100">
                      {selectedItem.name} {selectedItem.lastName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !savingClient && setOpenDialog(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                      <FaUser size={10} className="text-gray-400" />
                      Nombre <span className="text-[#D3423E]">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedItem.name || ""}
                      onChange={(e) =>
                        setSelectedItem({ ...selectedItem, name: e.target.value })
                      }
                      className="bg-white border border-gray-300 text-sm text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E]"
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                      <FaUser size={10} className="text-gray-400" />
                      Apellido <span className="text-[#D3423E]">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedItem.lastName || ""}
                      onChange={(e) =>
                        setSelectedItem({ ...selectedItem, lastName: e.target.value })
                      }
                      className="bg-white border border-gray-300 text-sm text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E]"
                      placeholder="Apellido"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1">
                    <FaUserTie size={10} className="text-gray-400" />
                    Vendedor asignado
                  </label>
                  <select
                    value={selectedSaler1}
                    onChange={(e) => setSelectedSaler1(e.target.value)}
                    className="app-select"
                  >
                    <option value="">Sin vendedor asignado</option>
                    {vendedores.map((vendedor) => (
                      <option key={vendedor._id} value={vendedor._id}>
                        {vendedor.fullName} {vendedor.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    Información (solo lectura)
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="Teléfono" value={selectedItem.number || "—"} />
                    <SummaryRow label="Categoría" value={selectedItem.userCategory || "—"} />
                    <SummaryRow label="Ciudad" value={selectedItem.region || "—"} />
                    <SummaryRow
                      label="Dirección"
                      value={selectedItem.client_location?.direction || "—"}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setOpenDialog(false)}
                    disabled={savingClient}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateClient}
                    disabled={savingClient || !selectedItem.name || !selectedItem.lastName}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors flex items-center justify-center gap-2 ${savingClient || !selectedItem.name || !selectedItem.lastName ? "bg-gray-300 cursor-not-allowed" : "bg-[#D3423E] hover:bg-red-700"}`}
                  >
                    {savingClient ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FaSave size={12} /> Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <ResultModal
            type="success"
            title="¡Cliente actualizado!"
            message="Los datos del cliente se actualizaron correctamente."
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showErrorModal && (
          <ResultModal
            type="error"
            title="Ocurrió un error"
            message={errorMessage || "No se pudo completar la operación."}
            onClose={() => { setShowErrorModal(false); setErrorMessage(""); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, onClick, active }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-3 text-left ${onClick ? "cursor-pointer hover:shadow-md" : "cursor-default"} ${active ? "border-[#D3423E] ring-2 ring-red-100" : "border-gray-200"}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-bold uppercase truncate">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  </button>
);

const FilterChip = ({ label, onRemove }) => (
  <span className="bg-red-50 border border-red-200 text-[#D3423E] px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
    {label}
    <button
      onClick={onRemove}
      className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
    >
      <FaTimes size={9} />
    </button>
  </span>
);
const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between items-baseline gap-2">
    <span className="text-gray-500 flex-shrink-0">{label}:</span>
    <span className="font-bold text-gray-900 text-right truncate" title={value}>
      {value || "—"}
    </span>
  </div>
);

const ResultModal = ({ type, title, message, onClose }) => {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? "bg-green-100" : "bg-red-100"}`}>
          {isSuccess ? (
            <FaCheckCircle className="text-green-500 text-5xl" />
          ) : (
            <FaTimesCircle className="text-red-500 text-5xl" />
          )}
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isSuccess ? "text-green-700" : "text-red-700"}`}>
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <button
          onClick={onClose}
          className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
        >
          Aceptar
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ClientView;