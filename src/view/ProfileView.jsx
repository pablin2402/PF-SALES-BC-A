import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileExport } from "react-icons/fa6";
import { jsPDF } from "jspdf";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import { HiFilter } from "react-icons/hi";
import Spinner from "../Components/LittleComponents/Spinner";

import { FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";

export default function ProfileView() {

  const [client, setClient] = useState();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [idClient, setClientId] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id = localStorage.getItem("id_user");

  const fetchClientData = useCallback(async () => {
    try {
      console.log(id,user)
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
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {loading ? (
       <Spinner/>
      ) : (
        <div className="p-6 mt-5 bg-white border border-gray-300 rounded-2xl shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="w-full max-w-5xl gap-6">
          <div className="w-full mt-10 relative pt-40 bg-white rounded-lg p-6 flex border border-gray-900 flex-col items-center">
          <div className="absolute top-10 w-40 h-40 rounded-full overflow-hidden">
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
                <div className="flex items-center gap-2 text-gray-900">
                  <FaMapMarkerAlt color="#D3423E" />
                  <p>{client.region || "No disponible"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 w-full max-w-5xl">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex gap-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                    }}
                    className="h-10 px-3 py-2 border text-sm text-gray-900 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                    }}
                    className="h-10 px-3 py-2 border text-sm text-gray-900 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500"
                  />
                </div>
             
                <PrincipalBUtton onClick={() => handleFilterClick()} icon={HiFilter}>Filtrar</PrincipalBUtton>
 
              </div>
              <div className="flex justify-end items-center space-x-4">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-white font-bold text-m text-[#D3423E] border-2 border-[#D3423E] rounded-3xl hover:text-[#D3423E] flex items-center gap-2"
                >
                  <FaFileExport color="##726E6E" />
                  csv
                </button>
               
                <PrincipalBUtton onClick={() => exportToPDF} icon={HiFilter}>PDF</PrincipalBUtton>
 
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
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-3xl overflow-hidden">
                <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 uppercase">Referencia</th>
                    <th className="px-6 py-3 uppercase">Fecha de creación</th>
                    <th className="px-6 py-3 uppercase">Cliente</th>
                    <th className="px-6 py-3 uppercase">Tipo de Pago</th>
                    <th className="px-6 py-3 uppercase">Total</th>
                    <th className="px-6 py-3 uppercase">Total Cobrado</th>
                    <th className="px-6 py-3 uppercase">Saldo por cobrar</th>
                    <th className="px-6 py-3 uppercase">Días de mora</th>
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
                          <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full">
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
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end px-6 py-4 text-lg text-gray-700 bg-gray-100 border-t border-b mb-2 mt-2 border-gray-300">
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
                      }}
                      className="border-2 border-gray-900 rounded-3xl px-2 py-1 text-m text-gray-700"
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
