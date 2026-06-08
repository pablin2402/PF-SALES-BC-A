import React from "react";
import { FaReceipt, FaEllipsisV, FaLink } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import { PAYMENT_STATUS_CONFIG, truncateHash } from "../../constants/paymentConfig";

export const PaymentsTable = ({ salesData, onOpenModal }) => (
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 border-b-2 border-gray-200">
        <tr>
          <th className="px-4 py-3.5 font-black tracking-wider">Nota</th>
          <th className="px-4 py-3.5 font-black tracking-wider">Fecha</th>
          <th className="px-4 py-3.5 font-black tracking-wider">Vendedor</th>
          <th className="px-4 py-3.5 font-black tracking-wider">Cliente</th>
          <th className="px-4 py-3.5 font-black tracking-wider text-right">Pago</th>
          <th className="px-4 py-3.5 font-black tracking-wider text-right">Total</th>
          <th className="px-4 py-3.5 font-black tracking-wider text-right">Deuda</th>
          <th className="px-4 py-3.5 font-black tracking-wider text-center">Estado</th>
          <th className="px-4 py-3.5 font-black tracking-wider text-center">Blockchain</th>
          <th className="px-4 py-3.5"></th>
        </tr>
      </thead>
      <tbody>
        {salesData.length > 0 ? salesData.map((item) => {
          const sc = PAYMENT_STATUS_CONFIG[item.paymentStatus];
          const StatusIcon = sc?.icon;
          const hasChain = !!item.txHash;

          return (
            <tr
              key={item._id}
              className={`border-b border-gray-100 transition-all hover:bg-gray-50 cursor-pointer ${
                hasChain ? "border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent" : ""
              }`}
              onClick={() => onOpenModal(item)}
            >
              <td className="px-4 py-3.5">
                <span className="font-black text-gray-900">#{item.orderId?.receiveNumber}</span>
              </td>
              <td className="px-4 py-3.5">
                {item.creationDate ? (
                  <div>
                    <p className="font-bold text-gray-900">
                      {new Date(item.creationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(item.creationDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ) : "—"}
              </td>
              <td className="px-4 py-3.5 text-gray-700 text-[13px] font-medium">
                {(item.sales_id || item.delivery_id)?.fullName} {(item.sales_id || item.delivery_id)?.lastName}
              </td>
              <td className="px-4 py-3.5 font-bold text-gray-900">
                {item.id_client?.name} {item.id_client?.lastName}
              </td>
              <td className="px-4 py-3.5 text-right font-black text-gray-900">
                Bs. {Number(item.total).toFixed(2)}
              </td>
              <td className="px-4 py-3.5 text-right text-gray-700 font-medium">
                Bs. {Number(item.orderId?.totalAmount || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3.5 text-right">
                <span className={item.debt > 0 ? "font-black text-[#D3423E]" : "font-bold text-green-600"}>
                  {item.debt !== undefined ? `Bs. ${item.debt.toFixed(2)}` : "—"}
                </span>
              </td>
              <td className="px-4 py-3.5">
                {sc && (
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black ${sc.bgColor} ${sc.textColor} ${sc.borderColor}`}>
                      <StatusIcon size={10} /> {sc.label}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                  {hasChain ? (
                    <a
                      href={`https://polygonscan.com/tx/${item.txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="group flex flex-col items-center"
                    >
                      <span className="text-[11px] font-mono text-purple-700 font-black">
                        {truncateHash(item.txHash, 8, 6)}
                      </span>
                      <span className="text-[10px] text-purple-400 flex items-center gap-1 group-hover:text-purple-600 transition-colors">
                        Polygon <FiExternalLink size={9} />
                      </span>
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenModal(item)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaEllipsisV className="text-gray-500" size={14} />
                </button>
              </td>
            </tr>
          );
        }) : (
          <tr>
            <td colSpan="10" className="px-6 py-20 text-center">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <FaReceipt className="text-5xl mb-3 text-gray-200" />
                <p className="text-lg font-bold text-gray-500">No hay pagos</p>
                <p className="text-sm mt-1">Intenta ajustar los filtros</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);