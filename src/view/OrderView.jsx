import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";
import { HiOutlineTrash } from "react-icons/hi";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import DateInput from "../Components/LittleComponents/DateInput";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";

import Spinner from "../Components/LittleComponents/Spinner";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStatus] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const [vendedores, setVendedores] = useState([]);


  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState();

  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const handleNewOrderClick = () => {
    navigate("/order/creation");
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
    fetchVendedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);
  const fetchOrders = async (pageNumber, customFilters) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user,
        region: "TOTAL CBB",
        page: pageNumber,
        limit: itemsPerPage,
        fullName: inputValue,
        ...customFilters,
      };

      const response = await axios.post(API_URL + "/whatsapp/order/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSalesData(response.data.orders);
      setTotalPages(response.data.totalPages);
      setItems(response.data.totalRecords);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    const customFilters = {};
    if (inputValue) customFilters.fullName = inputValue;
    if (selectedStatus) customFilters.status = selectedStatus;
    if (selectedPaymentType) customFilters.paymentType = selectedPaymentType;
    if (selectedSaler) customFilters.salesId = selectedSaler;
    if (selectedPayment) customFilters.payStatus = selectedPayment;
    if (selectedRegion) customFilters.region = selectedRegion;
    if (startDate && endDate) {
      customFilters.startDate = startDate;
      customFilters.endDate = endDate;
      setDateFilterActive(true);
    }
    fetchOrders(1, customFilters);
    setPage(1);
  };
  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);
  const goToClientDetails = (item) => {
    navigate(`/client/order/${item.id_client}`, { state: { products: item.products, files: item, flag: true } });
  };
  const exportToExcel = async () => {
    const filters = {
      id_owner: user,
      page: page,
      limit: items,
    };
    if (inputValue) filters.fullName = inputValue;
    if (selectedStatus) filters.status = selectedStatus;
    if (selectedPaymentType) filters.paymentType = selectedPaymentType;
    if (selectedSaler) filters.salesId = selectedSaler;
    if (selectedPayment) filters.payStatus = selectedPayment;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    const response = await axios.post(API_URL + "/whatsapp/order/id", filters, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const allData = response.data.orders;

    const ws = XLSX.utils.json_to_sheet(
      allData.map((item) => {
        const creationDateUTC = new Date(item.creationDate);
        creationDateUTC.setHours(creationDateUTC.getHours() - 4);
        const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
        return {
          "Código de Cliente": item._id,
          "Nombre": item.id_client.name + " " + item.id_client.lastName,
          "Fecha de confirmación": formattedDate,
          "Tipo de pago": item.accountStatus,
          "Vendedor": item.salesId.fullName + " " + item.salesId.lastName || "",
          "Fecha de Pago": item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : new Date(item.creationDate).toLocaleDateString("es-ES") || "",
          "Estado de Pago": item.payStatus || "",
          "Saldo por pagar": item.restante,
          "Total": item.totalAmount,
        };
      })
    );


    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order_List");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Order_List.xlsx");
  };
  const clearFilter = (type) => {
    if (type === "seller") setSelectedSaler("");
    if (type === "paymentType") setSelectedPaymentType("");
    if (type === "payment") setSelectedPayment("");
    if (type === "region") setSelectedRegion("");
    if (type === "date") {
      setStartDate("");
      setEndDate("");
      setDateFilterActive(false);
    }
    fetchOrders(1);
  };
  const clearAllFilters = () => {
    setSelectedFilter("");
    setStartDate("");
    setEndDate("");
    setSelectedSaler("");
    setSelectedPaymentType("");
    setSelectedPayment("");
    setSelectedRegion("");
    setDateFilterActive(false);

  };
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/whatsapp/order/id`, {
        data: {
          _id: id,
          id_owner: user,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 && response.data.success) {
        fetchOrders(1);
      }

      return response.data;
    } catch (error) {
      console.error("Error al eliminar:", error.response?.data || error.message);
    }
  };


  return (
    <div className="bg-white min-h-screen p-5">
      <div className="relative overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : (
          <div>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between w-full mb-4">
                <h1 className="text-gray-900 font-bold text-2xl">Órdenes de venta</h1>

                <div className="flex justify-end items-center space-x-4">
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl  border-2 border-[#D3423E] flex items-center gap-5"
                  >
                    <FaFileExport color="##726E6E" />
                  </button>
                  <PrincipalBUtton onClick={() => handleNewOrderClick()} icon={HiFilter}>Nuevo Pedido</PrincipalBUtton>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-20 mb-4">
                <div className="relative flex items-center  w-full max-w-2xl  space-x-4">
                  <div className="relative flex-grow">
                    <TextInputFilter
                      value={inputValue}
                      onChange={setInputValue}
                      onEnter={applyFilters}
                      placeholder="Buscar por nombre"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  >
                    <option value="">Filtrar por: </option>
                    <option value="payment">Filtrar por estado de pago:</option>
                    <option value="date">Filtrar por fecha:</option>
                    <option value="seller">Filtrar por vendedores: </option>
                    <option value="paymentType">Filtrar por tipo de pago:</option>
                    <option value="region">Filtrar por region:</option>
                  </select>
                </div>

                {selectedFilter === "seller" && (
                  <div className="flex gap-2">
                    <select
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      name="vendedor" value={selectedSaler} onChange={(e) => setSelectedSaler(e.target.value)} required>
                      <option value="">Vendedor</option>
                      <option value="">Mostrar Todos</option>
                      {vendedores.map((vendedor) => (
                        <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedFilter === "paymentType" && (
                  <div className="flex gap-2">
                    <select
                      value={selectedPaymentType} onChange={(e) => setSelectedPaymentType(e.target.value)}
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      <option value="">Tipo de pago</option>
                      <option value="">Mostrar Todos</option>

                      <option value="Crédito">Crédito</option>
                      <option value="Contado">Contado</option>
                    </select>
                  </div>
                )}
                {selectedFilter === "payment" && (
                  <div className="flex gap-2">
                    <select
                      value={selectedPayment}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      <option value="">Estado de pago</option>
                      <option value="">Mostrar Todos</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                )}
                {selectedFilter === "date" && (
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />
                    </div>
                  </div>
                )}
                {selectedFilter === "region" && (
                  <div className="flex gap-2">
                    <select
                      className="text-gray-900 rounded-2xl p-2 focus:outline-none focus:ring-0 focus:border-red-500"
                      name="ciudad"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      required
                    >
                      <option value="">Ciudad</option>
                      <option value="TOTAL CBB">Cochabamba</option>
                      <option value="TOTAL SC">Santa Cruz</option>
                      <option value="TOTAL LP">La Paz</option>
                      <option value="TOTAL OR">Oruro</option>
                    </select>

                  </div>
                )}
                <PrincipalBUtton onClick={() => applyFilters()} icon={HiFilter}>Filtrar</PrincipalBUtton>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {selectedSaler && (
                <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Vendedor: {vendedores.find(v => v._id === selectedSaler)?.fullName}
                  <button onClick={() => clearFilter("seller")} className="font-bold">×</button>
                </span>
              )}
              {selectedPaymentType && (
                <span className="bg-orange-400 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Tipo de Pago: {selectedPaymentType}
                  <button onClick={() => clearFilter("paymentType")} className="font-bold">×</button>
                </span>
              )}
              {selectedPayment && (
                <span className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Estado de Pago: {selectedPayment}
                  <button onClick={() => clearFilter("payment")} className="font-bold">×</button>
                </span>
              )}
              {dateFilterActive && (
                <span className="bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Fecha: {startDate} → {endDate}
                  <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                </span>
              )}
              {selectedRegion && (
                <span className="bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Region: {selectedRegion}
                  <button onClick={() => clearFilter("region")} className="font-bold">×</button>
                </span>
              )}
              {(selectedSaler || selectedStatus || selectedPaymentType || selectedPayment || selectedRegion) && (
                <button
                  onClick={clearAllFilters}
                  className="ml-2 text-sm underline font-bold text-gray-900 hover:text-[#D3423E]"
                >
                  Limpiar todos
                </button>
              )}
            </div>
            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 uppercase">Fecha de creación</th>
                    <th className="px-6 py-3 uppercase">Ciudad</th>
                    <th className="px-6 py-3 uppercase">Nombre</th>
                    <th className="px-6 py-3 uppercase">Tipo de Pago</th>
                    <th className="px-6 py-3 uppercase">Vendedor</th>
                    <th className="px-6 py-3 uppercase">Estado de pago</th>
                    <th className="px-6 py-3 uppercase">Total</th>
                    <th className="px-6 py-3 uppercase">Saldo por pagar</th>
                    <th className="px-6 py-3 uppercase">Días de mora</th>
                    <th className="px-6 py-3 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length > 0 ? (
                    salesData.map((item) => (
                      <tr key={item._id} onClick={() => goToClientDetails(item)} className="bg-white border-b hover:bg-gray-50">
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
                        <td className="px-6 py-4 text-gray-900">{item.region}</td>
                        <td className="px-6 py-4 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {item.accountStatus === "Crédito" && (
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                              CRÉDITO
                            </span>
                          )}
                          {item.accountStatus === "Contado" && (
                            <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                              CONTADO
                            </span>
                          )}
                          {item.accountStatus === "Cheque" && (
                            <span className="bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                              CHEQUE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{item.salesId.fullName + " " + item.salesId.lastName}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {item.payStatus === "Pagado" && (
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                              PAGADO
                            </span>
                          )}
                          {item.payStatus === "Pendiente" && (
                            <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                              PENDIENTE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-bold text-lg">{item.totalAmount}</td>
                        <td className="px-6 py-4 text-gray-900">
                          {item.restante}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {item.diasMora}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {item.totalAmount === item.restante && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item._id)
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center uppercase text-gray-500">
                        No se encontraron coincidencias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-100 border-t mb-2 mt-2 border-gray-300">
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
                        const selectedValue = Number(e.target.value);
                        setItemsPerPage(selectedValue);
                        setPage(1);
                      }}
                      className="border-2 border-gray-900 rounded-2xl px-2 py-1 text-m text-gray-700 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      {[5, 10, 20].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>

                  <nav className="flex items-center justify-center pt-4 space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold "}`}
                    >
                      ◀
                    </button>

                    <button
                      onClick={() => setPage(1)}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                    >
                      1
                    </button>

                    {page > 3 && <span className="px-2 text-gray-900 font-bold">…</span>}

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
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                      >
                        {totalPages}
                      </button>
                    )}

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"}`}
                    >
                      ▶
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default OrderView;
