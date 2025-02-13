import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FaShoppingCart, FaChartLine, FaUsers, FaFileAlt } from "react-icons/fa";

const HomeView = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");

  const [salesData, setSalesData] = useState([]);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [salesBySeller, setSalesBySeller] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("monthYear"); // "monthYear" o "dateRange"

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

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData =
        filterType === "monthYear"
          ? { id_owner: "CL-01", year: selectedYear, month: selectedMonth }
          : { id_owner: "CL-01", startDate, endDate };

      const response = await axios.post(`${API_URL}/whatsapp/order/id/statistics`, requestData);
      console.log(response.data.productSales)
      setSalesData(response.data.orders);
      setTotalSalesAmount(response.data.totalSalesAmount);
      setTotalOrders(response.data.totalOrders);

      // Agrupar por vendedor
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
  };

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
        <div className="flex items-center justify-between w-full mb-4">
          <h2 className="text-xl font-bold text-gray-700">Reporte de Órdenes</h2>

          <div className="flex gap-2">
            <select
              className="p-2 border text-gray-900 border-gray-900 rounded-lg"
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
                className="p-2 border text-gray-900 border-gray-900 rounded-lg"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                className="p-2 text-gray-900 border border-gray-900 rounded-lg"
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
                className="p-2 border text-gray-900 border-gray-900 rounded-lg"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="p-2 border text-gray-900 border-gray-900 rounded-lg"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}

          <button
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={fetchOrders}
          >
            Filtrar
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div>
          

            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3">Vendedor</th>
                    <th className="px-6 py-3">Número de Pedidos</th>
                    <th className="px-6 py-3">Monto Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {salesBySeller.length > 0 ? (
                    salesBySeller.map((seller) => (
                      <tr key={seller.sellerName} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{seller.sellerName}</td>
                        <td className="px-6 py-4">{seller.totalOrders}</td>
                        <td className="px-6 py-4">${seller.totalAmount.toFixed(2)}</td>
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
            <div className="grid grid-cols-4 gap-4 mt-5">
            <div className="p-6 border border-[#D8D8FC] rounded-xl shadow-md bg-white flex justify-between items-center">
      <div>
        <p className="text-black text-left text-m font-semibold">Productos vendidos</p>
        <p className="text-xl font-bold text-[#0D1321]">25.1k</p>
        <div className="flex items-center mt-2">
          <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full">⬆</span>
          <span className="text-green-600 text-lg font-semibold ml-2">+15%</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <FaShoppingCart className="text-3xl text-[#0D1321]" />
        <a href="#" className="text-red-600 font-semibold underline mt-8">Ver reporte</a>
      </div>
    </div>
            <div className="p-4 bg-white border rounded-lg shadow-md text-center flex flex-col items-center">
              <FaChartLine className="text-2xl text-gray-700" />
              <p className="text-lg font-semibold">Total en ventas</p>
              <p className="text-2xl font-bold">Bs. {totalSalesAmount.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white border rounded-lg shadow-md text-center flex flex-col items-center">
              <FaFileAlt className="text-2xl text-gray-700" />
              <p className="text-lg font-semibold">Producto más vendido</p>
              <p className="text-2xl font-bold"></p>
            </div>
            <div className="p-4 bg-white border rounded-lg shadow-md text-center flex flex-col items-center">
              <FaUsers className="text-2xl text-gray-700" />
              <p className="text-lg font-semibold">Clientes</p>
              <p className="text-2xl font-bold">{salesData.length}</p>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeView;
