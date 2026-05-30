import React, { useState, useCallback, useMemo, useRef } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUser, FaEnvelope, FaPhone, FaLock, FaCity, FaMapMarkerAlt,
    FaHome, FaHashtag, FaCheck, FaChevronLeft, FaChevronRight,
    FaTruck, FaSave, FaExclamationTriangle, FaIdCard,
    FaCloudUploadAlt, FaImage, FaTimes, FaArrowRight,
} from "react-icons/fa";
import { MAP_STYLE_MODERN, CITIES, STEPS, CONTAINER_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from "../../utils/MapDetails";

import SuccessModal from "../modal/SuccessModal";
import ErrorModal from "../modal/ErrorModal";
const initialAddress = { road: "", state: "", house_number: "" };
const initialFormData = {
    nombre: "", apellido: "", email: "", telefono: "",
    password: "", identification: "", region: "",
};

const DeliveryCreationComponent = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [step, setStep] = useState(1);
    const [location, setLocation] = useState(DEFAULT_CENTER);
    const [address, setAddress] = useState(initialAddress);
    const [formData, setFormData] = useState(initialFormData);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [center,] = useState(DEFAULT_CENTER);
    const [successModal, setSuccessModal] = useState(false);
    const [errorModal, setErrorModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState("Error al crear el repartidor");
    const [submitting, setSubmitting] = useState(false);
    const [fetchingAddress, setFetchingAddress] = useState(false);
    const [mapZoom, ] = useState(DEFAULT_ZOOM);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_API_KEY,
        id: "google-map-script",
    });

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.match(/^image\/(png|jpeg|jpg|svg\+xml)/)) {
            setErrorMsg("Solo se aceptan imágenes PNG, JPG o SVG");
            setErrorModal(true);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg("La imagen no puede superar los 5MB");
            setErrorModal(true);
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        handleFileSelect(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadImage = async () => {
        const fd = new FormData();
        fd.append("image", imageFile);
        const res = await axios.post(API_URL + "/whatsapp/upload/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data.imageUrl;
    };

    const fetchAddress = async (lat, lng) => {
        setFetchingAddress(true);
        try {
            const { data } = await axios.get(
                `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`
            );
            if (data.address) {
                setAddress((prev) => ({
                    road: data.address.road || prev.road,
                    state: data.address.state || prev.state,
                    house_number: data.address.house_number || prev.house_number,
                }));
            }
        } catch (error) {
            setErrorMsg("No se pudo obtener la dirección del mapa");
            setErrorModal(true);
        } finally {
            setFetchingAddress(false);
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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddress((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setAddress(initialAddress);
        setLocation(DEFAULT_CENTER);
        setImageFile(null);
        setImagePreview(null);
        setStep(1);
    };

    const validateStep1 = () => {
        const { nombre, apellido, email, telefono, password, identification, region } = formData;
        return (
            nombre.trim() && apellido.trim() && email.trim() &&
            telefono && password.trim() && identification.trim() && region
        );
    };

    const validateStep3 = () => {
        return address.road?.trim() && address.state?.trim() && address.house_number;
    };

const isFormValid = useMemo(
    () => validateStep1() && validateStep3(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData, address]
  );
    const goNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2) setStep(3);
        else if (step === 3 && validateStep3()) setStep(4);
    };

    const goBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!isFormValid || submitting) return;
        setSubmitting(true);

        try {
            const imageUrl = imageFile ? await uploadImage() : "";

            const addressRes = await Promise.race([
                axios.post(
                    API_URL + "/whatsapp/maps/id",
                    {
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
                        city: address.state,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout en dirección")), 10000)
                ),
            ]);

            const directionId = addressRes.data._id;

            const deliveryRes = await Promise.race([
                axios.post(
                    API_URL + "/whatsapp/delivery",
                    {
                        fullName: formData.nombre,
                        lastName: formData.apellido,
                        email: formData.email,
                        id_owner: user,
                        phoneNumber: Number(formData.telefono),
                        client_location: directionId,
                        identificationNumber: formData.identification,
                        region: formData.region,
                        identificationImage: imageUrl,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout en delivery")), 10000)
                ),
            ]);

            const deliveryId = deliveryRes.data._id;

            const userRes = await Promise.race([
                axios.post(
                    API_URL + "/whatsapp/user",
                    {
                        active: true,
                        email: formData.email,
                        password: formData.password,
                        role: "DELIVERY",
                        id_owner: user,
                        region: formData.region,
                        salesMan: deliveryId,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout en usuario")), 10000)
                ),
            ]);

            if (userRes.status === 200) {
                setSuccessModal(true);
                setTimeout(() => {
                    resetForm();
                    navigate("/delivery/list");
                }, 1500);
            }
        } catch (error) {
            console.error("Error en el proceso", error);
            setErrorMsg(
                error.message?.includes("Timeout")
                    ? "La petición tardó demasiado. Verifica tu conexión."
                    : "Error al crear el repartidor. Verifica los datos e intenta de nuevo."
            );
            setErrorModal(true);
        } finally {
            setSubmitting(false);
        }
    };

    const cityLabel = CITIES.find((c) => c.value === formData.region)?.label || "—";

    return (
        <div className="min-h-screen w-full bg-gray-50 py-8 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 bg-[#D3423E] rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <FaTruck className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 leading-tight">
                                Nuevo Repartidor
                            </h1>
                            <p className="text-base text-gray-500 mt-0.5">
                                Completa los datos para registrar un nuevo repartidor
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                    <div className="flex items-start justify-between gap-2">
                        {STEPS.map((s, idx) => {
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            return (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col items-center gap-3 flex-shrink-0">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.1 : 1,
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className={`rounded-full flex items-center justify-center font-bold transition-all ${isActive
                                                    ? "w-14 h-14 bg-[#D3423E] text-white text-xl shadow-lg shadow-red-200"
                                                    : isCompleted
                                                        ? "w-12 h-12 bg-red-100 text-[#D3423E] text-base"
                                                        : "w-12 h-12 bg-gray-100 text-gray-400 text-base"
                                                }`}
                                        >
                                            {isCompleted ? <FaCheck size={16} /> : s.id}
                                        </motion.div>
                                        <p className={`text-sm font-bold text-center ${isActive
                                                ? "text-gray-900"
                                                : isCompleted
                                                    ? "text-gray-700"
                                                    : "text-gray-400"
                                            }`}>
                                            {s.label}
                                        </p>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className="flex-1 h-0.5 mt-7 rounded-full overflow-hidden bg-gray-200 min-w-[40px]">
                                            <motion.div
                                                initial={false}
                                                animate={{ width: step > s.id ? "100%" : "0%" }}
                                                transition={{ duration: 0.3 }}
                                                className="h-full bg-[#D3423E]"
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <StepCard
                            key="step1"
                            icon={FaUser}
                            title="Datos personales del repartidor"
                            subtitle="Información básica de contacto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <FieldInput
                                    icon={FaUser}
                                    label="Nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Juan Carlos"
                                    required
                                />
                                <FieldInput
                                    icon={FaUser}
                                    label="Apellido"
                                    name="apellido"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    placeholder="Ej: Pérez Mamani"
                                    required
                                />
                                <FieldInput
                                    icon={FaEnvelope}
                                    label="Correo electrónico"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="cliente@email.com"
                                    required
                                />
                                <FieldInput
                                    icon={FaPhone}
                                    label="Número de teléfono"
                                    name="telefono"
                                    type="number"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="70000000"
                                    required
                                />
                                <FieldInput
                                    icon={FaIdCard}
                                    label="Cédula de identidad"
                                    name="identification"
                                    value={formData.identification}
                                    onChange={handleChange}
                                    placeholder="Ej: 1234567"
                                    required
                                />
                                <FieldInput
                                    icon={FaLock}
                                    label="Contraseña"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                />
                                <div className="flex flex-col md:col-span-2">
                                    <label className="text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                                        Ciudad de trabajo <span className="text-[#D3423E]">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaCity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <select
                    className="pl-8 pr-8 py-2 text-sm border border-gray-200 bg-white text-gray-700 font-semibold rounded-xl focus:outline-none focus:border-[#D3423E] cursor-pointer appearance-none"
                                            name="region"
                                            value={formData.region}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Seleccione una ciudad</option>
                                            {CITIES.map((c) => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                        <FaChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={11} />
                                    </div>
                                </div>
                            </div>

                            <FooterButtons
                                onBack={() => navigate("/delivery/list")}
                                backLabel="Cancelar"
                                onNext={goNext}
                                nextDisabled={!validateStep1()}
                                nextLabel="Continuar"
                            />
                        </StepCard>
                    )}

                    {step === 2 && (
                        <StepCard
                            key="step2"
                            icon={FaIdCard}
                            title="Documento de identidad"
                            subtitle="Adjunta una foto clara del carnet (opcional)"
                        >
                            {!imagePreview ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${dragOver
                                            ? "border-[#D3423E] bg-red-50"
                                            : "border-gray-300 hover:border-[#D3423E] hover:bg-red-50/30"
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".svg,.png,.jpg,.jpeg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <div className="w-20 h-20 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                                        <FaCloudUploadAlt className="text-[#D3423E]" size={32} />
                                    </div>
                                    <p className="text-base font-bold text-gray-900 mb-1">
                                        Arrastra el documento aquí o haz clic para subir
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        SVG, PNG, JPG (máximo 5MB)
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200">
                                    <div className="flex items-start gap-5">
                                        <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 shadow-sm">
                                            <img
                                                src={imagePreview}
                                                alt="Documento"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaImage className="text-[#D3423E]" size={13} />
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                                                    Documento adjuntado
                                                </p>
                                            </div>
                                            <p className="text-base font-bold text-gray-900 truncate">
                                                {imageFile?.name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {(imageFile?.size / 1024).toFixed(1)} KB · {imageFile?.type.split("/")[1].toUpperCase()}
                                            </p>
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-[#D3423E] hover:bg-red-50 transition-colors"
                                                >
                                                    Cambiar imagen
                                                </button>
                                                <button
                                                    onClick={removeImage}
                                                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors flex items-center gap-1.5"
                                                >
                                                    <FaTimes size={10} /> Quitar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".svg,.png,.jpg,.jpeg"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                                <FaExclamationTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={14} />
                                <p className="text-sm text-blue-900">
                                    Este paso es opcional. Si no adjuntas un documento ahora, podrás hacerlo más tarde desde el perfil del repartidor.
                                </p>
                            </div>

                            <FooterButtons
                                onBack={goBack}
                                onNext={goNext}
                                nextLabel="Continuar"
                            />
                        </StepCard>
                    )}

                    {step === 3 && (
                        <StepCard
                            key="step3"
                            icon={FaMapMarkerAlt}
                            title="Ubicación de domicilio"
                            subtitle="Haz clic en el mapa o arrastra el pin para fijar la dirección"
                            rightAdornment={fetchingAddress && (
                                <div className="flex items-center gap-2 text-xs text-white/90">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                                    Detectando...
                                </div>
                            )}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 mb-6">
                                <FieldInput
                                    icon={FaHome}
                                    label="Dirección"
                                    name="road"
                                    value={address.road}
                                    onChange={handleAddressChange}
                                    placeholder="Av. Heroínas"
                                    required
                                />
                                <FieldInput
                                    icon={FaCity}
                                    label="Ciudad"
                                    name="state"
                                    value={address.state}
                                    onChange={handleAddressChange}
                                    placeholder="Cochabamba"
                                    required
                                />
                                <FieldInput
                                    icon={FaHashtag}
                                    label="Número"
                                    name="house_number"
                                    value={address.house_number}
                                    onChange={handleAddressChange}
                                    placeholder="123"
                                    required
                                />
                            </div>

                            <div className="relative overflow-hidden rounded-2xl border border-gray-200">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={CONTAINER_STYLE}
                                        center={center}
                                        zoom={mapZoom}
                                        onClick={handleMapClick}
                                        options={{
                                            disableDefaultUI: false,
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: true,
                                            styles: MAP_STYLE_MODERN,

                                        }}
                                    >
                                        <Marker
                                            position={location}
                                            draggable
                                            onDragEnd={handleMarkerDragEnd}
                                            icon={{
                                                path: window.google?.maps?.SymbolPath?.CIRCLE,
                                                fillColor: "#D3423E",
                                                fillOpacity: 1,
                                                strokeColor: "#fff",
                                                strokeWeight: 3,
                                                scale: 12,
                                            }}
                                        />
                                    </GoogleMap>
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center bg-gray-100">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-3"></div>
                                            <p className="text-sm text-gray-600">Cargando mapa...</p>
                                        </div>
                                    </div>
                                )}

                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-md px-4 py-2.5 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-[#D3423E]" size={13} />
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Coordenadas</p>
                                            <p className="text-sm font-bold text-gray-900">
                                                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <FooterButtons
                                onBack={goBack}
                                onNext={goNext}
                                nextDisabled={!validateStep3()}
                                nextLabel="Continuar"
                            />
                        </StepCard>
                    )}

                    {step === 4 && (
                        <StepCard
                            key="step4"
                            icon={FaCheck}
                            title="Confirmar datos"
                            subtitle="Revisa la información antes de crear"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                        <div className="w-8 h-8 rounded-full bg-[#D3423E] flex items-center justify-center">
                                            <FaUser className="text-white" size={11} />
                                        </div>
                                        <p className="text-sm font-black text-gray-700 uppercase tracking-wide">
                                            Personal
                                        </p>
                                    </div>
                                    <SummaryRow label="Nombre" value={`${formData.nombre} ${formData.apellido}`} />
                                    <SummaryRow label="Email" value={formData.email} />
                                    <SummaryRow label="CI" value={formData.identification} />
                                    <SummaryRow label="Teléfono" value={formData.telefono} />
                                    <SummaryRow label="Ciudad" value={cityLabel} />
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                        <div className="w-8 h-8 rounded-full bg-[#D3423E] flex items-center justify-center">
                                            <FaMapMarkerAlt className="text-white" size={11} />
                                        </div>
                                        <p className="text-sm font-black text-gray-700 uppercase tracking-wide">
                                            Ubicación
                                        </p>
                                    </div>
                                    <SummaryRow label="Dirección" value={address.road || "—"} />
                                    <SummaryRow label="Ciudad" value={address.state || "—"} />
                                    <SummaryRow label="N° casa" value={address.house_number || "—"} />
                                    <SummaryRow
                                        label="Coordenadas"
                                        value={`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                    />
                                </div>
                            </div>

                            {imagePreview && (
                                <div className="mt-5 bg-gray-50 rounded-2xl p-5 flex items-center gap-5">
                                    <img
                                        src={imagePreview}
                                        alt="Documento"
                                        className="w-24 h-24 rounded-xl object-cover border border-gray-200 flex-shrink-0 shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FaIdCard className="text-[#D3423E]" size={12} />
                                            <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                                                Documento
                                            </p>
                                        </div>
                                        <p className="text-base font-bold text-gray-900 truncate">
                                            {imageFile?.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {(imageFile?.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                                <FaExclamationTriangle className="text-[#D3423E] flex-shrink-0 mt-0.5" size={14} />
                                <p className="text-sm text-red-900">
                                    Al crear el repartidor se generarán automáticamente sus credenciales de acceso a la app móvil con el correo y contraseña proporcionados.
                                </p>
                            </div>

                            <FooterButtons
                                onBack={goBack}
                                backDisabled={submitting}
                                onNext={handleSubmit}
                                nextDisabled={!isFormValid || submitting}
                                nextLabel={submitting ? "Creando..." : "Crear repartidor"}
                                nextIcon={submitting ? null : FaSave}
                                nextLoading={submitting}
                            />
                        </StepCard>
                    )}
                </AnimatePresence>
            </div>

            <SuccessModal
                show={successModal}
                onClose={() => setSuccessModal(false)}
                message="Repartidor creado exitosamente"
            />
            <ErrorModal
                show={errorModal}
                onClose={() => setErrorModal(false)}
                message={errorMsg}
            />
        </div>
    );
};

const StepCard = ({ icon: Icon, title, subtitle, rightAdornment, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
    >
        <div className="bg-gradient-to-br from-[#D3423E] to-red-700 px-7 py-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Icon className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-white">{title}</h2>
                <p className="text-sm text-red-100 mt-0.5">{subtitle}</p>
            </div>
            {rightAdornment}
        </div>

        <div className="p-7">
            {children}
        </div>
    </motion.div>
);

const FieldInput = ({ icon: Icon, label, name, value, onChange, placeholder, type = "text", required }) => (
    <div className="flex flex-col">
        <label className="text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
            {label} {required && <span className="text-[#D3423E]">*</span>}
        </label>
        <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 text-sm text-gray-900 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] transition-colors"
            />
        </div>
    </div>
);

const FooterButtons = ({
    onBack, backLabel = "Atrás", backDisabled,
    onNext, nextLabel, nextDisabled, nextIcon: NextIcon = FaArrowRight, nextLoading,
}) => (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button
            onClick={onBack}
            disabled={backDisabled}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
            <FaChevronLeft size={11} /> {backLabel}
        </button>
        <button
            onClick={onNext}
            disabled={nextDisabled}
            className={`flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold transition-all ${nextDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#D3423E] text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                }`}
        >
            {nextLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : null}
            {nextLabel}
            {!nextLoading && NextIcon && <NextIcon size={12} />}
        </button>
    </div>
);

const SummaryRow = ({ label, value }) => (
    <div className="flex justify-between items-baseline gap-2 text-sm">
        <span className="text-gray-500 flex-shrink-0">{label}:</span>
        <span className="font-bold text-gray-900 text-right truncate" title={value}>
            {value || "—"}
        </span>
    </div>
);

export default DeliveryCreationComponent;