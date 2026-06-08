import { FaCheckCircle, FaTimesCircle, FaReceipt } from "react-icons/fa";

export const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: "Ingresado",
    bgColor: "bg-blue-100", textColor: "text-blue-700", borderColor: "border-blue-300",
    icon: FaReceipt,
  },
  confirmado: {
    label: "Confirmado",
    bgColor: "bg-green-100", textColor: "text-green-700", borderColor: "border-green-300",
    icon: FaCheckCircle,
  },
  rechazado: {
    label: "Rechazado",
    bgColor: "bg-red-100", textColor: "text-red-700", borderColor: "border-red-300",
    icon: FaTimesCircle,
  },
};
export const POLYGON_RPC_URLS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
  "https://polygon.drpc.org",
];
export const extractTxHash = (item) =>
  item?.txHash || item?.tx_hash || item?.transactionHash || item?.transaction_hash ||
  item?.hash || item?.blockchain?.txHash || item?.blockchain?.transactionHash ||
  item?.blockchain?.hash || item?.chain?.txHash || item?.chain?.hash ||
  item?.onChain?.txHash || null;

export const extractBlockNumber = (item) =>
  item?.blockNumber || item?.block_number || item?.block ||
  item?.blockchain?.blockNumber || item?.blockchain?.block || null;

export const extractContractAddress = (item) =>
  item?.contractAddress || item?.contract_address ||
  item?.blockchain?.contractAddress || null;

export const truncateHash = (hash, start = 6, end = 4) => {
  if (!hash) return "";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};