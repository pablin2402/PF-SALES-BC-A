import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { HiFilter } from "react-icons/hi";
import { FiTrash2, FiEdit2, FiChevronRight, FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimesCircle,
  FaBullseye,
  FaPlus,
  FaHome,
} from "react-icons/fa";

import ObjectiveDepartmentComponent from "../Components/ObjectiveComponent/ObjectiveDepartmentComponent";
import ObjectiveSalesDetailComponent from "../Components/ObjectiveComponent/ObjectiveSalesDetailComponent";
import DateInput from "../Components/LittleComponents/DateInput";


const Pill = ({ children, color = "gray" }) => {
  const palette = {
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-[#D3423E] border-red-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${palette[color]}`}
    >
      {children}
    </span>
  );
};

const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const ObjectiveTableSkeleton = ({ cols = 14 }) => {
  const widths = [
    "w-20", "w-20", "w-24", "w-16", "w-12",
    "w-12", "w-16", "w-14", "w-16", "w-16",
    "w-16", "w-14", "w-12", "w-10",
  ];

  return (
    <>
      {[...Array(6)].map((_, rowIdx) => (
        <tr
          key={rowIdx}
          className="border-b border-gray-50"
          style={{ opacity: 1 - rowIdx * 0.12 }}
        >
          {[...Array(cols)].map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              {colIdx === cols - 1 ? (
                <div className="flex gap-1">
                  <SBox className="w-7 h-7 rounded-lg" />
                  <SBox className="w-7 h-7 rounded-lg" />
                </div>
              ) : colIdx === 8 ? (
                <SBox className="h-6 w-14 rounded-full" />
              ) : (
                <SBox className={`h-4 ${widths[colIdx] || "w-16"}`} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
const advanceColor = (pct) => {
  if (pct >= 100) return "green";
  if (pct >= 70) return "amber";
  return "red";
};

const ObjectiveRegionalsView = () => {
  const [salesData, setSalesData] = useState([]);
  const [salesNationalData, setSalesNationaData] = useState([]);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditModal1, setShowEditModal1] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("card");
  const [selectedItem, setSelectedItem] = useState(null);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    numberOfBoxes: 0,
    saleLastYear1: 0,
    region: "",
    startDate,
    endDate,
    ciudad: "",
  });
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedLyne, setSelectedLyne] = useState(null);
  const [objective, setObjective] = useState(0);
  const [role, setRole] = useState("");
  const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);

  const [saleLastYear, setSaleLastYear] = useState(0);
  const [objective1, setObjective1] = useState(0);
  const [saleLastYear1, setSaleLastYear1] = useState(0);
  const [id, setId] = useState("");
  const [id1, setId1] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const isAdmin = role === "ADMIN";
  const applyFilters = () => {
    const customFilters = {};
    if (startDate && endDate) {
      customFilters.startDate = startDate;
      customFilters.endDate = endDate;
    }
    fetchProducts(customFilters);
    fetchSalesNational(customFilters);
  };

  const fetchProducts = async (customFilters) => {
    setLoading(true);
    const filters = { id_owner: user, ...customFilters };
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/objective/region/order",
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesNational = async (customFilters) => {
    setLoading(true);
    try {
      const filters = { id_owner: user, ...customFilters };
      const response = await axios.post(
        API_URL + "/whatsapp/sales/objective/national",
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesNationaData(response.data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSalesNational();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilter = (type) => {
    if (type === "date") {
      setStartDate("");
      setEndDate("");
      setDateFilterActive(false);
    }
    fetchProducts(1);
  };

  const initialFormData = {
    ciudad: "",
    numberOfBoxes: "",
    saleLastYear1: "",
    startDate: "",
    endDate: "",
    region: "",
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/objective/regional",
        {
          region: formData.ciudad,
          lyne: "GENERAL",
          objective: formData.numberOfBoxes,
          saleLastYear: formData.saleLastYear1,
          acumulateSales: 0,
          currentSaleVsSameMonthLastYear: 0,
          saleVsEstablishedObjectiveMonth: 0,
          date: null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          id: formData.region + formData.numberOfBoxes,
          id_owner: user,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchProducts();
        setFormData(initialFormData);
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setShowObjectiveErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "numberOfBoxes" || name === "saleLastYear1"
          ? Number(value)
          : value,
    }));
  };

  const uploadProducts = async () => {
    try {
      const response = await axios.put(
        API_URL + "/whatsapp/order/objective/region/product",
        {
          _id: id,
          id_owner: user,
          saleLastYear: saleLastYear,
          objective: objective,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchProducts(1);
        setShowEditModal(false);
        setSaleLastYear(0);
        setObjective(0);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  const deleteObjective = async (id2) => {
    try {
      const response = await axios.delete(
        API_URL + "/whatsapp/order/objective/region/product",
        { data: { _id: id2, id_owner: user } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchProducts(1);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  const uploadProducts1 = async () => {
    try {
      const response = await axios.put(
        API_URL + "/whatsapp/order/objective/product",
        {
          _id: id1,
          id_owner: user,
          saleLastYear: saleLastYear1,
          numberOfBoxes: objective1,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchSalesNational();
        setShowEditModal(false);
        setShowEditModal1(false);
        setSaleLastYear(0);
        setObjective(0);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  const deleteObjective1 = async (id2) => {
    try {
      const response = await axios.delete(
        API_URL + "/whatsapp/order/objective/product",
        { data: { _id: id2, id_owner: user } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchProducts(1);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  const totalObjetivo = salesData.reduce((s, i) => s + (i.objetivo || 0), 0);
  const totalVtaAA = salesData.reduce((s, i) => s + (i.saleLastYear || 0), 0);
  const totalVendido = salesData.reduce((s, i) => s + (i.cajasVendidas || 0), 0);
  const avanceProm = totalObjetivo > 0 ? (totalVendido / totalObjetivo) * 100 : 0;
  const porVender = totalObjetivo - totalVendido;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Objetivos de venta
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona y monitorea el cumplimiento de objetivos por región y producto
          </p>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center flex-wrap gap-1 text-sm">
            <li>
              <button
                onClick={() => setViewMode("card")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${viewMode === "card"
                  ? "bg-red-50 text-[#D3423E] font-bold"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <FaHome size={11} />
                Nacional
              </button>
            </li>
            <FiChevronRight className="text-gray-400" size={14} />
            <li>
              <button
                onClick={() => selectedItem && setViewMode("form")}
                disabled={!selectedItem}
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === "form"
                  ? "bg-red-50 text-[#D3423E] font-bold"
                  : selectedItem
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-400 cursor-not-allowed"
                  }`}
              >
                Regional
              </button>
            </li>
            <FiChevronRight className="text-gray-400" size={14} />
            <li>
              <span
                className={`px-3 py-1.5 rounded-lg ${viewMode === "sales"
                  ? "bg-red-50 text-[#D3423E] font-bold"
                  : "text-gray-400"
                  }`}
              >
                Productos por categoría
              </span>
            </li>
          </ol>
        </motion.nav>

        {viewMode === "card" ? (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <DateInput
                      value={startDate}
                      onChange={setStartDate}
                      label="Fecha de Inicio"
                    />
                  </div>
                  <div className="flex-1">
                    <DateInput
                      value={endDate}
                      onChange={setEndDate}
                      min={startDate}
                      label="Fecha Final"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      applyFilters();
                      setDateFilterActive(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D3423E] text-white text-sm font-bold rounded-xl
                               hover:bg-[#bb3330] transition active:scale-[0.98] shadow-sm"
                  >
                    <HiFilter size={16} />
                    Filtrar
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#D3423E] text-[#D3423E]
                                 text-sm font-bold rounded-xl hover:bg-red-50 transition active:scale-[0.98]"
                    >
                      <FaPlus size={12} />
                      Nuevo Objetivo
                    </button>
                  )}
                </div>
              </div>

              {dateFilterActive && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-2 bg-red-50 text-[#D3423E] border border-red-100
                                   px-3 py-1 rounded-full text-xs font-bold">
                    {startDate} → {endDate}
                    <button
                      onClick={() => clearFilter("date")}
                      className="hover:text-red-700 transition"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
            </motion.div>
            {!loading && salesData.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Objetivo total", value: totalObjetivo, color: "bg-blue-100 text-blue-700" },
                  { label: "Venta acumulada", value: totalVendido.toFixed(2), color: "bg-green-100 text-green-700" },
                  { label: "Venta año pasado", value: totalVtaAA, color: "bg-yellow-100 text-yellow-700" },
                  { label: "Por vender", value: porVender.toFixed(2), color: "bg-red-100 text-red-700" },
                ].map((card) => (
                  <div key={card.label} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                      <FaBullseye size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{card.label}</p>
                      <p className="text-xl font-bold text-gray-900 truncate">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8"
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Objetivos por región</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Detalle de avance por ciudad
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                 <thead className="bg-gray-200 border-b border-gray-200">
                    <tr>
                      {[
                        "Inicio", "Fin", "Región", "Línea", "Objetivo",
                        "VTA AA", "VTA ACUM", "VS AA", "VS OBJ", "Tendencia",
                        "Por vender", "% Avance", "Proy.", "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <ObjectiveTableSkeleton cols={14} />
                    ) : salesData.length > 0 ? (
                      salesData.map((item) => {
                        const vsObj = (item.cajasVendidas / item.objetivo) * 100 || 0;
                        return (
                          <tr
                            key={item._id}
                            onClick={() => {
                              setViewMode("form");
                              setSelectedItem(item);
                            }}
className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"                          >
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {item.startDate
                                ? new Date(item.startDate)
                                  .toISOString()
                                  .slice(0, 10)
                                  .split("-")
                                  .reverse()
                                  .join("/")
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {item.endDate
                                ? new Date(item.endDate)
                                  .toISOString()
                                  .slice(0, 10)
                                  .split("-")
                                  .reverse()
                                  .join("/")
                                : "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {item.region}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.lyne}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">
                              {item.objetivo}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.saleLastYear}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {item.cajasVendidas.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {((item.cajasVendidas / item.saleLastYear) * 100).toFixed(2)}%
                            </td>
                            <td className="px-4 py-3">
                              <Pill color={advanceColor(vsObj)}>
                                {vsObj.toFixed(1)}%
                              </Pill>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {((item.cajasVendidas / 14) * 31).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {(item.objetivo - item.cajasVendidas).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{vsObj.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-gray-700">
                              {((item.cajasVendidas / item.saleLastYear) * 100).toFixed(2)}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowEditModal(true);
                                      setId(item._id || "");
                                      setObjective(item.objetivo || "");
                                      setSaleLastYear(item.saleLastYear || "");
                                    }}
                                    className="p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                                    title="Editar"
                                  >
                                    <FiEdit2 size={15} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteObjective(item._id || "");
                                    }}
                                    className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-[#D3423E] rounded-lg transition"
                                    title="Eliminar"
                                  >
                                    <FiTrash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FiSearch size={36} className="mb-3" />
                            <p className="text-base font-semibold text-gray-700">
                              No se encontraron coincidencias
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Intenta ajustar los filtros
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {salesData.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-100">
                        <td className="px-4 py-3" colSpan={4}>TOTAL</td>
                        <td className="px-4 py-3">{totalObjetivo}</td>
                        <td className="px-4 py-3">{totalVtaAA}</td>
                        <td className="px-4 py-3">{totalVendido.toFixed(2)}</td>
                        <td className="px-4 py-3" colSpan={7}>
                          <Pill color={advanceColor(avanceProm)}>
                            Avance {avanceProm.toFixed(1)}%
                          </Pill>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Objetivos a nivel nacional</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vista consolidada por línea de producto
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                 <thead className="bg-gray-200 border-b border-gray-200">
                    <tr>
                      {[
                        "Inicio", "Fin", "Línea", "Objetivo", "VTA AA",
                        "VTA ACUM", "VS AA", "VS OBJ", "Tendencia", "Por vender", "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                 <tbody>
                    {loading ? (
                      <ObjectiveTableSkeleton cols={11} />
                    ) : salesNationalData.length > 0 ? (
                      salesNationalData.map((item) => {
                        const vsObj = (item.cajasVendidas / item.objetivo) * 100 || 0;
                        return (
                          <tr
                            key={item._id + item.saleLastYear}
className="border-b border-gray-100 hover:bg-gray-50 transition-colors"                          >
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {item.startDate
                                ? new Date(item.startDate)
                                  .toISOString()
                                  .slice(0, 10)
                                  .split("-")
                                  .reverse()
                                  .join("/")
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {item.endDate
                                ? new Date(item.endDate)
                                  .toISOString()
                                  .slice(0, 10)
                                  .split("-")
                                  .reverse()
                                  .join("/")
                                : "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {item.lyne}
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900">
                              {item.objetivo}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.saleLastYear}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {item.cajasVendidas.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {((item.cajasVendidas / item.saleLastYear) * 100).toFixed(2)}%
                            </td>
                            <td className="px-4 py-3">
                              <Pill color={advanceColor(vsObj)}>{vsObj.toFixed(1)}%</Pill>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {((item.cajasVendidas / 14) * 31).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {(item.objetivo - item.cajasVendidas).toFixed(2)}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowEditModal(true);
                                      setShowEditModal1(true);
                                      setId1(item._id || "");
                                      setObjective1(item.objetivo || "");
                                      setSaleLastYear1(item.saleLastYear || "");
                                    }}
                                    className="p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                                    title="Editar"
                                  >
                                    <FiEdit2 size={15} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteObjective1(item._id || "");
                                    }}
                                    className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-[#D3423E] rounded-lg transition"
                                    title="Eliminar"
                                  >
                                    <FiTrash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FiSearch size={36} className="mb-3" />
                            <p className="text-base font-semibold text-gray-700">
                              No se encontraron coincidencias
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Intenta ajustar los filtros
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        ) : viewMode === "form" ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <ObjectiveDepartmentComponent
              item={selectedItem}
              setViewMode={setViewMode}
              setSelectedRegion={setSelectedRegion}
              setSelectedLyne={setSelectedLyne}
              date1={startDate}
              date2={endDate}
            />
          </div>
        ) : viewMode === "sales" ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <ObjectiveSalesDetailComponent
              region={selectedRegion}
              lyne={selectedLyne}
              date1={startDate}
              date2={endDate}
            />
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FaBullseye className="text-[#D3423E]" size={18} />
                  <h2 className="text-lg font-bold text-gray-900">Nuevo objetivo de venta</h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
                >
                  ×
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Número de cajas
                  </label>
                  <input
                    type="number"
                    name="numberOfBoxes"
                    value={formData.numberOfBoxes}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Venta año pasado
                  </label>
                  <input
                    type="number"
                    name="saleLastYear1"
                    value={formData.saleLastYear1}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha inicial
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha final
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Ciudad
                  </label>
                  <select
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    required
                      className="app-select"

                  >
                    <option value="">Seleccione una ciudad</option>
                    <option value="TOTAL CBB">Cochabamba</option>
                    <option value="TOTAL SC">Santa Cruz</option>
                    <option value="TOTAL LP">La Paz</option>
                    <option value="TOTAL OR">Oruro</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl
                             hover:bg-gray-100 transition active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !formData.ciudad ||
                    !formData.numberOfBoxes ||
                    !formData.saleLastYear1 ||
                    !formData.startDate ||
                    !formData.endDate
                  }
                  className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase rounded-xl transition active:scale-[0.98] ${!formData.ciudad ||
                    !formData.numberOfBoxes ||
                    !formData.saleLastYear1 ||
                    !formData.startDate ||
                    !formData.endDate
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#D3423E] text-white hover:bg-[#bb3330] shadow-sm hover:shadow-md"
                    }`}
                >
                  Insertar objetivo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiEdit2 className="text-[#D3423E]" size={16} />
                  <h2 className="text-lg font-bold text-gray-900">
                    {showEditModal1 ? "Actualizar objetivo por línea" : "Actualizar objetivo"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setShowEditModal1(false);
                  }}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
                >
                  ×
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Objetivo
                  </label>
                  <input
                    type="number"
                    value={showEditModal1 ? objective1 : objective}
                    onChange={(e) =>
                      showEditModal1
                        ? setObjective1(e.target.value)
                        : setObjective(e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Venta año anterior
                  </label>
                  <input
                    type="number"
                    value={showEditModal1 ? saleLastYear1 : saleLastYear}
                    onChange={(e) =>
                      showEditModal1
                        ? setSaleLastYear1(e.target.value)
                        : setSaleLastYear(e.target.value)
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setShowEditModal1(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl
                             hover:bg-gray-100 transition active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={showEditModal1 ? uploadProducts1 : uploadProducts}
                  className="flex-1 px-4 py-2.5 bg-[#D3423E] text-white text-sm font-bold uppercase rounded-xl
                             hover:bg-[#bb3330] transition active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showObjectiveErrorModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <FaTimesCircle className="text-[#D3423E]" size={44} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Error al crear el objetivo
              </h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                Ocurrió un problema al guardar los datos. Intenta nuevamente.
              </p>
              <button
                onClick={() => setShowObjectiveErrorModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#D3423E]
                           hover:bg-[#bb3330] transition active:scale-[0.98]"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ObjectiveRegionalsView;