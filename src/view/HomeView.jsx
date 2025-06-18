import React, { useEffect, useState,useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { FaFilter } from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);


const HomeView = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");

  const [salesData, setSalesData] = useState([]);
  const [salesBySeller, setSalesBySeller] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("monthYear");

  const years = Array.from({ length: 16 }, (_, i) => 2010 + i);
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];
  const fetchOrders = useCallback(async () => {
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);
    try {
      const requestData =
        filterType === "monthYear"
          ? { id_owner: user, year: selectedYear, month: selectedMonth }
          : { id_owner: user, startDate, endDate };
  
      const response = await axios.post(API_URL+"/whatsapp/order/id/statistics", requestData, 
        {
        headers: {
          Authorization: `Bearer ${token}`
        }});
      setSalesData(response.data.orders);
  
      const groupedSales = response.data.orders.reduce((acc, order) => {
        const sellerId = order.salesId?._id || "Desconocido";
        const sellerName = `${order.salesId?.fullName || "Desconocido"} ${order.salesId?.lastName || ""}`.trim();
  
        if (!acc[sellerId]) {
          acc[sellerId] = { sellerName, totalAmount: 0, totalOrders: 0 };
        }
        acc[sellerId].totalAmount += order.totalAmount;
        acc[sellerId].totalOrders += 1;
        return acc;
      }, {});
  
      setSalesBySeller(Object.values(groupedSales));
    } catch (error) {
      setError("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedYear, selectedMonth, startDate, endDate]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  


  
  const exportOrdersToExcel = () => {
    const formattedOrders = salesData.map((order) => {
      const productos = order.products
        .map(
          (p) =>
            `${p.nombre} (Cant: ${p.cantidad}, Precio: Bs ${p.precio})`
        )
        .join(" | ");
        const creationDateUTC = new Date(order.creationDate);
        creationDateUTC.setHours(creationDateUTC.getHours() - 4);
        const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
      return {
        "Número / Recibo": order.receiveNumber || "—",
        "Fecha de creación":formattedDate,
        "Vencimiento": new Date(order.dueDate).toLocaleDateString(),
        "Vendedor": `${order.salesId?.fullName || "—"} ${order.salesId?.lastName || ""}`.trim(),
        "Productos": productos,
        "Total Bs": order.totalAmount,
        "Descuento Bs": order.dissccount || 0,
        "Impuesto Bs": order.tax || 0,
        "Estado de pago": order.payStatus || "—",
        "Estado de entrega": order.orderStatus || "—",
        "Razón social": order.razonSocial || "—",
        "Dirección": order.direction || "—",
        "NIT": order.nit || "—",
        "Estado de cuenta": order.accountStatus || "—",
      };
    });
  
    const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_By_Sales");
  
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  
    saveAs(dataBlob, `ordenes_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-white max-w-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
        <div className="flex items-center justify-between w-full mt-5 mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Reporte</h2>
        </div>
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex gap-2">
            <select
              className="p-2  text-gray-900 hover:text-red-700 hover:border-red-700 focus:border-red-700 font-bold rounded-lg"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="monthYear">Filtrar por Mes y Año</option>
              <option value="dateRange">Filtrar por Rango de Fechas</option>
            </select>
          </div>

          {filterType === "monthYear" ? (
            <div className="flex gap-2">
              <select
                className="p-2 font-bold text-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:text-black focus:border-black"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                className="p-2 font-bold text-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:text-black focus:border-black"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="date"
                className="p-2 font-bold text-gray-700  rounded-lg"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="p-2 font-bold text-gray-700 rounded-lg"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button
            className="px-5 py-2.5 bg-white font-bold text-lg text-[#D3423E] rounded-lg hover:bg-gray-100 rounded-2xl hover:text-[#D3423E] flex items-center gap-2 "
            onClick={fetchOrders}
          >
            <FaFilter />
            Filtrar
          </button>
            </div>
          )}

        </div>

        {loading ? (
          <p className="text-center text-gray-500">
            <div className="flex justify-center items-center h-64">
              <div role="status">
                <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div>
            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
              <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
              <tr>
                    <th className="px-6 py-3 font-bold">Vendedor</th>
                    <th className="px-6 py-3 font-bold">Número de Pedidos</th>
                    <th className="px-6 py-3 font-bold">Monto Total Vendido</th>
                    <th className="px-6 py-3 font-bold"></th>

                  </tr>
                </thead>
                <tbody>
                  {salesBySeller.length > 0 ? (
                    salesBySeller.map((seller) => (
                      <tr key={seller.sellerName} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium font-semibold text-gray-900">{seller.sellerName}</td>
                        <td className="px-6 py-4 font-medium font-semibold text-gray-900">{seller.totalOrders}</td>
                        <td className="px-6 py-4 font-medium font-semibold text-gray-900">${seller.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 font-medium font-semibold text-gray-900">
                          <button
                              onClick={exportOrdersToExcel}
                              className="px-4 py-2 bg-white font-bold text-lg text-[#3A3737] rounded-lg hover:text-white hover:bg-[#D3423E] flex items-center gap-2"
                            >
                              <FaFileExport color="##726E6E" />
                              Exportar
                            </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No hay datos disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeView;
