import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";
import { HiFilter } from "react-icons/hi";
import { FaSearch, FaUsers, FaChevronLeft, FaChevronRight, FaEllipsisV, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaKey, FaTimes, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash, FaUserTie, FaToggleOn, FaToggleOff, FaFileExport, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLOR_CLASSES = [
  'bg-gradient-to-br from-red-500 to-red-700',
  'bg-gradient-to-br from-blue-500 to-blue-700',
  'bg-gradient-to-br from-green-500 to-green-700',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-yellow-500 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-pink-700',
  'bg-gradient-to-br from-indigo-500 to-indigo-700',
  'bg-gradient-to-br from-teal-500 to-teal-700'
];

const SalesManView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ email: "", newPassword: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
        {
          id_owner: user,
          page: pageNumber,
          limit: itemsPerPage,
          searchTerm: searchTerm
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
    const delay = setTimeout(() => {
      setPage(1);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, itemsPerPage, fetchProducts]);

  const handleToggle = async (newStatus, id) => {
    try {
      await axios.put(API_URL + "/whatsapp/salesman/status", {
        _id: id,
        active: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(prev => prev.map(s => s._id === id ? { ...s, active: newStatus } : s));
    } catch (error) {
      console.error("Error al cambiar estado", error);
      setErrorMessage("No se pudo cambiar el estado del vendedor");
      setShowErrorModal(true);
    }
  };

  const goToClientDetails = (client) => {
    navigate(`/sales/${client._id}`, { state: { client } });
  };

  const getInitials = (name, lastName) => {
    const firstInitial = name?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial || '?';
  };

  const getColor = (name, lastName) => {
    const hash = ((name || '') + (lastName || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      await axios.put(API_URL + "/whatsapp/password",
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

  const exportToExcel = () => {
    if (!salesData.length) return;
    const ws = XLSX.utils.json_to_sheet(
      salesData.map(s => ({
        "Nombre": `${s.fullName || ""} ${s.lastName || ""}`.trim(),
        "Correo": s.email || "",
        "Teléfono": s.phoneNumber || "",
        "Ciudad": s.region || "",
        "Estado": s.active ? "Activo" : "Inactivo"
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendedores");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Vendedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    return sortOrder === "asc" ? <FaSortUp className="text-[#D3423E]" size={10} /> : <FaSortDown className="text-[#D3423E]" size={10} />;
  };

  const filteredAndSorted = salesData
    .filter(s => {
      if (statusFilter === "active") return s.active;
      if (statusFilter === "inactive") return !s.active;
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

  const stats = {
    total: salesData.length,
    active: salesData.filter(s => s.active).length,
    inactive: salesData.filter(s => !s.active).length,
    regions: new Set(salesData.map(s => s.region).filter(Boolean)).size
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FaUserTie className="text-[#D3423E]" />
              Personal de Ventas
            </h1>
            <p className="text-sm text-gray-500">Gestiona tu equipo de vendedores</p>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <TextInputFilter
                value={searchTerm}
                onChange={setSearchTerm}
                onEnter={() => fetchProducts(1)}
                placeholder="Buscar vendedor por nombre..."
              />
            </div>

            <div className="flex items-center gap-2">
              {statusFilter !== "all" && (
                <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                  {statusFilter === "active" ? "Solo activos" : "Solo inactivos"}
                  <button onClick={() => setStatusFilter("all")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "table" ? 'bg-white text-[#D3423E] shadow-sm' : 'text-gray-600'}`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === "cards" ? 'bg-white text-[#D3423E] shadow-sm' : 'text-gray-600'}`}
                >
                  Tarjetas
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
              <p className="text-sm">Cargando vendedores...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaUserTie className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-semibold">Sin vendedores</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? "Intenta ajustar tu búsqueda" : "Comienza agregando tu primer vendedor"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/sales/create")}
                  className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <IoPersonAdd /> Agregar vendedor
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3"></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nombre {getSortIcon("name")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("email")}>
                      <div className="flex items-center gap-1">Correo {getSortIcon("email")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("region")}>
                      <div className="flex items-center gap-1">Ciudad {getSortIcon("region")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold text-center">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => goToClientDetails(item)}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getColor(item.fullName, item.lastName)}`}>
                          {getInitials(item.fullName, item.lastName)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900">{item.fullName} {item.lastName}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        
                          <a href={`mailto:${item.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-[#D3423E] transition-colors"
                        >
                          {item.email || "-"}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {item.phoneNumber ? (
                          
                            <a href={`tel:${item.phoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#D3423E] transition-colors flex items-center gap-1"
                          >
                            <FaPhone size={10} className="text-gray-400" />
                            {item.phoneNumber}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-4">
                        {item.region ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                            <FaMapMarkerAlt size={9} />
                            {item.region}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin ciudad</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="relative inline-flex items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={item.active}
                            onChange={() => handleToggle(!item.active, item._id)}
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
                          onToggle={(e) => { e.stopPropagation(); handleToggle(!item.active, item._id); }}
                          isActive={item.active}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {(viewMode === "cards" || (viewMode === "table" && filteredAndSorted.length > 0)) && (
            <div className={viewMode === "cards" ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "lg:hidden p-4 space-y-3"}>
              {filteredAndSorted.map((item) => (
                <div
                  key={item._id}
                  onClick={() => goToClientDetails(item)}
                  className={`bg-white border-2 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${item.active ? 'border-gray-200 hover:border-gray-300' : 'border-gray-200 opacity-75'}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 ${getColor(item.fullName, item.lastName)}`}>
                      {getInitials(item.fullName, item.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.fullName} {item.lastName}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {item.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <ActionsMenu
                      onPassword={(e) => { e.stopPropagation(); openPasswordModal(item); }}
                      onView={(e) => { e.stopPropagation(); goToClientDetails(item); }}
                      onToggle={(e) => { e.stopPropagation(); handleToggle(!item.active, item._id); }}
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
                        {item.region}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredAndSorted.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                  Mostrando <strong className="text-gray-900">{filteredAndSorted.length}</strong> de <strong className="text-gray-900">{items}</strong> vendedores
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
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#D3423E]"
                  >
                    {[5, 10, 20, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {totalPages > 1 && searchTerm === "" && (
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPage(1)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                  >
                    1
                  </button>
                  {page > 3 && <span className="px-1 text-gray-400">…</span>}
                  {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                    .filter((p) => p > 1 && p < totalPages)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === p ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        {p}
                      </button>
                    ))}
                  {page < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}
                  {totalPages > 1 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                  >
                    Siguiente →
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>

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
                  <label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
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
                  <label htmlFor="newPassword" className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
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

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                  <strong>⚠️ Importante:</strong> El vendedor deberá iniciar sesión con esta nueva contraseña.
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
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${submittingPassword ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#D3423E] hover:bg-red-700'}`}
                  >
                    {submittingPassword ? 'Cambiando...' : 'Cambiar'}
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

const StatCard = ({ label, value, icon, color, onClick, active }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-3 text-left ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${active ? 'border-[#D3423E] ring-2 ring-red-100' : 'border-gray-200'}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </button>
);

const ActionsMenu = ({ onPassword, onView, onToggle, isActive }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FaEllipsisV className="text-gray-600" size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { onView(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaEye className="text-blue-500" size={12} /> Ver detalles
            </button>
            <button
              onClick={(e) => { onPassword(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaKey className="text-yellow-500" size={12} /> Cambiar contraseña
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={(e) => { onToggle(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              {isActive ? (
                <><FaToggleOff className="text-red-500" size={14} /> Desactivar</>
              ) : (
                <><FaToggleOn className="text-green-500" size={14} /> Activar</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte", "Excelente"];
  const colors = ["bg-red-500", "bg-red-400", "bg-yellow-400", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-500 font-semibold w-16 text-right">
        {labels[strength]}
      </span>
    </div>
  );
};

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
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSuccess ? (
            <FaCheckCircle className="text-green-500 text-5xl" />
          ) : (
            <FaTimesCircle className="text-red-500 text-5xl" />
          )}
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <button
          onClick={onClose}
          className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${isSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          Aceptar
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SalesManView;