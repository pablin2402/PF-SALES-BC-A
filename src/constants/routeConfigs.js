import { getChannelConfig } from "../utils/ClientMarkerIcons";

export const ACCOUNT_STATUS_CONFIG = {
  "Crédito": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "CRÉDITO" },
  "Contado": { color: "bg-green-100 text-green-800 border-green-300", label: "CONTADO" },
  "Cheque": { color: "bg-blue-100 text-blue-800 border-blue-300", label: "CHEQUE" },
};

export const FALLBACK_IMAGE = "https://us.123rf.com/450wm/tkacchuk/tkacchuk2004/tkacchuk200400017/143745488-no-hay-icono-de-imagen-vector-de-línea-editable-no-hay-imagen-no-hay-foto-disponible-o-no-hay.jpg";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const OPTIMIZATION_METHOD = "Nearest Neighbor + 2-opt + CVRP Capacity Split";
export const TABS = { PEDIDOS: "pedidos", PLAN: "plan" };
export const GOOGLE_MAPS_LIBRARIES = ["maps"];

export const SHIMMER_STYLE = {
  background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s linear infinite",
};

export const buildOrderedChannelMarker = (orderIndex, channel, tripColor = "#D3423E", pulsing = false) => {
  const config = getChannelConfig(channel);
  const size = 52;
  const ringOpacity = pulsing ? 0.4 : 0;
  const imageSrc = config.imageBase64 || null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><filter id="ds-${orderIndex}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="0" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="ic-${orderIndex}"><circle cx="${size / 2}" cy="${size / 2}" r="20"/></clipPath></defs><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${tripColor}" opacity="${ringOpacity}"/><circle cx="${size / 2}" cy="${size / 2}" r="22" fill="white" stroke="${tripColor}" stroke-width="3" filter="url(#ds-${orderIndex})"/>${imageSrc ? `<image href="${imageSrc}" x="${size / 2 - 14}" y="${size / 2 - 14}" width="28" height="28" clip-path="url(#ic-${orderIndex})" preserveAspectRatio="xMidYMid meet"/>` : `<text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="${config.colorDark}">${config.emoji}</text>`}<circle cx="${size - 11}" cy="11" r="10" fill="${tripColor}" stroke="white" stroke-width="2"/><text x="${size - 11}" y="15" text-anchor="middle" fill="white" font-size="11" font-weight="900" font-family="Arial, sans-serif">${orderIndex + 1}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const buildDepotIcon = () => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><defs><filter id="depot-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="0" dy="2" result="offsetblur"/><feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="28" cy="28" r="24" fill="#111827" stroke="white" stroke-width="3" filter="url(#depot-shadow)"/><g transform="translate(15 14)" fill="white"><path d="M13 0 L0 10 L0 22 L26 22 L26 10 Z M11 22 L11 14 L15 14 L15 22" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g></svg>`)}`;

export const generateGroupId = () => `OPT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const buildMarkerFromOrder = (location) => ({
  _id: location._id,
  region: location.region,
  orderStatus: location.orderStatus,
  pagosAcumulados: location.pagosConAcumulado,
  products: location.products,
  salesId: location.salesId,
  receiveNumber: location.receiveNumber,
  totalAmount: location.totalAmount,
  totalPagado: location.totalPagado,
  accountStatus: location.accountStatus,
  clientId: location.id_client?._id,
  name: location.id_client?.name,
  lastName: location.id_client?.lastName,
  profilePicture: location.id_client?.identificationImage,
  userCategory: location.id_client?.userCategory || location.userCategory,
  client_location: location.id_client?.client_location || location.client_location,
  visitStatus: false, visitStatus1: "Sin visitar", visitTime: null,
  orderTaken: false, visitStartTime: null, visitEndTime: null,
  tripTime: null, distanceTrip: null, timeToPlace: null,
});