import { FaExclamationCircle, FaCheckCircle, FaTruck, FaTimesCircle, FaBoxOpen } from "react-icons/fa";

export const ORDER_STATUS_CONFIG = {
  created: { label: "Creado", icon: FaExclamationCircle, color: "bg-yellow-100 text-yellow-700 border-yellow-300", iconColor: "text-yellow-500" },
  aproved: { label: "Aprobado", icon: FaCheckCircle, color: "bg-green-100 text-green-700 border-green-300", iconColor: "text-green-500" },
  "En Ruta": { label: "En Ruta", icon: FaTruck, color: "bg-blue-100 text-blue-700 border-blue-300", iconColor: "text-blue-500" },
  cancelled: { label: "Cancelado", icon: FaTimesCircle, color: "bg-red-100 text-red-700 border-red-300", iconColor: "text-red-500" },
  deliver: { label: "Entregado", icon: FaBoxOpen, color: "bg-emerald-100 text-emerald-700 border-emerald-300", iconColor: "text-emerald-500" },
};

export const ACCOUNT_STATUS_CONFIG = {
  "Crédito": "bg-yellow-100 text-yellow-800",
  "Contado": "bg-green-500 text-white",
  "Cheque": "bg-blue-500 text-white",
};

export const PAY_STATUS_CONFIG = {
  "Pagado": "bg-green-100 text-green-700",
  "Pendiente": "bg-red-100 text-red-700",
};
export const REGION_OPTIONS = [
  { value: "", label: "Todas las ciudades" },
  { value: "TOTAL CBB", label: "Cochabamba" },
  { value: "TOTAL SC", label: "Santa Cruz" },
  { value: "TOTAL LP", label: "La Paz" },
  { value: "TOTAL OR", label: "Oruro" },
];