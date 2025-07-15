import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    setMonth,
    setYear,
} from "date-fns";
import { es } from "date-fns/locale";

import { API_URL } from "../config";

const OrderCalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [modalEvents, setModalEvents] = useState([]);
    const [modalDate, setModalDate] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal1, setShowModal1] = useState(false);
    useEffect(() => {
        const fetchOrdersForCalendar = async () => {
            try {
                const user = localStorage.getItem("id_owner");
                const token = localStorage.getItem("token");
                const filters = {
                    id_owner: user,
                    page: 1,
                    limit: 1000,
                    month: currentDate.getMonth() + 1,
                    year: currentDate.getFullYear(),
                };

                const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", filters, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const orders = response.data.data;

                const formattedEvents = orders.map((order) => ({
                    date: format(new Date(order.creationDate), "yyyy-MM-dd"),
                    title: `${order.sales_id?.fullName || ""} ${order.sales_id?.lastName || ""}`,
                    notes: `${order.orderId?.receiveNumber}`,
                    client: `${order.id_client?.name || ""} ${order.id_client?.lastName || ""}`,
                    total: `${order.total}`,
                    status: `${order.paymentStatus === "paid" ? "Pagado" : order.paymentStatus}`,
                    saleImage: `${order?.saleImage}`,
                    dates:  `${order.creationDate 
                        ? new Date(order.creationDate).toLocaleString("es-ES", {
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: "2-digit", 
                            minute: "2-digit", 
                            second: "2-digit",
                            hour12: false, 
                          }).toUpperCase()
                        : ''}`,
                }));

                setEvents(formattedEvents);
            } catch (error) {
                console.error("Error al cargar órdenes:", error);
            }
        };

        fetchOrdersForCalendar();
    }, [currentDate]);
    const closeModal = () => {
        setShowModal(false);
        setModalEvents([]);
        setModalDate("");
    };
    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value, 10);
        setCurrentDate(setMonth(currentDate, newMonth));
    };
    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value, 10);
        setCurrentDate(setYear(currentDate, newYear));
    };
    const handlePrevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };
    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };
    const openModal = (dayStr, dayEvents) => {
        setModalDate(dayStr);
        setModalEvents(dayEvents);
        setShowModal(true);
    };
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const dayStr = format(day, "yyyy-MM-dd");
                const today = new Date();
                const dayEvents = events.filter((event) => event.date === dayStr);
                const isToday = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, currentDate);

                days.push(
                    <div
                        key={dayStr}
                        className={`p-2 border-2 border-gray-300 min-h-[80px] text-sm rounded transition flex flex-col justify-between ${!isCurrentMonth ? "bg-gray-100 text-gray-300" : "bg-white text-gray-800"
                            } ${isToday ? "bg-green-100 border-red-600 font-bold shadow-inner" : ""}`}
                    >
                        <div className={`text-right ${isCurrentMonth ? "text-gray-800 text-m font-bold" : "text-gray-400"}`}>
                            {format(day, "d")}
                        </div>

                        <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 3).map((event, idx) => {
                                const bgColors = [
                                    "bg-red-200 text-red-700",
                                    "bg-green-300 text-gree-700",
                                    "bg-blue-200 text-blue-700",
                                    "bg-red-300",
                                    "bg-orange-600",
                                    "bg-orange-500 text-black",
                                ];
                                const color = bgColors[idx % bgColors.length];

                                return (
                                    <div
                                        key={idx}
                                        className={`px-2 py-1 pl-2 border-2 border-gray-900 rounded-md text-gray-900 text-xs font-semibold truncate ${color}`}
                                        title={event.client}
                                        onClick={() => {
                                            setSelectedItem(event);
                                            setShowModal1(true);
                                        }}
                                    >
                                        {event.client + " - " + event.notes}
                                        
                                    </div>
                                );
                            })}

                            {dayEvents.length > 3 && (
                                <button
                                    onClick={() => openModal(dayStr, dayEvents)}
                                    className="text-m text-gray-900 font-bold"
                                    aria-label={`Mostrar más eventos del ${dayStr}`}
                                >
                                    ... +{dayEvents.length - 3}
                                </button>
                            )}
                        </div>

                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-px" key={day}>
                    {days}
                </div>
            );
            days = [];
        }

        return <div>{rows}</div>;
    };

    return (
        <div className="max-w-full mx-auto p-4 border rounded-lg bg-white">
            <div className="mb-2 text-center text-lg font-semibold text-gray-800">
                {format(currentDate, "MMMM yyyy", { locale: es })}
            </div>
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handlePrevMonth}
                    className="text-3xl text-[#D3423E] font-bold"
                >
                    ←
                </button>
                <div className="flex gap-2 items-center">
                    <select value={currentDate.getMonth()} onChange={handleMonthChange}
                        className="border text-gray-900 px-2 py-1 font-bold rounded-xl">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {format(new Date(2025, i, 1), "MMMM", { locale: es })}
                            </option>
                        ))}
                    </select>
                    <select
                        value={currentDate.getFullYear()}
                        onChange={handleYearChange}
                        className="border px-2 py-1 rounded-xl text-gray-900 font-bold"
                    >
                        {Array.from({ length: 10 }, (_, i) => {
                            const y = currentDate.getFullYear() - 5 + i;
                            return (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <button
                    onClick={handleNextMonth}
                    className="text-3xl text-[#D3423E] font-bold"
                >
                    →
                </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
                {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="text-center font-semibold text-gray-900 uppercase">
                        {format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i), "EEE", { locale: es })}
                    </div>
                ))}
            </div>
            {renderCalendar()}
            {showModal && (
                <div
                    id="default-modal"
                    tabIndex={-1}
                    aria-hidden="false"
                    className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50"
                >
                    <div className="relative p-4 w-full max-w-2xl max-h-full">
                        <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Lista de Pagos realizados el {modalDate}
                                </h3>
                            </div>
                            <div className="p-4 md:p-5 space-y-4 max-h-96 overflow-y-auto">
                                {modalEvents.map((event, idx) => {
                                    const bgColors = [
                                        "bg-red-200 text-red-700",
                                        "bg-green-300 text-green-700",
                                        "bg-blue-200 text-blue-700",
                                        "bg-red-300 text-red-800",
                                        "bg-orange-300 text-orange-700",
                                        "bg-pink-300 text-pink-700",
                                    ];
                                    const color = bgColors[idx % bgColors.length];

                                    return (
                                        <div
                                            key={idx}
                                            className={`px-2 py-1 rounded-lg border-2 border-gray-900 text-gray-900 text-m font-semibold truncate ${color}`}
                                            title={event.client}
                                            onClick={() => {
                                                setSelectedItem(event);
                                                setShowModal1(true);
                                            }}
                                        >
                                            {event.client + " - " + event.notes}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                                <button
                                    type="button"
                                    className="text-white w-full bg-[#D3423E] uppercase font-bold  rounded-3xl text-m px-5 py-2.5 text-center"
                                    onClick={closeModal}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showModal1 && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-4xl"
                            onClick={() => {
                                setShowModal1(false);
                            }}
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Detalle del Pago</h2>
                        <div className="text-left space-y-2 text-gray-900">
                            <p className="text-gray-900"><strong>Número de Nota:</strong> {selectedItem.notes}</p>
                            <p className="text-gray-900"><strong>Fecha de Pago:</strong> {selectedItem.dates}</p>

                            <p className="text-gray-900"><strong>Cliente:</strong> {selectedItem.client}</p>
                            <p className="text-gray-900"><strong>Monto Pagado:</strong> Bs. {selectedItem.total}</p>
                            <p className="text-gray-900">
                                <strong>Estado:</strong> {selectedItem.status}
                            </p>
                        </div>
                        {selectedItem.saleImage && (
                            <div className="mt-4">
                                <img
                                    src={selectedItem.saleImage}
                                    alt="Recibo"
                                    className="rounded-md border border-gray-300 max-h-80"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderCalendarView;
