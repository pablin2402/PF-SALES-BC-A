import React, { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../../icons/tienda.png";

import ErrorModal from "../modal/ErrorModal";
import SuccessModal from "../modal/SuccessModal";

const containerStyle = {
    width: "100%",
    height: "300px",
};

const AdministrationCreationComponent = () => {
    const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
    const [address, setAddress] = useState({ road: "", state: "", house_number: "" });
    const [formData, setFormData] = useState({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", tipo: "", role: "", password: "" });
    const [successModal, setSuccessModal] = useState(false);
    const [errorModal, setErrorModal] = useState(false);

    const navigate = useNavigate();

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await axios.get(
                `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`
            );
            setAddress(response.data.address);

        } catch (error) {
            setErrorModal(true);
        }
    };
    const handleMapClick = useCallback((event) => {
        const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
        };
        setLocation(newLocation);
        fetchAddress(newLocation.lat, newLocation.lng);
    }, []);
    const handleMarkerDragEnd = (event) => {
        const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
        };
        setLocation(newLocation);
        fetchAddress(newLocation.lat, newLocation.lng);
    };
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.name === "telefono" ? Number(e.target.value) : e.target.value });
    };
    const handleChangeLocation = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", password: "", });
        setAddress({ road: "", state: "", house_number: "" });
        setLocation({ lat: -17.3835, lng: -66.1568 });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const addressResponse = await Promise.race([
                axios.post(API_URL + "/whatsapp/maps/id", {
                    sucursalName: "",
                    iconType: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
                    longitud: location.lng,
                    latitud: location.lat,
                    logoColor: "",
                    active: true,
                    client_id: "",
                    id_owner: user,
                    direction: address.road,
                    house_number: address.house_number,
                    city: address.state
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
            ]);

            if (addressResponse.status !== 200) throw new Error("Error en address");

            const directionId = addressResponse.data._id;

            const salesmanResponse = await Promise.race([
                axios.post(API_URL + "/whatsapp/sales/salesman", {
                    fullName: formData.nombre,
                    lastName: formData.apellido,
                    email: formData.email,
                    role: "SALES",
                    id_owner: user,
                    phoneNumber: formData.telefono,
                    client_location: directionId,
                    region: formData.role
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
            ]);

            if (salesmanResponse.status !== 200) throw new Error("Error en salesman");

            const salesmanId = salesmanResponse.data._id;

            const userResponse = await Promise.race([
                axios.post(API_URL + "/whatsapp/user", {
                    active: true,
                    email: formData.email,
                    password: formData.password,
                    role: "ADMIN",
                    id_owner: user,
                    region: formData.role,
                    salesMan: salesmanId
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
            ]);

            if (userResponse.status !== 200) throw new Error("Error en user");
            await axios.post(API_URL + "/whatsapp/administrator", {
                active: true,
                id_owner: user,
                salesId: salesmanId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccessModal(true);
            resetForm();
            navigate("/admin");

        } catch (error) {
            console.error("Error al crear usuario ADMIN:", error);
            setErrorModal(true);
        }
    };

    const isFormValid = () => {
        const { nombre, apellido, email, telefono, password } = formData;
        const { road, state } = address;

        return (
            nombre.trim() &&
            apellido.trim() &&
            email.trim() &&
            telefono &&
            password.trim() &&
            road.trim() &&
            state.trim()
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-6">
            <div className="flex w-full max-w-5xl gap-6">
                <div className="w-full p-6 bg-white border border-black rounded-lg shadow-lg">
                    <h2 className="mb-6 text-lg font-bold text-left text-gray-900">Datos personales del administrador</h2>
                    <form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Nombre" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Apellido</label>
                                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Apellido" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Correo electrónico</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Correo electrónico" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de teléfono</label>
                                <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Número de teléfono" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Contraseña</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Contraseña" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Ciudad de trabajo</label>
                                <select
                                    className="text-gray-900 rounded-2xl p-2 focus:outline-none focus:ring-0 focus:border-red-500"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Seleccione una ciudad</option>
                                    <option value="TOTAL CBB">Cochabamba</option>
                                    <option value="TOTAL SC">Santa Cruz</option>
                                    <option value="TOTAL LP">La Paz</option>
                                    <option value="TOTAL OR">Oruro</option>
                                </select>
                            </div>
                        </div>

                        <h2 className="mt-8 mb-2 text-lg font-bold text-left text-gray-900">Ubicación del Punto</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección de domicilio</label>
                                <input name="road" value={address.road} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Dirección" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Ciudad</label>
                                <input name="state" value={address.state} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Ciudad" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de casa</label>
                                <input name="house_number" value={address.house_number} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Número de casa" required />
                            </div>
                        </div>

                        <h2 className="mt-8 mb-2 text-sm text-left text-gray-900">Haga click en el punto del mapa donde necesite registrar la ubicación</h2>

                        <div className="mt-2 mb-6">
                            <LoadScript googleMapsApiKey={GOOGLE_API_KEY} onLoad={() => setIsMapLoaded(true)}>
                                {isMapLoaded && (
                                    <GoogleMap
                                        mapContainerStyle={containerStyle}
                                        center={location}
                                        zoom={14}
                                        onClick={handleMapClick}
                                    >
                                        <Marker
                                            key={`${location.lat}-${location.lng}`}
                                            position={location}
                                            draggable
                                            onDragEnd={handleMarkerDragEnd}
                                            icon={{
                                                url: tiendaIcon,
                                                scaledSize: new window.google.maps.Size(40, 40),
                                            }}
                                        />
                                    </GoogleMap>
                                )}
                            </LoadScript>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!isFormValid()}
                            className={`mt-4 w-full px-5 py-2.5 text-lg font-bold rounded-3xl transition ${isFormValid()
                                    ? "bg-[#D3423E] text-white hover:bg-white hover:text-red-600"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            GUARDAR
                        </button>
                    </form>
                </div>
            </div>
            <SuccessModal
                show={successModal}
                onClose={() => setSuccessModal(false)}
                message="Vendedor creado exitosamente"
            />
            <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al crear al vendedor" />
        </div>

    );
};

export default AdministrationCreationComponent;
