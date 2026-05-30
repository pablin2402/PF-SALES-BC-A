import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import { motion } from "framer-motion";
import { FaTimesCircle, FaTimes } from "react-icons/fa";

const ObjectiveSalesDetailComponent = ({ region, lyne, date1, date2 }) => {
  const [objectiveData, setObjectiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, startDate: "", endDate: "", categoria: "", ciudad: "", salesMan: "" });
  const [salesData, setSalesData] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [paymentFilterActive, setPaymentActive] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "numberOfBoxes" || name === "saleLastYear1" ? Number(value) : value });
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
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          salesManId: formData.salesMan,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        fetchObjectiveDataRegion(1);
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setShowObjectiveErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectiveDataRegion = async (pageNumber, customFilters = {}) => {
    setLoading(true);
    const filters = {
      region,
      id_owner: user,
      lyne,
      page: pageNumber,
      limit: itemsPerPage,
      startDate: date1 || customFilters.startDate,
      endDate: date2 || customFilters.endDate,
      ...customFilters,
    };
    try {
      const response = await axios.post(API_URL + "/whatsapp/order/objective/region/product", filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setObjectiveData(response.data.data);
      setTotalPages(response.data.pages);
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

  const fetchVendedores = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
        { id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendedores(response.data.data);
    } catch (error) {
      setVendedores([]);
    }
  };

  const applyFilters = () => {
    const customFilters = {};
    if (startDate && endDate) {
      customFilters.startDate = startDate + "T00:00:00.000Z";
      customFilters.endDate = endDate + "T23:59:59.999Z";
      setDateFilterActive(true);
    }
    if (selectedPayment) {
      customFilters.payStatus = selectedPayment;
      setPaymentActive(true);
    }
    fetchObjectiveDataRegion(1, customFilters);
  };

  const clearFilter = (type) => {
    if (type === "date") {
      setStartDate("");
      setEndDate("");
      setDateFilterActive(false);
    }
    if (type === "pay") {
      setSelectedPayment("");
      setPaymentActive(false);
    }
    fetchObjectiveDataRegion(1);
  };

  useEffect(() => {
    fetchCategories();
    fetchObjectiveDataRegion(page);
    fetchVendedores();
  }, [page, itemsPerPage]);

  const totalBotellas = objectiveData.reduce((s, i) => s + (i.totalBotellas || 0), 0);
  const totalCajas = objectiveData.reduce((s, i) => s + (i.cantidadVendida || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle por producto</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {region && lyne ? `${region} · ${lyne}` : "Ventas por región y línea"}
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
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Hasta</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Estado de pago</label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
            <button
              onClick={applyFilters}
              className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <HiFilter size={14} /> Aplicar
            </button>
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
                  <button onClick={() => clearFilter("pay")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <SalesDetailSkeleton />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Objetivos por región</h2>
              <p className="text-xs text-gray-500 mt-0.5">Detalle de avance por ciudad</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                  <tr>
                    {["Región", "Línea", "Producto", "Pedido", "Vendedor", "Fecha", "Botellas", "Cajas"].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {objectiveData.length > 0 ? objectiveData.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{region}</td>
                      <td className="px-4 py-3">
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">{item.categoria}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">#{item.receiveNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{item.salesFullName} {item.salesLastName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{item.totalBotellas}</td>
                      <td className="px-4 py-3 font-bold text-[#D3423E]">{item.cantidadVendida.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FaTimesCircle className="text-5xl mb-3 text-gray-300" />
                          <p className="text-lg font-semibold text-gray-700">Sin resultados</p>
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
                      <td className="px-4 py-3" colSpan={4} />
                      <td className="px-4 py-3">{totalBotellas.toFixed(2)}</td>
                      <td className="px-4 py-3 text-[#D3423E]">{totalCajas.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#D3423E]"
                  >
                    {[5, 10, 20, 50].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                  >
                    ← Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(Math.max(page - 2, 0), Math.min(page + 1, totalPages))
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === p ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                  >
                    Siguiente →
                  </button>
                </nav>
              )}
            </div>
          </div>
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
                <label className="text-xs font-semibold text-gray-600 uppercase">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition appearance-none cursor-pointer"
                >
                  <option value="">Selecciona una categoría</option>
                  {Array.isArray(salesData) && salesData.map((cat) => (
                    <option key={cat._id} value={cat.categoryName}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Ciudad</label>
                <select
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition appearance-none cursor-pointer"
                >
                  <option value="">Selecciona una ciudad</option>
                  <option value="TOTAL CBB">Cochabamba</option>
                  <option value="TOTAL SC">Santa Cruz</option>
                  <option value="TOTAL LP">La Paz</option>
                  <option value="TOTAL OR">Oruro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Número de cajas</label>
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
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase">Vendedor</label>
                <select
                  name="salesMan"
                  value={formData.salesMan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition appearance-none cursor-pointer"
                >
                  <option value="">Todos los vendedores</option>
                  {vendedores.map((v) => (
                    <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
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
                disabled={!formData.categoria || !formData.ciudad || !formData.numberOfBoxes || !formData.saleLastYear1}
                className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase rounded-xl transition ${!formData.categoria || !formData.ciudad || !formData.numberOfBoxes || !formData.saleLastYear1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#D3423E] text-white hover:bg-red-700"}`}
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

const SalesDetailSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 space-y-1.5">
      <SBox className="h-5 w-48" />
      <SBox className="h-3 w-32" />
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b border-gray-200">
          <tr>
            {[...Array(8)].map((_, i) => (
              <th key={i} className="px-4 py-3">
                <SBox className="h-3 w-16" style={{ background: "#d1d5db" }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.13 }}>
              <td className="px-4 py-4"><SBox className="h-4 w-24" /></td>
              <td className="px-4 py-4"><SBox className="h-6 w-20 rounded-full" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-32" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-16" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-28" /></td>
              <td className="px-4 py-4"><SBox className="h-3 w-20" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-12" /></td>
              <td className="px-4 py-4"><SBox className="h-4 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
      <SBox className="h-4 w-32" />
      <SBox className="h-9 w-56 rounded-xl" />
    </div>
  </div>
);

export default ObjectiveSalesDetailComponent;