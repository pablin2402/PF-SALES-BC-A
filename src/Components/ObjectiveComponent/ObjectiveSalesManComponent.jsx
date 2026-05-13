import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";
import {
  FaTimesCircle,
  FaBullseye,
  FaChartLine,
  FaBoxOpen,
  FaUsers,
  FaPercent,
  FaPlus,
  FaUserTie,
  FaSearch,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import DateInput from "../LittleComponents/DateInput";
import Spinner from "../LittleComponents/Spinner";

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition"
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: iconBg }}
    >
      <Icon size={20} style={{ color: iconColor }} />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-xs text-gray-500 font-medium truncate">{label}</span>
      <span className="text-xl font-bold text-gray-900 leading-tight truncate">
        {value}
      </span>
    </div>
  </motion.div>
);

const advanceColor = (pct) => {
  if (pct >= 100) return { bar: "#16a34a", bg: "bg-green-50", text: "text-green-700" };
  if (pct >= 70) return { bar: "#d97706", bg: "bg-amber-50", text: "text-amber-700" };
  return { bar: "#D3423E", bg: "bg-red-50", text: "text-[#D3423E]" };
};

const ProgressBar = ({ value }) => {
  const pct = Math.max(0, Math.min(value, 100));
  const c = advanceColor(value);
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold ${c.text}`}>
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-2 rounded-full"
          style={{ backgroundColor: c.bar }}
        />
      </div>
    </div>
  );
};


const ObjectiveSalesManComponent = ({ region }) => {
  const [objectiveData, setObjectiveData] = useState([]);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    numberOfBoxes: 0,
    saleLastYear1: 0,
    startDate,
    endDate,
    categoria: "",
    ciudad: "",
    salesMan: "",
  });
  const [salesData, setSalesData] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [paymentFilterActive, setPaymentActive] = useState(false);
  const [saleActive, setActiveSaler] = useState(false);
  const [role, setRole] = useState("");
  const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);

  const [vendedores, setVendedores] = useState([]);
  const [salesmen, setSalesmen] = useState({});
  const [selectedSaler, setSelectedSaler] = useState("");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const isAdmin = role === "ADMIN";
  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

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

  const initialFormData = {
    ciudad: "",
    categoria: "",
    numberOfBoxes: "",
    saleLastYear1: "",
    startDate: "",
    endDate: "",
    salesMan: "",
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/objective/sales",
        {
          region: formData.ciudad,
          lyne: formData.categoria,
          numberOfBoxes: formData.numberOfBoxes,
          saleLastYear: formData.saleLastYear1,
          id: formData.ciudad + formData.numberOfBoxes,
          id_owner: user,
          startDate: formData.startDate,
          endDate: formData.endDate,
          salesManId: formData.salesMan,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchObjectiveDataRegion();
        setModalOpen(false);
        setFormData(initialFormData);
      }
    } catch (err) {
      console.error(err);
      setShowObjectiveErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesmenByIds = async (ids) => {
    if (!ids.length) return;
    try {
      const res = await axios.post(
        API_URL + "/whatsapp/salesman/multiple",
        { ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const map = {};
      res.data.forEach(({ _id, fullName, lastName }) => {
        map[_id] = { fullName, lastName };
      });
      setSalesmen(map);
    } catch (error) {
      console.error("Error fetching salesmen:", error);
    }
  };

  const fetchObjectiveDataRegion = async (customFilters = {}) => {
    setLoading(true);
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDayDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;

    const filters = { region, startDate: firstDay, endDate: lastDay, ...customFilters };

    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/objective/list",
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      setObjectiveData(data);
      const uniqueIds = [
        ...new Set(data.map((item) => item.salesManId || item._id).filter(Boolean)),
      ];
      await fetchSalesmenByIds(uniqueIds);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/category/id",
        { userId: user, page: 1, id_owner: user, limit: 1000 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.data);
    } catch (error) {}
  };

  const applyFilters = () => {
    const customFilters = {};
    if (startDate && endDate) {
      customFilters.startDate = startDate;
      customFilters.endDate = endDate;
    }
    if (selectedPayment) customFilters.payStatus = selectedPayment;
    if (selectedSaler) customFilters.salesManId = selectedSaler;
    fetchObjectiveDataRegion(customFilters);
  };

  const fetchVendedores = async () => {
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/list/id",
        { id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendedores(response.data.data);
    } catch (error) {
      console.error("Error obteniendo vendedores", error);
      setVendedores([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchObjectiveDataRegion();
    fetchVendedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setSelectedPayment("");
    setSelectedSaler("");
    setDateFilterActive(false);
    setPaymentActive(false);
    setActiveSaler(false);
    fetchObjectiveDataRegion();
  };

  const totalObjetivo = objectiveData.reduce((s, i) => s + (i.numberOfBoxes || 0), 0);
  const totalVtaAA = objectiveData.reduce((s, i) => s + (i.saleLastYear || 0), 0);
  const totalCajas = objectiveData.reduce((s, i) => s + (i.caja || 0), 0);
  const avancePromedio = totalObjetivo > 0 ? (totalCajas / totalObjetivo) * 100 : 0;
  const vendedoresActivos = new Set(
    objectiveData.map((i) => i.salesManId || i._id).filter(Boolean)
  ).size;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <FaUserTie className="text-[#D3423E]" size={18} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            Objetivos por vendedor
          </h2>
          <p className="text-sm text-gray-500">
            Avance mensual de cada vendedor en{" "}
            <span className="font-semibold text-gray-700">{region}</span>
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={FaBullseye}
              label="Objetivo total"
              value={totalObjetivo.toFixed(0)}
              iconBg="#eff6ff"
              iconColor="#2563eb"
            />
            <StatCard
              icon={FaChartLine}
              label="Vta. año anterior"
              value={totalVtaAA.toFixed(0)}
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <StatCard
              icon={FaBoxOpen}
              label="Vta. acumulada"
              value={totalCajas.toFixed(0)}
              iconBg="#dcfce7"
              iconColor="#16a34a"
            />
            <StatCard
              icon={FaPercent}
              label="Avance promedio"
              value={avancePromedio.toFixed(1) + "%"}
              iconBg="#f3e8ff"
              iconColor="#9333ea"
            />
            <StatCard
              icon={FaUsers}
              label="Vendedores activos"
              value={vendedoresActivos}
              iconBg="#fee2e2"
              iconColor="#D3423E"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="flex flex-col gap-1.5 min-w-[180px]">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Tipo de filtro
                  </label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                  >
                    <option value="">Selecciona filtro</option>
                    <option value="all">Todos</option>
                    <option value="date">Por fecha</option>
                    <option value="payment">Estado de pago</option>
                    <option value="saller">Vendedor</option>
                  </select>
                </div>

                {selectedFilter === "date" && (
                  <>
                    <div className="flex-1 min-w-[140px]">
                      <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />
                    </div>
                  </>
                )}

                {selectedFilter === "payment" && (
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Estado
                    </label>
                    <select
                      value={selectedPayment}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                                 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                    >
                      <option value="">Selecciona un estado</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                )}

                {selectedFilter === "saller" && (
                  <div className="flex flex-col gap-1.5 min-w-[220px]">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Vendedor
                    </label>
                    <select
                      value={selectedSaler}
                      onChange={(e) => setSelectedSaler(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                                 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                    >
                      <option value="">Seleccione un vendedor</option>
                      {vendedores.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.fullName} {v.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedFilter && (
                  <button
                    onClick={() => {
                      if (selectedFilter === "all") {
                        clearFilter();
                      } else {
                        applyFilters();
                        if (selectedFilter === "date") setDateFilterActive(true);
                        if (selectedFilter === "payment") setPaymentActive(true);
                        if (selectedFilter === "saller") setActiveSaler(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D3423E] text-white text-sm font-bold rounded-xl
                               hover:bg-[#bb3330] transition active:scale-[0.98] shadow-sm"
                  >
                    <HiFilter size={16} />
                    Filtrar
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700
                               text-sm font-bold rounded-xl hover:bg-gray-50 transition active:scale-[0.98]"
                    title="Exportar"
                  >
                    <FaFileExport size={14} />
                    Exportar
                  </button>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D3423E] text-white text-sm font-bold rounded-xl
                               hover:bg-[#bb3330] transition active:scale-[0.98] shadow-sm"
                  >
                    <FaPlus size={12} />
                    Nuevo Objetivo
                  </button>
                </div>
              )}
            </div>

            {(dateFilterActive || paymentFilterActive || saleActive) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                {dateFilterActive && (
                  <span className="inline-flex items-center gap-2 bg-red-50 text-[#D3423E] border border-red-100
                                   px-3 py-1 rounded-full text-xs font-bold">
                    {startDate} → {endDate}
                    <button onClick={clearFilter} className="hover:text-red-700 transition">×</button>
                  </span>
                )}
                {paymentFilterActive && (
                  <span className="inline-flex items-center gap-2 bg-red-50 text-[#D3423E] border border-red-100
                                   px-3 py-1 rounded-full text-xs font-bold">
                    Pago: {selectedPayment}
                    <button onClick={clearFilter} className="hover:text-red-700 transition">×</button>
                  </span>
                )}
                {saleActive && selectedSaler && (
                  <span className="inline-flex items-center gap-2 bg-red-50 text-[#D3423E] border border-red-100
                                   px-3 py-1 rounded-full text-xs font-bold">
                    Vendedor: {vendedores.find((v) => v._id === selectedSaler)?.fullName}{" "}
                    {vendedores.find((v) => v._id === selectedSaler)?.lastName}
                    <button onClick={clearFilter} className="hover:text-red-700 transition">×</button>
                  </span>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Inicio", "Fin", "Región", "Línea", "Objetivo",
                      "VTA AA", "VTA ACUM", "VS AA", "VS OBJ", "Vendedor", "Progreso",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {objectiveData.length > 0 ? (
                    objectiveData.map((item) => {
                      const salesman = salesmen[item.salesManId || item._id];
                      const vsObj = (item.caja / item.numberOfBoxes) * 100 || 0;
                      const vsAA = (item.caja / item.saleLastYear) * 100 || 0;
                      const colorObj = advanceColor(vsObj);
                      return (
                        <tr
                          key={item.objetivoId || item._id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {item.startDate
                              ? new Date(item.startDate).toISOString().slice(0, 10).split("-").reverse().join("/")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {item.endDate
                              ? new Date(item.endDate).toISOString().slice(0, 10).split("-").reverse().join("/")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{region}</td>
                          <td className="px-4 py-3 text-gray-700">{item.lyne}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{item.numberOfBoxes}</td>
                          <td className="px-4 py-3 text-gray-700">{item.saleLastYear}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{item.caja.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-700">{vsAA.toFixed(2)}%</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-transparent ${colorObj.bg} ${colorObj.text}`}>
                              {vsObj.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {salesman ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-[11px] font-bold text-[#D3423E]">
                                  {salesman.fullName?.[0]}{salesman.lastName?.[0]}
                                </div>
                                <span className="font-medium text-gray-900">
                                  {salesman.fullName} {salesman.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Sin vendedor</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <ProgressBar value={vsObj} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FaSearch size={32} className="mb-3" />
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
                {objectiveData.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-100">
                      <td className="px-4 py-3" colSpan={4}>TOTAL</td>
                      <td className="px-4 py-3">{totalObjetivo.toFixed(0)}</td>
                      <td className="px-4 py-3">{totalVtaAA.toFixed(0)}</td>
                      <td className="px-4 py-3">{totalCajas.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {(
                          objectiveData.reduce((s, i) => s + ((i.caja / i.saleLastYear) * 100 || 0), 0) /
                          objectiveData.length
                        ).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${advanceColor(avancePromedio).bg} ${advanceColor(avancePromedio).text}`}>
                          {avancePromedio.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </motion.div>
        </>
      )}

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
              className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <FaBullseye className="text-[#D3423E]" size={18} />
                  <h2 className="text-lg font-bold text-gray-900">
                    Nuevo objetivo de venta
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
                >
                  ×
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Categoría
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                  >
                    <option value="">Seleccione una categoría</option>
                    {salesData.map((c) => (
                      <option key={c._id} value={c.categoryName}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Ciudad
                  </label>
                  <select
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                  >
                    <option value="">Seleccione una ciudad</option>
                    <option value="TOTAL CBB">Cochabamba</option>
                    <option value="TOTAL SC">Santa Cruz</option>
                    <option value="TOTAL LP">La Paz</option>
                    <option value="TOTAL OR">Oruro</option>
                  </select>
                </div>

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
                    Vendedor
                  </label>
                  <select
                    name="salesMan"
                    value={formData.salesMan}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                  >
                    <option value="">Seleccione un vendedor</option>
                    {vendedores.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.fullName} {v.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
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
                    !formData.categoria ||
                    !formData.ciudad ||
                    !formData.numberOfBoxes ||
                    !formData.saleLastYear1 ||
                    !formData.startDate ||
                    !formData.endDate
                  }
                  className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase rounded-xl transition active:scale-[0.98] ${
                    !formData.categoria ||
                    !formData.ciudad ||
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

export default ObjectiveSalesManComponent;