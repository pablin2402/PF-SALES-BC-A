import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";
import { FaUserShield, FaSearch, FaEnvelope, FaPhone, FaCity, FaMapMarkerAlt, FaFileExport, FaTimes, FaCrown, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { SkeletonCards, SkeletonTable, SkeletonStats } from "../utils/SkeletonLoading"

const COLOR_CLASSES = [
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-indigo-500 to-indigo-700',
  'bg-gradient-to-br from-blue-500 to-blue-700',
  'bg-gradient-to-br from-pink-500 to-pink-700',
  'bg-gradient-to-br from-red-500 to-red-700',
  'bg-gradient-to-br from-teal-500 to-teal-700',
  'bg-gradient-to-br from-orange-500 to-orange-700',
  'bg-gradient-to-br from-green-500 to-green-700'
];

const AdminView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [regionFilter, setRegionFilter] = useState("all");

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_URL + "/whatsapp/administrator/list",
        { id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Error al cargar administradores");
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getInitials = (name, lastName) => {
    return ((name?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  };

  const getColor = (name, lastName) => {
    const hash = ((name || '') + (lastName || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
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

  const exportToExcel = () => {
    if (!salesData.length) return;
    const ws = XLSX.utils.json_to_sheet(
      salesData.map(item => ({
        "Nombre": `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.trim(),
        "Correo": item.salesId?.email || "",
        "Teléfono": item.salesId?.phoneNumber || "",
        "Ciudad": item.salesId?.region || ""
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Administradores");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }),
      `Administradores_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const filteredAndSorted = salesData.filter(item => {
    const fullName = `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.toLowerCase();
    const email = (item.salesId?.email || "").toLowerCase();
    const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === "all" || item.salesId?.region === regionFilter;
    return matchesSearch && matchesRegion;
  })
    .sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "name":
          valA = `${a.salesId?.fullName || ""} ${a.salesId?.lastName || ""}`.toLowerCase();
          valB = `${b.salesId?.fullName || ""} ${b.salesId?.lastName || ""}`.toLowerCase();
          break;
        case "email":
          valA = (a.salesId?.email || "").toLowerCase();
          valB = (b.salesId?.email || "").toLowerCase();
          break;
        case "region":
          valA = (a.salesId?.region || "").toLowerCase();
          valB = (b.salesId?.region || "").toLowerCase();
          break;
        default: return 0;
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const allRegions = [...new Set(salesData.map(item => item.salesId?.region).filter(Boolean))];

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FaUserShield className="text-[#D3423E]" />
              Personal de Administración
            </h1>
            <p className="text-sm text-gray-500">Equipo de administradores con acceso al sistema</p>
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
            <PrincipalBUtton onClick={() => navigate("/admin/create")} icon={IoPersonAdd}>
              Nuevo Administrador
            </PrincipalBUtton>
          </div>
        </div>
        {loading && salesData.length === 0 ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <StatCard
              label="Total administradores"
              value={salesData.length}
              icon={<FaUserShield />}
              color="bg-purple-100 text-purple-700"
            />
            <StatCard
              label="Ciudades"
              value={allRegions.length}
              icon={<FaCity />}
              color="bg-blue-100 text-blue-700"
            />
            <StatCard
              label="Con email registrado"
              value={salesData.filter(s => s.salesId?.email).length}
              icon={<FaEnvelope />}
              color="bg-green-100 text-green-700"
            />
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">

              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar vendedor por nombre..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {allRegions.length > 0 && (
                <div className="relative">
                  <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="app-select"
                  >
                    <option value="all">Todas las ciudades</option>
                    {allRegions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              {regionFilter !== "all" && (
                <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                  {regionFilter}
                  <button onClick={() => setRegionFilter("all")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
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
            viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaUserShield className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-semibold">Sin administradores</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || regionFilter !== "all" ? "Ajusta los filtros para ver resultados" : "Agrega tu primer administrador"}
              </p>
              {!searchTerm && regionFilter === "all" && (
                <button
                  onClick={() => navigate("/admin/create")}
                  className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <IoPersonAdd /> Agregar administrador
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                {viewMode === "table" && (
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
                          <th className="px-4 py-3 font-semibold text-center">Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSorted.map((item) => (
                          <tr
                            key={item._id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="relative">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getColor(item.salesId?.fullName, item.salesId?.lastName)}`}>
                                  {getInitials(item.salesId?.fullName, item.salesId?.lastName)}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                  <FaCrown className="text-yellow-700" size={9} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-bold text-gray-900">{item.salesId?.fullName} {item.salesId?.lastName}</p>
                            </td>
                            <td className="px-4 py-4 text-gray-700">
                              {item.salesId?.email ? (

                                <a href={`mailto:${item.salesId.email}`}
                                  className="hover:text-[#D3423E] transition-colors flex items-center gap-1.5"
                                >
                                  <FaEnvelope size={10} className="text-gray-400" />
                                  {item.salesId.email}
                                </a>
                              ) : "-"}
                            </td>
                            <td className="px-4 py-4 text-gray-700">
                              {item.salesId?.phoneNumber ? (

                                <a href={`tel:${item.salesId.phoneNumber}`}
                                  className="hover:text-[#D3423E] transition-colors flex items-center gap-1.5"
                                >
                                  <FaPhone size={10} className="text-gray-400" />
                                  {item.salesId.phoneNumber}
                                </a>
                              ) : "-"}
                            </td>
                            <td className="px-4 py-4">
                              {item.salesId?.region ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                                  <FaMapMarkerAlt size={9} />
                                  {item.salesId.region}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Sin ciudad</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                                <FaUserShield size={9} />
                                ADMIN
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {(viewMode === "cards" || (viewMode === "table" && filteredAndSorted.length > 0)) && (
                <div className={viewMode === "cards" ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "lg:hidden p-4 space-y-3"}>
                  {filteredAndSorted.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getColor(item.salesId?.fullName, item.salesId?.lastName)}`}>
                            {getInitials(item.salesId?.fullName, item.salesId?.lastName)}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                            <FaCrown className="text-yellow-700" size={9} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.salesId?.fullName} {item.salesId?.lastName}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold mt-1">
                            <FaUserShield size={8} /> ADMINISTRADOR
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600">
                        {item.salesId?.email && (
                          <a href={`mailto:${item.salesId.email}`} className="flex items-center gap-2 truncate hover:text-[#D3423E] transition-colors">
                            <FaEnvelope className="text-gray-400 flex-shrink-0" size={11} />
                            <span className="truncate">{item.salesId.email}</span>
                          </a>
                        )}
                        {item.salesId?.phoneNumber && (
                          <a href={`tel:${item.salesId.phoneNumber}`} className="flex items-center gap-2 hover:text-[#D3423E] transition-colors">
                            <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
                            {item.salesId.phoneNumber}
                          </a>
                        )}
                        {item.salesId?.region && (
                          <p className="flex items-center gap-2">
                            <FaCity className="text-gray-400 flex-shrink-0" size={11} />
                            {item.salesId.region}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {!loading && filteredAndSorted.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Mostrando <strong className="text-gray-900">{filteredAndSorted.length}</strong> de <strong className="text-gray-900">{salesData.length}</strong> administradores
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);


export default AdminView;