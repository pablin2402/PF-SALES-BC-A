import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";

const SalesView = () => {
    const defaultImage = "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";

    const [imagePreview] = useState(defaultImage);
    const [categoriesList, setCategoriesList] = useState([]);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const [imageFile, setImageFile] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };
    const uploadImage = async () => {
        const formData = new FormData();
        formData.append("image", imageFile);

        const res = await axios.post(API_URL + "/whatsapp/upload/image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data.imageUrl;
    };
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
    const [formData, setFormData] = useState({ productName1: "", supplier: "", categoryId: "", productImage: "", qty: 1, description: "", id_user: "", productId: "", status: true, buttonStatus: false, addDisccount: 0, extra: 0, numberofUnitsPerBox: 0 });
    const [formDataPrice, setFormDataPrice] = useState({ price: 0, offerPrice: false, merchandiseCost: 0, revenue: 0, marginGain: 0, disscount: 0, productId: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "qty" ? Number(value) : value,
            [name]: name === "numberofUnitsPerBox" ? Number(value) : value,

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
        setFormData({ productName1: "", supplier: "", productImage: "", qty: 1, description: "", categoryId: "", id_user: "", productId: "", status: true, buttonStatus: false, addDisccount: 0, extra: 0, numberofUnitsPerBox: 0 });
        setFormDataPrice({ price: 0, offerPrice: false, merchandiseCost: 0, revenue: 0, marginGain: 0, disscount: 0, productId: "" });
    };
    const generateUniqueProductId = (productName) => {
        const sanitized = productName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
        const uniqueSuffix = Date.now().toString(36);
        return `${sanitized}-${uniqueSuffix}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const imageUrl = imageFile ? await uploadImage() : "";

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
                const directionId = priceResponse.data.id;
                const name = priceResponse.data.productId;
                await axios.post(API_URL + "/whatsapp/product",
                    {
                        productName: formData.productName1,
                        categoryId: formData.categoryId,
                        priceId: directionId,
                        supplierId: "6596e4de8aa965ef608703d1",
                        productImage: imageUrl,
                        qty: formData.qty,
                        description: formData.description,
                        id_user: user,
                        productId: name,
                        numberofUnitsPerBox: formData.numberofUnitsPerBox
                    }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
                );
                resetForm();
                navigate("/product");

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

    const isFormValid = () => {
        return (
            formData.productName1?.trim() &&
            formData.categoryId &&
            formData.numberofUnitsPerBox > 0 &&
            formDataPrice.price >= 0 &&
            formDataPrice.disscount >= 0 &&
            imagePreview
        );
    };

    return (
        <div className="flex justify-center px-1 mt-10">
            <div className="flex w-full max-w-5xl gap-6">
                <div className="w-full p-6 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-6 text-l text-left font-bold text-gray-900">Detalles del producto</h2>
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
                        <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
                            <div className="flex flex-col">
                                <label
                                    className="text-left text-sm font-medium text-gray-900 mb-1"
                                >Número de unidades por caja
                                </label>
                                <input
                                    type="number"
                                    name="numberofUnitsPerBox"
                                    value={formData.numberofUnitsPerBox} onChange={handleChange}
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-2xl focus:ring-black focus:border-black block p-2.5"
                                    placeholder="0"
                                    required
                                />
                            </div>

                        </div>
                        <div className="grid gap-6">
                            <h2 className="mt-4 text-l text-left font-bold text-gray-900">Imagen del producto</h2>
                            <div className="flex flex-col">
                                <input
                                    className="block w-full text-gray-900 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-[#D3423E] focus:outline-none"
                                    id="user_avatar"
                                    type="file"
                                    accept=".svg,.png,.jpg,.jpeg"
                                    onChange={handleFileChange} />
                                <p className="mt-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> SVG, PNG o JPG</p>
                            </div>
                        </div>
                        <div className="flex justify-center mt-6">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={!isFormValid()}
                                className={`px-5 py-2.5  w-full text-m font-bold uppercase rounded-3xl transition ${isFormValid()
                                    ? "bg-[#D3423E] text-white hover:bg-[#FF9C99]"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                Guardar datos
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>


    );
};

export default SalesView;
