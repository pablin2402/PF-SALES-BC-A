import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const useSalesmanProfile = (salesmanId, isOpen) => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("id_owner");

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");

  const fetchProfile = useCallback(async () => {
    if (!salesmanId || !isOpen) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const matchId = (o) => {
        const sid = typeof o.salesId === "string" ? o.salesId : o.salesId?._id;
        return sid === salesmanId;
      };

      const monthRes = await axios.post(API_URL + "/whatsapp/order/id/statistics",
        { id_owner: user, year: currentYear, month: currentMonth }, { headers });

      const monthlyPromises = Array.from({ length: 12 }, (_, i) =>
        axios.post(API_URL + "/whatsapp/order/id/statistics",
          { id_owner: user, year: currentYear, month: String(i + 1).padStart(2, "0") }, { headers })
          .then(r => ({ month: i, orders: r.data.orders || [] }))
          .catch(() => ({ month: i, orders: [] }))
      );
      const monthlyResults = await Promise.all(monthlyPromises);

      const allMonthOrders = monthRes.data.orders || [];
      const allYearOrders = monthlyResults.flatMap(r => r.orders);
      const myOrders = allMonthOrders.filter(matchId);
      const myYearOrders = allYearOrders.filter(matchId);

      const totalVentas = myOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const totalPedidos = myOrders.length;
      const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

      const allSellers = {};
      allMonthOrders.forEach(o => {
        const id = typeof o.salesId === "string" ? o.salesId : o.salesId?._id;
        if (!id) return;
        if (!allSellers[id]) allSellers[id] = { total: 0 };
        allSellers[id].total += o.totalAmount || 0;
      });
      const sorted = Object.entries(allSellers).sort((a, b) => b[1].total - a[1].total);
      const ranking = sorted.findIndex(([id]) => id === salesmanId) + 1;

      const cobrado = myOrders.filter(o => o.payStatus === "Pagado").reduce((s, o) => s + (o.totalAmount || 0), 0);
      const pendiente = totalVentas - cobrado;
      const enRuta = myOrders.filter(o => o.orderStatus === "En Ruta").length;
      const entregados = myOrders.filter(o => o.orderStatus === "Entregado").length;

      setStats({
        totalVentas, totalPedidos, ticketPromedio,
        ranking: ranking || sorted.length + 1,
        totalSellers: sorted.length || 1,
        cobrado, pendiente, enRuta, entregados,
      });

      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const monthlyData = monthNames.map((name, i) => {
        const mOrders = monthlyResults[i].orders.filter(matchId);
        return {
          month: name,
          amount: mOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
          orders: mOrders.length,
        };
      });
      setMonthlySales(monthlyData);

      const prodMap = {};
      myOrders.forEach(o => {
        (o.products || []).forEach(p => {
          const name = p.nombre || "Sin nombre";
          if (!prodMap[name]) prodMap[name] = { name, cantidad: 0, monto: 0 };
          prodMap[name].cantidad += p.cantidad || 0;
          prodMap[name].monto += (p.cantidad || 0) * (p.precio || 0);
        });
      });
      setTopProducts(Object.values(prodMap).sort((a, b) => b.monto - a.monto).slice(0, 8));

      const recentOrders = [...myOrders, ...myYearOrders.filter(yo => !myOrders.find(mo => mo._id === yo._id))]
        .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
        .slice(0, 15)
        .map(o => ({
          id: o._id,
          type: o.orderStatus === "Entregado" ? "delivery" : o.orderStatus === "En Ruta" ? "route" : "order",
          title: o.orderStatus === "Entregado" ? "Pedido entregado" : o.orderStatus === "En Ruta" ? "En ruta de entrega" : "Nuevo pedido",
          client: o.id_client ? `${o.id_client.name || ""} ${o.id_client.lastName || ""}`.trim() : "Cliente",
          amount: o.totalAmount,
          date: o.creationDate,
          status: o.orderStatus,
          receiveNumber: o.receiveNumber,
        }));
      setTimeline(recentOrders);

      setClients([]);

    } catch (e) {
      console.error("Error loading salesman profile:", e);
      setStats({ totalVentas: 0, totalPedidos: 0, ticketPromedio: 0, ranking: 0, totalSellers: 0, cobrado: 0, pendiente: 0, enRuta: 0, entregados: 0 });
      setMonthlySales([]);
      setTopProducts([]);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [salesmanId, isOpen, token, user, currentYear, currentMonth]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { stats, timeline, monthlySales, topProducts, clients, loading };
};