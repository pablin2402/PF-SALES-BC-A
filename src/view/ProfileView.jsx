import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileExport, FaFilePdf, FaFileExcel } from "react-icons/fa6";
import { jsPDF } from "jspdf";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import { HiFilter } from "react-icons/hi";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaUser, FaCalendarAlt, FaCheckCircle, FaExclamationCircle, FaClock, FaShoppingCart, FaDollarSign, FaTimes, FaCity, } from "react-icons/fa";
import { motion } from "framer-motion";
import { ModernPagination } from "../utils/ModernPagination";
import { ProfileFullSkeleton, ProfileTableSkeleton } from "../utils/ProfileCardLoaders";
const ACCOUNT_STATUS_CONFIG = {
  "Crédito": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "CRÉDITO" },
  "Contado": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "CONTADO" },
  "Cheque": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", label: "CHEQUE" }
};

export default function ProfileView() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [idClient, setClientId] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id = localStorage.getItem("id_user");

  const fetchClientData = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/sales/id",
        { _id: id, id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClientId(response.data._id);
      setClient(response.data);
    } catch (error) {
      console.error("Error al obtener los datos del perfil", error);
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const fetchProducts = useCallback(async (pageNum) => {
    setLoadingTable(true);
    try {
      const payload = {
        id_owner: user,
        salesId: id,
        page: pageNum,
        limit: itemsPerPage
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/sales", payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.total || 0);
    } catch (error) {
      console.error("Error al obtener los pedidos", error);
      setSalesData([]);
    } finally {
      setLoadingTable(false);
    }
  }, [user, id, itemsPerPage, startDate, endDate, token]);

  useEffect(() => {
    if (idClient) fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idClient, page, itemsPerPage]);

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((today - due) / (1000 * 60 * 60 * 24));
  };

  const handleFilterClick = () => {
    setPage(1);
    fetchProducts(1);
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setDateFilterActive(false);
    setPage(1);
    setTimeout(() => fetchProducts(1), 0);
  };

  const handleRowClick = (item) => {
    navigate(`/client/order/${item._id}`, { state: { products: item.products, files: item } });
  };
  const exportToExcel = async () => {
    try {
      const payload = { id_owner: user, salesId: id, page: 1, limit: items || 1000 };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/sales", payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allData = response.data.orders || [];

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => {
          const creationDateUTC = new Date(item.creationDate);
          creationDateUTC.setHours(creationDateUTC.getHours() - 4);
          return {
            "Número de Orden": item.receiveNumber,
            "Fecha de Venta": creationDateUTC.toISOString().replace('T', ' ').substring(0, 19),
            "Cliente": `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),
            "Tipo de pago": item.accountStatus || "",
            "Total pagado": item.totalPagado || 0,
            "Saldo": item.restante || 0,
            "Fecha prevista de pago": item.dueDate || "",
            "Total": item.totalAmount || 0,
          };
        })
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mis Ventas");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }),
        `Mis_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      setExportMenuOpen(false);
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const exportToPDF = async () => {
    try {
      const payload = { id_owner: user, salesId: id, page: 1, limit: items || 1000 };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/id/sales", payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allData = response.data.orders || [];

      const doc = new jsPDF();

      doc.setFillColor(211, 66, 62);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("MIS VENTAS", 15, 20);

      try {
        doc.addImage("/camacho.jpeg", "PNG", 175, 5, 25, 20);
      } catch (e) {
        console.warn("Logo no disponible");
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Vendedor: ${client?.fullName || ""} ${client?.lastName || ""}`, 15, 42);
      doc.text(`Fecha del reporte: ${new Date().toLocaleDateString("es-ES")}`, 15, 49);
      if (startDate && endDate) {
        doc.text(`Período: ${startDate} → ${endDate}`, 15, 56);
      }
      doc.text(`Total de pedidos: ${allData.length}`, 15, 63);
      doc.setFont(undefined, 'bold');
      doc.text(`Total vendido: Bs. ${allData.reduce((s, i) => s + (i.totalAmount || 0), 0).toFixed(2)}`, 15, 70);

      const tableColumn = ["Ref", "Fecha", "Cliente", "Tipo", "Total", "Pagado", "Saldo", "Días"];
      const tableRows = allData.map((item) => [
        item.receiveNumber || "-",
        item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : '',
        `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),
        item.accountStatus || "-",
        `Bs. ${(item.totalAmount || 0).toFixed(2)}`,
        `Bs. ${(item.totalPagado || 0).toFixed(2)}`,
        `Bs. ${(item.restante || 0).toFixed(2)}`,
        calculateDaysRemaining(item.dueDate)
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 78,
        theme: "striped",
        headStyles: {
          fillColor: [211, 66, 62],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: "center"
        },
        styles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      doc.save(`Mis_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportMenuOpen(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  const getInitials = (name, lastName) => {
    return ((name?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  };

  const totalAmountSum = salesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalPagadoSum = salesData.reduce((sum, item) => sum + (item.totalPagado || 0), 0);
  const totalSaldoSum = salesData.reduce((sum, item) => sum + (item.restante || 0), 0);
  const ordersWithOverdue = salesData.filter(item => calculateDaysRemaining(item.dueDate) > 0 && item.restante > 0).length;

  if (loading) return <ProfileFullSkeleton bg="bg-white" />;
  if (!client) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaExclamationCircle className="text-red-500 text-5xl mx-auto mb-3" />
          <p className="text-gray-700 font-bold text-lg">No se pudo cargar el perfil</p>
          <button
            onClick={fetchClientData}
            className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-br from-[#D3423E] to-red-700 relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="relative">
                {client.identificationImage ? (
                  <img
                    src={client.identificationImage}
                    alt={client.fullName}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#D3423E] to-red-700 border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-bold">
                    {getInitials(client.fullName, client.lastName)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-white" size={11} />
                </span>
              </div>

              <div className="flex-1 sm:pt-12">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-100 text-[#D3423E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Mi Perfil
                  </span>
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Activo
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.fullName} {client.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-[#D3423E] transition-colors">
                      <FaEnvelope className="text-[#D3423E]" size={11} />
                      {client.email}
                    </a>
                  )}
                  {client.phoneNumber && (
                    <a href={`tel:${client.phoneNumber}`} className="flex items-center gap-1 hover:text-[#D3423E] transition-colors">
                      <FaPhone className="text-[#D3423E]" size={11} />
                      {client.phoneNumber}
                    </a>
                  )}
                  {client.client_location?.direction && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-[#D3423E]" size={11} />
                      {client.client_location.direction}
                    </span>
                  )}
                  {client.region && (
                    <span className="flex items-center gap-1">
                      <FaCity className="text-[#D3423E]" size={11} />
                      {client.region.replace("TOTAL ", "")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<FaShoppingCart />}
            label="Mis pedidos"
            value={items}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon={<FaDollarSign />}
            label="Total vendido"
            value={`Bs. ${totalAmountSum.toFixed(2)}`}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            icon={<FaCheckCircle />}
            label="Cobrado"
            value={`Bs. ${totalPagadoSum.toFixed(2)}`}
            color="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            icon={<FaExclamationCircle />}
            label="Por cobrar"
            value={`Bs. ${totalSaldoSum.toFixed(2)}`}
            color="bg-red-100 text-red-700"
            warning={ordersWithOverdue > 0 ? `${ordersWithOverdue} en mora` : null}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaShoppingCart className="text-[#D3423E]" />
                  Mis pedidos
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dateFilterActive ? "Resultados filtrados por fecha" : "Historial completo de ventas"}
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Desde</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hasta</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <PrincipalBUtton onClick={handleFilterClick} icon={HiFilter}>
                  Filtrar
                </PrincipalBUtton>

                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                    className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 font-semibold text-sm"
                  >
                    <FaFileExport size={14} />
                    Exportar
                  </button>
                  {exportMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setExportMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20"
                      >
                        <button
                          onClick={exportToExcel}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FaFileExcel className="text-green-600" /> Excel (XLSX)
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FaFilePdf className="text-red-600" /> PDF
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {dateFilterActive && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                  <FaCalendarAlt size={10} />
                  {startDate} → {endDate}
                  <button onClick={clearFilter} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              </div>
            )}
          </div>

          {loadingTable ? (
            <ProfileTableSkeleton />
          ) : salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaShoppingCart className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-semibold">Sin pedidos</p>
              <p className="text-sm text-gray-500 mt-1">
                {dateFilterActive ? "No hay pedidos en este rango" : "Todavía no registraste pedidos"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-600 uppercase bg-white border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ref.</th>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold text-center">Tipo</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-right">Cobrado</th>
                      <th className="px-4 py-3 font-semibold text-right">Saldo</th>
                      <th className="px-4 py-3 font-semibold text-center">Mora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((item) => {
                      const config = ACCOUNT_STATUS_CONFIG[item.accountStatus];
                      const days = calculateDaysRemaining(item.dueDate);
                      const isOverdue = days > 0 && item.restante > 0;
                      return (
                        <tr
                          key={item._id}
                          onClick={() => handleRowClick(item)}
                          className="border-b border-gray-100 hover:bg-white transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900">#{item.receiveNumber}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {item.creationDate ? (
                              <div>
                                <p className="font-medium text-gray-900">
                                  {new Date(item.creationDate).toLocaleDateString("es-ES", {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(item.creationDate).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </p>
                              </div>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.id_client?.name} {item.id_client?.lastName}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {config && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} text-xs font-bold`}>
                                {config.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            Bs. {Number(item.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-semibold">
                            Bs. {Number(item.totalPagado || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={item.restante > 0 ? "text-[#D3423E] font-bold" : "text-gray-400"}>
                              Bs. {Number(item.restante || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                <FaClock size={9} />
                                {days}d
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden p-4 space-y-3">
                {salesData.map((item) => {
                  const config = ACCOUNT_STATUS_CONFIG[item.accountStatus];
                  const days = calculateDaysRemaining(item.dueDate);
                  const isOverdue = days > 0 && item.restante > 0;
                  return (
                    <div
                      key={item._id}
                      onClick={() => handleRowClick(item)}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900">#{item.receiveNumber}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.creationDate).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                        {config && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} text-xs font-bold`}>
                            {config.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2 flex items-center gap-1">
                        <FaUser size={10} className="text-gray-400" />
                        {item.id_client?.name} {item.id_client?.lastName}
                      </p>
                      <div className="flex justify-between pt-2 border-t border-gray-100 text-sm">
                        <span className="font-bold text-gray-900">Bs. {Number(item.totalAmount).toFixed(2)}</span>
                        {isOverdue && (
                          <span className="text-red-700 font-bold flex items-center gap-1">
                            <FaClock size={10} /> {days}d en mora
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="flex justify-end mb-3 pb-3 border-b border-gray-200">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total general</p>
                    <p className="text-2xl font-bold text-[#D3423E]">Bs. {totalAmountSum.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>
                      Mostrando <strong className="text-gray-900">{salesData.length}</strong> de <strong className="text-gray-900">{items}</strong> pedidos
                    </span>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="itemsPerPage" className="font-semibold">Mostrar:</label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setPage(1);
                        }}
                        className="app-select"
                      >
                        {[5, 10, 20, 50, 100].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <ModernPagination
                      page={page}
                      totalPages={totalPages}
                      onChange={setPage}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, color, warning }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        {warning && (
          <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
            <FaExclamationCircle size={9} />
            {warning}
          </p>
        )}
      </div>
    </div>
  </div>
);