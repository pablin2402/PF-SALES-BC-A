import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { HiFilter } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FiGrid, FiList } from "react-icons/fi";
import OrderCalendarView from "./OrderCalendarView";
import PrincipalBUtton from "../Components/PrincipalButton";
import DateInput from "../Components/DateInput";
import TextInputFilter from "../Components/TextInputFilter";

const OrderPaymentView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applyFilter, setApplyFilter] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState(null);

  const [items, setItems] = useState();

  const [selectedItem, setSelectedItem] = useState(null);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const [showEditModal, setShowEditModal] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const fetchProducts = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        clientName: searchTerm
      };
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedCliente) filters.id_client = selectedCliente.value;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
        setDateFilterActive(true);

      }
      const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", filters,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSalesData(response.data.data);
      setItems(response.data.pagination.totalRecords);
      setTotalPages(response.data.pagination.totalPages || 1);
      console.log(response.data.pagination.totalPages)
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts(page);
    setApplyFilter(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyFilter, page, itemsPerPage]);
  const exportToExcel = async () => {
    try {
      const filters = {
        id_owner: user,
        page: 1,
        limit: 100000,
        clientName: searchTerm,
      };

      if (selectedStatus) filters.status = selectedStatus;
      if (selectedCliente) filters.id_client = selectedCliente.value;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const allData = response.data.data;

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => {
          const creationDateUTC = new Date(item.creationDate);
          creationDateUTC.setHours(creationDateUTC.getHours() - 4);
          const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);

          return {
            "Número de Orden": item.orderId.receiveNumber,
            "Fecha de Pago": formattedDate,
            "Vendedor": item.sales_id.fullName + " " + item.sales_id.lastName,
            "Cliente": item.id_client.name + " " + item.id_client.lastName || "",
            "Estado": item.paymentStatus || "",
            "Pago": item.total || "",
            "Monto total": item.orderId.totalAmount || "",
            "Deuda de la nota": item.debt?.toFixed(2) || "",
          };
        })
      );



      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pagos_Por_Cliente");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, "Pagos_Por_Cliente.xlsx");
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    setSearchTerm("");
    setSelectedCliente(null);
    setSelectedStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setApplyFilter(true);
  };
  const clearFilter = (type) => {
    if (type === 'date') {
      setStartDate('');
      setEndDate('');
      setDateFilterActive(false);

    }
    
  };
  const uploadProducts = async (id) => {
    try {
      const response = await axios.put(
        API_URL + "/whatsapp/order/pay/status/id",
        {
          _id: id,
          paymentStatus: selectedItem.confirmed,
          reviewer: id_user,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        fetchProducts(1);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }

  };
  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div role="status">
            <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="ml-1 mr-1 mt-10 relative overflow-x-auto">
          {viewMode === "table" ? (
            <div>
              <div className="flex items-center justify-between w-full">
                <div className="relative flex items-center space-x-4">
                  <div className="relative flex-1">
                   
                   
                    <TextInputFilter
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onEnter={() => fetchProducts(1)}
                      placeholder="Buscar por nombre"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="block p-2 text-m text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  >
                    <option value="none">Filtrar por: </option>
                    <option value="all">Mostrar todos</option>
                    <option value="date">Filtrar por Fecha:</option>
                  </select>
                </div>
                <div className="flex justify-end items-center space-x-10">

                  <PrincipalBUtton onClick={exportToExcel}
                    icon={FaFileExport}>Exportar</PrincipalBUtton>

                </div>
              </div>
              <div className="relative mt-8 flex items-center space-x-4">
                {selectedFilter === "date" && (
                  <div className="flex space-x-4 mb-4 items-center">
                    <div className="flex items-center space-x-2">
                      
                            <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />

                    </div>

                    <div className="flex items-center space-x-2">
                      
                            <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />

                    </div>

                    <div className="flex items-center">

                      <PrincipalBUtton onClick={() => setApplyFilter(true)}
                        icon={HiFilter}>Filtrar</PrincipalBUtton>

                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {dateFilterActive && (
                  <span className="bg-orange-400 text-white px-3 py-1 rounded-full font-bold text-sm flex items-center gap-2">
                    Fecha: {startDate} → {endDate}
                    <button
                      onClick={() => clearFilter("date")}
                      className="font-bold"            >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <div className="flex mt-4 justify-end space-x-2">
                <button
                  onClick={() => setViewMode("table")}
                  className=" rounded-lg font-bold text-sm p-2 text-[#D3423E] w-10 h-10 flex items-center justify-center"
                >
                  <FiList className="w-5 h-5 text-[#D3423E] font-bold" />
                </button>

                <button
                  onClick={() => setViewMode("cards")}
                  className=" rounded-lg font-bold text-sm p-2 text-[#D3423E] w-10 h-10 flex items-center justify-center"
                >
                  <FiGrid className="w-5 h-5 text-[#D3423E] font-bold" />
                </button>
              </div>
              <div className="mt-5 border border-gray-400 rounded-xl">
                <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                  <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-3 uppercase">Número de Nota</th>
                      <th className="px-6 py-3 uppercase">Fecha</th>
                      <th className="px-6 py-3 uppercase">Vendedor</th>
                      <th className="px-6 py-3 uppercase">Cliente</th>
                      <th className="px-6 py-3 uppercase">Monto</th>
                      <th className="px-6 py-3 uppercase">Total </th>
                      <th className="px-6 py-3 uppercase">Deuda a la Fecha</th>
                      <th className="px-6 py-3 uppercase">Estado de pago</th>
                      <th className="px-6 py-3 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.length > 0 ? (
                      salesData.map((item) => (
                        <tr
                          key={item._id}
                          className="bg-white text-sm border-b border-gray-200 hover:bg-gray-50"
                          onClick={() => {
                            setSelectedItem(item);
                          }}
                        >
                          <td className="px-6 py-4 text-gray-900">{item.orderId.receiveNumber}</td>
                          <td className="px-6 py-4 text-gray-900">
                            {item.creationDate
                              ? new Date(item.creationDate).toLocaleString("es-ES", {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                              }).toUpperCase()
                              : ''}
                          </td>
                          <td className="px-6 py-4 text-gray-900">{item.sales_id.fullName + " " + item.sales_id.lastName}</td>
                          <td className="px-6 py-4 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                          <td className="px-6 py-4 text-gray-900">Bs. {item.total}</td>
                          <td className="px-6 py-4 text-gray-900">Bs. {item.orderId.totalAmount}</td>
                          <td className="px-6 py-4 text-gray-900">
                            {item.debt !== undefined ? `Bs. ${item.debt.toFixed(2)}` : "N/A"}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {item.paymentStatus === "paid" && (
                              <span className="bg-blue-500 font-bold text-m text-white px-3.5 py-0.5 rounded-full">
                                INGRESADO
                              </span>
                            )}
                            {item.paymentStatus === "confirmado" && (
                              <span className="bg-green-500 font-bold text-white px-4 py-1 rounded-full inline-block text-sm whitespace-nowrap">
                                PAGO CONFIRMADO
                              </span>
                            )}
                            {item.paymentStatus === "rechazado" && (
                              <span className="bg-green-500 font-bold text-white px-2.5 py-0.5 rounded-full">
                                PAGO RECHAZADO
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setShowEditModal(true);
                              }}
                              className="text-gray-900 bg-white font-bold py-1 px-3 rounded"
                              aria-label="Opciones"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <circle cx="10" cy="4" r="2" />
                                <circle cx="10" cy="10" r="2" />
                                <circle cx="10" cy="16" r="2" />
                              </svg>
                            </button>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 uppercase text-center text-gray-500">
                          No se encontraron coincidecias
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between px-6 py-4 text-m text-gray-700 bg-gray-100 border-t mb-2 mt-2 border-gray-300">
                  <div className="text-m">Total de Ítems: <span className="font-semibold">{items}</span></div>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-6 pb-4">
                    <div className="flex mb-4 justify-end items-center pt-4">
                      <label htmlFor="itemsPerPage" className="mr-2 text-m font-bold text-gray-700">
                        Ítems por página:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setPage(1);
                          fetchProducts(page);
                        }}
                        className="border-2 border-gray-900 rounded-2xl px-2 py-1 text-m text-gray-700"
                      >
                        {[5, 10, 20, 50, 100].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <nav className="flex items-center mb-4 justify-center pt-4 space-x-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-gray-900 font-bold"}`}
                      >
                        ◀
                      </button>

                      <button
                        onClick={() => setPage(1)}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                      >
                        1
                      </button>

                      {page > 3 && <span className="px-2 text-gray-900">…</span>}

                      {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                        .filter((p) => p > 1 && p < totalPages)
                        .map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                          >
                            {p}
                          </button>
                        ))}

                      {page < totalPages - 2 && <span className="px-2 text-gray-900 font-bold">…</span>}

                      {totalPages > 1 && (
                        <button
                          onClick={() => setPage(totalPages)}
                          className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-red-500 text-white font-bold" : "text-gray-900 font-bold"}`}
                        >
                          {totalPages}
                        </button>
                      )}

                      <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] hover:bg-gray-200"}`}
                      >
                        ▶
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex mt-4 mb-4 justify-end space-x-2">
                <button
                  onClick={() => setViewMode("table")}
                  className=" rounded-lg font-bold text-sm p-2 text-[#D3423E] w-10 h-10 flex items-center justify-center"
                >
                  <FiList className="w-5 h-5 text-[#D3423E] font-bold" />
                </button>

                <button
                  onClick={() => setViewMode("cards")}
                  className=" rounded-lg font-bold text-sm p-2 text-[#D3423E] w-10 h-10 flex items-center justify-center"
                >
                  <FiGrid className="w-5 h-5 text-[#D3423E] font-bold" />
                </button>
              </div>
              <OrderCalendarView></OrderCalendarView>
            </div>
          )}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl w-[700px]">
                {selectedItem.paymentStatus === "paid" && (
                  <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Verificación de Pago</h2>
                )}
                {selectedItem.paymentStatus === "confirmado" && (
                  <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Detalles del pago</h2>
                )}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Número de Nota:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.orderId?.receiveNumber}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Monto Pagado:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.total}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Cliente:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.id_client?.name + " " + selectedItem.id_client?.lastName}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Fecha de Pago:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.creationDate
                        ? new Date(selectedItem.creationDate).toLocaleString("es-ES", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        }).toUpperCase()
                        : ''}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Deuda a la fecha:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.debt !== undefined ? `Bs. ${selectedItem.debt.toFixed(2)}` : "N/A"}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Monto Total:</label>
                    <input
                      type="text"
                      disabled
                      value={selectedItem.orderId.totalAmount}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                  {selectedItem.saleImage && (
                    <div className="col-span-2 mt-4">
                      <label className="block mb-1 text-sm font-medium text-gray-700">Imagen del Recibo:</label>
                      <img
                        src={selectedItem.saleImage}
                        alt="Recibo"
                        className="rounded-md border border-gray-300 max-h-40 w-full object-contain"
                      />
                    </div>
                  )}
                  {selectedItem.paymentStatus === "paid" && (
                    <div className="col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">¿Confirmar Pago?</label>
                      <select
                        value={selectedItem.confirmed || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, confirmed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>
                  )}
                </div>
                {selectedItem.paymentStatus === "paid" && (

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-1/2 px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => uploadProducts(selectedItem._id)}
                      className="w-1/2 px-4 py-2 bg-[#D3423E] text-white font-bold uppercase rounded-3xl"
                    >
                      Guardar
                    </button>

                  </div>
                )}
                {selectedItem.paymentStatus === "confirmado" && (

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-full px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default OrderPaymentView;
