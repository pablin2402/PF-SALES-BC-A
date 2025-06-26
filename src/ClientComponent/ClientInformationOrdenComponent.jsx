import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import ClientPaymentDialog from "./ClientPaymentDialog";
import axios from "axios";
import { API_URL } from "../config";
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
    const [paymentsData, setPaymentsData] = useState([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const tabs = ["Año", "Mes"];
    const [orderData, setOrderData] = useState([]);
    const [activeTab] = useState(0);
    const tabRefs = useRef(new Array(tabs.length).fill(null));
    const [setIndicatorStyle] = useState({ left: 0, width: 0 });
    const [selectedImage, setSelectedImage] = useState(null);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
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
    const fetchPayments = async () => {
        if (!state?.files?.id_client.id_user) {
            console.error("No se encontró orderId en el estado.");
            return;
        }
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/pay/id", {
                id_client: state?.files.id_client._id,
                id_owner: user,
                orderId: state.files._id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const payments = response.data;
            if (payments.length > 0) {
                const totalPaidSum = payments.reduce((sum, payment) => sum + (payment.total || 0), 0);
                setPaymentsData(payments);
                setTotalPaid(totalPaidSum);
            } else {
                setPaymentsData([]);
                setTotalPaid(0);
            }

        } catch (error) {
            console.error("Error al obtener los pagos", error);
        }
    };
    const fetchOrderTracks = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/track/list", {
                orderId: state.files._id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const payments = response.data || [];
            setOrderData(payments);
        } catch (error) {
            console.error("Error al obtener los pagos", error);
        }
    };
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchPayments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchOrderTracks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            case "Contado":
                return "Contado";
            case "Crédito":
                return "Crédito";
            default:
                return status;
        }
    };
    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
    };
    const closeModal = () => {
        setSelectedImage(null);
    };
    const getInitials = (name = "", lastName = "") => {
        if (typeof name !== "string" || typeof lastName !== "string") return "";

        const fullName = `${name} ${lastName}`.trim();
        const parts = fullName.split(" ");
        return parts
            .filter(Boolean)
            .map((p) => p[0].toUpperCase())
            .slice(0, 2)
            .join("");
    };

    const colorClasses = [
        'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-yellow-300',
        'bg-red-800', 'bg-red-900', 'bg-yellow-600', 'bg-yellow-800'
    ];
    const getColor = (name, lastName) => {
        const hash = (name + lastName)
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const index = hash % colorClasses.length;
        return colorClasses[index];
    };
    return (
        <div className="bg-white min-h-screen p-5">
            <div className="relative overflow-x-auto">
                <div className="flex mt-4 mb-4 justify-start space-x-2">
                    {state.flag ? (
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                <li className="inline-flex items-center" >
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                                    >
                                        <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                        </svg>
                                        Lista de ventas
                                    </button>

                                </li>
                                <li aria-current="page">
                                    <div className="flex items-center">
                                        <svg className="rtl:rotate-180 w-3 h-3 text-gray-900 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                        </svg>
                                        <span className="ms-1 text-m font-bold  text-[#D3423E] md:ms-2 dark:text-gray-400">Detalle del pago</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                    ) : (
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                <li className="inline-flex items-center" >
                                    <button
                                        onClick={() => navigate(-2)}
                                        className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                                    >
                                        <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                        </svg>
                                        Lista de clientes
                                    </button>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                        </svg>
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="ms-1 text-m font-medium text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                                        >
                                            {state.files.id_client.name + " " + state.files.id_client.lastName}
                                        </button>
                                    </div>
                                </li>
                                <li aria-current="page">
                                    <div className="flex items-center">
                                        <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                        </svg>
                                        <span className="ms-1 text-sm font-medium text-gray-900 md:ms-2 dark:text-gray-400">Detalle del pedido</span>
                                    </div>
                                </li>
                            </ol>
                        </nav>
                    )}
                </div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Nota de remisión <span className="text-gray-900 text-2xl">{"# " + state.files.receiveNumber}</span>
                    </h2>

                    <div className="flex items-center space-x-4">
                        {state.files.accountStatus === 'DEUDA' && (
                            <button
                                className="px-4 py-2 text-lg bg-[#D3423E] text-white font-bold rounded-lg hover:bg-[#FF9C99] hover:text-gray-900 transition duration-200"
                            >
                                Registrar pago
                            </button>
                        )}

                        <ClientPaymentDialog
                            isOpen={isDialogOpen}
                            onClose={handleCloseDialog}
                            onSave={handleSavePayment}
                            orderId={state.files._id}
                            totalPaid={totalPaid}
                            idClient={state.files.id_client._id}
                            salesID={state.files.salesId._id}
                            totalGeneral={totalGeneral}
                        />

                        <button
                            onClick={exportToPDF}
                            className="px-4 py-2 bg-white font-bold text-lg text-red-700 rounded-lg hover:text-white hover:bg-[#D3423E] flex items-center gap-2"
                        >
                            <FaFilePdf size="25" color="##726E6E" />
                        </button>

                        {totalPaid < totalGeneral && (
                            <button
                                onClick={handleOpenDialog}
                                className="px-4 py-2 bg-[#D3423E] font-bold text-xl text-white rounded-3xl hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
                            >
                                Ingresar Pago
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <ul className="flex flex-wrap text-m text-center text-red-700 font-bold">
                            <li className="me-2">
                                <button className="p-4 border-b-2 text-gray-900 rounded-lg border-transparent" onClick={() => setShowPayments(false)}>Productos</button>
                            </li>
                            {paymentsData.length > 0 && (
                                <li className="me-2">
                                    <button className="p-4 text-gray-900 rounded-lg" onClick={() => setShowPayments(true)}>
                                        Pagos
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                    {showPayments ? (
                        <div>
                            <div className="mt-5 border border-gray-400 rounded-xl">
                                <table className="w-full text-sm text-left border border-black shadow-xl rounded-2xl overflow-hidden">
                                    <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                        <tr>
                                            <th className="px-6 py-3 uppercase">Foto del Recibo</th>
                                            <th className="px-6 py-3 uppercase">Fecha de Pago</th>
                                            <th className="px-6 py-3 uppercase">Vendedor</th>
                                            <th className="px-6 py-3 uppercase">Nota</th>
                                            <th className="px-6 py-3 uppercase">Monto</th>
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
                                                            onClick={() => handleImageClick(payment.saleImage)}
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

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {selectedImage && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={closeModal}>
                                    <div className="relative">
                                        <img src={selectedImage} alt="Imagen ampliada" className="max-w-full max-h-full" />
                                        <button
                                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-4xl"
                                            onClick={() => closeModal}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 flex flex-col items-end gap-2">
                                <p className="text-m font-semibold text-gray-600 flex justify-between w-full max-w-xs">
                                    Saldo por Pagar:
                                    <span className="text-gray-900 font-bold text-lg ml-4">
                                        Bs. {totalGeneral.toFixed(2) - totalPaid.toFixed(2)}
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
                                <table className="w-full text-sm text-left border border-black rounded-2xl overflow-hidden">
                                    <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                        <tr>
                                            <th className="px-6 py-3 uppercase">Nombre del Producto</th>
                                            <th className="px-6 py-3 uppercase">Cantidad</th>
                                            <th className="px-6 py-3 uppercase">Precio Unitario</th>
                                            <th className="px-6 py-3 uppercase">Descuento</th>
                                            <th className="px-6 py-3 uppercase">Total</th>
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
                                    Saldo por Pagar:
                                    <span className="text-gray-900 font-bold text-lg ml-4">
                                        Bs. {totalGeneral.toFixed(2) - totalPaid.toFixed(2)}
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
                <div className="max-w-full mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <div className="space-y-4">
                        <div className="flex justify-between pb-2">
                            <span className="text-xl font-bold text-gray-900">Detalles del cliente:</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-xl font-bold text-gray-900">Cliente:</span>
                            <span className="text-lg text-gray-900">
                                {state.files.id_client.name + " " + state.files.id_client.lastName}
                            </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-xl font-bold text-gray-900">Repartidor:</span>
                            <span className="text-lg text-gray-900">
                                {state.files.orderTrackId
                                    ? `${state.files.orderTrackId.fullName} ${state.files.orderTrackId.lastName}`
                                    : 'No asignado'}
                            </span>

                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-xl font-bold text-gray-900">Estado:</span>
                            <span className="text-lg text-gray-900">
                                {formatAccountStatus(state.files.accountStatus)}
                            </span>
                        </div>


                        <div className="flex justify-between border-b pb-2">
                            <span className="text-xl font-bold text-gray-900">Vencimiento:</span>
                            <span className="text-lg text-gray-900">
                                {state.files.dueDate
                                    ? new Date(state.files.dueDate).toLocaleDateString("es-ES")
                                    : new Date(state.files.creationDate).toLocaleDateString("es-ES")}
                            </span>
                        </div>

                    </div>

                </div>
                <div className="max-w-full mt-4 p-6 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <ol className="relative border-s border-gray-300 dark:border-gray-700">
                        {Array.isArray(orderData) && orderData.length > 0 ? (
                            orderData.map((event, index) => (
                                <li key={index} className="mb-10 ms-6">
                                    <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                                        <div
                                            className={`flex items-center justify-center w-10 h-10 rounded-full ${getColor(
                                                event.triggeredBySalesman?.fullName,
                                                event.triggeredBySalesman?.lastName
                                            )}`}
                                        >
                                            <span className="font-medium text-white">
                                                {getInitials(
                                                    event.triggeredBySalesman?.fullName,
                                                    event.triggeredBySalesman?.lastName
                                                )}
                                            </span>
                                        </div>
                                    </span>

                                    <div className="p-8 ml-4 bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-gray-700 dark:border-gray-600">
                                        <div className="items-center justify-between mb-3 sm:flex">
                                            <time className="mb-1 text-xs font-normal text-gray-900 sm:order-last sm:mb-0">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </time>
                                            <div className="text-m font-normal text-gray-900 dark:text-gray-300">
                                                {event.eventType === "Orden Creada" && (
                                                    <div>
                                                        <strong>
                                                            {event.triggeredBySalesman?.fullName
                                                                ? `${event.triggeredBySalesman.fullName} ${event.triggeredBySalesman.lastName}`
                                                                : event.triggeredByUser?.fullName
                                                                    ? `${event.triggeredByUser.fullName} ${event.triggeredByUser.lastName}`
                                                                    : event.triggeredByDelivery?.fullName
                                                                        ? `${event.triggeredByDelivery.fullName} ${event.triggeredByDelivery.lastName}`
                                                                        : "Alguien"}
                                                        </strong>{" "}
                                                        ha creado el pedido
                                                    </div>
                                                )}

                                                {event.eventType === "Pago Ingresado" && (
                                                    <div>
                                                        <strong>
                                                            {event.triggeredBySalesman?.fullName
                                                                ? `${event.triggeredBySalesman.fullName} ${event.triggeredBySalesman.lastName}`
                                                                : event.triggeredByUser?.fullName
                                                                    ? `${event.triggeredByUser.fullName} ${event.triggeredByUser.lastName}`
                                                                    : event.triggeredByDelivery?.fullName
                                                                        ? `${event.triggeredByDelivery.fullName} ${event.triggeredByDelivery.lastName}`
                                                                        : "Alguien"}
                                                        </strong>{" "}
                                                        ha ingresado un pago
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                No se tienen datos de registro de actividad.
                            </div>
                        )}
                    </ol>

                </div>
            </div>
        </div>
    );
}
