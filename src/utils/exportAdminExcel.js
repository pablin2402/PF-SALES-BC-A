import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";

export const exportToExcel = async ({salesData}) => {

    if (!salesData.length) return;
    const ws = XLSX.utils.json_to_sheet(
      salesData.map(item => ({
        "Nombre": `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.trim(),
        "Correo": item.salesId?.email || "",
        "Teléfono": item.salesId?.phoneNumber || "",
        "Ciudad": item.salesId?.region || ""
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Administradores");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }),
      `Administradores_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

