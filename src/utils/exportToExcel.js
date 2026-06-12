import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportDeliveryToExcel = (data) => {
  if (!data?.length) return;

  const rows = data.map(item => ({
    "Nombre": `${item.fullName || ""} ${item.lastName || ""}`.trim(),
    "Correo": item.email || "",
    "Teléfono": item.phoneNumber || "",
    "Dirección": item.client_location?.direction || "",
    "Ciudad": item.region || "",
    "Estado": item.active ? "Activo" : "Inactivo",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Repartidores");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const filename = `Repartidores_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), filename);
};