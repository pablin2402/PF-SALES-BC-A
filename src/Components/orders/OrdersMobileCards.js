import React from "react";
import { ORDER_STATUS_CONFIG, ACCOUNT_STATUS_CONFIG, PAY_STATUS_CONFIG } from "../../constants/orderConfigs";

export const OrdersMobileCards = ({ salesData, onRowClick }) => {
  if (!salesData || salesData.length === 0) return null;
  return (
    <div className="lg:hidden p-4 space-y-3">
      {salesData.map((item) => {
        const sc = ORDER_STATUS_CONFIG[item.orderStatus];
        const StatusIcon = sc?.icon;
        return (
          <div
            key={item._id}
            onClick={() => onRowClick(item)}
            className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-red-200 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center text-xs font-black text-[#D3423E] ring-2 ring-white shadow-sm">
                  {item.id_client?.name?.[0]}{item.id_client?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{item.id_client?.name} {item.id_client?.lastName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {new Date(item.creationDate).toLocaleDateString("es-ES")} · {item.region}
                  </p>
                </div>
              </div>
              {sc && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${sc.color}`}>
                  <StatusIcon className={sc.iconColor} size={10} />
                  {sc.label}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-3">
              {ACCOUNT_STATUS_CONFIG[item.accountStatus] && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${ACCOUNT_STATUS_CONFIG[item.accountStatus]}`}>
                  {item.accountStatus.toUpperCase()}
                </span>
              )}
              {PAY_STATUS_CONFIG[item.payStatus] && (
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${PAY_STATUS_CONFIG[item.payStatus]}`}>
                  {item.payStatus.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-3">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Vendedor</p>
                <p className="text-sm text-gray-700 font-semibold">{item.salesId?.fullName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
                <p className="text-lg font-black text-gray-900">Bs. {Number(item.totalAmount).toFixed(2)}</p>
                {item.restante > 0 && (
                  <p className="text-[11px] text-[#D3423E] font-bold">Saldo: Bs. {Number(item.restante).toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};