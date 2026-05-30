import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import {
  FaChartLine,
  FaBoxOpen,
  FaTrophy,
  FaCalendarAlt,
  FaBrain,
  FaSearch,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import TrendLineChart from "../Components/charts/TrendLineChart";
import VentasChart from "../Components/charts/VentasChart";

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

const SectionCard = ({ title, subtitle, icon: Icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
  >
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <Icon className="text-[#D3423E]" size={15} />
          </div>
        )}
        <div>
          {title && <h2 className="text-base font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    )}
    {children}
  </motion.div>
);

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const ChartSkeleton = () => (
  <div className="p-5 space-y-3 h-72 flex flex-col justify-end">
    <div className="flex items-end gap-3 flex-1">
      {[55, 80, 40, 90, 65, 75, 50, 85].map((h, i) => (
        <SBox
          key={i}
          className="flex-1 rounded-t-lg"
          style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
    <div className="flex gap-3">
      {[...Array(8)].map((_, i) => (
        <SBox key={i} className="flex-1 h-3" />
      ))}
    </div>
  </div>
);

const ProductTableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.15 }}>
        <td className="px-6 py-4"><SBox className="h-4 w-48" /></td>
        <td className="px-6 py-4 text-right"><SBox className="h-4 w-20 ml-auto" /></td>
      </tr>
    ))}
  </>
);
const StatisticsView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedStatus] = useState("");
  const [items, setTotalItems] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [products, setProducts] = useState([]);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    const startYear = 2010;
    const endYear = new Date().getFullYear();
    const yearsList = [];
    for (let y = endYear; y >= startYear; y--) yearsList.push(y);
    setYears(yearsList);
  }, []);

  useEffect(() => {
    axios
      .post(
        API_URL + "/whatsapp/order/products/analysis",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setProducts(res.data.data);
        setLoading2(false);
      })
      .catch((err) => {
        console.error("Error al obtener predicciones:", err);
        setLoading2(false);
      });
  }, [token]);

  const fetchOrders = async (pages) => {
    setLoading(true);
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/order/products/stadistics",
        {
          year: selectedYear,
          month: selectedMonth,
          page: pages,
          itemsPerPage: itemsPerPage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetchedData = response.data.data || [];
      const chartLabels = fetchedData.map(
        (item) => item._id?.slice(0, 12) || "Sin nombre"
      );
      const chartValues = fetchedData.map((item) => item.totalCantidad || 0);
      setSalesData(fetchedData);
      setLabels(chartLabels);
      setValues(chartValues);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedYear, selectedMonth, itemsPerPage]);

  const exportToExcel = async () => {
    const filters = { id_owner: user, page: page, limit: 10000 };
    if (searchTerm) filters.fullName = searchTerm;
    if (selectedStatus) filters.status = selectedStatus;
    const response = await axios.post(
      API_URL + "/whatsapp/order/products/stadistics",
      {
        year: selectedYear,
        month: selectedMonth,
        page: 1,
        itemsPerPage: 10000,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const allData = response.data.data;
    const ws = XLSX.utils.json_to_sheet(
      allData.map((item) => ({
        Producto: item._id,
        Cantidad: item.totalCantidad,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista_Productos_Vendidos");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Order_List.xlsx");
  };

  const obtenerMes = (offset) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleString("es-ES", { month: "long" }).toUpperCase();
  };

  const totalUnidades = salesData.reduce(
    (s, i) => s + (i.totalCantidad || 0),
    0
  );
  const topProducto = salesData[0]?._id?.slice(0, 18) || "—";
  const mesLabel = selectedMonth ? MONTHS[selectedMonth - 1] : "Todos";

  return (
<div className="bg-white min-h-screen p-4 sm:p-6">
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
            Análisis de ventas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza tendencias, predicciones y rendimiento de productos
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={FaBoxOpen}
            label="Unidades vendidas"
            value={totalUnidades.toLocaleString()}
            iconBg="#dcfce7"
            iconColor="#16a34a"
          />
          <StatCard
            icon={FaChartLine}
            label="Productos activos"
            value={items?.toLocaleString?.() || items || 0}
            iconBg="#eff6ff"
            iconColor="#2563eb"
          />
          <StatCard
            icon={FaTrophy}
            label="Producto top"
            value={topProducto}
            iconBg="#fef3c7"
            iconColor="#d97706"
          />
          <StatCard
            icon={FaCalendarAlt}
            label="Año"
            value={selectedYear}
            iconBg="#f3e8ff"
            iconColor="#9333ea"
          />
          <StatCard
            icon={FaCalendarAlt}
            label="Mes"
            value={mesLabel}
            iconBg="#fee2e2"
            iconColor="#D3423E"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Año
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="app-select"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Mes
                </label>
                <select
                  value={selectedMonth || ""}
                  onChange={(e) => {
                    const month = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedMonth(month);
                  }}
                  className="app-select"
                >
                  <option value="">Todos los meses</option>
                  {MONTHS.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#D3423E]
                         text-[#D3423E] text-sm font-bold rounded-xl hover:bg-red-50 transition active:scale-[0.98]"
            >
              <FaFileExport size={14} />
              Exportar a Excel
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <SectionCard
            title="Ventas por producto"
            subtitle="Distribución del período seleccionado"
            icon={FaChartLine}
            delay={0.12}
          >
            <div className="p-5">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <VentasChart labels={labels} values={values} year={selectedYear} />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Tendencia histórica"
            subtitle="Comportamiento de ventas a lo largo del tiempo"
            icon={FaChartLine}
            delay={0.16}
          >
            <div className="p-5">
              {loading2 ? (
                <ChartSkeleton />
              ) : (
                <TrendLineChart products={products} />
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Detalle de ventas por producto"
          subtitle={`${items || 0} productos en el período`}
          icon={FaBoxOpen}
          delay={0.2}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        Unidades vendidas
                      </th>
                    </tr>
                  </thead>
              <tbody>
               {loading ? (
                  <ProductTableSkeleton />
                ) : salesData.length > 0 ? (
                  salesData.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-3.5 font-medium text-gray-900">
                        {item._id}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                        {item.totalCantidad?.toLocaleString?.() || item.totalCantidad}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-16 text-center">
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
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Total ítems: <span className="font-bold text-gray-900">{items}</span>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-600">
                    Por página:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                      className="app-select"
                  >
                    {[5, 10, 20].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className={`p-2 rounded-lg transition ${
                      page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-[#D3423E] hover:bg-red-50"
                    }`}
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  <button
                    onClick={() => setPage(1)}
                    className={`min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-bold transition ${
                      page === 1
                        ? "bg-[#D3423E] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    1
                  </button>

                  {page > 3 && <span className="px-1 text-gray-400 text-xs">…</span>}

                  {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                    .filter((p) => p > 1 && p < totalPages)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-bold transition ${
                          page === p
                            ? "bg-[#D3423E] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                  {page < totalPages - 2 && (
                    <span className="px-1 text-gray-400 text-xs">…</span>
                  )}

                  {totalPages > 1 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-bold transition ${
                        page === totalPages
                          ? "bg-[#D3423E] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg transition ${
                      page === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-[#D3423E] hover:bg-red-50"
                    }`}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </SectionCard>

        <div className="mt-6">
          <SectionCard
            title="Predicción de ventas por producto"
            subtitle="Proyección de los próximos 3 meses desde el mes actual"
            icon={FaBrain}
            delay={0.24}
          >
           {loading2 ? (
              <ChartSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                   <tr className="bg-gray-200 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Vta. acum.
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-[#D3423E] uppercase tracking-wider whitespace-nowrap">
                        {obtenerMes(0)}
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-[#D3423E] uppercase tracking-wider whitespace-nowrap">
                        {obtenerMes(1)}
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-[#D3423E] uppercase tracking-wider whitespace-nowrap">
                        {obtenerMes(2)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-50 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-3.5 font-medium text-gray-900">
                            {item.nombre}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                            {item.totalCantidad?.toLocaleString?.() || item.totalCantidad}
                          </td>
                          {item.forecast.map((f, idx) => (
                            <td
                              key={idx}
                              className="px-4 py-3.5 text-right text-gray-700"
                            >
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-[#D3423E] font-bold text-xs">
                                {f.valor}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaBrain size={32} className="mb-3" />
                            <p className="text-base font-semibold text-gray-700">
                              Sin predicciones disponibles
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;