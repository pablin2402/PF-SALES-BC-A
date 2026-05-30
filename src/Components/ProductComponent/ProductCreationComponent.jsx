import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimesCircle,
  FaBoxOpen,
  FaChevronLeft,
  FaImage,
} from "react-icons/fa";

const SalesView = () => {
  const defaultImage =
    "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";

  const [imagePreview, setImagePreview] = useState(defaultImage);
  const [categoriesList, setCategoriesList] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showProductErrorModal, setShowProductErrorModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName1: "",
    categoryId: "",
    qty: 1,
    description: "",
    id_user: "",
    productId: "",
    status: true,
    numberofUnitsPerBox: 0,
  });

  const [formDataPrice, setFormDataPrice] = useState({
    price: 0,
    offerPrice: false,
    merchandiseCost: 0,
    revenue: 0,
    marginGain: 0,
    disscount: 0,
    productId: "",
  });

  const handleFileChange = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    const fd = new FormData();
    fd.append("image", imageFile);
    const res = await axios.post(API_URL + "/whatsapp/upload/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.imageUrl;
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.post(
        API_URL + "/whatsapp/category/id",
        { userId: user, id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategoriesList(response.data.data);
    } catch {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "qty" || name === "numberofUnitsPerBox"
          ? Number(value)
          : value,
    }));
  };

  const handleChangePrice = (e) => {
    const { name, value } = e.target;
    setFormDataPrice((prev) => ({
      ...prev,
      [name]: ["price", "merchandiseCost", "revenue", "marginGain", "disscount"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      productName1: "", categoryId: "", qty: 1,
      description: "", id_user: "", productId: "",
      status: true, numberofUnitsPerBox: 0,
    });
    setFormDataPrice({
      price: 0, offerPrice: false, merchandiseCost: 0,
      revenue: 0, marginGain: 0, disscount: 0, productId: "",
    });
    setImagePreview(defaultImage);
    setImageFile(null);
  };

  const generateUniqueProductId = (productName) => {
    const sanitized = productName.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    return `${sanitized}-${Date.now().toString(36)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const imageUrl = imageFile ? await uploadImage() : "";
      const pricePromise = axios.post(
        API_URL + "/whatsapp/price",
        {
          price: formDataPrice.price,
          offerPrice: formDataPrice.offerPrice,
          merchandiseCost: formDataPrice.merchandiseCost,
          revenue: formDataPrice.revenue,
          marginGain: formDataPrice.marginGain,
          disscount: formDataPrice.disscount,
          productId: generateUniqueProductId(formData.productName1),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const priceResponse = await Promise.race([
        pricePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ]);
      if (priceResponse.status === 200) {
        const directionId = priceResponse.data.id;
        const name = priceResponse.data.productId;
        await axios.post(
          API_URL + "/whatsapp/product",
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
            numberofUnitsPerBox: formData.numberofUnitsPerBox,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        resetForm();
        navigate("/product");
      }
    } catch (error) {
      console.error("Error en el proceso", error);
      setShowProductErrorModal(true);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFormValid = () =>
    formData.productName1?.trim() &&
    formData.categoryId &&
    formData.numberofUnitsPerBox > 0 &&
    formDataPrice.price >= 0 &&
    formDataPrice.disscount >= 0;

  const precioFinal = (formDataPrice.price - formDataPrice.disscount).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={() => navigate("/product")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
          >
            <FaChevronLeft size={11} />
            Volver
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-start justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <FaBoxOpen className="text-[#D3423E]" size={26} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                Nuevo producto
              </h1>
              <p className="text-sm text-gray-500">
                Completa los campos y guarda el producto
              </p>
            </div>
          </div>

          <AnimatePresence>
            {formDataPrice.price > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 bg-white border border-gray-200
                           rounded-2xl px-4 py-2 shadow-sm"
              >
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Total
                </span>
                <div className="flex items-center gap-1.5 bg-[#D3423E] text-white rounded-xl px-3 py-1.5">
                  <FaBoxOpen size={12} />
                  <span className="text-sm font-bold">Bs. {precioFinal}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            <div className="lg:col-span-1 p-6 flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-800">
                Imagen del producto
              </p>

              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <label
                htmlFor="product_image_input"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileChange(e.dataTransfer.files[0]);
                }}
                className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl
                            border-2 border-dashed cursor-pointer transition-all select-none ${
                  isDragging
                    ? "border-[#D3423E] bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:border-[#D3423E] hover:bg-red-50"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#D3423E] flex items-center justify-center shadow-sm">
                  <FaImage className="text-white" size={14} />
                </div>
                <div className="text-center px-3">
                  <p className="text-xs font-semibold text-gray-700 truncate max-w-[180px]">
                    {imageFile ? imageFile.name : "Haz clic o arrastra aquí"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">SVG, PNG, JPG</p>
                </div>
                <input
                  id="product_image_input"
                  type="file"
                  accept=".svg,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
              </label>
            </div>

            <div className="lg:col-span-2 p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    name="productName1"
                    value={formData.productName1}
                    onChange={handleChange}
                    placeholder="Ej. Ron Abuelo Añejo 1000ml"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                               text-sm text-gray-900 placeholder-gray-400
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Categoría
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                   className="app-select"
                  >
                    <option value="">Todas las categorías</option>
                    {categoriesList.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Precio (Bs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none select-none">
                        Bs.
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formDataPrice.price}
                        onChange={handleChangePrice}
                        placeholder="0.00"
                        required
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                                   text-sm text-gray-900
                                   focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Descuento (Bs.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none select-none">
                        Bs.
                      </span>
                      <input
                        type="number"
                        name="disscount"
                        value={formDataPrice.disscount}
                        onChange={handleChangePrice}
                        placeholder="0.00"
                        required
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                                   text-sm text-gray-900
                                   focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Unidades por caja
                  </label>
                  <input
                    type="number"
                    name="numberofUnitsPerBox"
                    value={formData.numberofUnitsPerBox}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                               text-sm text-gray-900
                               focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>

                <div className="border-t border-gray-100 mt-1" />

                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl
                              text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                    isFormValid()
                      ? "bg-[#D3423E] text-white hover:bg-[#bb3330] shadow-sm hover:shadow-md active:scale-[0.98]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaBoxOpen size={14} />
                  Guardar producto
                </button>
              </form>
            </div>

          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showProductErrorModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <FaTimesCircle className="text-[#D3423E]" size={44} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Error inesperado
              </h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                No se pudo crear el producto. Por favor intenta nuevamente.
              </p>
              <button
                onClick={() => setShowProductErrorModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white
                           bg-[#D3423E] hover:bg-[#bb3330] transition active:scale-[0.98]"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesView;