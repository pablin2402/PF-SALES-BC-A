import React, { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";

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
};

const DeliveryCreationComponent = () => {
  const [location, setLocation] = useState(initialLocation);
  const [address, setAddress] = useState(initialAddress);
  const [formData, setFormData] = useState(initialFormData);
  const [showToast, setShowToast] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchAddress = async (lat, lng) => {
    try {
      const { data } = await axios.get(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userRes = await axios.post(
        `${API_URL}/whatsapp/user`,
        {
          active: true,
          email: formData.email,
          password: formData.password,
          role: "DELIVERY",
          id_owner: user,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clientId = userRes.data.id;

      const addressRes = await axios.post(
        `${API_URL}/whatsapp/maps/id`,
        {
          sucursalName: "",
          iconType: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
          longitud: location.lng,
          latitud: location.lat,
          logoColor: "",
          active: true,
          client_id: clientId,
          id_owner: user,
          direction: address.road,
          house_number: address.house_number,
          city: address.state,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const directionId = addressRes.data._id;

      await axios.post(
        `${API_URL}/whatsapp/delivery`,
        {
          fullName: formData.nombre,
          lastName: formData.apellido,
          email: formData.email,
          role: "DELIVER",
          id_owner: user,
          phoneNumber: formData.telefono,
          client_location: directionId,
          identificationNumber: formData.identification,
          userId: clientId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowToast(true);
      resetForm();
      navigate("/delivery/list");
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error en el proceso", error);
      alert("Error inesperado al registrar el delivery.");
    }
  };

  return (
    <div className="flex items-center justify-center px-6 min-h-screen">
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg font-bold text-left text-gray-900">Datos personales del repartidor</h2>
          <form>
            <div className="grid gap-6 sm:grid-cols-2">
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

              <div className="sm:col-span-2 flex flex-col">
                <h2 className="mt-2 mb-2 text-left text-l font-bold text-gray-900">Dirección de domicilio</h2>
                <h2 className="mb-6 text-sm text-left text-gray-900">Haga click en el punto del mapa donde necesite registrar la ubicación</h2>
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
            </div>
          </form>
        </div>

        <div className="w-2/6 p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg font-bold text-left text-gray-900">Ubicación</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
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
              <button
                type="submit"
                className="mt-4 w-full px-5 py-2.5 text-lg font-bold text-white bg-[#D3423E] rounded-3xl hover:bg-white hover:text-red-600 transition"
              >
                GUARDAR
              </button>
            </div>
          </form>
        </div>
      </div>

      {showToast && (
        <div className="fixed top-10 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm" role="alert">
          <div className="inline-flex items-center justify-center w-8 h-8 text-green-500 bg-green-100 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
          </div>
          <div className="ml-3 text-xl font-bold">Cliente registrado correctamente.</div>
        </div>
      )}
    </div>
  );
};

export default DeliveryCreationComponent;
