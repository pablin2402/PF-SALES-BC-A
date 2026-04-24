import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../../icons/tienda.png";
import { FaUser, FaEnvelope, FaPhone, FaKey, FaMapMarkerAlt, FaCity, FaHome, FaCamera, FaArrowLeft, FaCheck, FaUpload, FaEye, FaEyeSlash, FaUserTie, FaSearchLocation, FaTimes, FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";

import ErrorModal from "../modal/ErrorModal";
import SuccessModal from "../modal/SuccessModal";

const containerStyle = {
  width: "100%",
  height: "350px",
};

const CITIES = [
  { value: "TOTAL CBB", label: "Cochabamba" },
  { value: "TOTAL SC", label: "Santa Cruz" },
  { value: "TOTAL LP", label: "La Paz" },
  { value: "TOTAL OR", label: "Oruro" }
];

const SalesManCreationComponent = () => {
  const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
  const [address, setAddress] = useState({ road: "", state: "", house_number: "" });
  const [formData, setFormData] = useState({
    nombre: "", apellido: "", email: "", telefono: "", password: "", role: ""
  });
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    id: "google-map-script",
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Solo se permiten archivos SVG, PNG o JPG");
      setErrorModal(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("El archivo debe pesar menos de 5MB");
      setErrorModal(true);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
    setSearchingAddress(true);
    try {
      const response = await axios.get(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`
      );
      if (response.data.address) {
        setAddress({
          road: response.data.address.road || "",
          state: response.data.address.state || response.data.address.city || "",
          house_number: response.data.address.house_number || ""
        });
      }
    } catch (error) {
      console.error("Error obteniendo dirección", error);
    } finally {
      setSearchingAddress(false);
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

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setSearchingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(newLoc);
        fetchAddress(newLoc.lat, newLoc.lng);
      },
      (error) => {
        console.error("Geolocation error", error);
        setSearchingAddress(false);
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "email") {
      if (value && !validateEmail(value)) {
        setEmailError("Correo inválido");
      } else {
        setEmailError("");
      }
    }
  };

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleChangeLocation = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ nombre: "", apellido: "", email: "", telefono: "", password: "", role: "" });
    setAddress({ road: "", state: "", house_number: "" });
    setLocation({ lat: -17.3835, lng: -66.1568 });
    setImageFile(null);
    setImagePreview(null);
    setCurrentStep(1);
  };

  const isStep1Valid = () => {
    const { nombre, apellido, email, telefono, password, role } = formData;
    return nombre.trim() && apellido.trim() && email.trim() && validateEmail(email) && telefono && password.length >= 6 && role;
  };

  const isStep2Valid = () => {
    return address.road.trim() && address.state.trim();
  };

  const isFormValid = () => isStep1Valid() && isStep2Valid();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid()) {
      setErrorMessage("Completa todos los campos obligatorios");
      setErrorModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = imageFile ? await uploadImage() : "";

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
        }, { headers: { Authorization: `Bearer ${token}` } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

      if (addressResponse.status !== 200) throw new Error("Error guardando dirección");
      const directionId = addressResponse.data._id;

      const salesmanResponse = await Promise.race([
        axios.post(API_URL + "/whatsapp/sales/salesman", {
          fullName: formData.nombre,
          lastName: formData.apellido,
          email: formData.email,
          role: "SALES",
          id_owner: user,
          phoneNumber: Number(formData.telefono),
          client_location: directionId,
          region: formData.role,
          identificationImage: imageUrl
        }, { headers: { Authorization: `Bearer ${token}` } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

      if (salesmanResponse.status !== 200) throw new Error("Error guardando vendedor");
      const salesmanId = salesmanResponse.data._id;

      const userResponse = await axios.post(API_URL + "/whatsapp/user", {
        active: true,
        email: formData.email,
        password: formData.password,
        role: "SALES",
        id_owner: user,
        region: formData.role,
        salesMan: salesmanId
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (userResponse.status !== 200) throw new Error("Error creando usuario");

      setSuccessModal(true);
      resetForm();
      setTimeout(() => navigate("/sales/client"), 1500);

    } catch (error) {
      console.error("Error al crear vendedor:", error);
      setErrorMessage(error.message || "No se pudo crear el vendedor. Intenta de nuevo.");
      setErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    const pw = formData.password;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const pwStrength = getPasswordStrength();
  const pwLabels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte", "Excelente"];
  const pwColors = ["bg-red-500", "bg-red-400", "bg-yellow-400", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-[#D3423E] flex items-center gap-1 mb-2 transition-colors"
          >
            <FaArrowLeft size={11} /> Volver
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FaUserTie className="text-[#D3423E]" />
                Nuevo Vendedor
              </h1>
              <p className="text-sm text-gray-500 mt-1">Completa los datos para registrar un nuevo vendedor</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <StepIndicator
              number={1}
              label="Datos personales"
              active={currentStep === 1}
              completed={currentStep > 1 && isStep1Valid()}
              onClick={() => setCurrentStep(1)}
            />
            <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${isStep1Valid() ? 'bg-green-500' : 'bg-gray-200'}`} />
            <StepIndicator
              number={2}
              label="Ubicación"
              active={currentStep === 2}
              completed={currentStep > 2 && isStep2Valid()}
              onClick={() => isStep1Valid() && setCurrentStep(2)}
              disabled={!isStep1Valid()}
            />
            <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${isStep2Valid() && isStep1Valid() ? 'bg-green-500' : 'bg-gray-200'}`} />
            <StepIndicator
              number={3}
              label="Documento"
              active={currentStep === 3}
              completed={currentStep > 3}
              onClick={() => isStep1Valid() && isStep2Valid() && setCurrentStep(3)}
              disabled={!isStep1Valid() || !isStep2Valid()}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-[#D3423E] to-red-700 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaUser /> Datos personales del vendedor
                </h2>
                <p className="text-xs text-red-100 mt-0.5">Información básica de contacto y acceso</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nombre"
                    icon={<FaUser />}
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej: Juan Carlos"
                    required
                    touched={touched.nombre}
                    error={touched.nombre && !formData.nombre ? "Requerido" : ""}
                  />
                  <Field
                    label="Apellido"
                    icon={<FaUser />}
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej: Pérez Mamani"
                    required
                    touched={touched.apellido}
                    error={touched.apellido && !formData.apellido ? "Requerido" : ""}
                  />
                  <Field
                    label="Correo electrónico"
                    icon={<FaEnvelope />}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="vendedor@email.com"
                    required
                    error={emailError}
                  />
                  <Field
                    label="Número de teléfono"
                    icon={<FaPhone />}
                    type="number"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="70000000"
                    required
                    touched={touched.telefono}
                    error={touched.telefono && !formData.telefono ? "Requerido" : ""}
                  />

                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                      Contraseña <span className="text-[#D3423E]">*</span>
                    </label>
                    <div className="relative">
                      <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${i < pwStrength ? pwColors[pwStrength] : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold w-16 text-right">
                          {pwLabels[pwStrength]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                      Ciudad de trabajo <span className="text-[#D3423E]">*</span>
                    </label>
                    <div className="relative">
                      <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Seleccione una ciudad</option>
                        {CITIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!isStep1Valid()}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${isStep1Valid() ? 'bg-[#D3423E] text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Continuar <FaArrowLeft className="rotate-180" size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-[#D3423E] to-red-700 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaMapMarkerAlt /> Ubicación de domicilio
                </h2>
                <p className="text-xs text-red-100 mt-0.5">Marca la dirección en el mapa o escríbela manualmente</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                  <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Tip:</strong> Haga clic sobre el mapa o arrastra el marcador para fijar la ubicación. Los campos se completan automáticamente.
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={location}
                      zoom={14}
                      onClick={handleMapClick}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
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
                  ) : (
                    <div className="h-[350px] flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando mapa...</p>
                      </div>
                    </div>
                  )}

                  {searchingAddress && (
                    <div className="absolute top-3 left-3 bg-white rounded-lg shadow-md px-3 py-1.5 flex items-center gap-2 text-xs">
                      <FaSpinner className="animate-spin text-[#D3423E]" size={11} />
                      <span className="text-gray-700 font-semibold">Buscando dirección...</span>
                    </div>
                  )}

                  {isLoaded && (
                    <button
                      type="button"
                      onClick={useMyLocation}
                      className="absolute top-3 right-3 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FaSearchLocation className="text-[#D3423E]" size={11} />
                      Mi ubicación
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field
                    label="Dirección"
                    icon={<FaMapMarkerAlt />}
                    name="road"
                    value={address.road}
                    onChange={handleChangeLocation}
                    placeholder="Av. Heroínas"
                    required
                  />
                  <Field
                    label="Ciudad"
                    icon={<FaCity />}
                    name="state"
                    value={address.state}
                    onChange={handleChangeLocation}
                    placeholder="Cochabamba"
                    required
                  />
                  <Field
                    label="Número de casa"
                    icon={<FaHome />}
                    name="house_number"
                    value={address.house_number}
                    onChange={handleChangeLocation}
                    placeholder="123"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <FaArrowLeft size={11} /> Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!isStep2Valid()}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${isStep2Valid() ? 'bg-[#D3423E] text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Continuar <FaArrowLeft className="rotate-180" size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-[#D3423E] to-red-700 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaCamera /> Documento de identidad
                </h2>
                <p className="text-xs text-red-100 mt-0.5">Adjunta una foto del CI del vendedor (opcional)</p>
              </div>

              <div className="p-6 space-y-5">
                {imagePreview ? (
                  <div className="relative rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="Documento"
                      className="w-full max-h-80 object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >
                      <FaTimes size={14} />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <FaCheck size={10} /> {imageFile?.name}
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="user_avatar"
                    className="flex flex-col items-center justify-center w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:border-[#D3423E] hover:bg-red-50 transition-colors"
                  >
                    <FaUpload className="text-gray-400 text-4xl mb-3" />
                    <p className="text-sm text-gray-700 font-semibold">
                      Hacé clic para subir
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      SVG, PNG o JPG (máx. 5MB)
                    </p>
                    <input
                      id="user_avatar"
                      type="file"
                      className="hidden"
                      accept=".svg,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </label>
                )}

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase">Resumen</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <SummaryRow label="Vendedor" value={`${formData.nombre} ${formData.apellido}`} />
                    <SummaryRow label="Correo" value={formData.email} />
                    <SummaryRow label="Teléfono" value={formData.telefono} />
                    <SummaryRow label="Ciudad" value={CITIES.find(c => c.value === formData.role)?.label || "-"} />
                    <SummaryRow label="Dirección" value={address.road || "-"} fullWidth />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <FaArrowLeft size={11} /> Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid() || submitting}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${!isFormValid() || submitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#D3423E] text-white hover:bg-red-700 shadow-md'}`}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" /> Creando...
                      </>
                    ) : (
                      <>
                        <FaCheck /> Crear vendedor
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </div>

      <SuccessModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="¡Vendedor creado exitosamente!"
      />
      <ErrorModal
        show={errorModal}
        onClose={() => { setErrorModal(false); setErrorMessage(""); }}
        message={errorMessage || "Error al crear al vendedor"}
      />
    </div>
  );
};

const StepIndicator = ({ number, label, active, completed, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-1 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
      completed ? 'bg-green-500 text-white' :
      active ? 'bg-[#D3423E] text-white ring-4 ring-red-100' :
      'bg-gray-200 text-gray-500'
    }`}>
      {completed ? <FaCheck size={12} /> : number}
    </div>
    <span className={`text-[10px] font-semibold ${active ? 'text-[#D3423E]' : completed ? 'text-green-600' : 'text-gray-500'}`}>
      {label}
    </span>
  </button>
);

const Field = ({ label, icon, type = "text", name, value, onChange, onBlur, placeholder, required, touched, error }) => (
  <div>
    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
      {label} {required && <span className="text-[#D3423E]">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 text-sm border ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-[#D3423E] focus:ring-red-100'} text-gray-900 rounded-xl focus:outline-none focus:ring-2`}
        placeholder={placeholder}
        required={required}
      />
    </div>
    {error && (
      <p className="text-[11px] text-red-500 mt-1 font-semibold">{error}</p>
    )}
  </div>
);

const SummaryRow = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? 'md:col-span-2' : ''}>
    <p className="text-[10px] text-gray-500 font-semibold uppercase">{label}</p>
    <p className="text-sm font-semibold text-gray-900 truncate">{value || "-"}</p>
  </div>
);

export default SalesManCreationComponent;