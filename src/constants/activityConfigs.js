import { FaCheckCircle, FaPlayCircle } from "react-icons/fa";

export const DETAILS_CONFIG = {
  "Visita al cliente": {
    label: "En visita",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    icon: FaPlayCircle,
    iconColor: "text-green-500",
  },
  "Termina la visita": {
    label: "Visita finalizada",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    icon: FaCheckCircle,
    iconColor: "text-blue-500",
  },
};

export const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

export const getCurrentDateUTCMinus4 = () => {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() - 4);
  return now.toISOString().split("T")[0];
};