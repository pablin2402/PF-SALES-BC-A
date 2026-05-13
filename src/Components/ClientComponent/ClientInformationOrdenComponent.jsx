import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ClientPaymentDialog from "./ClientPaymentDialog";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { FaFilePdf, FaMapMarkedAlt, FaCreditCard, FaUser, FaCalendarAlt } from "react-icons/fa";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaTruck, FaRegClipboard, FaDollarSign, FaMapMarkerAlt, FaBoxOpen, FaHome, FaSpinner } from "react-icons/fa";

import tiendaIcon from "../../icons/entrega-rapida.png";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const containerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "12px"
};
export const GOOGLE_MAPS_LIBRARIES = ["maps"];

const ORDER_STATUS_CONFIG = {
    aproved: { label: "Aprobado", color: "bg-green-100 text-green-700 border-green-300", icon: FaCheckCircle, iconColor: "text-green-500" },
    "En Ruta": { label: "En Ruta", color: "bg-blue-100 text-blue-700 border-blue-300", icon: FaTruck, iconColor: "text-blue-500" },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-300", icon: FaTimesCircle, iconColor: "text-red-500" },
    created: { label: "Creado", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: FaExclamationCircle, iconColor: "text-yellow-500" },
    deliver: { label: "Entregado", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: FaBoxOpen, iconColor: "text-emerald-500" }
};

const EVENT_CONFIG = {
    "Orden Creada": { color: "bg-blue-500", icon: FaRegClipboard, text: "ha creado el pedido" },
    "Pago Ingresado": { color: "bg-yellow-500", icon: FaDollarSign, text: "ha ingresado un pago" },
    "Ha aprobado un pago": { color: "bg-green-500", icon: FaCheckCircle, text: "ha aprobado un pago" },
    "Ha sido asignado como repartidor": { color: "bg-purple-500", icon: FaTruck, text: "ha sido asignado como repartidor" },
    "está en camino al destino": { color: "bg-indigo-500", icon: FaTruck, text: "está en camino al punto de entrega" },
    "ha llegado al destino": { color: "bg-pink-500", icon: FaMapMarkerAlt, text: "ha llegado al destino de entrega" },
    "Pedido Entregado": { color: "bg-emerald-600", icon: FaBoxOpen, text: "ha entregado el pedido" }
};

export default function ClientInformationOrdenComponent() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [totalGeneral, setTotalGeneral] = useState(0);
    const [totalDescuentos, setTotalDescuentos] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const [paymentsData, setPaymentsData] = useState([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [orderData, setOrderData] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [deliveryData, setOrderPickUP] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: GOOGLE_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const saldoPendiente = totalGeneral - totalPaid;
    const porcentajePagado = totalGeneral > 0 ? (totalPaid / totalGeneral) * 100 : 0;

    const getTriggerName = (event) => {
        const trigger = event.triggeredBySalesman || event.triggeredByUser || event.triggeredByDelivery;
        if (trigger?.fullName) {
            return `${trigger.fullName} ${trigger.lastName || ''}`.trim();
        }
        return "Alguien";
    };

    const exportToPDF = () => {
        const pdf = new jsPDF();

        const formatCurrency = (value) => {
            return new Intl.NumberFormat("es-BO", {
                style: "currency",
                currency: "BOB"
            }).format(value);
        };

        const clientName = `${state.files.id_client.name} ${state.files.id_client.lastName}`;

        pdf.setFillColor(211, 66, 62);
        pdf.rect(0, 0, 210, 30, 'F');

        try {
            pdf.addImage("/camacho.jpeg", "JPEG", 160, 5, 25, 20);
        } catch {
            console.log("Logo no disponible");
        }

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text("RECIBO ELECTRÓNICO", 15, 18);

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`N° ${state.files.receiveNumber}`, 15, 25);

        let yPos = 40;

        pdf.setDrawColor(200);
        pdf.rect(10, yPos, 190, 35);

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);

        const fecha = state.files.dueDate
            ? new Date(state.files.dueDate).toLocaleDateString("es-ES")
            : new Date(state.files.creationDate).toLocaleDateString("es-ES");

        pdf.setFont(undefined, 'bold');
        pdf.text("Cliente:", 15, yPos + 10);
        pdf.text("Tipo de pago:", 15, yPos + 18);
        pdf.text("Fecha:", 15, yPos + 26);

        pdf.setFont(undefined, 'normal');
        pdf.text(clientName, 60, yPos + 10);
        pdf.text(state.files.accountStatus, 60, yPos + 18);
        pdf.text(fecha, 60, yPos + 26);

        autoTable(pdf, {
            startY: yPos + 45,
            theme: "grid",
            headStyles: {
                fillColor: [211, 66, 62],
                textColor: 255,
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columns: [
                { header: "Producto", dataKey: "nombre" },
                { header: "Cant.", dataKey: "cantidad" },
                { header: "P. Unitario", dataKey: "precio" },
                { header: "Desc.", dataKey: "descuento" },
                { header: "Total", dataKey: "total" }
            ],
            body: state.products.map(p => {
                const precio = p.precio || 0;
                const cantidad = p.cantidad || 1;
                const descuento = 0;
                const total = (precio - descuento) * cantidad;

                return {
                    nombre: p.nombre || "Sin nombre",
                    cantidad,
                    precio: formatCurrency(precio),
                    descuento: formatCurrency(descuento),
                    total: formatCurrency(total)
                };
            })
        });

        const finalY = pdf.lastAutoTable.finalY + 10;

        pdf.setDrawColor(220);
        pdf.line(120, finalY, 200, finalY);

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');

        pdf.text("Total General:", 120, finalY + 8);
        pdf.text(formatCurrency(totalGeneral), 200, finalY + 8, { align: "right" });

        pdf.setFont(undefined, 'normal');
        pdf.text("Total Pagado:", 120, finalY + 16);
        pdf.text(formatCurrency(totalPaid), 200, finalY + 16, { align: "right" });

        pdf.setTextColor(211, 66, 62);
        pdf.setFont(undefined, 'bold');
        pdf.text("Saldo Pendiente:", 120, finalY + 24);
        pdf.text(formatCurrency(saldoPendiente), 200, finalY + 24, { align: "right" });

        pdf.setTextColor(120);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'italic');

        pdf.text(
            "Gracias por su compra. Este documento no tiene validez fiscal.",
            105,
            285,
            { align: "center" }
        );

        pdf.save(`recibo-${state.files.receiveNumber}.pdf`);
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
        if (!state?.files?.id_client.id_user) return;
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/pay/id", {
                id_client: state?.files.id_client._id,
                id_owner: user,
                orderId: state.files._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payments = response.data;
            if (payments.length > 0) {
                const totalPaidSum = payments.reduce((sum, payment) => {
                    if (payment.paymentStatus === "confirmado") return sum + (payment.total || 0);
                    return sum;
                }, 0);
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
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrderData(response.data || []);
        } catch (error) {
            console.error("Error al obtener el tracking", error);
        }
    };

    const fetchOrderPickUpDetails = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/delivery/order/id", {
                orderId: state.files._id,
                id_owner: user,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || null;
            if (data && data.latitud && data.longitud) {
                setOrderPickUP(data);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) return;
            console.error("Error inesperado:", error);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            await Promise.all([fetchPayments(), fetchOrderTracks(), fetchOrderPickUpDetails()]);
            setIsLoading(false);
        };
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSavePayment = () => fetchPayments();

    if (!state || !state.products) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <FaBoxOpen className="text-gray-400 text-6xl mb-4" />
                <p className="text-xl text-gray-600">No hay productos disponibles.</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-[#D3423E] text-white rounded-xl">
                    Volver
                </button>
            </div>
        );
    }

    const handleOpenDialog = () => setIsDialogOpen(true);
    const handleCloseDialog = () => setIsDialogOpen(false);
    const handleImageClick = (imageUrl) => setSelectedImage(imageUrl);
    const closeModal = () => setSelectedImage(null);

    const orderStatusConfig = ORDER_STATUS_CONFIG[state.files.orderStatus];

    return (
        <div className="w-full min-h-screen bg-white p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <nav className="mb-6" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 flex-wrap">
                        <li className="inline-flex items-center">
                            <button
                                onClick={() => navigate(state.flag ? -1 : -2)}
                                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-[#D3423E] transition-colors"
                            >
                                <FaHome className="mr-2" />
                                {state.flag ? "Lista de ventas" : "Lista de clientes"}
                            </button>
                        </li>
                        {!state.flag && (
                            <li>
                                <div className="flex items-center">
                                    <span className="mx-2 text-gray-400">/</span>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="text-sm font-medium text-gray-600 hover:text-[#D3423E]"
                                    >
                                        {state.files.id_client.name + " " + state.files.id_client.lastName}
                                    </button>
                                </div>
                            </li>
                        )}
                        <li>
                            <div className="flex items-center">
                                <span className="mx-2 text-gray-400">/</span>
                                <span className="text-sm font-bold text-[#D3423E]">
                                    {state.flag ? "Detalle del pago" : "Detalle del pedido"}
                                </span>
                            </div>
                        </li>
                    </ol>
                </nav>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Nota #{state.files.receiveNumber}
                                </h1>
                                {orderStatusConfig && (
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${orderStatusConfig.color} text-sm font-semibold`}>
                                        <orderStatusConfig.icon className={`${orderStatusConfig.iconColor} mr-2`} />
                                        {orderStatusConfig.label}
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 flex items-center gap-2">
                                <FaUser className="text-gray-400" />
                                {state.files.id_client.name} {state.files.id_client.lastName}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={exportToPDF}
                                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 font-semibold"
                            >
                                <FaFilePdf />
                                PDF
                            </button>

                            {totalPaid < totalGeneral && (
                                <button
                                    onClick={handleOpenDialog}
                                    className="px-5 py-2 bg-[#D3423E] text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 font-bold shadow-md"
                                >
                                    <FaDollarSign />
                                    Ingresar Pago
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isDialogOpen && (
                    <ClientPaymentDialog
                        onClose={handleCloseDialog}
                        onSave={handleSavePayment}
                        orderId={state.files._id}
                        totalPaid={totalPaid}
                        idClient={state.files.id_client._id}
                        salesID={state.files.salesId._id}
                        totalGeneral={totalGeneral}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total General</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">Bs. {totalGeneral.toFixed(2)}</p>
                        {totalDescuentos > 0 && (
                            <p className="text-xs text-gray-500 mt-1">Descuentos: Bs. {totalDescuentos.toFixed(2)}</p>
                        )}
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Pagado</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">Bs. {totalPaid.toFixed(2)}</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{porcentajePagado.toFixed(1)}% completado</p>
                    </div>
                    <div className={`rounded-2xl shadow-sm border p-5 ${saldoPendiente === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-xs uppercase tracking-wide font-semibold text-gray-600">Saldo Pendiente</p>
                        <p className={`text-3xl font-bold mt-2 ${saldoPendiente === 0 ? 'text-green-600' : 'text-[#D3423E]'}`}>
                            Bs. {saldoPendiente.toFixed(2)}
                        </p>
                        {saldoPendiente === 0 ? (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <FaCheckCircle /> Totalmente pagado
                            </p>
                        ) : (
                            <p className="text-xs text-red-600 mt-1">Por cobrar</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                    <div className="border-b border-gray-200 flex">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'products' ? 'text-[#D3423E] border-[#D3423E]' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                        >
                            Productos ({state.products.length})
                        </button>
                        {paymentsData.length > 0 && (
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'payments' ? 'text-[#D3423E] border-[#D3423E]' : 'text-gray-600 border-transparent hover:text-gray-900'}`}
                            >
                                Pagos ({paymentsData.length})
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {activeTab === 'products' ? (
                            <div>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Producto</th>
                                                <th className="px-4 py-3 text-center">Cantidad</th>
                                                <th className="px-4 py-3 text-right">P. Unitario</th>
                                                <th className="px-4 py-3 text-right">Descuento</th>
                                                <th className="px-4 py-3 text-right rounded-r-lg">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {state.products.map((product, index) => {
                                                const precio = product.precio || 0;
                                                const descuento = 0;
                                                const cantidad = product.cantidad || 1;
                                                const totalPorProducto = (precio - descuento) * cantidad;
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {product.productImage ? (
                                                                    <img
                                                                        src={product.productImage}
                                                                        alt={product.nombre}
                                                                        onClick={() => handleImageClick(product.productImage)}
                                                                        className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                                                    />
                                                                ) : (
                                                                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                        <FaBoxOpen className="text-gray-400" />
                                                                    </div>
                                                                )}
                                                                <span className="font-medium text-gray-900">{product.nombre || "Sin nombre"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-gray-700">{cantidad}</td>
                                                        <td className="px-4 py-4 text-right text-gray-700">Bs. {precio.toFixed(2)}</td>
                                                        <td className="px-4 py-4 text-right text-gray-700">Bs. {descuento.toFixed(2)}</td>
                                                        <td className="px-4 py-4 text-right font-bold text-gray-900">Bs. {totalPorProducto.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {state.products.map((product, index) => {
                                        const precio = product.precio || 0;
                                        const cantidad = product.cantidad || 1;
                                        const totalPorProducto = precio * cantidad;
                                        return (
                                            <div key={index} className="bg-gray-50 rounded-xl p-4 flex gap-3">
                                                {product.productImage ? (
                                                    <img
                                                        src={product.productImage}
                                                        alt={product.nombre}
                                                        onClick={() => handleImageClick(product.productImage)}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <FaBoxOpen className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{product.nombre}</p>
                                                    <p className="text-xs text-gray-500">Cantidad: {cantidad} × Bs. {precio.toFixed(2)}</p>
                                                    <p className="font-bold text-gray-900 mt-1">Bs. {totalPorProducto.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
                                    <FaExclamationCircle className="text-yellow-500 text-lg flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-bold">Nota importante</p>
                                        <p>Los pagos deben ser <strong>aprobados</strong> por un administrador. Hasta entonces, no se descontarán del saldo pendiente.</p>
                                    </div>
                                </div>

                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 rounded-l-lg">Recibo</th>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Vendedor</th>
                                                <th className="px-4 py-3">Nota</th>
                                                <th className="px-4 py-3 text-right">Monto</th>
                                                <th className="px-4 py-3 text-center rounded-r-lg">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentsData.map((payment, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        {payment.saleImage ? (
                                                            <img
                                                                src={payment.saleImage}
                                                                alt="Recibo"
                                                                onClick={() => handleImageClick(payment.saleImage)}
                                                                className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <FaFilePdf className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-700">
                                                        {new Date(payment.creationDate).toLocaleDateString("es-ES")}
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-700">
                                                        {payment.sales_id?.fullName} {payment.sales_id?.lastName}
                                                    </td>
                                                    <td className="px-4 py-4 text-gray-700 max-w-xs truncate">{payment.note || '-'}</td>
                                                    <td className="px-4 py-4 text-right font-bold text-gray-900">Bs. {payment.total.toFixed(2)}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-center">
                                                            {payment.paymentStatus === "confirmado" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                                    <FaCheckCircle /> Confirmado
                                                                </span>
                                                            )}
                                                            {payment.paymentStatus === "rechazado" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                                    <FaTimesCircle /> Rechazado
                                                                </span>
                                                            )}
                                                            {payment.paymentStatus === "paid" && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                                    <FaExclamationCircle /> Pendiente
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden space-y-3">
                                    {paymentsData.map((payment, index) => (
                                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold text-gray-900">Bs. {payment.total.toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(payment.creationDate).toLocaleDateString("es-ES")}
                                                    </p>
                                                </div>
                                                {payment.paymentStatus === "confirmado" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                        <FaCheckCircle /> Confirmado
                                                    </span>
                                                )}
                                                {payment.paymentStatus === "rechazado" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                        <FaTimesCircle /> Rechazado
                                                    </span>
                                                )}
                                                {payment.paymentStatus === "paid" && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                        <FaExclamationCircle /> Pendiente
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {payment.sales_id?.fullName} {payment.sales_id?.lastName}
                                            </p>
                                            {payment.note && (
                                                <p className="text-sm text-gray-500 mt-1 italic">"{payment.note}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaUser className="text-[#D3423E]" />
                        Información del cliente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                            <FaUser className="text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
                                <p className="text-gray-900 font-medium">
                                    {state.files.id_client.name} {state.files.id_client.lastName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                            <FaTruck className="text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Repartidor</p>
                                <p className="text-gray-900 font-medium">
                                    {state.files.orderTrackId
                                        ? `${state.files.orderTrackId.fullName} ${state.files.orderTrackId.lastName}`
                                        : 'No asignado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                            <FaCreditCard className="text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Tipo de pago</p>
                                <p className="text-gray-900 font-medium">{state.files.accountStatus}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                            <FaCalendarAlt className="text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Vencimiento</p>
                                <p className="text-gray-900 font-medium">
                                    {state.files.dueDate
                                        ? new Date(state.files.dueDate).toLocaleDateString("es-ES")
                                        : new Date(state.files.creationDate).toLocaleDateString("es-ES")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FaRegClipboard className="text-[#D3423E]" />
                        Historial de actividad
                    </h2>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <FaSpinner className="animate-spin text-[#D3423E] text-3xl" />
                        </div>
                    ) : Array.isArray(orderData) && orderData.length > 0 ? (
                        <ol className="relative border-s-2 border-gray-200 ml-4">
                            {orderData.map((event, index) => {
                                const config = EVENT_CONFIG[event.eventType] || { color: "bg-gray-400", icon: FaRegClipboard, text: event.eventType };
                                const Icon = config.icon;
                                return (
                                    <li key={index} className="mb-6 ms-6 last:mb-0">
                                        <span className={`absolute flex items-center justify-center w-10 h-10 rounded-full -start-5 ring-4 ring-white ${config.color} text-white shadow-md`}>
                                            <Icon className="text-sm" />
                                        </span>
                                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                                <p className="text-sm text-gray-800">
                                                    <strong>{getTriggerName(event)}</strong> {config.text}
                                                </p>
                                                <time className="text-xs text-gray-500">
                                                    {new Date(event.timestamp).toLocaleString("es-ES")}
                                                </time>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FaRegClipboard className="text-4xl mx-auto mb-2 text-gray-300" />
                            <p>No hay registros de actividad</p>
                        </div>
                    )}
                </div>

                {deliveryData && deliveryData.latitud && deliveryData.longitud ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaMapMarkedAlt className="text-[#D3423E]" />
                            Punto de entrega
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Recibió</p>
                                <p className="text-gray-900 font-medium">{deliveryData.clientName}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Repartidor</p>
                                <p className="text-gray-900 font-medium">
                                    {deliveryData?.delivery?.fullName && deliveryData?.delivery?.lastName
                                        ? `${deliveryData.delivery.fullName} ${deliveryData.delivery.lastName}`
                                        : "No disponible"}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl md:col-span-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Fecha de entrega</p>
                                <p className="text-gray-900 font-medium">
                                    {new Date(deliveryData.creationDate).toLocaleString("es-ES")}
                                </p>
                            </div>
                        </div>

                        {deliveryData.image && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Foto de la entrega</p>
                                <img
                                    src={deliveryData.image}
                                    alt="Entrega"
                                    onClick={() => handleImageClick(deliveryData.image)}
                                    className="max-h-48 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                />
                            </div>
                        )}

                        {isLoaded && (
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={{
                                    lat: Number(deliveryData.latitud),
                                    lng: Number(deliveryData.longitud),
                                }}
                                zoom={15}
                            >
                                <Marker
                                    position={{
                                        lat: parseFloat(String(deliveryData.latitud).replace(",", ".")),
                                        lng: parseFloat(String(deliveryData.longitud).replace(",", ".")),
                                    }}
                                    icon={{
                                        url: tiendaIcon,
                                        scaledSize: new window.google.maps.Size(40, 40),
                                    }}
                                />
                            </GoogleMap>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <FaMapMarkedAlt className="text-4xl mx-auto mb-2 text-gray-300" />
                        <p className="text-gray-500">Aún no hay datos de la entrega</p>
                    </div>
                )}

                {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={selectedImage}
                                alt="Ampliada"
                                className="w-full max-h-[90vh] object-contain rounded-xl"
                            />
                            <button
                                className="absolute top-4 right-4 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-gray-100 shadow-lg"
                                onClick={closeModal}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}