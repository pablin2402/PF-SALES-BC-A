import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";
import { extractTxHash, extractBlockNumber, extractContractAddress } from "../constants/paymentConfig";

export const exportPaymentsToExcel = async ({ searchTerm, startDate, endDate, items, user, token }) => {
  try {
    const payload = { id_owner: user, page: 1, limit: items || 10000, clientName: searchTerm };
    if (startDate && endDate) { payload.startDate = startDate; payload.endDate = endDate; }

    const res = await axios.post(API_URL + "/whatsapp/order/pay/list/id", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.data.data || [];
    if (!data.length) return;

    const ws = XLSX.utils.json_to_sheet(data.map((item) => {
      const d = new Date(item.creationDate);
      d.setHours(d.getHours() - 4);
      return {
        "Número de Orden": item.orderId?.receiveNumber,
        "Fecha de Pago": d.toISOString().replace("T", " ").substring(0, 19),
        "Vendedor": `${item.sales_id?.fullName || ""} ${item.sales_id?.lastName || ""}`.trim(),
        "Cliente": `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),
        "Estado": item.paymentStatus || "",
        "Pago": item.total || "",
        "Monto total": item.orderId?.totalAmount || "",
        "Deuda": item.debt?.toFixed(2) || "",
        "TX Hash": extractTxHash(item) || "",
        "Bloque": extractBlockNumber(item) || "",
        "Contrato": extractContractAddress(item) || "",
      };
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagos");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Pagos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) { console.error("Error exportando pagos", e); }
};