import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";

export const exportProductsToExcel = async ({ searchTerm, selectedCategory, items, user, token }) => {
  try {
    const res = await axios.post(API_URL + "/whatsapp/product/id", {
      id_user: user, status: false, page: 1, limit: items || 1000,
      search: searchTerm, category: selectedCategory,
    }, { headers: { Authorization: `Bearer ${token}` } });

    const data = res.data.products || [];
    if (!data.length) return;

    const ws = XLSX.utils.json_to_sheet(data.map((item) => ({
      "Producto": item.productName || "",
      "Categoría": item.categoryId?.categoryName || "",
      "Precio": item.priceId?.price || 0,
      "Oferta": item.priceId?.offerPrice || "",
      "Descuento": item.priceId?.discount || "",
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `Productos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (e) { console.error("Error exportando productos", e); }
};