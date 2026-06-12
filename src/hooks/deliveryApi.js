import axios from "axios";
import { API_URL } from "../config";

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const ownerId = () => localStorage.getItem("id_owner");

export const fetchDeliveryList = async ({ page, limit, searchTerm }) => {
  const { data } = await axios.post(
    `${API_URL}/whatsapp/delivery/list`,
    { id_owner: ownerId(), page, limit, searchTerm },
    authConfig()
  );
  return {
    data: data.data || [],
    totalPages: data.totalPages || 1,
    items: data.items || data.data?.length || 0,
  };
};

export const fetchDeliveryListAll = async ({ searchTerm, items }) => {
  const { data } = await axios.post(
    `${API_URL}/whatsapp/delivery/list`,
    { id_owner: ownerId(), page: 1, limit: items || 1000, searchTerm },
    authConfig()
  );
  return data.data || [];
};

export const updateDeliveryStatus = (id, active) =>
  axios.put(
    `${API_URL}/whatsapp/delivery/status`,
    { _id: id, active },
    authConfig()
  );