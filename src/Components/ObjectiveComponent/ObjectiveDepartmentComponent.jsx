import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import DateInput from "../LittleComponents/DateInput";
import { motion } from "framer-motion";
import { FaTimesCircle, FaBullseye, FaBoxOpen, FaChartLine, FaShoppingCart, FaTimes } from "react-icons/fa";

const ObjectiveDepartmentComponent = ({ item, setViewMode, setSelectedRegion, setSelectedLyne, date1, date2 }) => {
  const [objectiveData, setObjectiveData] = useState([]);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, startDate, endDate, categoria: "", ciudad: "" });
  const [salesData, setSalesData] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [paymentFilterActive, setPaymentActive] = useState(false);
  const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "numberOfBoxes" || name === "saleLastYear1" ? Number(value) : value });
  };

  const initialFormData = { ciudad: "", categoria: "", numberOfBoxes: "", saleLastYear1: "", startDate: "", endDate: "" };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/sales/objective/id",
        {
          region: formData.ciudad,
          lyne: formData.categoria,
          numberOfBoxes: formData.numberOfBoxes,
          saleLastYear: formData.saleLastYear1,
          id: formData.ciudad + formData.numberOfBoxes,
          id_owner: user,
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchObjectiveDataRegion();
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

  const fetchObjectiveDataRegion = async (customFilters) => {
    if (!item?.region) return;
    setLoading(true);
    const filters = { region: item.region, salesId: "", id_owner: user, payStatus: "", startDate: date1, endDate: date2, ...customFilters };
    try {
      const response = await axios.post(API_URL + "/whatsapp/order/objective/region/id", filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setObjectiveData(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id",
        { userId: user, page: 1, id_owner: user, limit: 1000 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const applyFilters = () => {
    const customFilters = {};
    if (selectedPayment) customFilters.payStatus = selectedPayment;
    fetchObjectiveDataRegion(customFilters);
  };

useEffect(() => {
    fetchCategories();
    fetchObjectiveDataRegion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilter = (type) => {
    if (type === "date") {
      setStartDate("");
      setEndDate("");
      setSelectedPayment("");
      setDateFilterActive(false);
      setPaymentActive(false);
    }
  };

  const totalObjetivo = objectiveData.reduce((s, i) => s + (i.objective || 0), 0);
  const totalVendido = objectiveData.reduce((s, i) => s + (i.totalCajas || 0), 0);
  const totalAA = objectiveData.reduce((s, i) => s + (i.saleLastYear || 0), 0);
  const totalPorVender = objectiveData.reduce((s, i) => s + ((i.objective - i.totalCajas) || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Objetivos regionales</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {item?.region ? `Región: ${item.region}` : "Detalle por línea de producto"}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 self-start"
          >
            + Nuevo objetivo
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="app-select"
            >
              <option value="">Filtrar por</option>
              <option value="payment">Estado de pago</option>
              <option value="date">Fecha</option>
            </select>

            {selectedFilter === "date" && (
              <div className="flex flex-wrap gap-2 items-end">
                <DateInput value={startDate} onChange={setStartDate} label="Desde" />
                <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Hasta" />
                <button
                  onClick={() => { applyFilters(); setDateFilterActive(true); }}
                  className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <HiFilter size={14} /> Aplicar
                </button>
              </div>
            )}

            {selectedFilter === "payment" && (
              <div className="flex gap-2 items-end">
                <select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="app-select"
                >
                  <option value="">Todos</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
                <button
                  onClick={() => { applyFilters(); setPaymentActive(true); }}
                  className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <HiFilter size={14} /> Aplicar
                </button>
              </div>
            )}
          </div>

          {(dateFilterActive || paymentFilterActive) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {dateFilterActive && (
                <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                  {startDate} → {endDate}
                  <button onClick={() => clearFilter("date")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
              {paymentFilterActive && (
                <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                  {selectedPayment}
                  <button onClick={() => clearFilter("date")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <DeptSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={<FaBullseye />} label="Objetivo" value={totalObjetivo.toFixed(0)} color="bg-blue-100 text-blue-700" />
              <StatCard icon={<FaShoppingCart />} label="Venta acumulada" value={totalVendido.toFixed(0)} color="bg-green-100 text-green-700" />
              <StatCard icon={<FaChartLine />} label="Venta año pasado" value={totalAA.toFixed(0)} color="bg-yellow-100 text-yellow-700" />
              <StatCard icon={<FaBoxOpen />} label="Por vender" value={totalPorVender.toFixed(0)} color="bg-red-100 text-red-700" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Objetivos nacionales</h2>
                <p className="text-xs text-gray-500 mt-0.5">Rendimiento consolidado por línea</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                    <tr>
                      {["Región", "Línea", "Objetivo", "Vta AA", "Vta acum", "VS AA", "VS Obj", "Tendencia", "Por vender"].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {objectiveData.length > 0 ? objectiveData.map((row) => {
                      const vsAA = ((row.totalCajas / row.saleLastYear) * 100).toFixed(2);
                      const vsObj = ((row.totalCajas / row.objective) * 100).toFixed(2);
                      const vsObjNum = parseFloat(vsObj);
                      return (
                        <tr
                          key={row._id}
                          onClick={() => { setSelectedRegion(row.region); setSelectedLyne(row.categoria); setViewMode("sales"); }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.region}</td>
                          <td className="px-4 py-3 text-gray-700">{row.categoria}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{row.objective}</td>
                          <td className="px-4 py-3 text-gray-700">{row.saleLastYear}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{row.totalCajas}</td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">{vsAA}%</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${vsObjNum >= 100 ? "bg-green-100 text-green-700" : vsObjNum >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {vsObj}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{((row.totalCajas / 14) * 31).toFixed(2)}</td>
                          <td className="px-4 py-3 font-bold text-[#D3423E]">{(row.objective - row.totalCajas).toFixed(2)}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="9" className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaTimesCircle className="text-5xl mb-3 text-gray-300" />
                            <p className="text-lg font-semibold text-gray-700">No hay datos disponibles</p>
                            <p className="text-sm text-gray-400 mt-1">Ajusta los filtros e intenta nuevamente</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {objectiveData.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900">
                      <tr>
                        <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                        <td className="px-4 py-3">{totalObjetivo.toFixed(2)}</td>
                        <td className="px-4 py-3">{totalAA.toFixed(2)}</td>
                        <td className="px-4 py-3">{totalVendido.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            {(objectiveData.reduce((s, i) => s + ((i.totalCajas / i.saleLastYear) * 100), 0) / objectiveData.length).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                            {(objectiveData.reduce((s, i) => s + ((i.totalCajas / i.objective) * 100), 0) / objectiveData.length).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(objectiveData.reduce((s, i) => s + ((i.totalCajas / 14) * 31), 0) / objectiveData.length).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-[#D3423E]">{totalPorVender.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Nuevo objetivo</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Cajas</label>
                <input
                  type="number"
                  name="numberOfBoxes"
                  value={formData.numberOfBoxes}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Venta año pasado</label>
                <input
                  type="number"
                  name="saleLastYear1"
                  value={formData.saleLastYear1}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Fecha inicial</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Fecha final</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="app-select"
                >
                  <option value="">Selecciona una categoría</option>
                  {Array.isArray(salesData) && salesData.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.categoria || !formData.numberOfBoxes || !formData.saleLastYear1 || !formData.startDate || !formData.endDate}
                className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase rounded-xl transition ${!formData.categoria || !formData.numberOfBoxes || !formData.saleLastYear1 || !formData.startDate || !formData.endDate ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#D3423E] text-white hover:bg-red-700"}`}
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showObjectiveErrorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowObjectiveErrorModal(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <FaTimesCircle className="text-[#D3423E]" size={44} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Error al crear objetivo</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Ocurrió un problema al guardar los datos. Intenta nuevamente.</p>
            <button
              onClick={() => setShowObjectiveErrorModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#D3423E] hover:bg-red-700 transition"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
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

const DeptSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
          <SBox className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SBox className="h-2.5 w-20" />
            <SBox className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 space-y-1.5">
        <SBox className="h-5 w-48" />
        <SBox className="h-3 w-36" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 border-b border-gray-200">
            <tr>
              {[...Array(9)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <SBox className="h-3 w-16" style={{ background: "#d1d5db" }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.15 }}>
                <td className="px-4 py-4"><SBox className="h-4 w-24" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-20" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-12" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-12" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-12" /></td>
                <td className="px-4 py-4"><SBox className="h-6 w-16 rounded-full" /></td>
                <td className="px-4 py-4"><SBox className="h-6 w-16 rounded-full" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-16" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

export default ObjectiveDepartmentComponent;