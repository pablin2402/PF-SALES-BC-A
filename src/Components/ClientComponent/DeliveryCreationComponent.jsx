import React, { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../../config";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../../icons/tienda.png";
import SuccessModal from "../modal/SuccessModal";
import ErrorModal from "../modal/ErrorModal";

const containerStyle = {
  width: "100%",
  height: "300px",
};

const initialLocation = { lat: -17.3835, lng: -66.1568 };
const initialAddress = { road: "", state: "", house_number: "" };
const initialFormData = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  punto: "",
  vendedor: "",
  tipo: "",
  role: "",
  password: "",
  identification: "",
  region: ""
};

const DeliveryCreationComponent = () => {
  const [location, setLocation] = useState(initialLocation);
  const [address, setAddress] = useState(initialAddress);
  const [formData, setFormData] = useState(initialFormData);
  const [successModal, setSuccessModal] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [imageFile, setImageFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };
  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("image", imageFile);
  
    const res = await axios.post(API_URL + "/whatsapp/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    setUploadedUrl(res.data.imageUrl);
    console.log("URL de imagen:", res.data.imageUrl);


    return res.data.imageUrl;
  };
  const fetchAddress = async (lat, lng) => {
    try {
      const { data } = await axios.get(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`
      );
      setAddress(data.address);
    } catch (error) {
      console.error("Error obteniendo la dirección", error);
      setAddress({ ...initialAddress });
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "telefono" ? Number(value) : value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setAddress(initialAddress);
    setLocation(initialLocation);
  };

  const isFormValid = () => {
    return (
      formData.nombre.trim() &&
      formData.apellido.trim() &&
      formData.email.trim() &&
      formData.telefono &&
      formData.region &&
      formData.password.trim() &&
      formData.identification.trim() &&
      address.state.trim() &&
      address.house_number
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
  
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
            city: address.state
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout en dirección")), 10000))
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
            phoneNumber: formData.telefono,
            client_location: directionId,
            identificationNumber: formData.identification,
            region: formData.region,
            identificationImage:imageUrl

          },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout en delivery")), 10000))
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
            salesMan: deliveryId 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout en usuario")), 10000))
      ]);
  
      if (userRes.status === 200) {
        setSuccessModal(true);
        resetForm();
        navigate("/delivery/list");
      }
    } catch (error) {
      console.error("Error en el proceso", error);
      setErrorModal(true);
    }
  };
  

  return (
    <div className="flex items-center justify-center px-6 min-h-screen">
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-full p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg font-bold text-left text-gray-900">Datos personales del repartidor</h2>
          <form>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Nombre", name: "nombre" },
                { label: "Apellido", name: "apellido" },
                { label: "Correo electrónico", name: "email", type: "email" },
                { label: "Número de Identificación", name: "identification" },
                { label: "Número de teléfono", name: "telefono", type: "number" },
                { label: "Contraseña", name: "password", type: "password" },
              ].map(({ label, name, type = "text" }) => (
                <div key={name} className="flex flex-col">
                  <label className="mb-1 text-left text-sm font-medium text-gray-900">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="p-2.5 rounded-2xl text-sm text-gray-900 bg-gray-50 border border-gray-900"
                    placeholder={label}
                    required
                  />
                </div>
              ))}

              <div className="flex flex-col">
                <label className="mb-1 text-left text-sm font-medium text-gray-900">Ciudad de trabajo</label>
                <select
                  className="text-gray-900 rounded-2xl p-2.5 bg-gray-50 border border-gray-900"
                  name="region"
                  value={formData.region}
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

            <h2 className="mt-6 text-lg font-bold text-left text-gray-900">Ubicación</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Dirección de domicilio", name: "road" },
                { label: "Ciudad", name: "state" },
                { label: "Número de casa", name: "house_number" },
              ].map(({ label, name }) => (
                <div key={name} className="flex flex-col">
                  <label className="mb-1 text-left text-sm font-medium text-gray-900">{label}</label>
                  <input
                    name={name}
                    value={address[name]}
                    onChange={handleAddressChange}
                    type="text"
                    className="p-2.5 rounded-2xl text-sm text-gray-900 bg-gray-50 border border-gray-900"
                    placeholder={label}
                    required
                  />
                </div>

              ))}
            </div>
            <div className="flex flex-col">
              <h2 className="mt-8 mb-2 text-lg font-bold text-left text-gray-900">Adjunta el documento de identidad del vendedor</h2>
              <input
                className="block w-full text-gray-900 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-[#D3423E] focus:outline-none"
                id="user_avatar"
                type="file"
                accept=".svg,.png,.jpg,.jpeg"
                onChange={handleFileChange}              />
              <p className="mt-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> SVG, PNG o JPG</p>
            </div>
            <div className="mt-6">
              <h2 className="mb-2 text-left text-l font-bold text-gray-900">Dirección de domicilio</h2>
              <p className="mb-6 text-sm text-left text-gray-900">Haga click en el punto del mapa donde necesite registrar la ubicación</p>
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
              type="submit"
              disabled={!isFormValid()}
              onClick={handleSubmit}
              className={`mt-6 w-full px-5 py-2.5 text-lg font-bold rounded-3xl transition ${isFormValid()
                  ? "bg-[#D3423E] text-white hover:bg-white hover:text-red-600"
                  : "bg-gray-400 text-white cursor-not-allowed"
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
        message="Repartidor creado exitosamente"
      />
      <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al crear un repartidor" />
    </div>
  );
};

export default DeliveryCreationComponent;
