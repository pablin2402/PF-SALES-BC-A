import React from "react";
import { HiOutlineDocumentAdd, HiOutlineCheckCircle } from "react-icons/hi";
import { MdLocalShipping, MdDoneAll, MdCancel } from "react-icons/md";
import { SkeletonStats } from "../utils/SkeletonLoading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { API_URL } from "../config";

const STAT_CARDS = [
  { key: "created", label: "Sin asignar", icon: HiOutlineDocumentAdd, accent: "blue" },
  { key: "aproved", label: "Aprobados", icon: HiOutlineCheckCircle, accent: "green" },
  { key: "En Ruta", label: "En Ruta", icon: MdLocalShipping, accent: "yellow" },
  { key: "deliver", label: "Entregados", icon: MdDoneAll, accent: "purple" },
  { key: "cancelled", label: "Cancelados", icon: MdCancel, accent: "red" },
];

const ACCENT_STYLES = {
  blue: { bg: "from-blue-500 to-blue-600", soft: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
  green: { bg: "from-green-500 to-emerald-600", soft: "bg-green-50", text: "text-green-600", ring: "ring-green-200" },
  yellow: { bg: "from-amber-500 to-orange-500", soft: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
  purple: { bg: "from-purple-500 to-purple-600", soft: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200" },
  red: { bg: "from-red-500 to-red-600", soft: "bg-red-50", text: "text-red-600", ring: "ring-red-200" },
};

const StatCard = ({ cfg, value, isActive, onClick }) => {
  const a = ACCENT_STYLES[cfg.accent];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 ${
        isActive
          ? `bg-gradient-to-br ${a.bg} text-white shadow-lg scale-[1.02]`
          : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isActive ? "bg-white/20" : a.soft
        }`}>
          <Icon className={isActive ? "text-white" : a.text} size={20} />
        </div>
        {isActive && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
            Activo
          </span>
        )}
      </div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
        isActive ? "text-white/80" : "text-gray-500"
      }`}>
        {cfg.label}
      </p>
      <p className={`text-2xl font-black ${isActive ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
    </button>
  );
};
export const exportOrdersToExcel = async ({
  filters = {},
  items,
  user,
  token,
}) => {

  const payload = {
    id_owner: user,
    page: 1,
    limit: items || 10000,
    ...filters,
  };

  try {
    const response = await axios.post(
      API_URL + "/whatsapp/order/id",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const allData = response.data.orders || [];

    if (!allData.length) return;

    const ws = XLSX.utils.json_to_sheet(
      allData.map((item) => {
        const creationDateUTC = new Date(item.creationDate);
        creationDateUTC.setHours(
          creationDateUTC.getHours() - 4
        );

        const formattedDate = creationDateUTC
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);

        return {
          "Código de Cliente": item._id,

          "Nombre":
            `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),

          "Fecha de confirmación": formattedDate,

          "Tipo de pago": item.accountStatus,

          "Vendedor":
            `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.trim(),

          "Fecha de Pago": item.dueDate
            ? new Date(item.dueDate).toLocaleDateString("es-ES")
            : new Date(item.creationDate).toLocaleDateString("es-ES"),

          "Estado de Pago": item.payStatus || "",

          "Saldo por pagar": item.restante,

          "Total": item.totalAmount,
        };
      })
    );

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Order_List"
    );

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(
      data,
      `Pedidos_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );

  } catch (error) {
    console.error(
      "Error exportando pedidos:",
      error
    );
  }
};
export const OrdersStats = ({ counts, statsLoading, selectedStatus, onFilterByStatus }) => {
  if (statsLoading) return <SkeletonStats />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {STAT_CARDS.map((cfg) => (
        <StatCard
          key={cfg.key}
          cfg={cfg}
          value={counts?.[cfg.key] || 0}
          isActive={selectedStatus === cfg.key}
          onClick={() => onFilterByStatus(cfg.key)}
        />
      ))}
    </div>
  );
};