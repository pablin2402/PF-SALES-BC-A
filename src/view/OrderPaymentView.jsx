import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL, CONTRACT_ABI, CONTRACT_ADDRESS } from "../config";
import { HiFilter } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";
import { BrowserProvider, Contract, id, Interface } from "ethers";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FiGrid, FiList } from "react-icons/fi";
import OrderCalendarView from "./OrderCalendarView";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import DateInput from "../Components/LittleComponents/DateInput";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import Spinner from "../Components/LittleComponents/Spinner";

const OrderPaymentView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedFilter, setSelectedFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applyFilter, setApplyFilter] = useState(false);


  const [items, setItems] = useState();

  const [selectedItem, setSelectedItem] = useState(null);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const [showEditModal, setShowEditModal] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const getBlockchainPayments = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask no está instalado");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const count = await contract.getPaymentsCount();
      const payments = [];
      for (let i = 0; i < count; i++) {
        const payment = await contract.getPayment(i);
        payments.push({
          orderId: payment[0],
          amount: Number(payment[1]),
          payer: payment[2],
          sender: payment[3],
          timestamp: Number(payment[4]),
          transactionHash: null,
        });
      }

      const contractInterface = new Interface(CONTRACT_ABI);
      const eventTopic = id("PaymentRegistered(string,uint256,string,address,uint256)");

      const logs = await provider.getLogs({
        fromBlock: 0,
        toBlock: "latest",
        address: CONTRACT_ADDRESS,
        topics: [eventTopic],
      });

      for (const log of logs) {
        const parsed = contractInterface.parseLog(log);
        const orderId = parsed.args[0];
        const match = payments.find((p) => p.orderId === orderId);
        if (match) {
          match.transactionHash = log.transactionHash;
        }
      }

      return payments;
    } catch (error) {
      console.error("Error fetching payments from blockchain:", error);
      return [];
    }
  };
  const fetchProducts = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        clientName: searchTerm,
      };

      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
        setDateFilterActive(true);
      }

      const response = await axios.post(
        API_URL + "/whatsapp/order/pay/list/id",
        filters,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const backendData = response.data.data || [];
      const blockchainPayments = await getBlockchainPayments();
      const mergedData = backendData.map((item) => {
        const backendId = item._id;
        const blockchainEntry = blockchainPayments.find(
          (payment) => payment.orderId === backendId
        );

        return {
          ...item,
          blockchain: blockchainEntry
            ? {
              amount: blockchainEntry.amount,
              payer: blockchainEntry.payer,
              sender: blockchainEntry.sender,
              orderId: blockchainEntry.orderId,
              timestamp: blockchainEntry.timestamp,
              transactionHash: blockchainEntry.transactionHash
            }
            : null,
        };
      });

      setSalesData(mergedData);
      setItems(response.data.pagination.totalRecords);
      setTotalPages(response.data.pagination.totalPages || 1);
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
  }, [applyFilter, page, itemsPerPage, selectedFilter]);
  const exportToExcel = async () => {
    try {
      const filters = {
        id_owner: user,
        page: 1,
        limit: items,
        clientName: searchTerm,
      };

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

    if (value === "all") {
      setDateFilterActive(false);
      setStartDate(null);
      setEndDate(null);
      setApplyFilter(false);
    }
  };
  const clearFilter = (type) => {
    if (type === 'date') {
      setStartDate('');
      setEndDate('');
      fetchProducts(1);
      setDateFilterActive(false);
    }

  };
  const uploadProducts = async (id, orderId1) => {
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
        await axios.post(API_URL + "/whatsapp/order/track", {
          orderId: orderId1._id,
          eventType: "Ha aprobado un pago",
          triggeredBySalesman: id_user,
          triggeredByDelivery: "",
          triggeredByUser: "",
          location: { lat: 0, lng: 0 }
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchProducts(1);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }

  };


  return (
    <div className="bg-white max-h-screen rounded-lg p-5 sm:p-6 md:p-8 lg:p-10">
      {loading ? (
        <Spinner />
      ) : (
        <div className="w-full p-10 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">
          <div className="ml-1 mr-1 mt-10 relative overflow-x-auto">
            {viewMode === "table" ? (
              <div>
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div>
                      <h1 className="text-gray-900 font-bold text-2xl">Lista de pagos</h1>
                    </div>
                    <div className="flex justify-end items-center space-x-4">
                      <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl  border-2 border-[#D3423E] flex items-center gap-5"
                      >
                        <FaFileExport color="##726E6E" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 mt-10 mb-4">
                    <div className="relative flex items-center  w-full max-w-2xl  space-x-4">
                      <div className="relative flex-grow">
                        <TextInputFilter
                          value={searchTerm}
                          onChange={setSearchTerm}
                          onEnter={() => fetchProducts(1)}
                          placeholder="Buscar por nombre"
                        />
                      </div>
                      <select
                        value={selectedFilter}
                        onChange={(e) => { handleFilterChange(e.target.value) }}
                        className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      >
                        <option value="none">Filtrar por: </option>
                        <option value="all">Mostrar todos</option>
                        <option value="date">Filtrar por Fecha:</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {selectedFilter === "date" && (
                        <div className="flex space-x-4 mb-4 items-center">
                          <div className="flex items-center space-x-2">
                            <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />
                          </div>
                        </div>
                      )}
                    </div>
                    <PrincipalBUtton onClick={() => setApplyFilter(true)} icon={HiFilter}>
                      Filtrar
                    </PrincipalBUtton>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                </div>
                <div className="flex justify-end space-x-2">
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
                <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
                  <table className="min-w-[600px] w-full text-sm text-left text-gray-500 rounded-2xl">
                    <thead className="text-xs text-gray-700 bg-gray-200 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 uppercase">Número de Nota</th>
                        <th className="px-4 py-3 uppercase">Fecha</th>
                        <th className="px-4 py-3 uppercase">Vendedor</th>
                        <th className="px-4 py-3 uppercase">Cliente</th>
                        <th className="px-4 py-3 uppercase">Monto</th>
                        <th className="px-4 py-3 uppercase">Total </th>
                        <th className="px-4 py-3 uppercase">Deuda a la Fecha</th>
                        <th className="px-4 py-3 uppercase">Estado de pago</th>
                        <th className="px-4 py-3 uppercase text-center">Blockchain</th>
                        <th className="px-4 py-3 uppercase text-center">Ver en la blockchain</th>
                        <th className="px-4 py-3 uppercase"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.length > 0 ? (
                        salesData.map((item) => (
                          <tr
                            key={item._id}
                            className="bg-white border-b hover:bg-gray-50"
                            onClick={() => {
                              setSelectedItem(item);
                            }}
                          >
                            <td className="px-4 py-3 text-gray-900">{item.orderId?.receiveNumber}</td>
                            <td className="px-4 py-3 text-gray-900">
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
                            <td className="px-4 py-3 text-gray-900">
                              {(item.sales_id || item.delivery_id)?.fullName + " " + (item.sales_id || item.delivery_id)?.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                            <td className="px-4 py-3 text-gray-900">Bs. {item.total}</td>
                            <td className="px-4 py-3 text-gray-900">Bs. {item.orderId?.totalAmount}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {item.debt !== undefined ? `Bs. ${item.debt.toFixed(2)}` : "N/A"}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
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
                                <span className="bg-red-500 font-bold text-white px-2.5 py-0.5 rounded-full">
                                  PAGO RECHAZADO
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center items-center">
                                {item.blockchain ? (
                                  <FaCheckCircle className="text-green-500 text-lg" />
                                ) : (
                                  <FaTimesCircle className="text-red-400 text-lg" />
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-center">
                              {item.blockchain?.transactionHash ? (
                                <a
                                  href={`https://polygonscan.com/tx/${item.blockchain.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 text-sm font-semibold uppercase text-white bg-red-700 hover:bg-red-600 rounded-full shadow transition"
                                  title="Consulta pública en Polygonscan"
                                >
                                  Ver en la Blockchain
                                  <FiExternalLink className="ml-2 text-white" size={16} />
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>


                            <td className="px-4 py-3">
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
                          <td colSpan="11" className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 114 0v2m-4 4h4m-6-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                              </svg>
                              <p className="text-lg font-semibold">No se encontraron coincidencias</p>
                              <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros o busca otra información.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={11}>
                          <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-200 border-t mt-2 border-gray-300">
                            <div className="text-m font-bold">
                              Total de Ítems: <span className="font-semibold">{items}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>

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
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Monto Pagado:</label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.total}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Cliente:</label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.id_client?.name + " " + selectedItem.id_client?.lastName}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
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
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Deuda a la fecha:</label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.debt !== undefined ? `Bs. ${selectedItem.debt.toFixed(2)}` : "N/A"}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Monto Total:</label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.orderId.totalAmount}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
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
                        onClick={() => uploadProducts(selectedItem._id, selectedItem.orderId)}
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
        </div>
      )}
    </div>
  );
};

export default OrderPaymentView;
