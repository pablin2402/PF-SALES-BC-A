import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import Spinner from "../LittleComponents/Spinner";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";

const ObjectiveSalesDetailComponent = ({ region, lyne, date1, date2 }) => {
    const [objectiveData, setObjectiveData] = useState([]);
    const [dateFilterActive, setDateFilterActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, startDate, endDate, categoria: "", ciudad: "", salesMan: "" });
    const [salesData, setSalesData] = useState("");
    const [selectedPayment, setSelectedPayment] = useState("");
    const [paymentFilterActive, setPaymentActive] = useState(false);
    const [vendedores, setVendedores] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [setItems] = useState();
    const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "numberOfBoxes" ? Number(value) : value,
            [name]: name === "saleLastYear1" ? Number(value) : value
        });
    };
    const handleSubmit = async () => {
        try {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            endDate.setDate(endDate.getDate() + 1);

            const response = await axios.post(
                API_URL + "/whatsapp/sales/objective/sales",
                {
                    region: formData.ciudad,
                    lyne: formData.categoria,
                    numberOfBoxes: formData.numberOfBoxes,
                    saleLastYear: formData.saleLastYear1,
                    id: formData.ciudad + formData.numberOfBoxes,
                    id_owner: user,
                    startDate: startDate,
                    endDate: endDate,
                    salesManId: formData.salesMan
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                fetchObjectiveDataRegion();
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
            id_owner:user,
            lyne,
            page: pageNumber,
            limit: itemsPerPage,
            startDate: date1 || customFilters.startDate,
            endDate: date2 || customFilters.endDate,
            ...customFilters 
        };
    
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/objective/region/product", filters, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setObjectiveData(response.data.data);
            setTotalPages(response.data.pages);
            setItems(response.data.total);

        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/category/id",
                {
                    userId: user,
                    page: 1,
                    id_owner: user,
                    limit: 1000,
                }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSalesData(response.data.data);

        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
    const applyFilters = () => {
        const customFilters = {};
    
        const start = new Date(startDate);
        const end = new Date(endDate);
        const min = new Date(date1);
        const max = new Date(date2);
    
        if (startDate && endDate) {
            if (start < min || end > max) {
                return;
            }
            customFilters.startDate = startDate + "T00:00:00.000Z";
            customFilters.endDate = endDate + "T23:59:59.999Z";
        }
    
        if (selectedFilter === "payment" && !selectedPayment) {
            return;
        }
        if (selectedFilter === "payment" && selectedPayment === "") {
            setDateFilterActive(false);
            setPaymentActive(false);
            fetchObjectiveDataRegion(1); 
            return;
        }
        if (selectedPayment) {
            customFilters.payStatus = selectedPayment;
        }
    
        fetchObjectiveDataRegion(1, customFilters);
    };
    
    const fetchVendedores = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
                {
                    id_owner: user
                }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setVendedores(response.data.data);
        } catch (error) {
            console.error("Error obteniendo vendedores", error);
            setVendedores([]);
        }
    };
    useEffect(() => {
        fetchCategories();
        fetchObjectiveDataRegion(page);
        fetchVendedores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, itemsPerPage]);
    const clearFilter = (type) => {
        if (type === "date") {
            setStartDate("");
            setEndDate("");
            setDateFilterActive(false);
            setSelectedFilter("");
        } else if (type === "pay") {
            setSelectedPayment("");
            setPaymentActive(false);
            setSelectedFilter("");

        }
    };
   return (
  <div className="min-h-screen bg-[#F8F8FA] p-4 md:p-6 rounded-[32px]">
    {loading ? (
      <Spinner />
    ) : (
      <div className="space-y-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#1E1E1E] tracking-tight">
              Objetivos de venta
            </h1>
            <p className="text-gray-500 mt-1 text-base">
              Gestiona y monitorea el cumplimiento de objetivos por región y producto
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#D3423E] hover:bg-[#B8322F] text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-red-200 transition-all duration-300 flex items-center gap-2"
          >
            + Nuevo Objetivo
          </button>
        </div>

        <div className="bg-white rounded-[28px] border border-[#ECECEC] shadow-sm p-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-2 block">
                Fecha inicio
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-3 text-gray-700 focus:outline-none focus:border-[#D3423E]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-2 block">
                Fecha final
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-3 text-gray-700 focus:outline-none focus:border-[#D3423E]"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-2 block">
                Estado de pago
              </label>

              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-3 text-gray-700 focus:outline-none focus:border-[#D3423E]"
              >
                <option value="">Todos</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full bg-[#D3423E] hover:bg-[#BC312E] text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 transition"
              >
                <HiFilter size={20} />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-[#ECECEC] shadow-sm overflow-hidden">

          <div className="px-8 py-6 border-b border-[#F0F0F0]">
            <h2 className="text-2xl font-black text-[#1F1F1F]">
              Objetivos por región
            </h2>

            <p className="text-gray-500 mt-1">
              Detalle de avance por ciudad
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#FAFAFA] border-b border-[#EEEEEE]">
                <tr className="text-sm text-gray-500 uppercase">

                  <th className="px-6 py-5 text-left font-bold">
                    Región
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Línea
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Producto
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Pedido
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Vendedor
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Fecha
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Botellas
                  </th>

                  <th className="px-6 py-5 text-left font-bold">
                    Cajas
                  </th>
                </tr>
              </thead>

              <tbody>
                {objectiveData.length > 0 ? (
                  objectiveData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#F5F5F5] hover:bg-[#FFF5F5] transition"
                    >

                      <td className="px-6 py-5">
                        <div className="font-bold text-[#1F1F1F]">
                          {region}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="bg-red-50 text-[#D3423E] px-3 py-1 rounded-full text-xs font-bold">
                          {item.categoria}
                        </span>
                      </td>

                      <td className="px-6 py-5 font-semibold text-gray-800">
                        {item.productName}
                      </td>

                      <td className="px-6 py-5 text-gray-700 font-semibold">
                        #{item.receiveNumber}
                      </td>

                      <td className="px-6 py-5 text-gray-700">
                        {item.salesFullName} {item.salesLastName}
                      </td>

                      <td className="px-6 py-5 text-gray-500 text-sm">
                        {item.creationDate
                          ? new Date(item.creationDate).toLocaleDateString("es-ES")
                          : ""}
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-bold text-[#1F1F1F]">
                          {item.totalBotellas}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-black text-[#D3423E] text-lg">
                          {item.cantidadVendida.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-20 text-center">

                      <div className="flex flex-col items-center">

                        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                          <FaTimesCircle
                            size={40}
                            className="text-[#D3423E]"
                          />
                        </div>

                        <h3 className="text-2xl font-black text-gray-700">
                          No se encontraron resultados
                        </h3>

                        <p className="text-gray-500 mt-2">
                          Ajusta los filtros e intenta nuevamente
                        </p>
                      </div>

                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot className="bg-[#FAFAFA] border-t border-[#EEEEEE]">
                <tr>

                  <td className="px-6 py-5 font-black text-[#1F1F1F]">
                    TOTAL
                  </td>

                  <td colSpan="5"></td>

                  <td className="px-6 py-5 font-black text-[#1F1F1F]">
                    {objectiveData
                      .reduce(
                        (sum, item) => sum + (item.totalBotellas || 0),
                        0
                      )
                      .toFixed(2)}
                  </td>

                  <td className="px-6 py-5 font-black text-[#D3423E] text-lg">
                    {objectiveData
                      .reduce(
                        (sum, item) => sum + (item.cantidadVendida || 0),
                        0
                      )
                      .toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

]          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-[#F0F0F0]">

              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">
                  Ítems por página
                </span>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const selectedValue = Number(e.target.value);
                    setItemsPerPage(selectedValue);
                    setPage(1);
                    fetchObjectiveDataRegion(1);
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2 bg-white"
                >
                  {[5, 10, 20].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={() =>
                    setPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={page === 1}
                  className="w-11 h-11 rounded-xl border border-red-200 text-[#D3423E] font-bold hover:bg-red-50 transition disabled:opacity-40"
                >
                  ◀
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(page - 2, 0),
                    Math.min(page + 1, totalPages)
                  )
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-11 h-11 rounded-xl font-bold transition ${
                        page === p
                          ? "bg-[#D3423E] text-white shadow-lg shadow-red-200"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-red-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                <button
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={page === totalPages}
                  className="w-11 h-11 rounded-xl border border-red-200 text-[#D3423E] font-bold hover:bg-red-50 transition disabled:opacity-40"
                >
                  ▶
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {modalOpen && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden"
        >

          <div className="bg-[#D3423E] px-8 py-6 flex items-center justify-between">

            <div>
              <h2 className="text-3xl font-black text-white">
                Nuevo objetivo
              </h2>

              <p className="text-red-100 mt-1">
                Configura un nuevo objetivo comercial
              </p>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-2xl font-bold transition"
            >
              ×
            </button>
          </div>

          <div className="p-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Categoría
                </label>

                <select
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-4 focus:outline-none focus:border-[#D3423E]"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                >
                  <option value="">Seleccione</option>

                  {salesData.map((categoria) => (
                    <option
                      key={categoria._id}
                      value={categoria.categoryName}
                    >
                      {categoria.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Ciudad
                </label>

                <select
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-4 focus:outline-none focus:border-[#D3423E]"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                >
                  <option value="">Seleccione</option>
                  <option value="TOTAL CBB">Cochabamba</option>
                  <option value="TOTAL SC">Santa Cruz</option>
                  <option value="TOTAL LP">La Paz</option>
                  <option value="TOTAL OR">Oruro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Número de cajas
                </label>

                <input
                  type="number"
                  name="numberOfBoxes"
                  value={formData.numberOfBoxes}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-4 focus:outline-none focus:border-[#D3423E]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Venta año pasado
                </label>

                <input
                  type="number"
                  name="saleLastYear1"
                  value={formData.saleLastYear1}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-4 focus:outline-none focus:border-[#D3423E]"
                />
              </div>

            </div>

            <button
              onClick={handleSubmit}
              className="mt-8 w-full bg-[#D3423E] hover:bg-[#BA2F2C] text-white py-4 rounded-2xl text-lg font-black shadow-xl shadow-red-100 transition"
            >
              Guardar objetivo
            </button>

          </div>
        </motion.div>
      </div>
    )}
  </div>
);
};

export default ObjectiveSalesDetailComponent;
