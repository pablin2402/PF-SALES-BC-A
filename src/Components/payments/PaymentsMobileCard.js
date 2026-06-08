import React from "react";
import { FaReceipt, FaLink } from "react-icons/fa";
import { PAYMENT_STATUS_CONFIG } from "../../constants/paymentConfig";

export const PaymentsMobileCards = ({ salesData, onOpenModal }) => {
  if (!salesData.length) {
    return (
      <div className="lg:hidden text-center py-12 text-gray-400">
        <FaReceipt className="text-4xl mb-3 mx-auto text-gray-200" />
        <p className="font-bold text-gray-500">Sin pagos</p>
      </div>
    );
  }
  return (
    <div className="lg:hidden p-4 space-y-3">
      {salesData.map((item) => {
        const sc = PAYMENT_STATUS_CONFIG[item.paymentStatus];
        const StatusIcon = sc?.icon;
        const hasChain = !!item.txHash;
        return (
          <div
            key={item._id}
            onClick={() => onOpenModal(item)}
            className={`bg-white border rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] ${
              hasChain ? "border-purple-200 bg-gradient-to-br from-purple-50/50 to-white" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-black text-gray-900">#{item.orderId?.receiveNumber}</p>
                <p className="text-[11px] text-gray-400 font-medium">
                  {new Date(item.creationDate).toLocaleDateString("es-ES")}
                </p>
              </div>
              {sc && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-black ${sc.bgColor} ${sc.textColor} ${sc.borderColor}`}>
                  <StatusIcon size={10} /> {sc.label}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-700 mb-3">
              {item.id_client?.name} {item.id_client?.lastName}
            </p>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-xs">
                {hasChain ? (
                  <span className="text-purple-700 font-black flex items-center gap-1">
                    <FaLink size={10} /> En blockchain
                  </span>
                ) : (
                  <span className="text-gray-400">Sin blockchain</span>
                )}
              </span>
              <span className="font-black text-gray-900">Bs. {Number(item.total).toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};