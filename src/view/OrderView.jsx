import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen } from "react-icons/fa";
import { useOrders } from "../hooks/useOrders";
import { OrdersStats } from "../Components/orders/OrdersStats";
import { OrdersFilters } from "../Components/orders/OrdersFilters";
import { OrdersTable } from "../Components/orders/OrdersTable";
import { OrdersMobileCards } from "../Components/orders/OrdersMobileCards";
import { OrderActionsModal } from "../Components/orders/OrderActionsModal";
import { DeleteOrderModal, PaymentWarningModal } from "../Components/orders/DeleteOrderModal";
import { exportOrdersToExcel } from "../utils/exportOrders";
import { ModernPagination } from "../utils/ModernPagination";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";

const OrderView = () => {
  const navigate = useNavigate();
  const orders = useOrders();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const filterByStatus = (status) => {
    const newStatus = orders.filters.selectedStatus === status ? "" : status;
    orders.updateFilter("selectedStatus", newStatus);
    setTimeout(() => { orders.fetchOrders(1, newStatus); orders.fetchCounts(newStatus); }, 0);
  };

  const handleRowClick = (item) => {
    navigate(`/client/order/${item.id_client}`, {
      state: { products: item.products, files: item, flag: true },
    });
  };

  const handleEdit = (item) => { setSelectedItem(item); setShowEditModal(true); };

  const handleDelete = (item) => {
    if (item.totalAmount === item.restante) setItemToDelete(item);
    else setShowPaymentWarning(true);
  };

  const handleExport = () => {
    const payload = {};
    Object.entries(orders.filters).forEach(([k, v]) => {
      if (!v) return;
      if (k === "inputValue") payload.fullName = v;
      else if (k === "selectedStatus") payload.status = v;
      else if (k === "selectedPaymentType") payload.paymentType = v;
      else if (k === "selectedSaler") payload.salesId = v;
      else if (k === "selectedPayment") payload.payStatus = v;
      else if (k === "selectedRegion") payload.region = v;
      else if (k === "startDate" || k === "endDate") payload[k] = v;
    });
    exportOrdersToExcel({ filters: payload, items: orders.items, user, token });
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-red-100">
              <FaBoxOpen className="text-[#D3423E]" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">Órdenes de venta</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">Gestiona todos los pedidos desde un solo lugar</p>
            </div>
          </div>
          <PrincipalBUtton onClick={() => navigate("/order/creation")}>Nuevo Pedido</PrincipalBUtton>
        </header>

        <OrdersStats
          counts={orders.counts}
          statsLoading={orders.statsLoading}
          selectedStatus={orders.filters.selectedStatus}
          onFilterByStatus={filterByStatus}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <OrdersFilters {...orders} onExport={handleExport} />
          <OrdersTable
            {...orders}
            onRowClick={handleRowClick}
            onEditClick={handleEdit}
            onDeleteClick={handleDelete}
            onCreate={() => navigate("/client/creation")}
          />
          <OrdersMobileCards salesData={orders.salesData} onRowClick={handleRowClick} />

          {!orders.initialLoading && !orders.tableLoading && orders.salesData.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-b from-gray-50/50 to-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Total: <strong className="text-gray-900">{orders.items}</strong> pedidos</span>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Mostrar:</label>
                  <select
                    value={orders.itemsPerPage}
                    onChange={(e) => { orders.setItemsPerPage(Number(e.target.value)); orders.setPage(1); }}
                    className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E]"
                  >
                    {[5, 10, 20, 50].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {orders.totalPages > 1 && (
                <ModernPagination page={orders.page} totalPages={orders.totalPages} onChange={orders.setPage} />
              )}
            </div>
          )}
        </div>
      </div>

      <OrderActionsModal
        open={showEditModal}
        item={selectedItem}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => { orders.fetchOrders(1); orders.fetchCounts(); }}
      />
      <DeleteOrderModal
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onSuccess={() => { orders.fetchOrders(1); orders.fetchCounts(); }}
      />
      <PaymentWarningModal
        open={showPaymentWarning}
        onClose={() => setShowPaymentWarning(false)}
      />
    </div>
  );
};

export default OrderView;
