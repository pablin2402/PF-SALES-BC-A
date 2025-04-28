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

const SalesManCreationComponent = () => {
  const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
  const [address, setAddress] = useState({ road: "", state: "", house_number: "" });
  const [formData, setFormData] = useState({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", tipo:"", role:"", password:"" });

  const [showToast, setShowToast] = useState(false);
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
      console.error("Error obteniendo la dirección", error);
      setAddress("Error al obtener la dirección");
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
    setFormData({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", password:"", });
    setAddress({ road: "", state: "", house_number: "" });
    setLocation({ lat: -17.3835, lng: -66.1568 });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData)
    try {
      const userResponse = await Promise.race([
        axios.post(API_URL + "/whatsapp/user", {
          active: true,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          id_owner: user,
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);
  
      if (userResponse.status === 200) {
        const clientId = userResponse.data._id;
        const addressResponse = await Promise.race([
          axios.post(API_URL + "/whatsapp/maps/id", {
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
            city: address.state
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
        ]);
  
        if (addressResponse.status === 200) {
          const directionId = addressResponse.data._id;
          const userId = userResponse.data._id;

          await axios.post(API_URL + "/whatsapp/sales/salesman", {
            fullName: formData.nombre,
            lastName:formData.apellido,
            email: formData.email,
            role: formData.role,
            id_owner: user,
            phoneNumber: formData.telefono,
            client_location: directionId,
            userId: userId
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setShowToast(true);
          resetForm();
          navigate("/sales/client");
          setTimeout(() => setShowToast(false), 3000);
        } else {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      }
    } catch (error) {
      console.error("Error en el proceso", error);
      alert("Error inesperado");
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-6">
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg text-left font-bold text-gray-900">Datos personales</h2>
          <form>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Nombre" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Apellido</label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Apellido" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Correo electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Correo electrónico" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de teléfono</label>
                <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Número de teléfono" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Contraseña" required />
              </div>
              <div className="flex flex-col">
                    <label className="text-left text-sm font-medium text-gray-900 mb-1">Rol</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5"
                        required
                    >
                        <option value="">Selecciona un rol</option>
                        <option value="SALES">Vendedor</option>
                        <option value="RESALESW">Repartidor</option>
                        <option value="ADMIN">Administrador</option>
                    </select>
                </div>
              <div className="flex flex-col sm:col-span-2">
                <h2 className="mt-2 mb-2 text-l text-left font-bold text-gray-900">Ubicación del Punto</h2>
                <h2 className="mb-6 text-sm text-left text-gray-900">Haga click en el punto del mapa donde necesite registrar la ubicación </h2>
                <LoadScript
                  googleMapsApiKey={GOOGLE_API_KEY}
                  onLoad={() => setIsMapLoaded(true)}
                >
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
                      draggable={true}
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

        <div className="w-2/6  p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg text-left font-bold text-gray-900">Ubicación</h2>
          <form>
            <div className="grid gap-6">
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección de domicilio</label>
                <input name="road" value={address.road} onChange={handleChangeLocation} ytpe="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Dirección" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Ciudad</label>
                <input name="state" value={address.state} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Ciudad" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Número de casa</label>
                <input name="house_number" value={address.house_number} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Número de casa" required />
              </div>
              <button
                onClick={handleSubmit}
                className="mt-4 w-full px-5 py-2.5 text-lg font-bold text-white bg-[#D3423E] rounded-2xl hover:bg-white hover:text-red-600 transition"
              >
                GUARDAR
              </button>
            </div>
          </form>
        </div>
      </div>
      {showToast && (
        <div className="fixed top-10 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white border border-gray-300 rounded-lg shadow-sm" role="alert">
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
          </div>
          <div className="ms-3 text-xl text-gray-900 font-bold">Cliente registrado correctamente.</div>
        </div>
      )}

    </div>
  );
};

export default SalesManCreationComponent;
