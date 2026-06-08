export const FALLBACK_IMAGE = "https://via.placeholder.com/200?text=Sin+imagen";

export const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

export const ITEMS_PER_PAGE_OPTIONS = [5, 12, 20, 50, 100];

export const SORT_FIELDS = [
  { key: "name", label: "Producto" },
  { key: "price", label: "Precio" },
  { key: "category", label: "Categoría" },
];

export const sortProducts = (data, sortBy, sortOrder) => {
  return [...data].sort((a, b) => {
    let vA, vB;
    switch (sortBy) {
      case "name":
        vA = (a.productName || "").toLowerCase();
        vB = (b.productName || "").toLowerCase();
        break;
      case "price":
        vA = Number(a.priceId?.price || 0);
        vB = Number(b.priceId?.price || 0);
        break;
      case "category":
        vA = (a.categoryId?.categoryName || "").toLowerCase();
        vB = (b.categoryId?.categoryName || "").toLowerCase();
        break;
      default: return 0;
    }
    if (vA < vB) return sortOrder === "asc" ? -1 : 1;
    if (vA > vB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
};