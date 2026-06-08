import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV, FaCheck, FaTrash } from "react-icons/fa";
import { ORDER_STATUS_CONFIG, ACCOUNT_STATUS_CONFIG, PAY_STATUS_CONFIG } from "../../constants/orderConfigs";
import { SkeletonTable } from "../../utils/SkeletonLoading";
import { EmptyState } from "../../utils/StatCard";

const RowMenu = ({ item, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const disabled = ["deliver", "En Ruta", "aproved"].includes(item.orderStatus);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FaEllipsisV className="text-gray-600" />
      </button>
      {open && !disabled && (
        <div
          className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onEdit(item); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <FaCheck className="text-green-600" size={11} />
            </div>
            Confirmar pedido
          </button>
          <button
            onClick={() => { onDelete(item); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
          >
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <FaTrash className="text-red-600" size={10} />
            </div>
            Eliminar pedido
          </button>
        </div>
      )}
    </div>
  );
};

export const OrdersTable = ({
  salesData, initialLoading, tableLoading, hasActiveFilters,
  onRowClick, onEditClick, onDeleteClick, clearAllFilters, onCreate,
}) => {
  if (initialLoading || tableLoading) return <SkeletonTable />;
  if (salesData.length === 0) {
    return <EmptyState hasFilters={hasActiveFilters} onClear={clearAllFilters} onCreate={onCreate} />;
  }

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-4 py-3.5 font-black tracking-wider">Fecha</th>
            <th className="px-4 py-3.5 font-black tracking-wider">Ciudad</th>
            <th className="px-4 py-3.5 font-black tracking-wider">Cliente</th>
            <th className="px-4 py-3.5 font-black tracking-wider">Tipo</th>
            <th className="px-4 py-3.5 font-black tracking-wider">Vendedor</th>
            <th className="px-4 py-3.5 font-black tracking-wider">Pago</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-right">Total</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-right">Saldo</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-center">Mora</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-center">Estado</th>
            <th className="px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {salesData.map((item) => {
            const sc = ORDER_STATUS_CONFIG[item.orderStatus];
            const StatusIcon = sc?.icon;
            return (
              <tr
                key={item._id}
                onClick={() => onRowClick(item)}
                className="border-b border-gray-100 hover:bg-red-50/30 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3.5">
                  {item.creationDate ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {new Date(item.creationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(item.creationDate).getFullYear()} · {new Date(item.creationDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  {item.region ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-100 whitespace-nowrap">
                      {item.region}
                    </span>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center text-[11px] font-black text-[#D3423E] flex-shrink-0 ring-2 ring-white shadow-sm">
                      {item.id_client?.name?.[0]}{item.id_client?.lastName?.[0]}
                    </div>
                    <span className="font-bold text-gray-900 whitespace-nowrap">
                      {item.id_client?.name} {item.id_client?.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {ACCOUNT_STATUS_CONFIG[item.accountStatus] && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${ACCOUNT_STATUS_CONFIG[item.accountStatus]}`}>
                      {item.accountStatus.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-700 text-[13px]">
                  {item.salesId?.fullName} {item.salesId?.lastName}
                </td>
                <td className="px-4 py-3.5">
                  {PAY_STATUS_CONFIG[item.payStatus] && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${PAY_STATUS_CONFIG[item.payStatus]}`}>
                      {item.payStatus.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-black text-gray-900 tabular-nums">
                    Bs. {Number(item.totalAmount).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {item.restante > 0 ? (
                    <span className="font-black text-[#D3423E] tabular-nums text-[13px]">
                      Bs. {Number(item.restante).toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black border border-green-100">
                      PAGADO
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {item.diasMora > 0 ? (
                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-full">
                      {item.diasMora}d
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {sc && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${sc.color}`}>
                      <StatusIcon className={sc.iconColor} size={11} />
                      <span>{sc.label}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <RowMenu item={item} onEdit={onEditClick} onDelete={onDeleteClick} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};