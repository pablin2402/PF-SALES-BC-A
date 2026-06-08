import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";

export const exportClientsToExcel = async ({ searchTerm, selectedSaler, selectedRegion, user, token, onError }) => {
  const payload = { id_owner: user, page: 1, limit: 10000, clientName: searchTerm };
  if (selectedSaler) payload.sales_id = selectedSaler;
  if (selectedRegion) payload.region = selectedRegion;

  try {
    const r = await axios.post(API_URL + "/whatsapp/client/list/id", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = r.data.clients || [];
    if (!data.length) return;

    const ws = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        Nombre: `${item.name || ""} ${item.lastName || ""}`.trim(),
        Categoría: item.userCategory || "",
        Dirección: item.client_location?.direction || "",
        Teléfono: item.number || "",
        Vendedor: item.sales_id ? `${item.sales_id.fullName} ${item.sales_id.lastName}` : "Sin asignar",
        Ciudad: item.region || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) {
    onError?.("No se pudo exportar la lista");
  }
};