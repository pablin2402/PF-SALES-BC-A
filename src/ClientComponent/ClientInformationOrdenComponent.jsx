import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback,useRef,useEffect } from "react";
import ClientPaymentDialog from "./ClientPaymentDialog";
import axios from "axios";
import { API_URL } from "../config";
import { MdNavigateBefore } from "react-icons/md";
import { FaFilePdf } from "react-icons/fa6";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export default function ClientInformationOrdenComponent() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [totalGeneral, setTotalGeneral] = useState(0);
    const [totalDescuentos, setTotalDescuentos] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showPayments, setShowPayments] = useState(false);

    const [setSalesData] = useState([]);
    const [paymentsData, setPaymentsData] = useState([]);

    const [totalPaid, setTotalPaid] = useState(0);
    const [totalDebt, setTotalDebt] = useState(0);

    const tabs = ["Año", "Mes"];

    const [activeTab] = useState(0);
    const tabRefs = useRef(new Array(tabs.length).fill(null));
    const [setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (tabRefs.current[activeTab]) {
            const { offsetLeft, offsetWidth } = tabRefs.current[activeTab];
            setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
        }
    }, [activeTab, setIndicatorStyle]); 

    const exportToPDF = () => {
    const pdf = new jsPDF();
    pdf.addImage("/camacho.jpeg", "PNG", 160, 10, 30, 30);
    pdf.text("Recibo Electrónico", 15, 20);

    pdf.text(`Nota de remisión: ${state.files.receiveNumber}`, 15, 30);
    pdf.text(`Cliente: ${state.files.id_client.name} ${state.files.id_client.lastName}`, 15, 40);
    pdf.text(`Estado: ${formatAccountStatus(state.files.accountStatus)}`, 15, 50);
    pdf.text(`Vencimiento: ${state.files.dueDate ? new Date(state.files.dueDate).toLocaleDateString("es-ES") : new Date(state.files.creationDate).toLocaleDateString("es-ES")}`, 15, 60);

    autoTable(pdf, {
        startY: 70,
        head: [["Nombre del Producto", "Cantidad", "Precio Unitario", "Descuento", "Total"]],
        body: state.products.map(product => {
        const precio = product.precio || 0;
        const descuento = 0;
        const cantidad = product.cantidad || 1;
        const totalPorProducto = (precio - descuento) * cantidad;
        return [
            product.nombre || "Sin nombre",
            cantidad,
            `Bs. ${precio.toFixed(2)}`,
            `Bs. ${descuento.toFixed(2)}`,
            `Bs. ${totalPorProducto.toFixed(2)}`
        ];
        })
    });

    // pdf.text(`Saldo Disponible: Bs. ${state.saldoDisponible.toFixed(2)}`, 15, pdf.lastAutoTable.finalY + 10);
    //pdf.text(`Total de Descuentos: Bs. ${state.totalDescuentos.toFixed(2)}`, 15, pdf.lastAutoTable.finalY + 20);
    pdf.text(`Total General: Bs. ${totalGeneral.toFixed(2)}`, 15, pdf.lastAutoTable.finalY + 30);

    pdf.save("recibo-electronico.pdf");
    };
    useEffect(() => {
    
        if (Array.isArray(state?.products)) {
            let total = 0;
            let descuentos = 0;
    
            state.products.forEach((product) => {
                const precio = product.precio || 0;
                const cantidad = product.cantidad || 1;
                const descuento = product.descuento || 0; 
                descuentos += descuento * cantidad;
                total += (precio - descuento) * cantidad;
            });
    
            setTotalGeneral(total);
            setTotalDescuentos(descuentos);
        }
    }, [state]);

    const fetchProducts = useCallback(async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", {
                orderId: state.files.order_id
            });
            setSalesData(response.data || []);
        } catch (error) {
            console.error("Error al cargar los productos:", error);
        } finally {
            //setLoading(false);
        }
    }, [state.files.order_id]); 
    
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    const fetchPayments = useCallback(async () => {
        console.log(state?.files);
        if (!state?.files?.id_client.id_user) {
            console.error("No se encontró orderId en el estado.");
            return;
        }
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/pay/id", {
                id_client: state?.files.id_client._id,
                id_owner: "CL-01",
                orderId: state.files._id
            });
            const payments = response.data || [];
            console.log(response.data);
            const totalPaidSum = payments.reduce((sum, payment) => sum + (payment.total || 0), 0);
            const totalDebtInitial = payments.length > 0 ? payments[0].debt : 0;
    
            setPaymentsData(payments);
            setTotalPaid(totalPaidSum);
            setTotalDebt(totalDebtInitial);
        } catch (error) {
            console.error("Error al obtener los pagos", error);
        }
    }, [state?.files]);
    
    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]); 
    
    const handleSavePayment = () => {
        fetchPayments();
    };
    if (!state || !state.products) {
        return (
            <div className="text-center mt-10 text-xl">
                No hay productos disponibles.
            </div>
        );
    }

    const handleOpenDialog = () => setIsDialogOpen(true);
    const handleCloseDialog = () => setIsDialogOpen(false);
    const formatAccountStatus = (status) => {
        switch (status) {
            case "pending":
                return "Contado";
            case "credito":
                return "Crédito";
            default:
                return status;
        }
    };
    
 
    return (
        <div className="bg-white min-h-screen p-5">
            <div className="ml-10 mr-10 relative overflow-x-auto">
                <div className="flex mt-4 mb-4 justify-start space-x-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-3 bg-white font-bold text-3xl text-[#D3423E] rounded-full hover:bg-[#D3423E] hover:text-white flex items-center gap-2"
                    >
                        <MdNavigateBefore />
                    </button>
                </div>
                <div className="p-6 border border-gray-600 rounded-lg">
                    <div>
                    <h2 className="text-2xl text-left font-bold text-gray-900 mb-4">
                        Nota de remisión <span className="text-gray-900 text-2xl">{state.files.receiveNumber}</span>
                    </h2>
                    <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                        Cliente: <span className="text-gray-900 text-lg">{state.files.id_client.name + " " + state.files.id_client.lastName}</span>
                    </h2>
                    <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                        Estado: <span className="text-gray-900 text-lg">{formatAccountStatus(state.files.accountStatus)}</span>
                    </h2>
                    <h2 className="text-xl text-left font-bold text-gray-900 mb-4">
                        Vencimiento: <span className="text-gray-900 text-lg">
                            {state.files.dueDate ? new Date(state.files.dueDate).toLocaleDateString("es-ES") : new Date(state.files.creationDate).toLocaleDateString("es-ES")}
                        </span>
                    </h2>
                    <div className="flex mt-4 justify-end space-x-2">
                        {state.files.accountStatus === 'DEUDA' && (
                            <div>
                                <button
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
                            orderId={state.files._id}
                            totalDebt={totalDebt}
                            idClient={state.files.id_client._id}
                            salesID={state.files.salesId._id}

                        />
                        <div className="flex justify-end items-center space-x-4">
                            <button
                                    onClick={exportToPDF} 
                                className="px-4 py-2 bg-white font-bold text-lg text-red-700 rounded-lg hover:text-white hover:bg-[#D3423E] flex items-center gap-2"
                            >
                                <FaFilePdf color="##726E6E" />
                            </button>
                            <button
                            onClick={handleOpenDialog}
                            className="px-4 py-2 bg-[#D3423E] font-bold text-lg text-white rounded-lg hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
                            >
                                Ingresar Pago
                            </button>
                        </div>
                    </div>
                    </div>
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <ul class="flex flex-wrap text-m text-center text-red-700 font-bold">
                            <li className="me-2">
                                <button className="p-4 border-b-2 rounded-lg border-transparent hover:text-red-600 hover:bg-red-200" onClick={() => setShowPayments(false)}>Productos</button>
                            </li>
                            <li className="me-2">
                                <button className="p-4 dark:text-blue-500 rounded-lg hover:text-red-600 hover:bg-red-200" onClick={() => setShowPayments(true)}>Pagos</button>
                            </li>
                        </ul>
                    </div>
                    {showPayments ? (
                        <div>
                            <div className="mt-5 border border-gray-400 rounded-xl">
                                <table className="w-full text-sm text-left border border-black shadow-xl rounded-2xl overflow-hidden">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3">Foto del Recibo</th>
                                            <th className="px-6 py-3">Fecha de Pago</th>
                                            <th className="px-6 py-3">Vendedor</th>
                                            <th className="px-6 py-3">Nota</th>
                                            <th className="px-6 py-3">Monto</th>
                                            <th className="px-6 py-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentsData?.map((payment, index) => (
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
                                                <td className="px-6 py-4 text-gray-900">{payment.sales_id.fullName + " " + payment.sales_id.lastName}</td>
                                                <td className="px-6 py-4 text-gray-900">{payment.note}</td>
                                                <td className="px-6 py-4 text-gray-900">Bs. {payment.total.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-gray-900">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {payment.paymentStatus === "paid" && (
                                                            <span className="bg-orange-400 text-m text-white px-3.5 py-0.5 rounded-full">
                                                            PAGO INGRESADO
                                                            </span>
                                                        )}
                                                        {payment.paymentStatus === "pagado" && (
                                                            <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                                                            PAGO APROBADO
                                                            </span>
                                                        )}
                                                    </td>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </div>
                            <div className="mt-4 flex flex-col items-end gap-2">
                                <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                                    Saldo por Pagar:
                                    <span className="text-gray-900 font-bold text-lg ml-4">
                                        Bs. {totalDebt.toFixed(2)}
                                    </span>
                                </p>

                                <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                                    Total Pagado:
                                    <span className="text-gray-900 font-bold text-lg ml-4">Bs. {totalPaid.toFixed(2)}</span>
                                </p>
                                <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                                    Total General:
                                    <span className="text-gray-900 text-2xl font-bold ml-4">Bs. {totalGeneral.toFixed(2)}</span>
                                </p>
                            </div>
                        </div>

                    ) : (
                        <div>
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
                                            const precio = product.precio || 0;
                                            const descuento = 0;
                                            const cantidad = product.cantidad || 1;
                                            const totalPorProducto = (precio - descuento) * cantidad;

                                            return (
                                                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{product.nombre || "Sin nombre"}</td>
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
                            <div className="mt-4 flex flex-col items-end gap-2">
                                <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                                    Saldo Disponible:
                                    <span className="text-gray-900 font-bold text-lg ml-4">
                                        Bs.                                         Bs. {totalDebt.toFixed(2)}
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
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
}
