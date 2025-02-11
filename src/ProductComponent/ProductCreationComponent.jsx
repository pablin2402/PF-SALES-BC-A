import React, { useEffect, useState } from "react";
import axios from "axios";

const SalesView = () => {
    const defaultImage = "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";

    const [imagePreview, setImagePreview] = useState(defaultImage);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImagePreview(imageUrl);
        }
    };
    return (
        <div className="flex justify-center bg-gray-100 px-1 mt-10">
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
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Nombre"
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
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
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
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
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
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Nombre"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">
                                    Proveedor
                                </label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Nombre"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                type="submit"
                                className="px-5 py-2.5 text-m font-medium text-white bg-[#D3423E] rounded-lg hover:bg-[#FF9C99] transition"
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
