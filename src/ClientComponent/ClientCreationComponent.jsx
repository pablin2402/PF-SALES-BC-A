import React, { useEffect, useState } from "react";
import axios from "axios";

const SalesView = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-6">
            <div className="flex w-full max-w-5xl gap-6">

                <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-6 text-l text-left font-bold text-gray-900">Datos personales</h2>
                    <form>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Nombre"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Apellido</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Apellido"
                                    required
                                />
                            </div>

                            <div className="flex flex-col sm:col-span-2">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Correo</label>
                                <input
                                    type="email"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Correo electrónico"
                                    required
                                />
                            </div>
                        </div>

                        <h2 className="mt-6 mb-6 text-l text-left font-bold text-gray-900">Dirección</h2>
                        <div className="grid gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Dirección"
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre del Punto</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Nombre del punto"
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

                <div className="w-2/6 p-6 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-6 text-l text-left font-bold text-gray-900">Imagen del punto</h2>
                    <form>
                        <div className="grid gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Descripción del punto</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Dirección"
                                    required
                                />
                            </div>
                        </div>
                    </form>
                </div>

            </div>
        </div>


    );
};

export default SalesView;
