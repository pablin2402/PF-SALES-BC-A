import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import Select from 'react-select';

import axios from "axios";
import { API_URL } from "../config";

import { MdDelete } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";
import { HiFilter } from "react-icons/hi";

import OrderDetailsComponent from "./OrderDetailsComponent";

const OrderCreateComponent = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [categoriesList, setCategoriesList] = useState([]);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    creationDate: new Date(),
    apellido: "",
    email: "",
    telefono: 0,
    punto: "",
    vendedor: "",
    vendedorId:"",
    tipoPago: '',
    direccion: "",
    plazoCredito: 0,
    note: '',
    fechaPago: new Date()
  });
  const [vendedores, setVendedores] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [tempSearchTerm] = useState("");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id", {
        id_owner: user,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const clientesData = response.data.clients.map(cliente => ({
        value: cliente._id,
        label: `${cliente.name} ${cliente.lastName}`,
        directionid: cliente.client_location.direction,
        direction_id: cliente.client_location._id,
        number: cliente.number,
        sales_id: cliente.sales_id,
        salesMan: cliente.sales_id.fullName
      }));
  
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al obtener los clientes", error);
    } finally {
      setLoading(false);
    }
  }, [user, token]); 
  
  useEffect(() => {
    fetchClients(); 
  }, [fetchClients]);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
          {
            id_owner: user
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log(response)
        setVendedores(response.data.data);
  
      } catch (error) {
        setVendedores([]);
      }
    };
  
    fetchVendedores();
  }, [user, token]); 
  
  const handleSelectChange = (selectedOption) => {
    setSelectedCliente(selectedOption);
    const clienteSeleccionado = clientes.find(cliente => cliente.value === selectedOption.value);
    setFormData(prevState => ({
      ...prevState,
      vendedorId:clienteSeleccionado ? clienteSeleccionado.sales_id : "",
      vendedor: clienteSeleccionado ? clienteSeleccionado.salesMan : "",
      direccion: clienteSeleccionado ? clienteSeleccionado.directionid : "",
      telefono: clienteSeleccionado ? clienteSeleccionado.number : "",
    }));
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchTerm(tempSearchTerm);
    }
  };
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id", {
        userId: user,
        id_owner: user,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategoriesList(response.data.data);
    } catch (error) {
      console.error("Error al obtener las categorías", error);
    } finally {
      setLoading(false);
    }
  }, [user, token]); 
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); 
  
  const addToCart = (product) => {
    const existingProductIndex = cart.findIndex((item) => item._id === product._id);

    if (existingProductIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingProductIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1, price: product.priceId?.price, numberofUnitsPerBox: product.numberofUnitsPerBox || 0 }]);
    }
  };
  const calcularTotal = () => {
    return parseFloat(cart.reduce(
      (sum, item) => sum + item.quantity * (item.price - (item.discount || 0)),
      0
    ).toFixed(2));
  };
  const calcularDescuentos = () => {
    return parseFloat(cart.reduce(
      (sum, item) => sum + item.quantity * (item.discount || 0),
      0
    ).toFixed(2));
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.name === "telefono" ? Number(e.target.value) : e.target.value });
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  const calcularFechaPago = (creationDate, plazoCredito) => {
    if (!creationDate || !plazoCredito) return "No disponible";
    const fecha = new Date(creationDate);
    fecha.setDate(fecha.getDate() + plazoCredito);
    return fecha;
  };
 
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fechaPago: calcularFechaPago(prev.creationDate, prev.plazoCredito)
    }));
  }, [formData.creationDate, formData.plazoCredito]);

  const fetchProducts = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/product/id", {
        id_user: user,
        status: false,
        page: pageNumber,
        limit: 8,
        search: searchTerm,
        category: selectedCategory
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSalesData(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory]);

  const generateReceiveNumber = () => {
    return Math.floor(Math.random() * (1000000000 - 10000000) + 10000000);
  };
  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert("Debe seleccionar al menos un producto.");
      return;
    }
    try {
      const orderResponse = await Promise.race([ 
        await axios.post(API_URL + "/whatsapp/order", {
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
            caja: item.quantity/item.numberofUnitsPerBox,
            lyne: item.categoryId.categoryName
          })),
          disscount: calcularDescuentos(),
          tax: 0,
          totalAmount: calcularTotal(),
          nit: 0,
          razonSocial: "",
          cellPhone: formData.telefono || "No disponible",
          direction: formData.direccion || "No disponible",
          accountStatus: formData.tipoPago,
          dueDate: formData.fechaPago,
          id_client: selectedCliente?.value || "No seleccionado",
          salesId: formData.vendedorId,
          orderTrackId: null,
          region: "TOTAL CBB"
        },{
        headers: {
          Authorization: `Bearer ${token}`
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);
      if (orderResponse.status === 200) {
        alert("Orden guardada exitosamente.");
        setCart([]);
        navigate("/order");
        setFormData({ nombre: "", apellido: "", email: "", direccion: "", telefono: 0, punto: "", vendedor: "", tipopago: '', plazoCredito: 0,vendedorId:'' });
        setSelectedCliente(null);
        const clientId = orderResponse.data._id;
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
        
              try {
                const response = await axios.post(API_URL + "/whatsapp/order/track", {
                  orderId: clientId,
                  eventType: "Orden Creada",
                  triggeredBySalesman: id_user,
                  triggeredByDelivery: "",
                  triggeredByUser: "",
                  location: { lat, lng }
                }, {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });
        
                setSalesData(response.data.products || []);
                setTotalPages(response.data.totalPages || 1);
              } catch (error) {
                console.error("Error al enviar evento de orden:", error);
              } finally {
                setLoading(false);
              }
            },
            (error) => {
              console.error("No se pudo obtener la ubicación:", error);
              setLoading(false);
            }
          );
        } else {
          console.warn("La geolocalización no es soportada por este navegador.");
        }
        
      }
     
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white min-h-screen rounded-lg p-5">
      <div className="relative overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div role="status">
              <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex mt-4 justify-start space-x-2">
              {viewMode === "card" ? (
                <div className="flex mt-4 mb-4 justify-start space-x-2">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                      <li className="inline-flex items-center" 
                      >
                       <button
                        onClick={() => setViewMode("card")}
                        className="inline-flex items-center text-m font-bold text-[#D3423E] hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                      >
                        <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                          <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                        </svg>
                        Lista de productos
                      </button>

                      </li>
                      <li>
                        <div className="flex items-center" 
                        >
                          <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                          </svg>
                          <button
                            onClick={() => setViewMode("form")}                            
                            className="ms-1 text-sm font-medium text-gray-900 hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                          >
                            Detalle del pedido
                          </button>

                        </div>
                      </li>
                      <li aria-current="page">
                        <div className="flex items-center" onClick={() => setViewMode("table")}>
                          <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                          </svg>
                          <span className="ms-1 text-sm font-medium text-gray-900 md:ms-2 dark:text-gray-400">Confirmación del pedido</span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>
              ) : viewMode === "form" ? (
                <div className="flex mt-4 mb-4 justify-start space-x-2">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                      <li className="inline-flex items-center" 
                      >
                       <button
                          onClick={() => setViewMode("card")}                          
                          className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                        >
                          <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                          </svg>
                          Lista de productos
                        </button>

                      </li>
                      <li>
                        <div className="flex items-center">
                          <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                          </svg>
                          <button
                           onClick={() => setViewMode("form")}
                            className="ms-1 text-m font-bold text-[#D3423E] hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                          >
                            Detalle del pedido
                          </button>
                        </div>
                      </li>
                      <li aria-current="page">
                        <div className="flex items-center" onClick={() => setViewMode("table")}>
                          <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                          </svg>
                          <span className="ms-1 text-sm font-medium text-gray-900 md:ms-2 dark:text-gray-400">Confirmación del pedido</span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>
              ) : (
                <div className="flex mt-4 mb-4 justify-start space-x-2">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center" 
                    >
                     <button
                      onClick={() => setViewMode("card")}
                      className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                    >
                      <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                      </svg>
                      Lista de productos
                    </button>

                    </li>
                    <li>
                      <div className="flex items-center"
                      >
                        <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                        </svg>
                        <button
                         onClick={() => setViewMode("form")}
                          className="ms-1 text-sm font-medium text-gray-900 hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                        >
                          Detalle del pedido
                        </button>

                      </div>
                    </li>
                    <li aria-current="page">
                      <div className="flex items-center" onClick={() => setViewMode("table")}>
                        <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                        </svg>
                        <span className="ms-1 text-m font-bold text-[#D3423E] md:ms-2 dark:text-gray-400">Confirmación del pedido</span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>

              )}
            </div>
            {viewMode === "card" ? (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="relative mb-4 mt-4 flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-red-500"
                          aria-hidden="true"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar producto por nombre, categoría"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        className="block p-2 ps-10 text-m text-gray-900 border border-gray-900 rounded-3xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      <option value="">Todas las categorías</option>
                      {categoriesList.map((category) => (
                        <option key={category._id} value={category._id}>{category.categoryName}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => fetchProducts(1)}                       
                      className="flex items-center gap-2 px-4 py-2 bg-[#D3423E] text-lg text-white font-bold rounded-3xl transition duration-200"
                    >
                    <HiFilter className="text-white text-lg" />
                    Filtrar
                    </button>
                  </div>
                </div>
                <div className="max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5">
                  {salesData.map((item) => (
                    <div key={item._id} className="p-5 border border-gray-400 rounded-2xl shadow-lg flex flex-col">
                      <img className="w-40 h-40 object-cover mx-auto rounded-lg" src={item.productImage} alt={item.productName} />
                      <h3 className="mt-2 text-m text-gray-900 font-bold">{item.productName || "Sin nombre"}</h3>
                      <div className="flex-grow"></div>
                      <p className="text-gray-900">{item.categoryId?.categoryName || "Sin categoría"}</p>
                      <div className="flex-grow"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-left text-3xl font-bold text-gray-900">{item.priceId?.price ? `Bs. ${item.priceId.price}` : "N/A"}</span>
                        <button
                          onClick={() => addToCart(item)}
                          href="#"
                          className="text-[#D3423E] bg-white hover:bg-[#D3423E] hover:text-white focus:ring-4 focus:outline-none focus:ring-[#D3423E] font-bold rounded-full text-l px-2.5 py-2.5 text-center "
                        >
                          <IoMdAdd size={30} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && searchTerm === "" && (
                  <nav className="flex items-center justify-center pt-4 space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}
                    >
                      ◀
                    </button>

                    <button
                      onClick={() => setPage(1)}
                      className={`px-3 py-1 border rounded-lg ${page === 1 ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                    >
                      1
                    </button>

                    {page > 3 && <span className="px-2 text-gray-900">…</span>}

                    {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                      .filter((p) => p > 1 && p < totalPages)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1 border rounded-lg ${page === p ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                        >
                          {p}
                        </button>
                      ))}

                    {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}

                    {totalPages > 1 && (
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`px-3 py-1 border rounded-lg ${page === totalPages ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                      >
                        {totalPages}
                      </button>
                    )}

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}
                    >
                      ▶
                    </button>
                  </nav>
                )}
                </div>
              </>
            ) : viewMode === "form" ? (
              <div className="flex w-full justify-center gap-6 mt-4">
                <div className="w-2/6 p-6 bg-white border border-black rounded-lg shadow-lg">
                  <h2 className="mb-6 text-lg text-left font-bold text-gray-900">Datos personales</h2>
                  <form>
                    <div className="grid gap-6">
                      <div className="flex flex-col">
                        <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre</label>
                        <Select
                          options={clientes}
                          value={selectedCliente}
                          onChange={handleSelectChange}
                          isSearchable={true}
                          placeholder="Buscar cliente..."
                          noOptionsMessage={() => "No se encontraron clientes"}
                          className="text-gray-900 rounded-2xl"
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              borderColor: state.isFocused ? "#2E2B2B" : "#2E2B2B",
                              boxShadow: state.isFocused ? "0 0 0 2px rgba(211, 66, 62, 0.5)" : "none",
                              "&:hover": { borderColor: "#B8322F" },
                            }),
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: state.isSelected ? "#D3423E" : "white",
                              color: state.isSelected ? "white" : "##2E2B2B",
                              "&:hover": { backgroundColor: "#F8D7DA", color: "#D3423E" }
                            }),
                            singlevalue: (provided) => ({
                              ...provided, color: "#2E2B2B",

                            }), placeholder: (provided) => ({
                              ...provided, color: "#2E2B2B",
                            }), menu: (provided) => ({
                              ...provided, color: "#2E2B2B",
                            }),
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-left text-sm font-medium text-gray-900 mb-1">Tipo de pago</label>
                        <select
                          className="p-2 text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 rounded-3xl"
                          name="tipoPago"
                          value={formData.tipoPago}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Seleccione un tipo de pago</option>
                          <option value="Crédito">Crédito</option>
                          <option value="Contado">Contado</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      {formData.tipoPago === 'Crédito' && (
                        <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Plazo de pago</label>
                          <input
                            type="number"
                            value={formData.plazoCredito}
                            onChange={(e) =>
                              setFormData({ ...formData, plazoCredito: e.target.value })
                            }
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-3xl p-2.5 focus:outline-none focus:ring-0 focus:border-red-500"
                          />

                        </div>
                      )}
                     
                      {selectedCliente && (
                        <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Vendedor</label>
                          <input
                            type="text"
                            value={formData.vendedor}
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500 p-2.5"
                            readOnly
                          />
                        </div>
                      )}
                      {selectedCliente && (
                        <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección</label>
                          <input
                            type="text"
                            value={formData.direccion}
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500 p-2.5"
                            readOnly
                          />
                        </div>
                      )}
                      {selectedCliente && (
                        <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de teléfono</label>
                          <input
                            type="text"
                            value={formData.telefono}
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500 p-2.5"
                            readOnly
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <label className="text-left text-sm font-medium text-gray-900 mb-1">Nota</label>
                        <input
                          type="text"
                          value={formData.note}
                          className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500 p-2.5"
                          readOnly
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg flex flex-col">
                  <h2 className="mb-6 text-lg text-left font-bold text-gray-900">Confirmar Orden</h2>
                  <form>
                    <div className="grid gap-4">
                      <div className="flex justify-between px-2 py-2 border-b font-bold text-gray-900">
                        <span className="w-1/4 text-left">Producto</span>
                        <span className="w-1/6 text-center">Cantidad</span>
                        <span className="w-1/6 text-center">Precio</span>
                        <span className="w-1/6 text-center">Descuento</span>
                        <span className="w-1/6 text-center">Final</span>
                        <span className="w-1/6 text-center">Acción</span>
                      </div>

                      <div className="max-h-96 overflow-y-scroll">
                        {cart.map((item, index) => (
                          <div key={index} className="flex justify-between items-center px-2 py-2 border-b">
                            <div className="w-1/4 flex items-center gap-2">
                              <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg" />
                              <span className="text-gray-900">{item.productName}</span>
                            </div>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                                setCart(cart.map((c, i) => i === index ? { ...c, quantity: newQuantity } : c));
                              }}
                              className="w-1/6  mr-1 ml-1 text-center border rounded-lg text-gray-900"
                            />
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                setCart(cart.map((c, i) => i === index ? { ...c, price: newPrice } : c));
                              }}
                              className="w-1/6  mr-1 ml-1 text-center border rounded-lg text-gray-900"
                            />
                            <span className="w-1/6 text-center font-bold text-gray-900">
                              Bs. {(item.discount || 0).toFixed(2)}
                            </span>

                            <span className="w-1/6 text-center font-bold text-gray-900">
                            Bs. {((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}
                            </span>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setCart(cart.filter((_, i) => i !== index));
                              }}
                              className="w-1/6 flex justify-center text-[#D3423E] text-2xl hover:text-gray-900"
                            >
                              <MdDelete />
                            </button>
                          </div>
                        ))}
                      </div>

                      <hr className="h-px my-8 bg-gray-300 border-0 " />

                      <h3 className="text-lg text-gray-900 font-bold text-right">
                        Total Descuentos: Bs. {calcularDescuentos()}
                      </h3>
                      <h3 className="mt-auto text-lg text-gray-900 font-bold mt-3 text-right">
                        Total: Bs.{calcularTotal()}
                      </h3>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <OrderDetailsComponent
                selectedCliente={selectedCliente}
                formData={formData}
                vendedores={vendedores}
                calcularFechaPago={calcularFechaPago}
                cart={cart}
                calcularTotal={calcularTotal}
                handleSubmit={handleSubmit}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default OrderCreateComponent;
