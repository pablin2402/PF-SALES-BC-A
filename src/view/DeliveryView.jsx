import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { FaUsers, FaEllipsisV, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTimes, FaEye, FaToggleOn, FaToggleOff, FaCity, FaSort, FaSortUp, FaSortDown, FaMotorcycle } from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLOR_CLASSES = [
  'bg-gradient-to-br from-orange-500 to-orange-700',
  'bg-gradient-to-br from-blue-500 to-blue-700',
  'bg-gradient-to-br from-green-500 to-green-700',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-yellow-500 to-orange-600',
  'bg-gradient-to-br from-pink-500 to-pink-700',
  'bg-gradient-to-br from-indigo-500 to-indigo-700',
  'bg-gradient-to-br from-teal-500 to-teal-700'
];

const DeliveryView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const getInitials = (fullName, lastName) => {
    return ((fullName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  };

  const getColor = (fullName, lastName) => {
    const hash = ((fullName || '') + (lastName || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
  };

  const fetchDeliveryList = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        searchTerm: searchTerm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.items || response.data.data?.length || 0);
    } catch (error) {
      console.error("Error fetching delivery list:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, token, itemsPerPage]);

  useEffect(() => {
    const delay = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    fetchDeliveryList(page);
  }, [page, itemsPerPage, fetchDeliveryList]);

  const goToClientDetails = (client) => {
    navigate(`/deliver/${client._id}`, { state: { client, flag: false } });
  };

  const handleToggle = async (newStatus, id) => {
    setSalesData(prev => prev.map(s => s._id === id ? { ...s, active: newStatus } : s));
    try {
      await axios.put(API_URL + "/whatsapp/delivery/status", {
        _id: id,
        active: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error al cambiar estado", error);
      setSalesData(prev => prev.map(s => s._id === id ? { ...s, active: !newStatus } : s));
    }
  };

  const exportToExcel = async () => {
    if (!salesData.length) return;
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", {
        id_owner: user,
        page: 1,
        limit: items || 1000,
        searchTerm: searchTerm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allData = response.data.data || [];
      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => ({
          "Nombre": `${item.fullName || ""} ${item.lastName || ""}`.trim(),
          "Correo": item.email || "",
          "Teléfono": item.phoneNumber || "",
          "Dirección": item.client_location?.direction || "",
          "Ciudad": item.region || "",
          "Estado": item.active ? "Activo" : "Inactivo"
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Repartidores");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }),
        `Repartidores_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting:", error);
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
        default: return 0;
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
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FaMotorcycle className="text-[#D3423E]" />
              Personal de Reparto
            </h1>
            <p className="text-sm text-gray-500">Gestiona tu equipo de repartidores</p>
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
            <PrincipalBUtton onClick={() => navigate("/delivery/creation")} icon={IoPersonAdd}>
              Nuevo Repartidor
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
            icon={<FaCity />}
            color="bg-blue-100 text-blue-700"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <TextInputFilter
                value={searchTerm}
                onChange={setSearchTerm}
                onEnter={() => fetchDeliveryList(1)}
                placeholder="Buscar repartidor por nombre..."
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
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
              <p className="text-sm">Cargando repartidores...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaMotorcycle className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-semibold">Sin repartidores</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? "Intenta ajustar tu búsqueda" : "Agrega tu primer repartidor"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/delivery/creation")}
                  className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <IoPersonAdd /> Agregar repartidor
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-s text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3"></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Nombre {getSortIcon("name")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("email")}>
                      <div className="flex items-center gap-1">Correo {getSortIcon("email")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold">Dirección</th>
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
                        {item.email ? (
                          
                           <a href={`mailto:${item.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#D3423E] transition-colors"
                          >
                            {item.email}
                          </a>
                        ) : "-"}
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
                      <td className="px-4 py-4 text-gray-600 text-xs max-w-xs truncate">
                        {item.client_location?.direction || "-"}
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
                  className={`bg-white border-2 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${item.active ? 'border-gray-400 hover:border-gray-300' : 'border-gray-200 opacity-75'}`}
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
                    {item.client_location?.direction && (
                      <p className="flex items-start gap-2">
                        <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" size={11} />
                        <span className="line-clamp-2">{item.client_location.direction}</span>
                      </p>
                    )}
                    {item.region && (
                      <p className="flex items-center gap-2">
                        <FaCity className="text-gray-400 flex-shrink-0" size={11} />
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
                  Mostrando <strong className="text-gray-900">{filteredAndSorted.length}</strong> de <strong className="text-gray-900">{items}</strong> repartidores
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

const ActionsMenu = ({ onView, onToggle, isActive }) => {
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
            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { onView(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaEye className="text-blue-500" size={12} /> Ver detalles
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

export default DeliveryView;