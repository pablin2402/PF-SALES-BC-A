import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

const SalesView = () => {
    const defaultImage = "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";

    const [imagePreview, setImagePreview] = useState(defaultImage);
    const [categoriesList, setCategoriesList] = useState([]);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const fetchCategories = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/category/id",
                {
                    userId: user,
                    id_owner: user,
                }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCategoriesList(response.data.data);
        } catch (error) {
        } finally {
        }
    };
    const [formData, setFormData] = useState({ productName1: "",supplier:"", categoryId:"",productImage: "", qty: 1, description:"", id_user:"", productId:"",status: true, buttonStatus: false, addDisccount:0, extra:0 });
    const [formDataPrice, setFormDataPrice] = useState({ price: 0, offerPrice: false, merchandiseCost: 0, revenue: 0, marginGain:0, disscount:0, productId:"" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
          ...formData,
          [name]: name === "qty" ? Number(value) : value,
        });
      };
      
    const handleChangePrice = (e) => {
        const { name, value } = e.target;
        setFormDataPrice({
          ...formDataPrice,
          [name]: name === "price" ? Number(value) : value,
          [name]: name === "merchandiseCost" ? Number(value) : value,
          [name]: name === "revenue" ? Number(value) : value,
          [name]: name === "marginGain" ? Number(value) : value,
          [name]: name === "disscount" ? Number(value) : value,

        });
      };  
    const resetForm = () => {
        setFormData({ productName1: "",supplier:"", productImage: "", qty: 1, description:"", categoryId:"", id_user:"", productId:"",status: true, buttonStatus: false, addDisccount:0, extra:0 });
        setFormDataPrice({ price: 0, offerPrice: false, merchandiseCost: 0, revenue: 0, marginGain:0, disscount:0, productId:"" });   
    };
      const generateUniqueProductId = (productName) => {
        const sanitized = productName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
        const uniqueSuffix = Date.now().toString(36); 
        return `${sanitized}-${uniqueSuffix}`;
      };
      
      const handleSubmit = async (e) => {
        e.preventDefault();   
        try { 
        const pricePromise = axios.post(API_URL + "/whatsapp/price",
            {
              price: formDataPrice.price, 
              offerPrice: formDataPrice.offerPrice, 
              merchandiseCost: formDataPrice.merchandiseCost, 
              revenue: formDataPrice.revenue, 
              marginGain: formDataPrice.marginGain, 
              disscount: formDataPrice.disscount, 
              productId: generateUniqueProductId(formData.productName1)
            }, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          const priceResponse = await Promise.race([pricePromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))]);
          if (priceResponse.status === 200) {
                console.log(priceResponse)   
                const directionId = priceResponse.data.id;
                const name = priceResponse.data.productId;
                await axios.post(API_URL + "/whatsapp/product",
                    {
                        productName: formData.productName1, 
                        categoryId: formData.categoryId,
                        priceId:directionId,
                        supplierId:"6596e4de8aa965ef608703d1",
                        productImage: formData.productImage, 
                        qty: formData.qty, 
                        description: formData.description, 
                        id_user: user, 
                        productId: name,
                    }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                    }
                );
                resetForm();
            }
            } catch (error) {
                console.error("Error en el proceso", error);
                alert("Error inesperado");
            }
        
    };
    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImagePreview(imageUrl);
        }
    };
    return (
        <div className="flex justify-center px-1 mt-10">
            <div className="flex w-full max-w-5xl gap-6">
                <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-6 text-l text-left font-bold text-gray-900">Información General</h2>
                    <form>
                        <div className="grid gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">
                                    Nombre del producto
                                </label>
                                <input
                                    type="text"
                                    name="productName1"
                                    value={formData.productName1}
                                    onChange={handleChange}
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-2xl focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Nombre del producto"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-6 mt-6">
                        <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">
                                    Descripción del producto
                                </label>
                            <textarea id="description" value={formData.description} onChange={handleChange}rows="4" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-2xl border border-gray-900" placeholder="Descripción del producto ..."></textarea>
                        </div>
                        </div>
                        <div className="mt-6 grid gap-6 sm:grid-cols-2">
                            <div className="flex flex-col">
                                <label
                                    className="text-left text-sm font-medium text-gray-900 mb-1"
                                >Precio en Bs.
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formDataPrice.price} onChange={handleChangePrice}
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-2xl focus:ring-black focus:border-black block p-2.5"
                                    placeholder="0 bs."
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label
                                    className="text-left text-sm font-medium text-gray-900 mb-1"
                                >Descuento en Bs.
                                </label>
                                <input
                                    type="number"
                                    name="disscount"
                                    value={formDataPrice.disscount} onChange={handleChangePrice}
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-2xl focus:ring-black focus:border-black block p-2.5"
                                    placeholder="0 bs."
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-6 grid gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">
                                    Categoría
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId} 
                                    onChange={handleChange}
                                    className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categoriesList.map((category) => (
                                        <option key={category._id} value={category._id}>{category.categoryName}</option>
                                    ))}
                                </select>
                            </div>
                          
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="px-5 py-2.5 text-m font-bold uppercase text-white bg-[#D3423E] rounded-3xl hover:bg-[#FF9C99] transition"
                            >
                                Guardar datos
                            </button>
                        </div>
                    </form>
                </div>

                <div className="w-2/6 p-5 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-4 text-l text-left font-bold text-gray-900">Imagen del punto</h2>

                    <form className="flex flex-col items-center">
                        <div className="mt-4 flex justify-center">
                            <a href={imagePreview} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imagePreview}
                                    alt="Vista previa"
                                    className="w-40 h-40 object-cover border border-gray-300 rounded-lg shadow-md"
                                />
                            </a>
                        </div>
                        <div className="mt-4">
                            <label className="mt-4 text-left text-sm font-medium text-gray-900 mb-2 text-left w-full">
                                Subir imagen
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-3/4 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                                onChange={handleImageChange}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>


    );
};

export default SalesView;
