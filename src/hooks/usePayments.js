import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { JsonRpcProvider } from "ethers";
import { API_URL } from "../config";
import { extractTxHash, extractBlockNumber, extractContractAddress, POLYGON_RPC_URLS } from "../constants/paymentConfig";

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("RPC timeout")), ms))]);

export const usePayments = () => {
  const [salesData, setSalesData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const fetchPayments = useCallback(async (pageNum = 1) => {
    setTableLoading(true);
    try {
      const payload = { id_owner: user, page: pageNum, limit: itemsPerPage, clientName: searchTerm };
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
        setDateFilterActive(true);
      }
      const res = await axios.post(API_URL + "/whatsapp/order/pay/list/id", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = res.data.data || [];
      setSalesData(raw.map((item) => ({
        ...item,
        txHash: extractTxHash(item),
        blockNumber: extractBlockNumber(item),
        contractAddress: extractContractAddress(item),
      })));
      setItems(res.data.pagination?.totalRecords || 0);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (e) {
      setSalesData([]);
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  }, [user, token, itemsPerPage, searchTerm, startDate, endDate]);

  useEffect(() => { fetchPayments(page); }, [page, itemsPerPage, fetchPayments]);

  const clearDateFilter = () => {
    setStartDate(""); setEndDate(""); setDateFilterActive(false);
    fetchPayments(1);
  };

  const applyDateFilter = () => { setPage(1); fetchPayments(1); };

  const updateStatus = async (id, orderId, status) => {
    const res = await axios.put(API_URL + "/whatsapp/order/pay/status/id",
      { _id: id, paymentStatus: status, reviewer: id_user },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 200) {
      const trackId = typeof orderId === "object" && orderId !== null ? orderId._id : orderId;
      await axios.post(API_URL + "/whatsapp/order/track", {
        orderId: trackId, eventType: "Ha aprobado un pago",
        triggeredBySalesman: id_user, triggeredByDelivery: "", triggeredByUser: "",
        location: { lat: 0, lng: 0 },
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchPayments(1);
    }
  };

  const verifyOnChain = async (txHash) => {
    for (const url of POLYGON_RPC_URLS) {
      try {
        const provider = new JsonRpcProvider(url, { chainId: 137, name: "polygon" });
        const receipt = await withTimeout(provider.getTransactionReceipt(txHash), 5000);
        if (receipt) return { exists: true, blockNumber: receipt.blockNumber, status: receipt.status, from: receipt.from, to: receipt.to };
      } catch (e) { continue; }
    }
    return { exists: false };
  };

  const stats = {
    total: salesData.length,
    ingresados: salesData.filter((s) => s.paymentStatus === "paid").length,
    confirmados: salesData.filter((s) => s.paymentStatus === "confirmado").length,
    rechazados: salesData.filter((s) => s.paymentStatus === "rechazado").length,
    enBlockchain: salesData.filter((s) => s.txHash).length,
  };
  const totalAmount = salesData.reduce((s, i) => s + (i.total || 0), 0);

  return {
    salesData, initialLoading, tableLoading, page, setPage, totalPages, items,
    itemsPerPage, setItemsPerPage, searchTerm, setSearchTerm,
    selectedFilter, setSelectedFilter, startDate, setStartDate,
    endDate, setEndDate, dateFilterActive, clearDateFilter, applyDateFilter,
    fetchPayments, updateStatus, verifyOnChain, stats, totalAmount,
  };
};