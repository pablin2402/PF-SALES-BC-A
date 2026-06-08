export const ProductEditModal = ({ onClose, editingProduct, item }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [editedPrice, setEditedPrice] = useState("");

    const handleSaveChanges = async () => {
        if (!editingProduct || !editedName.trim() || !editedPrice) return;
        setSubmitting(true);
        try {
            await axios.put(API_URL + "/whatsapp/product/price/id", {
                productId: editedId,
                priceId: editedPriceId,
                newName: editedName,
                newPrice: editedPrice
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessModal(true);
            setShowEditModal(false);
            fetchProducts(page);
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            setErrorModal(true);
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                onClick={() => setShowEditModal(false)}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                <MdEdit size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Editar producto</h3>
                                <p className="text-xs text-red-100">Actualiza nombre y precio</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {editingProduct?.productImage && (
                            <div className="flex justify-center">
                                <img
                                    src={editingProduct.productImage}
                                    alt={editingProduct.productName}
                                    className="w-24 h-24 object-contain rounded-xl bg-gray-50 border border-gray-200"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                Nombre del producto <span className="text-[#D3423E]">*</span>
                            </label>
                            <div className="relative">
                                <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                    placeholder="Nombre del producto"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                                Precio (Bs.) <span className="text-[#D3423E]">*</span>
                            </label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="number"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            {editingProduct?.priceId?.price && Number(editedPrice) !== Number(editingProduct.priceId.price) && (
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <FaCheckCircle className="text-green-500" size={10} />
                                    Precio anterior: <strong className="text-gray-700">Bs. {editingProduct.priceId.price}</strong>
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={!editedName.trim() || !editedPrice || submitting}
                                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${!editedName.trim() || !editedPrice || submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#D3423E] hover:bg-red-700'}`}
                            >
                                {submitting ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

        </AnimatePresence>
    );
};