import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";
import { API_URL, GOOGLE_API_KEY } from "../config";
import { useNavigate } from "react-router-dom";
import tiendaIcon from "../icons/tienda.png";


const containerStyle = {
  width: "100%",
  height: "300px",
};

const ClientCreationComponent = () => {
  const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
  const [address, setAddress] = useState({ road: "", state: "", house_number: "" });
  const [formData, setFormData] = useState({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", tipo:"", identificacion:"0" });

  const [vendedores, setVendedores] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const generateUniqueId = () => {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  const [clientId] = useState(generateUniqueId());

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
    setFormData({ ...address, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id", {
          id_owner: user,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVendedores(response.data);
      } catch (error) {
        console.error("obteniendo vendedores", error);
        setVendedores([]);
      }
    };
  
    fetchVendedores();
  }, [token, user]);
  
  const resetForm = () => {
    setFormData({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", identificacion:"0" });
    setAddress({ road: "", state: "", house_number: "" });
    setLocation({ lat: -17.3835, lng: -66.1568 });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const addressPromise = axios.post(API_URL + "/whatsapp/maps/id",
        {
          sucursalName: formData.punto,
          iconType:"https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
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
        }
      );
      const addressResponse = await Promise.race([addressPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))]);
      if (addressResponse.status === 200) {
        const directionId = addressResponse.data._id;
        await axios.post(API_URL + "/whatsapp/client",
          {
            name: formData.nombre,
            lastName: formData.apellido,
            profilePicture: "",
            icon: "",
            company: "",
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
            userCategory: formData.tipo
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setShowToast(true);
        resetForm();
        navigate("/client")
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Error en el proceso", error);
      alert("Error inesperado");
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg text-left font-bold text-gray-900">Datos personales</h2>
          <form>
            <div className="grid gap-6 sm:grid-cols-2">
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
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de Cédula de Identidad</label>
                <input type="text" name="identificacion" value={formData.identificacion} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Número de Cédula de Identidad" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de teléfono</label>
                <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Número de teléfono" required />
              </div>
              <div className="flex flex-col">
              <label className="text-left text-sm font-medium text-gray-900 mb-1">Asignar Vendedor</label>
                <select
                  className="text-gray-900 hover:text-red-700  hover:border-red-700 focus:border-red-700 rounded-2xl"
                  name="vendedor" value={formData.vendedor} onChange={handleChange} required>
                  <option value="">Seleccione un vendedor</option>
                  {vendedores.map((vendedor) => (
                    <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
              <label className="text-left text-sm font-medium text-gray-900 mb-1">TIpo de Punto</label>
                <select
                  className="text-gray-900 hover:text-red-700 hover:border-red-700 focus:border-red-700 rounded-2xl"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione tipo de punto</option>
                  <option value="Bar">Bar</option>
                  <option value="Mayorista">Mayorista</option>
                  <option value="Tienda">Tienda</option>
                  <option value="Restaurante">Restaurante</option>
                </select>
              </div>
              <div className="flex flex-col sm:col-span-2">
                <h2 className="mt-2 mb-6 text-l text-left font-bold text-gray-900">Ubicación del Punto</h2>
                <LoadScript
                  googleMapsApiKey={GOOGLE_API_KEY}
                  onLoad={() => setIsMapLoaded(true)}
                >
                {isMapLoaded && (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={location}
                    zoom={15}
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
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Nombre del punto</label>
                <input type="text" name="punto" onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Nombre del punto" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección</label>
                <input name="road" value={address.road} onChange={handleChangeLocation} ytpe="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Dirección" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Ciudad</label>
                <input name="state" value={address.state} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Ciudad" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Número de casa</label>
                <input name="house_number" value={address.house_number} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Número de casa" required />
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

export default ClientCreationComponent;
