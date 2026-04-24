import React, { useEffect, useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from 'react-select';
import axios from "axios";
import { API_URL } from "../../config";
import { MdDelete } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";
import { HiFilter } from "react-icons/hi";
import { FaCheckCircle, FaSearch, FaShoppingCart, FaUser, FaPhone, FaMapMarkerAlt, FaCity, FaCreditCard, FaCalendarAlt, FaStickyNote, FaArrowLeft, FaArrowRight, FaBox, FaTimes, FaPlus, FaMinus, FaUserTie, FaPercent, FaInfoCircle, FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import AlertModal from "../modal/AlertModal";
import ErrorModal from "../modal/ErrorModal";
import { motion, AnimatePresence } from "framer-motion";
import OrderDetailsComponent from "./OrderDetailsComponent";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";

const PAYMENT_TYPES = [
  { value: "Crédito", label: "Crédito", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "💳" },
  { value: "Contado", label: "Contado", color: "bg-green-100 text-green-700 border-green-300", icon: "💵" },
  { value: "Cheque", label: "Cheque", color: "bg-blue-100 text-blue-700 border-blue-300", icon: "📝" }
];

const STEPS = [
  { id: "card", label: "Productos", icon: FaBox },
  { id: "form", label: "Detalle del pedido", icon: FaUser },
  { id: "table", label: "Confirmación", icon: FaCheckCircle }
];

const OrderCreateComponent = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    creationDate: new Date(),
    apellido: "",
    email: "",
    telefono: 0,
    punto: "",
    vendedor: "",
    vendedorId: "",
    tipoPago: '',
    direccion: "",
    plazoCredito: 0,
    note: '',
    fechaPago: new Date(),
    region: ""
  });
  const [vendedores, setVendedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id", {
        id_owner: user,
        limit: 10000,
        page: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientesData = response.data.clients.map(cliente => ({
        value: cliente._id,
        label: `${cliente.name} ${cliente.lastName}`,
        directionid: cliente.client_location?.direction || "",
        direction_id: cliente.client_location?._id,
        number: cliente.number,
        sales_id: cliente.sales_id,
        salesMan: cliente.sales_id?.fullName || "Sin vendedor",
        region: cliente.region
      }));
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al obtener los clientes", error);
    }
  }, [user, token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
          { id_owner: user },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendedores(response.data.data || []);
      } catch (error) {
        setVendedores([]);
      }
    };
    fetchVendedores();
  }, [user, token]);

  const handleSelectChange = (selectedOption) => {
    setSelectedCliente(selectedOption);
    if (!selectedOption) return;
    const cliente = clientes.find(c => c.value === selectedOption.value);
    setFormData(prev => ({
      ...prev,
      vendedorId: cliente?.sales_id || "",
      vendedor: cliente?.salesMan || "",
      direccion: cliente?.directionid || "",
      telefono: cliente?.number || "",
      region: cliente?.region || ""
    }));
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id",
        { userId: user, id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategoriesList(response.data.data || []);
    } catch (error) {
      console.error("Error al obtener las categorías", error);
    }
  }, [user, token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/product/id", {
        id_user: user,
        status: false,
        page: pageNumber,
        limit: 12,
        search: searchTerm,
        category: selectedCategory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products", error);
    } finally {
      setLoading(false);
    }
  }, [user, token, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, selectedCategory, fetchProducts]);

  const addToCart = (product) => {
    const existing = cart.findIndex((item) => item._id === product._id);
    if (existing !== -1) {
      const updated = [...cart];
      updated[existing].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        price: product.priceId?.price || 0,
        numberofUnitsPerBox: product.numberofUnitsPerBox || 0
      }]);
    }
  };

  const updateCartItem = (index, field, value) => {
    setCart(prev => prev.map((c, i) => {
      if (i !== index) return c;
      if (field === 'quantity') return { ...c, quantity: Math.max(1, parseInt(value) || 1) };
      if (field === 'price') return { ...c, price: Math.max(0, parseFloat(value) || 0) };
      if (field === 'discount') return { ...c, discount: Math.max(0, parseFloat(value) || 0) };
      return c;
    }));
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const calcularSubtotal = useMemo(() =>
    parseFloat(cart.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)),
    [cart]);

  const calcularDescuentos = useMemo(() =>
    parseFloat(cart.reduce((sum, item) => sum + item.quantity * (item.discount || 0), 0).toFixed(2)),
    [cart]);

  const calcularTotal = useMemo(() =>
    parseFloat((calcularSubtotal - calcularDescuentos).toFixed(2)),
    [calcularSubtotal, calcularDescuentos]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === "telefono" ? Number(e.target.value) : e.target.value
    });
  };

  const calcularFechaPago = (creationDate, plazoCredito) => {
    if (!creationDate || !plazoCredito) return "No disponible";
    const fecha = new Date(creationDate);
    fecha.setDate(fecha.getDate() + Number(plazoCredito));
    return fecha;
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fechaPago: calcularFechaPago(prev.creationDate, prev.plazoCredito)
    }));
  }, [formData.creationDate, formData.plazoCredito]);

  const generateReceiveNumber = () => Math.floor(Math.random() * (1000000000 - 10000000) + 10000000);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setSuccessModal(true);
      return;
    }
    setSubmitting(true);
    try {
      const orderResponse = await Promise.race([
        axios.post(API_URL + "/whatsapp/order", {
          creationDate: new Date(),
          receiveNumber: generateReceiveNumber(),
          noteAditional: formData.note,
          id_owner: user,
          products: cart.map(item => ({
            id: item.id,
            nombre: item.productName,
            cantidad: item.quantity,
            precio: item.price,
            unidadesPorCaja: item.numberofUnitsPerBox,
            productImage: item.productImage,
            caja: item.numberofUnitsPerBox > 0 ? item.quantity / item.numberofUnitsPerBox : 0,
            lyne: item.categoryId?.categoryName
          })),
          disscount: calcularDescuentos,
          tax: 0,
          totalAmount: calcularTotal,
          nit: 0,
          razonSocial: "",
          cellPhone: formData.telefono || "No disponible",
          direction: formData.direccion || "No disponible",
          accountStatus: formData.tipoPago,
          dueDate: formData.fechaPago,
          id_client: selectedCliente?.value || "No seleccionado",
          salesId: formData.vendedorId,
          orderTrackId: null,
          region: formData.region || "No seleccionado",
        }, { headers: { Authorization: `Bearer ${token}` } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

      if (orderResponse.status === 200) {
        const clientId = orderResponse.data._id;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await axios.post(API_URL + "/whatsapp/order/track", {
                  orderId: clientId,
                  eventType: "Orden Creada",
                  triggeredBySalesman: id_user,
                  triggeredByDelivery: "",
                  triggeredByUser: "",
                  location: { lat: position.coords.latitude, lng: position.coords.longitude }
                }, { headers: { Authorization: `Bearer ${token}` } });
              } catch (error) {
                console.error("Error tracking", error);
              }
            },
            () => console.warn("Geolocation denied")
          );
        }

        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate("/order");
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating order", error);
      setErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedCliente &&
    formData.tipoPago &&
    (formData.tipoPago !== "Crédito" || formData.plazoCredito) &&
    formData.vendedor &&
    formData.direccion &&
    formData.region &&
    formData.telefono;

  const canAccessStep = (step) => {
    if (step === "card") return true;
    if (step === "form") return cart.length > 0;
    if (step === "table") return cart.length > 0 && isFormValid;
    return false;
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-[#D3423E] flex items-center gap-1 mb-2 transition-colors"
            >
              <FaArrowLeft size={11} /> Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FaShoppingCart className="text-[#D3423E]" />
              Nuevo pedido
            </h1>
            <p className="text-sm text-gray-500 mt-1">Selecciona productos, cliente y confirma el pedido</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <div className="relative">
                <FaShoppingCart className="text-[#D3423E] text-xl" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D3423E] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Total</p>
                <p className="font-bold text-gray-900">Bs. {calcularTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = viewMode === step.id;
              const isCompleted = STEPS.findIndex(s => s.id === viewMode) > idx;
              const accessible = canAccessStep(step.id);
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => accessible && setViewMode(step.id)}
                    disabled={!accessible}
                    className={`flex flex-col items-center gap-1 transition-all ${!accessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-[#D3423E] text-white ring-4 ring-red-100' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <FaCheck size={12} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-[11px] font-semibold ${
                      isActive ? 'text-[#D3423E]' :
                      isCompleted ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {viewMode === "card" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchProducts(1)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="relative">
                    <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                      className="pl-9 pr-8 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 appearance-none cursor-pointer"
                    >
                      <option value="">Todas las categorías</option>
                      {categoriesList.map((c) => (
                        <option key={c._id} value={c._id}>{c.categoryName}</option>
                      ))}
                    </select>
                  </div>
                  <PrincipalBUtton onClick={() => { setPage(1); fetchProducts(1); }} icon={HiFilter}>
                    Filtrar
                  </PrincipalBUtton>
                </div>
              </div>

              <div className="p-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
                    <p className="text-sm">Cargando productos...</p>
                  </div>
                ) : salesData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaBox className="text-gray-300 text-3xl" />
                    </div>
                    <p className="text-gray-700 font-semibold">Sin productos</p>
                    <p className="text-sm text-gray-500 mt-1">No se encontraron productos con esos filtros</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {salesData.map((item) => {
                      const inCart = cart.find(c => c._id === item._id);
                      return (
                        <motion.div
                          key={item._id}
                          whileHover={{ y: -2 }}
                          className={`bg-white border-2 rounded-2xl overflow-hidden transition-all hover:shadow-md ${inCart ? 'border-[#D3423E] ring-2 ring-red-100' : 'border-gray-200'}`}
                        >
                          <div className="relative bg-gray-50 p-3">
                            {inCart && (
                              <span className="absolute top-2 right-2 bg-[#D3423E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                ×{inCart.quantity}
                              </span>
                            )}
                            <img
                              className="w-full h-32 object-contain"
                              src={item.productImage}
                              alt={item.productName}
                              onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Sin+imagen"; }}
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[40px]">
                              {item.productName || "Sin nombre"}
                            </h3>
                            <p className="text-[11px] text-gray-500 mb-2 truncate">
                              {item.categoryId?.categoryName || "Sin categoría"}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-lg font-bold text-gray-900">
                                Bs. {item.priceId?.price || "0"}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-9 h-9 bg-[#D3423E] hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                                title="Agregar al pedido"
                              >
                                <IoMdAdd size={18} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {totalPages > 1 && searchTerm === "" && (
                  <nav className="flex items-center justify-center pt-6 gap-1">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(1)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                    >
                      1
                    </button>
                    {page > 3 && <span className="px-1 text-gray-400">…</span>}
                    {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                      .filter((p) => p > 1 && p < totalPages)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === p ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                        >
                          {p}
                        </button>
                      ))}
                    {page < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}
                    {totalPages > 1 && (
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                    >
                      Siguiente →
                    </button>
                  </nav>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-[#D3423E] to-red-700 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FaShoppingCart /> Carrito
                    </h3>
                    <span className="bg-white bg-opacity-20 text-xs font-bold px-2.5 py-1 rounded-full">
                      {cartCount} items
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <FaShoppingCart className="text-4xl mb-3" />
                      <p className="text-sm font-semibold">Carrito vacío</p>
                      <p className="text-xs text-center mt-1 px-4">Agrega productos haciendo clic en el botón rojo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <div className="flex items-start gap-2 mb-2">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 object-contain rounded-lg bg-white flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 line-clamp-2">{item.productName}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Bs. {item.price.toFixed(2)} c/u</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center bg-white rounded-lg border border-gray-200">
                              <button
                                onClick={() => updateCartItem(index, 'quantity', item.quantity - 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                                disabled={item.quantity <= 1}
                              >
                                <FaMinus size={9} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                                className="w-10 text-center text-xs font-bold text-gray-900 focus:outline-none bg-white"
                                min="1"
                              />
                              <button
                                onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                              >
                                <FaPlus size={9} />
                              </button>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              Bs. {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">Bs. {calcularSubtotal.toFixed(2)}</span>
                    </div>
                    {calcularDescuentos > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Descuentos</span>
                        <span className="font-semibold">- Bs. {calcularDescuentos.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Total</span>
                      <span className="text-xl font-bold text-[#D3423E]">Bs. {calcularTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setViewMode("form")}
                      className="w-full mt-3 px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Continuar <FaArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setShowCartMobile(true)}
                className="lg:hidden fixed bottom-6 right-6 z-30 bg-[#D3423E] text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center"
              >
                <div className="relative">
                  <FaShoppingCart size={24} />
                  <span className="absolute -top-2 -right-3 bg-white text-[#D3423E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                </div>
              </button>
            )}
          </motion.div>
        )}

        {viewMode === "form" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaUser /> Datos del cliente
                </h2>
                <p className="text-xs text-red-100 mt-0.5">Selecciona el cliente y tipo de pago</p>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                    Cliente <span className="text-[#D3423E]">*</span>
                  </label>
                  <Select
                    options={clientes}
                    value={selectedCliente}
                    onChange={handleSelectChange}
                    isSearchable
                    placeholder="Buscar cliente..."
                    noOptionsMessage={() => "No se encontraron clientes"}
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        borderRadius: "0.75rem",
                        borderColor: state.isFocused ? "#D3423E" : "#d1d5db",
                        boxShadow: state.isFocused ? "0 0 0 2px rgba(211, 66, 62, 0.2)" : "none",
                        padding: "2px",
                        "&:hover": { borderColor: "#D3423E" },
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? "#D3423E" : state.isFocused ? "#FEE2E2" : "white",
                        color: state.isSelected ? "white" : "#111827",
                      }),
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                    Tipo de pago <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_TYPES.map(pt => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, tipoPago: pt.value })}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${formData.tipoPago === pt.value ? `${pt.color} border-current` : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
                      >
                        <div className="text-2xl mb-1">{pt.icon}</div>
                        <p className="text-xs font-bold">{pt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {formData.tipoPago === 'Crédito' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                        Plazo de pago (días) <span className="text-[#D3423E]">*</span>
                      </label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="number"
                          value={formData.plazoCredito}
                          onChange={(e) => setFormData({ ...formData, plazoCredito: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                          placeholder="30"
                          min="1"
                        />
                      </div>
                      {formData.plazoCredito > 0 && formData.fechaPago && (
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          <FaInfoCircle size={10} />
                          Vence: <strong className="text-gray-700">{new Date(formData.fechaPago).toLocaleDateString("es-ES")}</strong>
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedCliente && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-2 border border-gray-200"
                  >
                    <p className="text-xs font-bold text-gray-700 uppercase mb-2">Información del cliente</p>
                    <InfoRow icon={<FaUserTie />} label="Vendedor" value={formData.vendedor} />
                    <InfoRow icon={<FaPhone />} label="Teléfono" value={formData.telefono} />
                    <InfoRow icon={<FaMapMarkerAlt />} label="Dirección" value={formData.direccion} />
                    <InfoRow icon={<FaCity />} label="Ciudad" value={formData.region} />
                  </motion.div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                    Nota adicional (opcional)
                  </label>
                  <div className="relative">
                    <FaStickyNote className="absolute left-3 top-3 text-gray-400 text-sm" />
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows="3"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 resize-none"
                      placeholder="Instrucciones especiales..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaArrowLeft size={11} /> Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    disabled={!isFormValid}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${isFormValid ? 'bg-[#D3423E] text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Continuar <FaArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FaShoppingCart className="text-[#D3423E]" />
                    Productos del pedido
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Edita cantidades, precios y descuentos</p>
                </div>
                <span className="bg-red-100 text-[#D3423E] text-xs font-bold px-3 py-1 rounded-full">
                  {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-24">Cant.</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-24">Precio</th>
                      <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-24">Desc.</th>
                      <th className="px-2 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-28">Total</th>
                      <th className="px-2 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <FaShoppingCart className="text-4xl text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 font-semibold">Sin productos en el carrito</p>
                          <button
                            onClick={() => setViewMode("card")}
                            className="mt-3 text-sm text-[#D3423E] font-bold hover:underline"
                          >
                            ← Volver a productos
                          </button>
                        </td>
                      </tr>
                    ) : (
                      cart.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-12 h-12 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm">{item.productName}</p>
                                <p className="text-xs text-gray-500">{item.categoryId?.categoryName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                              className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#D3423E]"
                              min="1"
                            />
                          </td>
                          <td className="px-2 py-3">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateCartItem(index, 'price', e.target.value)}
                              className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#D3423E]"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-2 py-3">
                            <input
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => updateCartItem(index, 'discount', e.target.value)}
                              className="w-full text-center px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#D3423E]"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-2 py-3 text-right">
                            <span className="text-sm font-bold text-gray-900">
                              Bs. {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <MdDelete size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {cart.length > 0 && (
                <div className="p-5 bg-gray-50 border-t border-gray-200">
                  <div className="max-w-sm ml-auto space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">Bs. {calcularSubtotal.toFixed(2)}</span>
                    </div>
                    {calcularDescuentos > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <FaPercent size={9} /> Descuentos
                        </span>
                        <span className="font-semibold">- Bs. {calcularDescuentos.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-[#D3423E]">Bs. {calcularTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {viewMode === "table" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OrderDetailsComponent
              selectedCliente={selectedCliente}
              formData={formData}
              vendedores={vendedores}
              calcularFechaPago={calcularFechaPago}
              cart={cart}
              calcularTotal={() => calcularTotal}
              handleSubmit={handleSubmit}
            />
            <div className="flex justify-start mt-4">
              <button
                onClick={() => setViewMode("form")}
                className="px-5 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FaArrowLeft size={11} /> Atrás
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCartMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-60 lg:hidden"
            onClick={() => setShowCartMobile(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-gradient-to-br from-[#D3423E] to-red-700 text-white rounded-t-3xl flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FaShoppingCart /> Carrito ({cartCount})
                </h3>
                <button
                  onClick={() => setShowCartMobile(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {cart.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-2">
                    <div className="flex items-start gap-2 mb-2">
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-contain rounded-lg bg-white" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 line-clamp-2">{item.productName}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Bs. {item.price.toFixed(2)} c/u</p>
                      </div>
                      <button onClick={() => removeFromCart(index)} className="text-red-400">
                        <FaTimes size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center bg-white rounded-lg border border-gray-200">
                        <button onClick={() => updateCartItem(index, 'quantity', item.quantity - 1)} className="px-2 py-1"><FaMinus size={9} /></button>
                        <span className="px-3 text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)} className="px-2 py-1"><FaPlus size={9} /></button>
                      </div>
                      <p className="text-sm font-bold text-gray-900">Bs. {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-xl font-bold text-[#D3423E]">Bs. {calcularTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setShowCartMobile(false); setViewMode("form"); }}
                  className="w-full px-4 py-3 bg-[#D3423E] text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Continuar <FaArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Por favor seleccione al menos un producto"
      />
      <ErrorModal
        show={errorModal}
        onClose={() => setErrorModal(false)}
        message="Error al crear el pedido. Intenta nuevamente."
      />

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg mx-auto mb-4"
              >
                <FaCheckCircle className="text-green-500" size={70} />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Pedido confirmado!</h2>
              <p className="text-sm text-gray-500">Redirigiendo a la lista de pedidos...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-3"></div>
            <p className="text-gray-700 font-semibold">Creando pedido...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="text-gray-400 flex-shrink-0">{icon}</span>
    <span className="text-gray-600 flex-shrink-0">{label}:</span>
    <span className="font-semibold text-gray-900 truncate">{value || "-"}</span>
  </div>
);

export default OrderCreateComponent;