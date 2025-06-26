import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

const CategoryCreation = ({ onClose }) => {
    const [categoryName, setCategoryName] = useState("");
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const handleSubmit = async (e) => {
        try {
          await axios.post(API_URL + "/whatsapp/category", {
            categoryName: categoryName,
            categoryId: "",
            categoryImage: "",
            userId: user,
            categoryColor: "",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
    
          setCategoryName("");
          onClose(); 
          
        } catch (error) {
          console.error("Error al enviar la categoría", error);
        }
      };
    

    return (
        <div className="flex justify-center bg-gray-100 px-1 mt-10">
            <div className="flex w-full max-w-5xl gap-6">
                <div className="w-full p-6 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-6 text-l text-left font-bold text-gray-900">Categorías de productos</h2>
                    <form >
                        <div className="grid gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre de categoría</label>
                                <input
                                    type="text"
                                    className="bg-gray-50 border border-gray-900 text-gray-900 text-sm rounded-3xl focus:ring-black focus:border-black block p-2.5"
                                    placeholder="Categoría"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    required                                />
                            </div>
                        </div>
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={handleSubmit}
                                type="submit"
                                className="px-5 py-2.5 text-lg font-medium text-white bg-[#D3423E] rounded-3xl hover:bg-[#FF9C99] transition"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>


    );
};

export default CategoryCreation;
