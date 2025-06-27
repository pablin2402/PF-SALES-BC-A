import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileExport } from "react-icons/fa6";
import { jsPDF } from "jspdf";
import DateInput from "../LittleComponents/DateInput";

import { FaBuilding, FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";

export default function ClientInformationComponent() {
  const { id } = useParams();

  const [client, setClient] = useState();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [idClient, setClientId] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEstadoPago, setSelectedEstadoPago] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [items, setItems] = useState(5);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  
  const fetchClientData = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/info/id", {
        _id: id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setClientId(response.data[0]._id);
      setClient(response.data);
    } catch (error) {
      console.error("Error al obtener los datos del cliente", error);
    }
  }, [id, token]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const fetchProducts = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const payload = {
        id_owner: user,
        id_client: idClient,
        page: pageNumber,
        limit: itemsPerPage,
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);

      }
      if (selectedEstadoPago) {
        payload.payStatus = selectedEstadoPago;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/user", payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSalesData(response.data.orders || []);
      setTotalPages(response.data.totalPages);
      setItems(response.data.items);
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
      fetchProducts();
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
        id_client: idClient,
        page: 1,
        limit: items,
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);

      }
      if (selectedEstadoPago) {
        payload.estadoPago = selectedEstadoPago;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/user", payload,{
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
      saveAs(data, "ventas_por_clientes.xlsx");
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };
  const exportToPDF = async () => {
    try {
      const payload = {
        id_owner: user,
        id_client: idClient,
        page: 1,
        limit: items+1,
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);

      }
      if (selectedEstadoPago) {
        payload.estadoPago = selectedEstadoPago;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/user", payload,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const allData = response.data.orders;

      const doc = new jsPDF();
      doc.addImage("/camacho.jpeg", "PNG", 160, 10, 30, 30);
      doc.text("Reporte de Ventas", 15, 20);
      doc.text(`Cliente: ${client[0].name} ${client[0].lastName}`, 15, 40);

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

      doc.save("Reporte_Ventas.pdf");
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
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
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
        <div>
          <div className="w-full max-w-5xl gap-6">
            <div className="flex mt-4 mb-4 justify-start space-x-2">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                  <li className="inline-flex items-center" onClick={() => navigate(-1)}>
                    <button
                      onClick={() => navigate(-2)}
                      className="inline-flex items-center text-lg font-medium text-gray-900 "
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
                      Lista de clientes
                    </button>

                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                      </svg>
                      <button
                        onClick={() => navigate(-1)}
                        className="ms-1 text-lg font-medium text-gray-900 hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                      >
                        {client[0].name} {client[0].lastName}
                      </button>

                    </div>
                  </li>
                </ol>
              </nav>

            </div>

            <div className="w-full relative bg-white rounded-lg p-6 flex border border-gray-900 flex-col items-center">
              <div className="absolute -top-20 w-40 h-40 rounded-full overflow-hidden">
                <img
                  src={client[0].identificationImage || "https://via.placeholder.com/150"}
                  alt={client[0].name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-20 text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {client[0].name} {client[0].lastName}
                </h2>
                <div className="flex items-center gap-2 text-gray-900">
                  <FaBuilding color="#D3423E" />
                  <p>{client[0]?.company || "No disponible"}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-900">
                  <FaMapMarkerAlt color="#D3423E" />
                  <p>{client[0]?.client_location?.direction || "No disponible"}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-900">
                  <FaEnvelope color="#D3423E" />
                  <p>{client[0]?.email || "No disponible"}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-900">
                  <FaPhone color="#D3423E" />
                  <p>{client[0]?.number || "No disponible"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 w-full max-w-5xl">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex gap-2">
                <div className="flex items-center space-x-2">
               
                    <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />

                </div>

                <div className="flex items-center space-x-2">
                  
                                        <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />

                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedEstadoPago}
                    onChange={(e) => setSelectedEstadoPago(e.target.value)}
                    className="h-10 px-3 py-2 text-sm text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  >
                    <option value="">Mostrar Todos</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Falta pagar</option>
                  </select>
                </div>

                <button
                  onClick={handleFilterClick}
                  className="px-4 py-2 font-bold uppercase text-lg text-white rounded-3xl bg-[#D3423E] flex items-center gap-6"
                >
                  Filtrar
                </button>

              </div>

              <div className="flex justify-end items-center space-x-4">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] border-2 border-[#D3423E] rounded-3xl  flex items-center gap-2"
                >
                  <FaFileExport color="##726E6E" />
                  CSV
                </button>
             
                <button
                    onClick={exportToPDF}
                    className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl  border-2 border-[#D3423E] flex items-center gap-5"
                  >
                    <FaFileExport color="##726E6E" /> PDF
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
            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 uppercase">Referencia</th>
                    <th className="px-6 py-3 uppercase">Fecha de creación</th>
                    <th className="px-6 py-3 uppercase">Tipo de Pago</th>
                    <th className="px-6 py-3 uppercase">Total</th>
                    <th className="px-6 py-3 uppercase">Total Cobrado</th>
                    <th className="px-6 py-3 uppercase">Saldo por cobrar</th>
                    <th className="px-6 py-3 uppercase">Días de mora</th>
                    <th className="px-6 py-3 uppercase">Estado de pago</th>

                  </tr>
                </thead>
                <tbody>
                  {salesData.map((item) => (
                    <tr key={item._id} onClick={() => handleRowClick(item)} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{item.receiveNumber}</td>
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
                      <td className="px-6 py-4 text-gray-900">Bs. {item.totalAmount}</td>
                      <td className="px-6 py-4 text-gray-900">Bs. {item.totalPagado}</td>
                      <td className="px-6 py-4 text-gray-900">Bs. {item.restante}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {calculateDaysRemaining(item.dueDate, item.creationDate)}
                      </td>
                      <td className="px-6 py-4 text-m text-gray-900 font-bold">
                        {item.payStatus === "Pendiente" && (
                          <span className="bg-red-700 text-m text-white px-3.5 py-0.5 rounded-full">
                            DEUDA
                          </span>
                        )}
                        {item.payStatus === "Pagado" && (
                          <span className="bg-green-600 text-white px-2.5 py-0.5 rounded-full">
                            PAGADO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <div className="flex justify-end px-6 py-4 text-lg text-gray-700 bg-gray-100 border-t mb-2 mt-2 border-gray-300">
                  <span className="font-bold">Total: Bs. {totalAmountSum.toFixed(2)}</span>
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
                    <nav className="flex items-center justify-center pt-4 space-x-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1
                          ? "text-[#D3423E] font-bold cursor-not-allowed"
                          : "text-[#D3423E] hover:bg-gray-200"
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
        </div>
      )}
    </div>

  );
}
