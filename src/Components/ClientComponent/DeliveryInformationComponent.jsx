import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFileExport, FaFilePdf, FaFileExcel } from "react-icons/fa6";
import { jsPDF } from "jspdf";
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaCalendarAlt, FaCheckCircle, FaExclamationCircle, FaClock, FaShoppingCart, FaDollarSign, FaTimes, FaCity, FaFilter, FaTruck, FaBoxOpen, FaUser } from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import { motion } from "framer-motion";
import { ProfileFullSkeleton, ProfileTableSkeleton } from "../../utils/ProfileCardLoaders";

const ACCOUNT_STATUS_CONFIG = {
  "Crédito": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "CRÉDITO" },
  "Contado": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "CONTADO" },
  "Cheque": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", label: "CHEQUE" }
};

export default function DeliveryInformationComponent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [idClient, setClientId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEstadoPago, setSelectedEstadoPago] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState(0);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchClientData = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/id",
        { _id: id, id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      setClientId(data?._id || "");
      setClient(data);
    } catch (error) {
      console.error("Error al obtener los datos del repartidor", error);
    } finally {
      setLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const fetchProducts = useCallback(async (pageNumber = 1) => {
    setLoadingTable(true);
    try {
      const payload = {
        id_owner: user,
        orderTrackId: idClient,
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
      const response = await axios.post(API_URL + "/whatsapp/order/deliver/id", payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.total || response.data.orders?.length || 0);
    } catch (error) {
      console.error("Error al obtener los pedidos", error);
      setSalesData([]);
    } finally {
      setLoadingTable(false);
    }
  }, [user, idClient, itemsPerPage, startDate, endDate, selectedEstadoPago, token]);

  useEffect(() => {
    if (idClient) fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idClient, page, itemsPerPage, selectedEstadoPago]);

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

  const clearFilter = (type) => {
    if (type === 'date') {
      setStartDate('');
      setEndDate('');
      setDateFilterActive(false);
      setPage(1);
      setTimeout(() => fetchProducts(1), 0);
    }
    if (type === 'status') {
      setSelectedEstadoPago('');
      setPage(1);
    }
  };

  const handleRowClick = (item) => {
    navigate(`/deliver/order/${item._id}`, { state: { products: item.products, files: item } });
  };

  const exportToExcel = async () => {
    try {
      const payload = {
        id_owner: user,
        orderTrackId: idClient,
        page: 1,
        limit: items || 1000,
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      if (selectedEstadoPago) {
        payload.payStatus = selectedEstadoPago;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/deliver/id", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = response.data.orders || [];

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => {
          const creationDateUTC = new Date(item.creationDate);
          creationDateUTC.setHours(creationDateUTC.getHours() - 4);
          return {
            "Número de Orden": item.receiveNumber,
            "Fecha de Venta": creationDateUTC.toISOString().replace('T', ' ').substring(0, 19),
            "Cliente": `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),
            "Vendedor": `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.trim(),
            "Tipo de pago": item.accountStatus || "",
            "Total pagado": item.totalPagado || 0,
            "Saldo": item.restante || 0,
            "Fecha prevista de pago": item.dueDate || "",
            "Total": item.totalAmount || 0,
          };
        })
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Entregas");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }),
        `Entregas_${client?.fullName || "repartidor"}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      setExportMenuOpen(false);
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const exportToPDF = async () => {
    try {
      const payload = {
        id_owner: user,
        orderTrackId: idClient,
        page: 1,
        limit: items || 1000,
      };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }
      if (selectedEstadoPago) {
        payload.payStatus = selectedEstadoPago;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/deliver/id", payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data.orders || [];

      const doc = new jsPDF();

      doc.setFillColor(211, 66, 62);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("REPORTE DE ENTREGAS", 15, 20);

      try {
        doc.addImage("/camacho.jpeg", "PNG", 175, 5, 25, 20);
      } catch (e) {
        console.warn("Logo no disponible");
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Repartidor: ${client?.fullName || ""} ${client?.lastName || ""}`, 15, 42);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Fecha del reporte: ${new Date().toLocaleDateString("es-ES")}`, 15, 49);
      if (startDate && endDate) {
        doc.text(`Período: ${startDate} → ${endDate}`, 15, 55);
      }

      const totalVentas = data.reduce((a, i) => a + (i.totalAmount || 0), 0);
      const totalPagado = data.reduce((a, i) => a + (i.totalPagado || 0), 0);
      const deuda = data.reduce((a, i) => a + (i.restante || 0), 0);

      const drawCard = (x, y, title, value, color) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220);
        doc.roundedRect(x, y, 60, 20, 2, 2, "FD");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.setFont(undefined, 'normal');
        doc.text(title, x + 4, y + 6);
        doc.setFontSize(11);
        doc.setTextColor(...color);
        doc.setFont(undefined, 'bold');
        doc.text(value, x + 4, y + 15);
      };

      drawCard(15, 62, "Total entregado", `Bs. ${totalVentas.toFixed(2)}`, [33, 37, 41]);
      drawCard(80, 62, "Cobrado", `Bs. ${totalPagado.toFixed(2)}`, [40, 167, 69]);
      drawCard(145, 62, "Por cobrar", `Bs. ${deuda.toFixed(2)}`, [220, 53, 69]);

      const rows = data.map((item) => [
        item.receiveNumber || "-",
        item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : '',
        `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),
        item.accountStatus || "-",
        item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : "-",
        `Bs. ${(item.totalAmount || 0).toFixed(2)}`,
        `Bs. ${(item.totalPagado || 0).toFixed(2)}`,
        `Bs. ${(item.restante || 0).toFixed(2)}`,
        calculateDaysRemaining(item.dueDate),
      ]);

      doc.autoTable({
        startY: 90,
        head: [["Ref", "Fecha", "Cliente", "Tipo", "Venc.", "Total", "Pagado", "Saldo", "Mora"]],
        body: rows,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [211, 66, 62],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          halign: "center"
        },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      const pages = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pages}`, 170, 290);
      }

      doc.save(`Entregas_${client?.fullName || "repartidor"}_${new Date().toISOString().slice(0, 10)}.pdf`);
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

  if (loading) {
    return <ProfileFullSkeleton />;
  }

  if (!client) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaExclamationCircle className="text-red-500 text-5xl mx-auto mb-3" />
          <p className="text-gray-700 font-bold text-lg">Repartidor no encontrado</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700"
          >
            Volver
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
                {client.active !== false && (
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                    <FaCheckCircle className="text-white" size={11} />
                  </span>
                )}
              </div>

              <div className="flex-1 sm:pt-12">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="bg-red-100 text-[#D3423E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <FaTruck size={9} /> Repartidor
                  </span>
                  {client.active !== false && (
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Activo
                    </span>
                  )}
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
            icon={<FaBoxOpen />}
            label="Entregas"
            value={items}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon={<FaDollarSign />}
            label="Total entregado"
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
                  Pedidos asignados
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dateFilterActive || selectedEstadoPago ? "Resultados filtrados" : "Mostrando todas las entregas"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Desde</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hasta</label>
                          <input
                            type="date"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                          />
                        </div>
                      </div> 

                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none z-10" />
                  <select
                    value={selectedEstadoPago}
                    onChange={(e) => { setSelectedEstadoPago(e.target.value); setPage(1); }}
                    className="app-select"
                  >
                    <option value="">Todos los estados</option>
                    <option value="Pagado">Pagados</option>
                    <option value="Pendiente">Con deuda</option>
                  </select>
                </div>

                <button
                  onClick={handleFilterClick}
                  className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <HiFilter size={14} />
                  Filtrar
                </button>

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
                      <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
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

            {(dateFilterActive || selectedEstadoPago) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {dateFilterActive && (
                  <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                    <FaCalendarAlt size={10} />
                    {startDate} → {endDate}
                    <button onClick={() => clearFilter("date")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {selectedEstadoPago && (
                  <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                    Estado: {selectedEstadoPago === "Pendiente" ? "Con deuda" : "Pagados"}
                    <button onClick={() => clearFilter("status")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {loadingTable ? (
            <ProfileTableSkeleton />
          ) : salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaBoxOpen className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-semibold">Sin entregas</p>
              <p className="text-sm text-gray-500 mt-1">
                {dateFilterActive || selectedEstadoPago ? "No hay entregas con esos filtros" : "Este repartidor todavía no tiene pedidos asignados"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
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
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
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
                          <span className="text-red-700 font-bold flex items-center gap-1 text-xs">
                            <FaClock size={10} /> {days}d en mora
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-end mb-3 pb-3 border-b border-gray-200">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total general</p>
                    <p className="text-2xl font-bold text-[#D3423E]">Bs. {totalAmountSum.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>
                      Mostrando <strong className="text-gray-900">{salesData.length}</strong> de <strong className="text-gray-900">{items}</strong> entregas
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
                    <nav className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        ← Anterior
                      </button>
                      <button
                        onClick={() => setPage(1)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        1
                      </button>
                      {page > 3 && <span className="px-1 text-gray-400">…</span>}
                      {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                        .filter((p) => p > 1 && p < totalPages)
                        .map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === p ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                          >
                            {p}
                          </button>
                        ))}
                      {page < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}
                      {totalPages > 1 && (
                        <button
                          onClick={() => setPage(totalPages)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                        >
                          {totalPages}
                        </button>
                      )}
                      <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        Siguiente →
                      </button>
                    </nav>
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