import React, { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaMapMarkerAlt, FaCamera, FaArrowLeft,
  FaTimes, FaUpload, FaIdCard, FaPhone, FaEnvelope, FaStore,
  FaCity, FaUserTie, FaTag, FaHashtag, FaCheck, FaUserCircle,
} from "react-icons/fa";
import { FiSave, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import tiendaIcon from "../../icons/tienda.png";
import SuccessModal from "../modal/SuccessModal";
import ErrorModal from "../modal/ErrorModal";

const containerStyle = { width: "100%", height: "340px" };

const CITY_OPTIONS = [
  { value: "TOTAL CBB", label: "Cochabamba" },
  { value: "TOTAL SC", label: "Santa Cruz" },
  { value: "TOTAL LP", label: "La Paz" },
  { value: "TOTAL OR", label: "Oruro" },
];

const POINT_TYPE_OPTIONS = [
  { value: "Bar", label: "🍷 Bar" },
  { value: "Mayorista", label: "🏭 Mayorista" },
  { value: "Tienda", label: "🏪 Tienda" },
  { value: "Restaurante", label: "🍽️ Restaurante" },
];

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffd6d4" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
];

const STEPS = [
  { id: 1, label: "Datos personales" },
  { id: 2, label: "Punto de venta" },
  { id: 3, label: "Ubicación" },
  { id: 4, label: "Documento" },
];

const InputField = ({ icon: Icon, label, required, ...props }) => (
  <div className="flex flex-col">
    <label className="text-left text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
      {label} {required && <span className="text-[#D3423E]">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon className="text-gray-400" size={14} />
        </div>
      )}
      <input
        {...props}
        className={`bg-white border border-gray-200 text-sm text-gray-900 rounded-xl ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] transition-colors`}
      />
    </div>
  </div>
);

const SelectField = ({ icon: Icon, label, options, required, value, onChange, name, placeholder }) => (
  <div className="flex flex-col">
    <label className="text-left text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
      {label} {required && <span className="text-[#D3423E]">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
          <Icon className="text-gray-400" size={14} />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`bg-white border border-gray-200 text-sm text-gray-900 rounded-xl ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 w-full focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] cursor-pointer appearance-none transition-colors`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

const Stepper = ({ currentStep, steps }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isActive
                    ? "bg-[#D3423E] text-white shadow-lg scale-110"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? <FaCheck size={14} /> : step.id}
              </div>
              <span
                className={`text-xs font-bold text-center hidden sm:block ${
                  isActive ? "text-[#D3423E]" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-gray-100 relative top-[-12px]">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? "bg-green-500 w-full" : "bg-transparent w-0"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="bg-gradient-to-br from-[#D3423E] to-red-700 text-white px-6 py-5 rounded-t-2xl">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <Icon className="text-white" size={18} />
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-red-100 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const ClientCreationComponent = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
  const [address, setAddress] = useState({ road: "", state: "" });
  const [addressNumber, setAddressNumber] = useState({ house_number: "" });

  const [formData, setFormData] = useState({
    nombre: "", apellido: "", email: "", telefono: "",
    punto: "", vendedor: "", tipo: "", identificacion: "", region: "",
  });

  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
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

  const generateUniqueId = () => {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  const [clientId] = useState(generateUniqueId());

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`
      );
      if (response.data?.address) {
        setAddress({
          road: response.data.address.road || "",
          state: response.data.address.state || response.data.address.city || "",
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const handleMapClick = useCallback((event) => {
    const newLocation = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    setLocation(newLocation);
    fetchAddress(newLocation.lat, newLocation.lng);
  }, []);

  const handleMarkerDragEnd = (event) => {
    const newLocation = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    setLocation(newLocation);
    fetchAddress(newLocation.lat, newLocation.lng);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChangeLocation = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleChangeLocationNumber = (e) => {
    setAddressNumber({ ...addressNumber, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(
          API_URL + "/whatsapp/sales/list/id",
          { id_owner: user },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendedores(response.data.data || []);
      } catch (error) {
        setVendedores([]);
      }
    };
    fetchVendedores();
  }, [token, user]);

  const resetForm = () => {
    setFormData({
      nombre: "", apellido: "", email: "", telefono: "",
      punto: "", vendedor: "", tipo: "", identificacion: "", region: "",
    });
    setAddress({ road: "", state: "" });
    setAddressNumber({ house_number: "" });
    setLocation({ lat: -17.3835, lng: -66.1568 });
    setImageFile(null);
    setImagePreview(null);
    setCurrentStep(1);
  };

  const isStep1Valid = () => {
    return (
      formData.nombre.trim() !== "" &&
      formData.apellido.trim() !== "" &&
      formData.email.trim() !== "" &&
      String(formData.telefono).trim() !== "" &&
      Number(formData.telefono) > 0 &&
      formData.identificacion.trim() !== "" &&
      formData.vendedor.trim() !== ""
    );
  };

  const isStep2Valid = () => {
    return (
      formData.punto.trim() !== "" &&
      formData.tipo.trim() !== "" &&
      formData.region.trim() !== ""
    );
  };

  const isStep3Valid = () => {
    return (
      address.road.trim() !== "" &&
      address.state.trim() !== "" &&
      addressNumber.house_number.trim() !== ""
    );
  };

  const canContinue = () => {
    if (currentStep === 1) return isStep1Valid();
    if (currentStep === 2) return isStep2Valid();
    if (currentStep === 3) return isStep3Valid();
    return true;
  };

  const handleNext = () => {
    if (canContinue() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!isStep1Valid() || !isStep2Valid() || !isStep3Valid() || isSaving) return;

    setIsSaving(true);
    try {
      const imageUrl = imageFile ? await uploadImage() : "";

      const userResponse = await Promise.race([
        axios.post(
          API_URL + "/whatsapp/maps/id",
          {
            sucursalName: formData.punto,
            iconType: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
            longitud: location.lng,
            latitud: location.lat,
            logoColor: "",
            active: true,
            client_id: clientId,
            id_owner: user,
            direction: address.road,
            house_number: addressNumber.house_number,
            city: address.state,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        ),
      ]);

      if (userResponse.status === 200) {
        const directionId = userResponse.data._id;
        const postResponse = await axios.post(
          API_URL + "/whatsapp/client",
          {
            name: formData.nombre,
            lastName: formData.apellido,
            profilePicture: "",
            icon: "",
            company: formData.punto,
            number: formData.telefono,
            email: formData.email,
            socialNetwork: "true",
            notes: "",
            id_user: clientId,
            id_owner: user,
            identityNumber: formData.identificacion,
            chat: "",
            directionId: directionId,
            sales_id: formData.vendedor,
            userCategory: formData.tipo,
            region: formData.region,
            identificationImage: imageUrl,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (postResponse.status === 200 || postResponse.status === 201) {
          setSuccessModal(true);
          resetForm();
          setTimeout(() => navigate("/client"), 1500);
        } else {
          setErrorModal(true);
        }
      } else {
        setErrorModal(true);
      }
    } catch (error) {
      console.error("Error creando cliente:", error);
      setErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const vendedorOptions = vendedores.map(v => ({
    value: v._id,
    label: `${v.fullName} ${v.lastName}`,
  }));

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
       

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-[#D3423E]" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Cliente</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-11">
            Completa los datos para registrar un nuevo cliente
          </p>
        </div>

        <Stepper currentStep={currentStep} steps={STEPS} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <SectionHeader
                icon={FaUser}
                title="Datos personales del cliente"
                subtitle="Información básica de contacto"
              />

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <InputField
                    icon={FaUser}
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                  <InputField
                    icon={FaUser}
                    label="Apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Ej: Pérez Mamani"
                    required
                  />
                  <InputField
                    icon={FaEnvelope}
                    type="email"
                    label="Correo electrónico"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="cliente@email.com"
                    required
                  />
                  <InputField
                    icon={FaPhone}
                    type="number"
                    label="Número de teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="70000000"
                    required
                  />
                  <InputField
                    icon={FaIdCard}
                    label="Cédula de identidad"
                    name="identificacion"
                    value={formData.identificacion}
                    onChange={handleChange}
                    placeholder="Ej: 1234567"
                    required
                  />
                  <SelectField
                    icon={FaUserTie}
                    label="Vendedor asignado"
                    name="vendedor"
                    value={formData.vendedor}
                    onChange={handleChange}
                    options={vendedorOptions}
                    placeholder="Seleccione un vendedor"
                    required
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <SectionHeader
                icon={FaStore}
                title="Punto de venta"
                subtitle="Tipo y categoría del establecimiento"
              />

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <InputField
                    icon={FaStore}
                    label="Nombre del punto"
                    name="punto"
                    value={formData.punto}
                    onChange={handleChange}
                    placeholder="Ej: Licorería La Esquina"
                    required
                  />
                  <SelectField
                    icon={FaTag}
                    label="Tipo de punto"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    options={POINT_TYPE_OPTIONS}
                    placeholder="Seleccione tipo de punto"
                    required
                  />
                  <SelectField
                    icon={FaCity}
                    label="Ciudad de trabajo"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    options={CITY_OPTIONS}
                    placeholder="Seleccione una ciudad"
                    required
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <SectionHeader
                icon={FaMapMarkerAlt}
                title="Ubicación"
                subtitle="Dirección y geolocalización del punto"
              />

              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2 mb-5">
                  <InputField
                    icon={FaMapMarkerAlt}
                    label="Dirección"
                    name="road"
                    value={address.road}
                    onChange={handleChangeLocation}
                    placeholder="Av. principal #123"
                    required
                  />
                  <InputField
                    icon={FaCity}
                    label="Ciudad"
                    name="state"
                    value={address.state}
                    onChange={handleChangeLocation}
                    placeholder="Ej: Cochabamba"
                    required
                  />
                  <InputField
                    icon={FaHashtag}
                    label="Número de casa"
                    name="house_number"
                    value={addressNumber.house_number}
                    onChange={handleChangeLocationNumber}
                    placeholder="Ej: 1234"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="text-left text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">
                    Ubicación en el mapa
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Haz click o arrastra el marcador para ajustar la ubicación
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={location}
                      zoom={15}
                      onClick={handleMapClick}
                      options={{
                        styles: MAP_STYLE,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      <Marker
                        key={`${location.lat}-${location.lng}`}
                        position={location}
                        draggable={true}
                        onDragEnd={handleMarkerDragEnd}
                        icon={{
                          url: tiendaIcon,
                          scaledSize: new window.google.maps.Size(40, 40),
                        }}
                      />
                    </GoogleMap>
                  ) : (
                    <div
                      style={containerStyle}
                      className="bg-gray-100 flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#D3423E] rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 font-medium">Cargando mapa...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Latitud</p>
                    <p className="text-sm font-mono font-bold text-gray-900">{location.lat.toFixed(6)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Longitud</p>
                    <p className="text-sm font-mono font-bold text-gray-900">{location.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <SectionHeader
                icon={FaCamera}
                title="Foto del lugar"
                subtitle="Imagen del exterior o fachada del punto (opcional)"
              />

              <div className="p-6">
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:border-[#D3423E] hover:bg-red-50 transition-all flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
                      <FaCamera className="text-gray-400" size={22} />
                    </div>
                    <p className="text-sm font-bold text-gray-700 mb-1">
                      Subir imagen del punto
                    </p>
                    <p className="text-xs text-gray-500">SVG, PNG o JPG · Máx. 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".svg,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full max-h-80 object-contain bg-white"
                    />
                    <div className="p-3 flex justify-between items-center bg-white border-t border-gray-200">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FaUpload className="text-gray-400 shrink-0" size={12} />
                        <p className="text-xs text-gray-700 truncate font-medium">
                          {imageFile?.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-xs text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      >
                        <FaTimes size={10} />
                        Quitar
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
                  <div className="text-blue-600 shrink-0 mt-0.5">ⓘ</div>
                  <p className="text-xs text-blue-800">
                    La foto del punto es opcional pero recomendada. Ayuda al equipo de reparto a identificar el lugar visualmente.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSaving}
              className="px-5 py-3 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FiArrowLeft size={14} />
              Atrás
            </button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={!canContinue()}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                canContinue()
                  ? "bg-gradient-to-br from-[#D3423E] to-red-700 text-white hover:shadow-lg active:scale-95"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continuar
              <FiArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStep1Valid() || !isStep2Valid() || !isStep3Valid() || isSaving}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isStep1Valid() && isStep2Valid() && isStep3Valid() && !isSaving
                  ? "bg-gradient-to-br from-[#D3423E] to-red-700 text-white hover:shadow-lg active:scale-95"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave size={14} />
                  Guardar cliente
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <SuccessModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Cliente creado exitosamente"
      />
      <ErrorModal
        show={errorModal}
        onClose={() => setErrorModal(false)}
        message="Error al crear al cliente"
      />
    </div>
  );
};

export default ClientCreationComponent;