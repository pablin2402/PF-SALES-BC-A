import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileExport } from "react-icons/fa6";
import { jsPDF } from "jspdf";
import DateInput from "../LittleComponents/DateInput";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import { HiFilter } from "react-icons/hi";
import Spinner from "../LittleComponents/Spinner";

import { FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";

export default function SalesManInformationComponent() {
  const { id } = useParams();

  const [client, setClient] = useState();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [idClient, setClientId] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(1);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const fetchClientData = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/sales/id", {
        _id: id,
        id_owner: user
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setClientId(response.data._id);
      setClient(response.data);
    } catch (error) {
      console.error("Error al obtener los datos del cliente", error);
    }
  }, [id, token, user]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const fetchProducts = async (page) => {
    setLoading(true);
    try {
      const payload = {
        id_owner: user,
        salesId: id,
        page: page,
        limit: itemsPerPage
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/sales", payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSalesData(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.total || 1);

    } catch (error) {
      console.error("Error al obtener los productos", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (idClient) {
      fetchProducts(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idClient, page, itemsPerPage]);

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return '0';

    const due = new Date(dueDate);
    const today = new Date();

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays}`;

  };
  const handleFilterClick = () => {
    setPage(1);
    setTimeout(() => {
      fetchProducts(page);
    }, 0);
  };

  const navigate = useNavigate();

  const handleRowClick = (item) => {
    navigate(`/client/order/${item._id}`, { state: { products: item.products, files: item } });
  };
  if (!client) {
    return <p className="text-center mt-10 text-xl">Cargando datos...</p>;
  }
  const exportToExcel = async () => {
    try {
      const payload = {
        id_owner: user,
        salesId: id,
        page: page,
        limit: items
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/sales", payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const allData = response.data.orders;

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => {
          const creationDateUTC = new Date(item.creationDate);
          creationDateUTC.setHours(creationDateUTC.getHours() - 4);
          const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
          return {

            "Número de Orden": item.receiveNumber,
            "Fecha de Venta": formattedDate,
            "Vendedor": item.salesId.fullName + " " + item.salesId.lastName,
            "Tipo de pago": item.accountStatus || "",
            "Total pagado": item.totalPagado,
            "Saldo": item.restante,
            "Fecha prevista de pago": item.dueDate || "",
            "Total": item.totalAmount || "",
          };
        })
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clientes");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, "Reporte_De_Ventas_Por_Vendedor.xlsx");
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };
  const exportToPDF = async () => {
    try {
      const payload = {
        id_owner: user,
        salesId: id,
        page: page,
        limit: items
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/sales", payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const allData = response.data.orders;

      const doc = new jsPDF();
      doc.addImage("/camacho.jpeg", "PNG", 160, 10, 30, 30);
      doc.text("Reporte de Ventas", 15, 20);

      const tableColumn = [
        "Referencia",
        "Fecha confirmación",
        "Tipo de Pago",
        "Vendedor",
        "Fecha de Pago",
        "Total",
        "Total pagado",
        "Saldo",
        "Días de mora"
      ];
      const tableRows = allData.map((item) => [
        item.receiveNumber,
        item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : '',
        item.accountStatus === "Crédito" ? "CRÉDITO" : "CONTADO",
        `${item.salesId.fullName} ${item.salesId.lastName}`,
        item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : new Date(item.creationDate).toLocaleDateString("es-ES"),
        `Bs. ${item.totalAmount}`,
        item.totalPagado,
        item.restante,
        calculateDaysRemaining(item.dueDate)
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: "grid",
        headStyles: {
          fillColor: [211, 211, 211],
          textColor: [51, 51, 51],
          fontSize: 12,
          font: "Montserrat",
          halign: "center",
          valign: "middle"
        },
      });

      doc.save("Reporte_Ventas_Por_Vendedor.pdf");
    } catch (error) {
      console.error("Error exporting data to PDF:", error);
    }
  };
  const totalAmountSum = salesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const clearFilter = (type) => {
    if (type === 'date') {
      setStartDate('');
      setEndDate('');
      setDateFilterActive(false);
    }
  };
  return (
    <div className="bg-white max-h-screen rounded-lg p-5 sm:p-6 md:p-8 lg:p-10">
      {loading ? (
        <Spinner />
      ) : (
        <div className="p-6 bg-white border border-gray-300 rounded-2xl shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-wrap items-center mt-4 mb-4 space-x-2">

              <nav className="flex flex-wrap items-center" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                  <li className="inline-flex items-center" onClick={() => navigate(-1)}>
                    <button
                      onClick={() => navigate(-2)}
                      className="inline-flex items-center text-lg font-medium text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <svg
                        className="w-3 h-3 me-2.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                      </svg>
                      Lista de vendedores
                    </button>

                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                      </svg>
                      <button
                        onClick={() => navigate(-1)}
                        className="ms-1 text-lg font-bold text-[#D3423E] hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                      >
                        {client.fullName} {client.lastName}
                      </button>

                    </div>
                  </li>
                </ol>
              </nav>

            </div>

            <div className="w-full relative bg-white rounded-lg p-6 flex border border-gray-900 flex-col items-center">
              <div className="absolute -top-20 w-40 h-40 rounded-full overflow-hidden">
                <img
                  src={client.identificationImage || "https://via.placeholder.com/150"}
                  alt={client.fullName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-20 text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {client.fullName} {client.lastName}
                </h2>
                <div className="flex items-center gap-2 text-gray-900">
                  <FaMapMarkerAlt color="#D3423E" />
                  <p>{client.client_location?.direction || "No disponible"}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-900">
                  <FaEnvelope color="#D3423E" />
                  <p>{client?.email || "No disponible"}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-900">
                  <FaPhone color="#D3423E" />
                  <p>{client?.phoneNumber || "No disponible"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 w-full max-w-5xl">
            <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 mt-10 mb-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                <div className="flex items-center w-full sm:w-auto">
                  <DateInput
                    value={startDate}
                    onChange={setStartDate}
                    label="Fecha de Inicio"
                  />
                </div>

                <div className="flex items-center w-full sm:w-auto">
                  <DateInput
                    value={endDate}
                    onChange={setEndDate}
                    min={startDate}
                    label="Fecha Final"
                  />
                </div>

                <PrincipalBUtton
                  onClick={handleFilterClick}
                  icon={HiFilter}
                  className="w-full sm:w-auto"
                >
                  Filtrar
                </PrincipalBUtton>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:ml-auto">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] border-2 border-[#D3423E] rounded-3xl flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <FaFileExport color="#D3423E" />
                  CSV
                </button>

                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl border-2 border-[#D3423E] flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <FaFileExport color="#D3423E" />
                  PDF
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {dateFilterActive && (
                <span className="bg-orange-400 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Fecha: {startDate} → {endDate}
                  <button
                    onClick={() => clearFilter("date")}
                    className="font-bold"            >
                    ×
                  </button>
                </span>
              )}
            </div>
            <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm text-left text-gray-500 rounded-2xl">
                <thead className="text-xs sm:text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-3 uppercase">Referencia</th>
                    <th className="px-4 py-3 uppercase">Fecha de creación</th>
                    <th className="px-4 py-3 uppercase">Cliente</th>
                    <th className="px-4 py-3 uppercase">Tipo de Pago</th>
                    <th className="px-4 py-3 uppercase">Total</th>
                    <th className="px-4 py-3 uppercase">Total Cobrado</th>
                    <th className="px-4 py-3 uppercase">Saldo por cobrar</th>
                    <th className="px-4 py-3 uppercase">Días de mora</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item) => (
                    <tr key={item._id} onClick={() => handleRowClick(item)} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{item.receiveNumber}</td>
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
                      <td className="px-4 py-3 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                      <td className="px-4 py-3 text-gray-900 font-bold">
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
                          <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                            CHEQUE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900">Bs. {item.totalAmount}</td>
                      <td className="px-4 py-3 text-gray-900">Bs. {item.totalPagado}</td>
                      <td className="px-4 py-3 text-gray-900">Bs. {item.restante}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {calculateDaysRemaining(item.dueDate, item.creationDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={8}>
                      <div className="flex justify-end px-6 py-4 text-lg text-gray-700 bg-gray-200 border-t mt-2 border-gray-300">
                        <span className="font-bold">Total: Bs. {totalAmountSum.toFixed(2)}</span>

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
                  <nav className="flex items-center justify-center pt-4 space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1
                        ? "text-[#D3423E] cursor-not-allowed"
                        : "text-[#D3423E] font-bold"
                        }`}
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
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages
                        ? "text-[#D3423E] cursor-not-allowed"
                        : "text-[#D3423E] font-bold"
                        }`}
                    >
                      ▶
                    </button>
                  </nav>
                </div>
              )}
            </div>


          </div>
        </div>
      )}
    </div>

  );
}
