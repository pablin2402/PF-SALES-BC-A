import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Select from 'react-select';

import axios from "axios";
import { API_URL } from "../config";

import { MdNavigateNext } from "react-icons/md";
import { MdNavigateBefore } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";
import OrderDetailsComponent from "./OrderDetailsComponent";

const OrderCreateComponent = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
    tipoPago: '', 
    direccion: "",
    plazoCredito: '',
    note:'',
    fechaPago: new Date()
  });
  const [vendedores, setVendedores] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);

  const [date, setDates] = useState("");

  const fetchClients = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id",
        {
          id_owner: "CL-01",
        },
      );
      const clientesData = response.data.clients.map(cliente => ({
        value: cliente._id,
        label: `${cliente.name} ${cliente.lastName}`,
        directionid: cliente.client_location.direction,
        direction_id: cliente.client_location._id,
        number: cliente.number

      }));
      setClientes(clientesData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClients();
  }, []);
  const handleSelectChange = (selectedOption) => {
    setSelectedCliente(selectedOption);
    const clienteSeleccionado = clientes.find(cliente => cliente.value === selectedOption.value);
    setFormData(prevState => ({
      ...prevState,
      direccion: clienteSeleccionado ? clienteSeleccionado.directionid : "",
      telefono: clienteSeleccionado ? clienteSeleccionado.number : "",
    }));
  };

  useEffect(() => {
    let filtered = salesData;

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((item) => item.categoryId?._id === selectedCategory);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedCategory, salesData]);
  const fetchCategories = async () => {
    setLoading(true); 
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id", { userId: "CL-01" });
      setCategoriesList(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);
  const addToCart = (product) => {
    const existingProductIndex = cart.findIndex((item) => item._id === product._id);

    if (existingProductIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingProductIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1, price: product.priceId?.price || 0 }]);
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
  const calcularFechaPago = (creationDate, plazoCredito) => {
    if (!creationDate || !plazoCredito) return "No disponible";
  
    const fecha = new Date(creationDate);
  
    switch (plazoCredito) {
      case "1_semana":
        fecha.setDate(fecha.getDate() + 7);
        break;
      case "2_semanas":
        fecha.setDate(fecha.getDate() + 14);
        break;
      case "1_mes":
        fecha.setMonth(fecha.getMonth() + 1);
        break;
      case "45_días":
        fecha.setDate(fecha.getDate() + 45);

        break;
      default:
        return "Plazo no válido";
    }

    return fecha; 
  };
  
  useEffect(() => {
    const fetchVendedores = async () => {
      try {

        const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
          {
            id_owner: "CL-01"
          });
        setVendedores(response.data);

      } catch (error) {
        console.error(" obteniendo vendedores", error);
        setVendedores([]);
      }
    };

    fetchVendedores();
  }, []);
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
        id_user: "CL-01",
        status: false,
        page: pageNumber,
        limit: 8,
        search: searchTerm,
        category: selectedCategory
      });
      setSalesData(response.data.products || []);
      setFilteredData(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page, searchTerm, selectedCategory]);
  const generateReceiveNumber = () => {
    return Math.floor(Math.random() * (1000000000 - 10000000) + 10000000);
};

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert("Debe seleccionar al menos un producto.");
      return;
    }
    try {
      const orderData = {
        creationDate: new Date(),
        receiveNumber: "",
        noteAditional: formData.note,
        id_owner: "CL-01",
        products: cart.map(item => ({
          id: item.id,
          nombre: item.productName,
          cantidad: item.quantity,
          precio: item.price,
          descuento: item.disscount
        })),
        disscount:calcularDescuentos(),
        tax: 0,
        totalAmount: calcularTotal(),
        nit: 0,
        razonSocial: "",
        cellPhone: formData.telefono || "No disponible",
        direction: formData.direccion || "No disponible",
        accountStatus: formData.tipoPago,
        dueDate: date,
        id_client: selectedCliente?.value || "No seleccionado",
        salesId: formData.vendedor,
      };
    
      console.log("Datos enviados al backend:", orderData);
      await axios.post(API_URL + "/whatsapp/order", {
        creationDate: new Date(),
        receiveNumber: generateReceiveNumber(),
        noteAditional: formData.note,
        id_owner: "CL-01",
        products: cart.map(item => ({
          id: item.id,
          nombre: item.productName,
          cantidad: item.quantity,
          precio: item.price,
         // descuento: item.disscount
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
        salesId: formData.vendedor,
      });
      alert("Orden guardada exitosamente.");
      setCart([]);
      navigate("/order");
      setFormData({ nombre: "", apellido: "", email: "",direccion:"", telefono: 0, punto: "", vendedor: "", tipopago: '', plazoCredito: '' });
      setSelectedCliente(null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div role="status">
              <svg aria-hidden="true" class="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex mt-4 justify-end space-x-2">
              {viewMode === "card" ? (
                <button
                  onClick={() => setViewMode("form")}
                  className="px-3 py-3 bg-white font-bold text-3xl text-[#D3423E] rounded-full hover:bg-[#D3423E] hover:text-white flex items-center gap-2"
                >

                  <MdNavigateNext />
                </button>

              ) : viewMode === "form" ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode("card")}
                    className="px-3 py-3 bg-white font-bold text-3xl text-[#D3423E] rounded-full hover:bg-[#D3423E] hover:text-white flex items-center gap-2"
                  >
                    <MdNavigateBefore />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className="px-3 py-3 bg-white font-bold text-3xl text-[#D3423E] rounded-full hover:bg-[#D3423E] hover:text-white flex items-center gap-2"
                  >
                    <MdNavigateNext />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode("form")}
                    className="px-3 py-3 bg-white font-bold text-3xl text-[#D3423E] rounded-full hover:bg-[#D3423E] hover:text-white flex items-center gap-2"
                  >
                    <MdNavigateBefore />
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className="px-3 py-3 bg-white font-bold text-3xl text-[#D3423E] rounded-full hover:bg-[#D3423E] hover:text-white flex items-center gap-2"
                  >
                    <MdNavigateNext />
                  </button>
                </div>

              )}
            </div>
            {viewMode === "card" ? (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="relative flex items-center space-x-4">
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      <option value="">Todas las categorías</option>
                      {categoriesList.map((category) => (
                        <option key={category._id} value={category._id}>{category.categoryName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5">
                  {filteredData.map((item) => (
                    <div key={item._id} className="p-5 border border-gray-400 rounded-2xl shadow-lg bg-gray-100 flex flex-col">
                      <a href="/#">
                        <img className="w-40 h-40 object-cover mx-auto rounded-lg" src={item.productImage} alt="product image" />
                      </a>
                      <h3 className="mt-2 text-m text-gray-900 font-bold">{item.productName || "Sin nombre"}</h3>
                      <div className="flex-grow"></div>
                      <p className="text-gray-900">{item.categoryId?.categoryName || "Sin categoría"}</p>
                      <div className="flex-grow"></div>
                      <div class="flex items-center justify-between">
                        <span className="text-left text-3xl font-bold text-gray-900">{item.priceId?.price ? `Bs. ${item.priceId.price}` : "N/A"}</span>
                        <button
                          onClick={() => addToCart(item)}
                          href="#"
                          class="text-[#D3423E] bg-white hover:bg-[#D3423E] hover:text-white focus:ring-4 focus:outline-none focus:ring-[#D3423E] font-bold rounded-full text-l px-2.5 py-2.5 text-center "
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
                      className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                        }`}
                    >
                      ◀
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`px-3 py-1 border border-gray-400 rounded-lg ${page === num ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"
                          }`}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                        }`}
                    >
                      ▶
                    </button>
                  </nav>
                )}
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
                          className="text-gray-900 rounded-lg"
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
                          className="p-2 text-gray-900 focus:border-red-700 rounded-lg"
                          name="tipoPago"
                          value={formData.tipoPago}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Seleccione un tipo de pago</option>
                          <option value="credito">Crédito</option>
                          <option value="contado">Contado</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                      {formData.tipoPago === 'credito' && (
                        <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Plazo de pago</label>
                          <select
                            className="p-2 text-gray-900 hover:text-red-700 hover:border-red-700 focus:border-red-700 rounded-lg mt-2"
                            name="plazoCredito"
                            value={formData.plazoCredito}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Seleccione el plazo</option>
                            <option value="1_semana">1 Semana</option>
                            <option value="2_semanas">2 Semanas</option>
                            <option value="1_mes">1 Mes</option>
                            <option value="45_dias">45 Días</option>
                          </select>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <label className="text-left text-sm font-medium text-gray-900 mb-1">Vendedor</label>
                        <select
                          className="p-2  text-gray-900 hover:text-red-700  hover:border-red-700 focus:border-red-700 rounded-lg"
                          name="vendedor" value={formData.vendedor} onChange={handleChange} required>
                          <option value="">Seleccione un vendedor</option>
                          {vendedores.map((vendedor) => (
                            <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                          ))}
                        </select>
                      </div>
                      {selectedCliente && (
                        <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección</label>
                          <input
                            type="text"
                            value={formData.direccion}
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5"
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
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5"
                            readOnly
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                          <label className="text-left text-sm font-medium text-gray-900 mb-1">Nota</label>
                          <input
                            type="text"
                            value={formData.note}
                            className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5"
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
                              disabled
                              value={item.price}
                              onChange={(e) => {
                                const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                setCart(cart.map((c, i) => i === index ? { ...c, price: newPrice } : c));
                              }}
                              className="w-1/6 mr-1 ml-1 text-center border rounded-lg text-gray-900"
                            />

                            <input
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => {
                                const newDiscount = Math.max(0, parseFloat(e.target.value) || 0);
                                setCart(cart.map((c, i) => i === index ? { ...c, discount: newDiscount } : c));
                              }}
                              className="w-1/6  mr-1 ml-1 text-center border rounded-lg text-gray-900"
                            />

                            <span className="w-1/6 text-center font-bold text-gray-900">
                              Bs. {(item.price - (item.discount || 0)).toFixed(2)}
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
