import React, { useState, useCallback, useEffect } from "react";
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

const ClientCreationComponent = () => {
  const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
  const [address, setAddress] = useState({ road: "", state: "" });
  const [addressNumber, setAddressNumber] = useState({ house_number: "" });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [formData, setFormData] = useState({ nombre: "", apellido: "", email: "", telefono: 0, punto: "", vendedor: "", tipo: "", identificacion: "0", region: "" });
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const [vendedores, setVendedores] = useState([]);
  const navigate = useNavigate();

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

  const handleChangeLocationNumber = (e) => {
    setAddressNumber({ ...addressNumber, [e.target.name]: e.target.value });
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
        setVendedores(response.data.data);
      } catch (error) {
        setVendedores([]);
      }
    };

    fetchVendedores();
  }, [token, user]);

  const resetForm = () => {
    setFormData({
      nombre: "", apellido: "", email: "", telefono: 0,
      punto: "", vendedor: "", tipo: "", identificacion: "0", region: ""
    });
    setAddress({ road: "", state: "" });
    setAddressNumber({ house_number: "" });
    setLocation({ lat: -17.3835, lng: -66.1568 });
  };
  const isFormValid = () => {
    return (
      formData.nombre.trim() !== "" &&
      formData.apellido.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.telefono > 0 &&
      formData.vendedor.trim() !== "" &&
      formData.tipo.trim() !== "" &&
      formData.punto.trim() !== "" &&
      formData.identificacion.trim() !== "" &&
      address.state.trim() !== "" &&
      addressNumber.house_number.trim() !== ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      const userResponse = await Promise.race([await axios.post(API_URL + "/whatsapp/maps/id",
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
          city: address.state
        }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);
      if (userResponse.status === 200) {
        const directionId = userResponse.data._id;
        const postResponse = await axios.post(API_URL + "/whatsapp/client",
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
            userCategory: formData.tipo,
            region: formData.region
          }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
        );
        if (postResponse.status === 200 || postResponse.status === 201) {
          setSuccessModal(true);
          resetForm();
          navigate("/client");
        } else {
          setErrorModal(true);
        }
      } else {
        setSuccessModal(true);
      }
    } catch (error) {
      setErrorModal(true);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-full p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-lg text-left font-bold text-gray-900">Datos personales del cliente</h2>
          <form>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl p-2.5" placeholder="Nombre" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Apellido</label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Apellido" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Correo electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5" placeholder="Correo electrónico" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de Cédula de Identidad</label>
                <input type="text" name="identificacion" value={formData.identificacion} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl p-2.5" placeholder="Número de Cédula de Identidad" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Número de teléfono</label>
                <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl p-2.5 focus:outline-none focus:ring-0 focus:border-red-500" placeholder="Número de teléfono" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Asignar Vendedor</label>
                <select
                  className="text-gray-900 hover:text-red-700  hover:border-red-700 focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl"
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
                  className="text-gray-900 hover:text-red-700 hover:border-red-700 focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl"
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
            <h2 className="mb-6 mt-6  text-lg text-left font-bold text-gray-900">Ubicación</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Nombre del punto</label>
                <input type="text" name="punto" value={formData.punto} onChange={handleChange} className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500 p-2.5" placeholder="Nombre del punto" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección</label>
                <input name="road" value={address.road} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl p-2.5" placeholder="Dirección" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Ciudad</label>
                <input name="state" value={address.state} onChange={handleChangeLocation} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500 p-2.5" placeholder="Ciudad" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Número de casa</label>
                <input name="house_number" value={addressNumber.house_number} onChange={handleChangeLocationNumber} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl p-2.5" placeholder="Número de casa" required />
              </div>
            </div>

            <div className="flex flex-col sm:col-span-2">
              <h2 className="mt-6 mb-6 text-lg text-left font-bold text-gray-900">Ubicación del Punto</h2>
              <LoadScript googleMapsApiKey={GOOGLE_API_KEY}
                onLoad={() => setIsMapLoaded(true)}
              >

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
                      icon={
                        isMapLoaded
                          ? {
                              url: tiendaIcon,
                              scaledSize: new window.google.maps.Size(40, 40),
                            }
                          : undefined
                      }
                      
                    />
                  </GoogleMap>
                
              </LoadScript>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className={`mt-4 w-full px-5 py-2.5 text-lg font-bold rounded-2xl ${isFormValid() ? "bg-[#D3423E] text-white" : "bg-gray-400 text-white cursor-not-allowed"}`}
            >
              GUARDAR
            </button>
          </form>
        </div>

      </div>
      <SuccessModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Cliente creado exitosamente"
      />
      <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al crear al cliente" />

    </div>
  );
};

export default ClientCreationComponent;
