import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import ClientPaymentDialog from "./ClientPaymentDialog";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { FaFilePdf } from "react-icons/fa6";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { FaCheckCircle } from "react-icons/fa";
import { FaTimesCircle, FaExclamationCircle } from "react-icons/fa";
import { FaTruck } from "react-icons/fa";
import {
    FaRegClipboard,
    FaDollarSign,
    FaMapMarkerAlt,
    FaBoxOpen
} from "react-icons/fa";

import tiendaIcon from "../../icons/tienda.png";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const containerStyle = {
    width: "100%",
    height: "300px",
};

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
    const [deliveryData, setOrderPickUP] = useState(null);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const [iconReady, setIconReady] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = tiendaIcon;
        img.onload = () => setIconReady(true);
    }, []);

    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: GOOGLE_API_KEY,
        libraries: ['maps'],
    });

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
                const totalPaidSum = payments.reduce((sum, payment) => {
                    if (payment.paymentStatus === "confirmado") {
                        return sum + (payment.total || 0);
                    }
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
    const fetchOrderPickUpDetails = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/delivery/order/id", {
                orderId: state.files._id,
                id_owner: user,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = response.data || null;

            if (data && data.latitud && data.longitud) {
                setOrderPickUP(data);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return;
            }
            console.error("Error inesperado al obtener datos de entrega:", error);
        }
    };
    useEffect(() => {
        fetchPayments();
        fetchOrderTracks();
        fetchOrderPickUpDetails();
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


    return (
        <div className="w-full p-6 bg-white border border-gray-300 rounded-2xl shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="bg-white min-h-screen p-5">
                <div className="relative overflow-x-auto">
                    <div className="flex mt-4 mb-4 justify-start space-x-2">
                        {state.flag ? (
                            <nav className="flex" aria-label="Breadcrumb">
                                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                    <li className="inline-flex items-center" >
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="inline-flex items-center text-lg font-medium text-gray-900 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
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
                                            <span className="ms-1 text-lg font-bold text-[#D3423E] md:ms-2 dark:text-gray-400">Detalle del pago</span>
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
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Nota de remisión <span className="text-gray-900 text-2xl">{"# " + state.files.receiveNumber}</span>
                            </h2>

                            {state.files.orderStatus === "aproved" && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-m font-medium">
                                    <FaCheckCircle className="text-green-500 mr-1" />
                                    Aprobado
                                </div>
                            )}

                            {state.files.orderStatus === "En Ruta" && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-m font-medium">
                                    <FaTruck className="text-blue-500 mr-1" />
                                    En Ruta
                                </div>
                            )}

                            {state.files.orderStatus === "cancelled" && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 text-m font-medium">
                                    <FaTimesCircle className="text-red-500 mr-1" />
                                    Cancelado
                                </div>
                            )}

                            {state.files.orderStatus === "created" && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-m font-medium">
                                    <FaExclamationCircle className="text-yellow-400 mr-1" />
                                    Creado
                                </div>
                            )}
                        </div>

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
                                <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
                                    <div className="min-w-[900px]">
                                        <table className="min-w-[600px] w-full text-sm text-left text-gray-500 rounded-2xl">
                                            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                                <tr>
                                                    <th className="px-6 py-3 uppercase">Foto del Recibo</th>
                                                    <th className="px-6 py-3 uppercase">Fecha de Pago</th>
                                                    <th className="px-6 py-3 uppercase">Vendedor</th>
                                                    <th className="px-6 py-3 uppercase">Nota</th>
                                                    <th className="px-6 py-3 uppercase">Monto</th>
                                                    <th className="px-6 py-3 uppercase"></th>
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
                                                        <td className="px-4 py-3 text-gray-900">
                                                            {payment.paymentStatus === "confirmado" && (
                                                                <FaCheckCircle className="text-green-500 text-lg" />
                                                            )}
                                                            {payment.paymentStatus === "rechazado" && (
                                                                <FaTimesCircle className="text-red-500 text-lg" />
                                                            )}
                                                            {payment.paymentStatus === "paid" && (
                                                                <FaExclamationCircle className="text-yellow-400 text-lg" />
                                                            )}
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
                                <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
                                    <div className="min-w-[900px]">

                                        <table className="min-w-[600px] w-full text-sm text-left text-gray-500 rounded-2xl">
                                            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                                <tr>
                                                    <th className="px-6 py-3 uppercase"></th>
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
                                                            <td className="px-6 py-4 text-gray-900">
                                                                {product.productImage ? (
                                                                    <img
                                                                        src={product.productImage}
                                                                        alt="Foto del recibo"
                                                                        onClick={() => handleImageClick(product.productImage)}
                                                                        className="w-20 h-20 object-cover rounded-md"
                                                                    />
                                                                ) : (
                                                                    "No disponible"
                                                                )}
                                                            </td>
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

                                        <span className={`absolute flex items-center justify-center w-10 h-10 rounded-full -start-3 ring-8 ring-white dark:ring-gray-800 text-white text-lg shadow-md
          ${event.eventType === "Orden Creada" ? "bg-blue-500" :
                                                event.eventType === "Pago Ingresado" ? "bg-yellow-500" :
                                                    event.eventType === "Ha aprobado un pago" ? "bg-green-500" :
                                                        event.eventType === "Ha sido asignado como repartidor" ? "bg-purple-500" :
                                                            event.eventType === "está en camino al destino" ? "bg-indigo-500" :
                                                                event.eventType === "ha llegado al destino" ? "bg-pink-500" :
                                                                    event.eventType === "Pedido Entregado" ? "bg-green-600" :
                                                                        "bg-gray-400"
                                            }`}>

                                            {event.eventType === "Orden Creada" && <FaRegClipboard />}
                                            {event.eventType === "Pago Ingresado" && <FaDollarSign />}
                                            {event.eventType === "Ha aprobado un pago" && <FaCheckCircle />}
                                            {event.eventType === "Ha sido asignado como repartidor" && <FaTruck />}
                                            {event.eventType === "está en camino al destino" && <FaTruck />}
                                            {event.eventType === "ha llegado al destino" && <FaMapMarkerAlt />}
                                            {event.eventType === "Pedido Entregado" && <FaBoxOpen />}
                                            {![
                                                "Orden Creada", "Pago Ingresado", "Ha aprobado un pago",
                                                "Ha sido asignado como repartidor", "está en camino al destino",
                                                "ha llegado al destino", "Pedido Entregado"
                                            ].includes(event.eventType) && <FaRegClipboard />}
                                        </span>

                                        <div className="p-6 ml-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                            <div className="items-center justify-between mb-3 sm:flex">
                                                <time className="mb-1 text-xs font-normal text-gray-900 dark:text-gray-400 sm:order-last sm:mb-0">
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
                                                            </strong> ha creado el pedido.
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
                                                            </strong> ha ingresado un pago.
                                                        </div>
                                                    )}

                                                    {event.eventType === "Ha aprobado un pago" && (
                                                        <div>
                                                            <strong>
                                                                {event.triggeredBySalesman?.fullName && event.triggeredBySalesman?.lastName
                                                                    ? `${event.triggeredBySalesman.fullName} ${event.triggeredBySalesman.lastName}`
                                                                    : "Un administrador"}
                                                            </strong> ha aprobado un pago.
                                                        </div>
                                                    )}

                                                    {event.eventType === "Ha sido asignado como repartidor" && (
                                                        <div>
                                                            <strong>
                                                                {event.triggeredByDelivery?.fullName && event.triggeredByDelivery?.lastName
                                                                    ? `${event.triggeredByDelivery.fullName} ${event.triggeredByDelivery.lastName}`
                                                                    : "Un repartidor"}
                                                            </strong> ha sido asignado como repartidor.
                                                        </div>
                                                    )}

                                                    {event.eventType === "ha llegado al destino" && (
                                                        <div>
                                                            <strong>
                                                                {event.triggeredByDelivery?.fullName && event.triggeredByDelivery?.lastName
                                                                    ? `${event.triggeredByDelivery.fullName} ${event.triggeredByDelivery.lastName}`
                                                                    : "Un repartidor"}
                                                            </strong> ha llegado al destino de entrega.
                                                        </div>
                                                    )}

                                                    {event.eventType === "está en camino al destino" && (
                                                        <div>
                                                            <strong>
                                                                {event.triggeredByDelivery?.fullName && event.triggeredByDelivery?.lastName
                                                                    ? `${event.triggeredByDelivery.fullName} ${event.triggeredByDelivery.lastName}`
                                                                    : "Un repartidor"}
                                                            </strong> está en camino al punto de entrega.
                                                        </div>
                                                    )}

                                                    {event.eventType === "Pedido Entregado" && (
                                                        <div>
                                                            <strong>
                                                                {event.triggeredByDelivery?.fullName && event.triggeredByDelivery?.lastName
                                                                    ? `${event.triggeredByDelivery.fullName} ${event.triggeredByDelivery.lastName}`
                                                                    : "Un repartidor"}
                                                            </strong> ha entregado el pedido.
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

                    {deliveryData && deliveryData.latitud && deliveryData.longitud ? (
                        <div className="max-w-full mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <div className="space-y-4 mb-5">
                                <div className="flex justify-between pb-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        Información del Punto de Entrega
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-xl font-bold text-gray-900">Persona que recibió el pedido:</span>
                                    <span className="text-lg text-gray-900">{deliveryData.clientName}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-xl font-bold text-gray-900">Repartidor:</span>
                                    <span className="text-lg text-gray-900">
                                        {deliveryData.delivery.fullName + " " + deliveryData.delivery.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-xl font-bold text-gray-900">Fecha:</span>
                                    <span className="text-lg text-gray-900">
                                        {new Date(deliveryData.creationDate).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <img
                                        src={deliveryData.image}
                                        alt="Foto del recibo"
                                        className="w-25 h-20 object-cover rounded-md"
                                    />
                                </div>
                            </div>
                            {isLoaded && window.google?.maps?.Size && (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={{
                                        lat: deliveryData.latitud,
                                        lng: deliveryData.longitud,
                                    }}
                                    zoom={15}
                                >
                                    {iconReady && (
                                        <Marker
                                            position={{
                                                lat: deliveryData.latitud,
                                                lng: deliveryData.longitud,
                                            }}
                                            icon={{
                                                url: tiendaIcon,
                                                scaledSize: new window.google.maps.Size(40, 40),
                                            }}
                                        />
                                    )}

                                </GoogleMap>
                            )}


                        </div>
                    ) : (
                        <div className="max-w-full mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <p className="text-gray-700 text-center">Todavía no se tienen datos de la entrega.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
