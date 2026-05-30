import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";
import {
  FaUsers, FaEnvelope, FaPhone, FaMapMarkerAlt, FaKey,
  FaTimes, FaEye, FaEyeSlash, FaUserTie,
  FaToggleOn, FaToggleOff, FaFileExport, FaSort, FaSortUp, FaSortDown, FaSearch, FaExclamationTriangle, FaRedo, FaCity,
} from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { SkeletonCards, SkeletonTable, SkeletonStats } from "../utils/SkeletonLoading";
import { ModernPagination } from "../utils/ModernPagination";

import { ActionsMenu, PasswordStrength, ConfirmModal, ResultModal } from "../utils/Modal";
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

const REGION_LABELS = {
  "TOTAL CBB": "Cochabamba",
  "TOTAL SC": "Santa Cruz",
  "TOTAL LP": "La Paz",
  "TOTAL OR": "Oruro",
};


const SalesManView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ email: "", newPassword: "" });
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [togglingId, setTogglingId] = useState(null);
  const [, setExporting] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const searchTimeoutRef = useRef(null);

  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/list/id",
        {
          id_owner: user,
          page: pageNumber,
          limit: itemsPerPage,
          searchTerm: searchTerm,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.items || response.data.data?.length || 0);
    } catch (error) {
      console.error("Error fetching salesmen:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [user, token, itemsPerPage, searchTerm]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchInput]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  const handleToggleConfirmed = async (newStatus, id) => {
    setTogglingId(id);
    try {
      await axios.put(
        API_URL + "/whatsapp/salesman/status",
        { _id: id, active: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData((prev) =>
        prev.map((s) => (s._id === id ? { ...s, active: newStatus } : s))
      );
    } catch (error) {
      console.error("Error al cambiar estado", error);
      setErrorMessage("No se pudo cambiar el estado del vendedor");
      setShowErrorModal(true);
    } finally {
      setTogglingId(null);
      setConfirmToggle(null);
    }
  };

  const requestToggle = (salesman) => {
    if (salesman.active) {
      setConfirmToggle(salesman);
    } else {
      handleToggleConfirmed(true, salesman._id);
    }
  };

  const goToClientDetails = (client) => {
    navigate(`/sales/${client._id}`, { state: { client } });
  };

  const getInitials = (name, lastName) => {
    const firstInitial = name?.charAt(0).toUpperCase() || "";
    const lastInitial = lastName?.charAt(0).toUpperCase() || "";
    return firstInitial + lastInitial || "?";
  };

  const getColor = (name, lastName) => {
    const hash = ((name || "") + (lastName || ""))
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validatePassword = (password) => {
    if (password.length < 6) return "Mínimo 6 caracteres";
    return null;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.email || !formData.newPassword) {
      setErrorMessage("Completa todos los campos");
      setShowErrorModal(true);
      return;
    }

    const pwError = validatePassword(formData.newPassword);
    if (pwError) {
      setErrorMessage(pwError);
      setShowErrorModal(true);
      return;
    }

    setSubmittingPassword(true);
    try {
      await axios.put(
        API_URL + "/whatsapp/password",
        { email: formData.email, newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      setFormData({ email: "", newPassword: "" });
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cambiar la contraseña. Verifica el correo.");
      setShowErrorModal(true);
    } finally {
      setSubmittingPassword(false);
    }
  };

  const openPasswordModal = (salesman) => {
    setSelectedSalesman(salesman);
    setFormData({ email: salesman?.email || "", newPassword: "" });
    setShowEditModal(true);
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/list/id",
        {
          id_owner: user,
          page: 1,
          limit: 10000,
          searchTerm: "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allData = response.data.data || [];
      if (!allData.length) {
        setExporting(false);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(
        allData.map((s) => ({
          Nombre: `${s.fullName || ""} ${s.lastName || ""}`.trim(),
          Correo: s.email || "",
          Teléfono: s.phoneNumber || "",
          Ciudad: REGION_LABELS[s.region] || s.region || "",
          Estado: s.active ? "Activo" : "Inactivo",
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vendedores");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([buf], { type: "application/octet-stream" }),
        `Vendedores_${new Date().toISOString().slice(0, 10)}.xlsx`
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

  const availableRegions = useMemo(() => {
    const set = new Set();
    salesData.forEach((s) => s.region && set.add(s.region));
    return Array.from(set);
  }, [salesData]);

  const filteredAndSorted = useMemo(() => {
    return salesData
      .filter((s) => {
        if (statusFilter === "active" && !s.active) return false;
        if (statusFilter === "inactive" && s.active) return false;
        if (regionFilter !== "all" && s.region !== regionFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let valA, valB;
        switch (sortBy) {
          case "name":
            valA = `${a.fullName || ""} ${a.lastName || ""}`.toLowerCase();
            valB = `${b.fullName || ""} ${b.lastName || ""}`.toLowerCase();
            break;
          case "email":
            valA = (a.email || "").toLowerCase();
            valB = (b.email || "").toLowerCase();
            break;
          case "region":
            valA = (a.region || "").toLowerCase();
            valB = (b.region || "").toLowerCase();
            break;
          default:
            return 0;
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [salesData, statusFilter, regionFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: salesData.length,
    active: salesData.filter((s) => s.active).length,
    inactive: salesData.filter((s) => !s.active).length,
    regions: new Set(salesData.map((s) => s.region).filter(Boolean)).size,
  }), [salesData]);

  const hasActiveFilters = statusFilter !== "all" || regionFilter !== "all" || searchInput !== "";

  const clearAllFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setRegionFilter("all");
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
            <FaUserTie className="text-[#D3423E]" size={22} />
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                Personal de Ventas
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gestiona tu equipo de vendedores
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
            <PrincipalBUtton onClick={() => navigate("/sales/create")} icon={IoPersonAdd}>
              Nuevo Vendedor
            </PrincipalBUtton>
          </div>
        </div>

        {loading && salesData.length === 0 ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Total"
              value={stats.total}
              icon={<FaUsers />}
              color="bg-gray-100 text-gray-700"
              onClick={() => setStatusFilter("all")}
              active={statusFilter === "all"}
            />
            <StatCard
              label="Activos"
              value={stats.active}
              icon={<FaToggleOn />}
              color="bg-green-100 text-green-700"
              onClick={() => setStatusFilter("active")}
              active={statusFilter === "active"}
            />
            <StatCard
              label="Inactivos"
              value={stats.inactive}
              icon={<FaToggleOff />}
              color="bg-red-100 text-red-700"
              onClick={() => setStatusFilter("inactive")}
              active={statusFilter === "inactive"}
            />
            <StatCard
              label="Ciudades"
              value={stats.regions}
              icon={<FaMapMarkerAlt />}
              color="bg-blue-100 text-blue-700"
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
                  placeholder="Buscar vendedor por nombre..."
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
                  <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="app-select"
                  >
                    <option value="all">Todas las ciudades</option>
                    {availableRegions.map((r) => (
                      <option key={r} value={r}>{REGION_LABELS[r] || r}</option>
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
                    {statusFilter !== "all" && (
                      <FilterChip
                        label={statusFilter === "active" ? "Solo activos" : "Solo inactivos"}
                        onRemove={() => setStatusFilter("all")}
                      />
                    )}
                    {regionFilter !== "all" && (
                      <FilterChip
                        label={REGION_LABELS[regionFilter] || regionFilter}
                        onRemove={() => setRegionFilter("all")}
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
            viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />
          ) : filteredAndSorted.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClear={clearAllFilters}
              onCreate={() => navigate("/sales/create")}
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
                            onClick={() => handleSort("email")}
                          >
                            <div className="flex items-center gap-1">Correo {getSortIcon("email")}</div>
                          </th>
                          <th className="px-4 py-3 font-bold">Teléfono</th>
                          <th
                            className="px-4 py-3 font-bold cursor-pointer hover:text-[#D3423E] select-none"
                            onClick={() => handleSort("region")}
                          >
                            <div className="flex items-center gap-1">Ciudad {getSortIcon("region")}</div>
                          </th>
                          <th className="px-4 py-3 font-bold text-center">Estado</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {filteredAndSorted.map((item, idx) => (
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
                                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-sm relative ${getColor(item.fullName, item.lastName)}`}
                                >
                                  {getInitials(item.fullName, item.lastName)}
                                  <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${item.active ? "bg-green-500" : "bg-gray-400"}`}
                                  ></span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-bold text-gray-900">
                                  {item.fullName} {item.lastName}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-gray-700">
                                <a
                                  href={`mailto:${item.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-[#D3423E] transition-colors"
                                >
                                  {item.email || "-"}
                                </a>
                              </td>
                              <td className="px-4 py-4 text-gray-700">
                                {item.phoneNumber ? (
                                  <a
                                    href={`tel:${item.phoneNumber}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-[#D3423E] transition-colors flex items-center gap-1"
                                  >
                                    <FaPhone size={10} className="text-gray-400" />
                                    {item.phoneNumber}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {item.region ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                                    <FaMapMarkerAlt size={9} />
                                    {REGION_LABELS[item.region] || item.region}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">Sin ciudad</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  className={`relative inline-flex items-center ${togglingId === item._id ? "cursor-wait opacity-50" : "cursor-pointer"}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={item.active}
                                    disabled={togglingId === item._id}
                                    onChange={() => requestToggle(item)}
                                  />
                                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-300 relative">
                                    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5 shadow-sm"></div>
                                  </div>
                                </label>
                              </td>
                              <td className="px-4 py-4">
                                <ActionsMenu
                                  onPassword={(e) => { e.stopPropagation(); openPasswordModal(item); }}
                                  onView={(e) => { e.stopPropagation(); goToClientDetails(item); }}
                                  onToggle={(e) => { e.stopPropagation(); requestToggle(item); }}
                                  isActive={item.active}
                                />
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
                    {filteredAndSorted.map((item, idx) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        onClick={() => goToClientDetails(item)}
                        className={`bg-white border-2 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${item.active ? "border-gray-200 hover:border-gray-300" : "border-gray-200 opacity-75"}`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 relative ${getColor(item.fullName, item.lastName)}`}
                          >
                            {getInitials(item.fullName, item.lastName)}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${item.active ? "bg-green-500" : "bg-gray-400"}`}
                            ></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {item.fullName} {item.lastName}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${item.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-green-500" : "bg-gray-400"}`}></span>
                              {item.active ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <ActionsMenu
                            onPassword={(e) => { e.stopPropagation(); openPasswordModal(item); }}
                            onView={(e) => { e.stopPropagation(); goToClientDetails(item); }}
                            onToggle={(e) => { e.stopPropagation(); requestToggle(item); }}
                            isActive={item.active}
                          />
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600">
                          {item.email && (
                            <p className="flex items-center gap-2 truncate">
                              <FaEnvelope className="text-gray-400 flex-shrink-0" size={11} />
                              <span className="truncate">{item.email}</span>
                            </p>
                          )}
                          {item.phoneNumber && (
                            <p className="flex items-center gap-2">
                              <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
                              {item.phoneNumber}
                            </p>
                          )}
                          {item.region && (
                            <p className="flex items-center gap-2">
                              <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" size={11} />
                              {REGION_LABELS[item.region] || item.region}
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

          {!loading && filteredAndSorted.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                  Mostrando <strong className="text-gray-900">{filteredAndSorted.length}</strong> de{" "}
                  <strong className="text-gray-900">{items}</strong> vendedores
                </span>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="font-semibold">
                    Mostrar:
                  </label>
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
        {confirmToggle && (
          <ConfirmModal
            title="¿Desactivar vendedor?"
            message={`¿Estás seguro de que quieres desactivar a ${confirmToggle.fullName} ${confirmToggle.lastName}? No podrá acceder al sistema hasta que vuelvas a activarlo.`}
            confirmText="Desactivar"
            confirmColor="red"
            loading={togglingId === confirmToggle._id}
            onCancel={() => setConfirmToggle(null)}
            onConfirm={() => handleToggleConfirmed(false, confirmToggle._id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <FaKey />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Cambiar contraseña</h3>
                    {selectedSalesman && (
                      <p className="text-xs text-red-100">
                        {selectedSalesman.fullName} {selectedSalesman.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="email" className="text-xs font-bold text-gray-600 uppercase block mb-1.5">
                    Correo del vendedor <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      placeholder="ejemplo@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="text-xs font-bold text-gray-600 uppercase block mb-1.5">
                    Nueva contraseña <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  {formData.newPassword && (
                    <div className="mt-2">
                      <PasswordStrength password={formData.newPassword} />
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Importante:</strong> El vendedor deberá iniciar sesión con esta nueva contraseña.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors flex items-center justify-center gap-2 ${submittingPassword ? "bg-gray-300 cursor-not-allowed" : "bg-[#D3423E] hover:bg-red-700"}`}
                  >
                    {submittingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                        Cambiando...
                      </>
                    ) : (
                      "Cambiar"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessModal && (
          <ResultModal
            type="success"
            title="¡Contraseña cambiada!"
            message="La contraseña se actualizó correctamente."
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



const EmptyState = ({ hasFilters, onClear, onCreate }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FaUserTie className="text-gray-300 text-3xl" />
    </div>
    <p className="text-gray-700 font-bold text-base">
      {hasFilters ? "Sin resultados" : "Sin vendedores"}
    </p>
    <p className="text-sm text-gray-500 mt-1 max-w-md">
      {hasFilters
        ? "No encontramos vendedores con los filtros actuales. Intenta ajustarlos o limpiarlos."
        : "Comienza agregando tu primer vendedor para gestionar tu equipo de ventas."}
    </p>
    <div className="flex gap-2 mt-5">
      {hasFilters ? (
        <button
          onClick={onClear}
          className="px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <FaRedo size={11} /> Limpiar filtros
        </button>
      ) : (
        <button
          onClick={onCreate}
          className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <IoPersonAdd /> Agregar vendedor
        </button>
      )}
    </div>
  </div>
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





export default SalesManView;