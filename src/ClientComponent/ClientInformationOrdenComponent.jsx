import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ClientPaymentDialog from './ClientPaymentDialog';
import axios from "axios";
import { API_URL } from "../config";
export default function ClientInformationOrdenComponent() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [totalGeneral, setTotalGeneral] = useState(0);
    const [totalDescuentos, setTotalDescuentos] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showPayments, setShowPayments] = useState(false);

    const [salesData, setSalesData] = useState([]);
    const totalPagado = salesData.reduce((acc, payment) => acc + payment.total, 0);
    const saldoDisponible = totalGeneral - totalPagado;

    useEffect(() => {
        console.log(state);
        if (state?.products) {
            let total = 0;
            let descuentos = 0;

            state.products.forEach((product) => {
                const precio = product.priceId.price || 0;
                const descuento = product.priceId.disscount || 0;
                const cantidad = product.qty || 1;

                descuentos += descuento * cantidad;
                total += (precio - descuento) * cantidad;
            });

            setTotalGeneral(total);
            setTotalDescuentos(descuentos);
        }
    }, [state?.products]);

    const fetchProducts = async () => {
        console.log(state?.files?.order_id);
        if (!state?.files?.order_id) {
            console.error(" No se encontró orderId en el estado.");
            return;
        }
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", {
                orderId: state.files.order_id
            });
            console.log(response.data)
            setSalesData(response.data || []);
        } catch (error) {
            console.error("Error al cargar los productos:", error);
        } finally {
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);


    if (!state || !state.products) {
        return (
            <div className="text-center mt-10 text-xl">
                No hay productos disponibles.
            </div>
        );
    }

    const handleOpenDialog = () => setIsDialogOpen(true);
    const handleCloseDialog = () => setIsDialogOpen(false);
    const handleSavePayment = (paymentData) => {
        console.log('Payment saved:', paymentData);
        handleCloseDialog();
    };

    const handleToggleTable = () => {
        setShowPayments(!showPayments);
    };



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
            <div className="w-full max-w-5xl bg-white p-6 shadow-lg rounded-lg ">
                <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                    Nota de remisión <span className="text-gray-500 text-lg">{state.files.receiveNumber}</span>
                </h2>
                <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                    Cliente <span className="text-gray-500 text-lg">{state.files.razonSocial}</span>
                </h2>
                <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                    Estado <span className="text-gray-500 text-lg">{state.files.accountStatus}</span>
                </h2>
                <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                    Vencimiento <span className="text-gray-500 text-lg">
                        {state.files.dueDate ? new Date(state.files.dueDate).toLocaleDateString("es-ES") : state.files.creationDate}
                    </span>
                </h2>
                <div className="flex mt-4 justify-end space-x-2">
                    {state.files.accountStatus === 'DEUDA' && (
                        <div>
                            <button
                                onClick={handleOpenDialog}
                                className="mr-4 px-4 py-2 text-lg bg-[#D3423E] text-white font-bold rounded-lg hover:bg-[#FF9C99] hover:text-gray-900 hover:font-bold transition duration-200"
                            >
                                Registrar pago
                            </button>
                        </div>
                    )}
                    <ClientPaymentDialog
                        isOpen={isDialogOpen}
                        onClose={handleCloseDialog}
                        onSave={handleSavePayment}
                    />
                    <button className="mr-4 px-4 py-2 text-lg bg-[#D3423E] text-white font-bold rounded-lg hover:bg-[#FF9C99] hover:text-gray-900 hover:font-bold transition duration-200">
                        Exportar
                    </button>
                </div>
                <div className="mt-6 text-right">
                <button
                        onClick={handleToggleTable}
                        className="px-4 py-2 text-lg bg-white text-red-500 font-bold rounded-lg hover:bg-[#D3423E] hover:text-white hover:font-bold transition duration-200"
                    >
                        {showPayments ? "Productos" : "Pagos"}
                    </button>
                </div>
                {showPayments ? (
                    <div className="mt-5 border border-gray-400 rounded-xl">
                        <table className="w-full text-sm text-left border border-black shadow-xl rounded-2xl overflow-hidden">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Foto del Recibo</th>
                                    <th className="px-6 py-3">Fecha de Pago</th>
                                    <th className="px-6 py-3">Vendedor</th>
                                    <th className="px-6 py-3">Nota</th>
                                    <th className="px-6 py-3">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData?.map((payment, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                         <td className="px-6 py-4 text-gray-900">
                                            {payment.saleImage ? (
                                                <img
                                                    src={payment.saleImage}
                                                    alt="Foto del recibo"
                                                    className="w-20 h-20 object-cover rounded-md"
                                                />
                                            ) : (
                                                "No disponible"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {new Date(payment.creationDate).toLocaleDateString("es-ES")}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">{payment.salesManId.fullName} {" " + payment.salesManId.lastName}</td>
                                        <td className="px-6 py-4 text-gray-900">{payment.note}</td>
                                        <td className="px-6 py-4 text-gray-900">Bs. {payment.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                ) : (
                    <div className="mt-5 border border-gray-400 rounded-xl">
                        <table className="w-full text-sm text-left border border-black shadow-xl rounded-2xl overflow-hidden">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Nombre del Producto</th>
                                    <th className="px-6 py-3">Cantidad</th>
                                    <th className="px-6 py-3">Precio Unitario</th>
                                    <th className="px-6 py-3">Descuento</th>
                                    <th className="px-6 py-3">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.products.map((product, index) => {
                                    const precio = product.priceId.price || 0;
                                    const descuento = product.priceId.disscount || 0;
                                    const cantidad = product.qty || 1;
                                    const totalPorProducto = (precio - descuento) * cantidad;

                                    return (
                                        <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{product.productName || "Sin nombre"}</td>
                                            <td className="px-6 py-4 text-gray-900">{cantidad}</td>
                                            <td className="px-6 py-4 text-gray-900">Bs. {precio.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-gray-900">Bs. {descuento.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-gray-900">Bs. {totalPorProducto.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                    </div>

                )}
                <div className="mt-4 flex flex-col items-end gap-2">
                    <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                        Saldo Disponible:
                        <span className="text-gray-900 font-bold text-lg ml-4">
                            Bs. {saldoDisponible.toFixed(2)}
                        </span>
                    </p>

                    <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                        Total de Descuentos:
                        <span className="text-gray-900 font-bold text-lg ml-4">Bs. {totalDescuentos.toFixed(2)}</span>
                    </p>
                    <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                        Total General:
                        <span className="text-gray-900 text-2xl font-bold ml-4">Bs. {totalGeneral.toFixed(2)}</span>
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700"
                >
                    Volver
                </button>
            </div>
        </div>
    );
}
