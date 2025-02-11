import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = "AIzaSyBXVleyFRjK4-iRECoUkxGJgXdpzPbOgO8";

const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 19.432608,
  lng: -99.133209,
};

const ClientCreationComponent = () => {
  const [location, setLocation] = useState({ lat: -17.3835, lng: -66.1568 });
  const [address, setAddress] = useState("Cargando dirección...");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  const fetchAddress = async (lat, lng) => {
    console.log("caaca")

    try {
      const response = await axios.get(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=67ab946de3ff0586040475iwxbbd4ee`
      );
      console.log(response.data)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      latitud: location.lat,
      longitud: location.lng,
    };

    try {
      await axios.post("https://tu-backend.com/api/location", formData);
      alert("Ubicación guardada correctamente");
    } catch (error) {
      console.error("Error enviando los datos", error);
      alert("Error al guardar la ubicación");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-6">
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
          <h2 className="mb-6 text-l text-left font-bold text-gray-900">Datos personales</h2>
          <form>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Nombre</label>
                <input type="text" className="bg-gray-50 border border-gray-900 text-sm rounded-lg p-2.5" placeholder="Nombre" required />
              </div>
              <div className="flex flex-col">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Apellido</label>
                <input type="text" className="bg-gray-50 border border-gray-900 text-sm rounded-lg p-2.5" placeholder="Apellido" required />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <label className="text-left text-sm font-medium text-gray-900 mb-1">Correo electrónico</label>
                <input type="email" className="bg-gray-50 border border-gray-900 text-sm rounded-lg p-2.5" placeholder="Correo electrónico" required />
              </div>
              <div className="flex flex-col sm:col-span-2">
                <h2 className="mt-2 mb-6 text-l text-left font-bold text-gray-900">Ubicación del Punto</h2>
                <LoadScript googleMapsApiKey="AIzaSyBXVleyFRjK4-iRECoUkxGJgXdpzPbOgO8">
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
                        url: "https://developers.google.com/maps/documentation/javascript/examples/full/images/info-i_maps.png",
                      }}
                    />
                  </GoogleMap>
                </LoadScript>
                <div className="mt-4 text-sm text-gray-700">
                  <p><strong>Latitud:</strong> {location.lat}</p>
                  <p><strong>Longitud:</strong> {location.lng}</p>
                </div>
                <button
                  onClick={handleSubmit}
                  className="mt-4 w-full px-5 py-2.5 text-m font-medium text-white bg-[#D3423E] rounded-lg hover:bg-[#FF9C99] transition"
                >
                  Guardar Ubicación
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="w-2/6 p-6 bg-white border border-black rounded-lg shadow-lg">
        <h2 className="mb-6 text-l text-left font-bold text-gray-900">Ubicación</h2>
        <form>
          <div className="grid gap-6">
            <div className="flex flex-col">
              <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Nombre del punto</label>
              <input type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Ciudad" required />
            </div>
            <div className="flex flex-col">
              <label className="text-left text-sm font-medium text-gray-900 mb-1">Dirección</label>
              <input value={address.road} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Direccion" required />
            </div>
            <div className="flex flex-col">
              <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Ciudad</label>
              <input value={address.state} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Ciudad" required />
            </div>
            <div className="flex flex-col">
              <label className="text-left text-sm font-medium text-gray-900 mb-1  ">Número de casa</label>
              <input value={address.house_number} type="text" className="bg-gray-50 border border-gray-900 text-sm text-gray-900 rounded-lg p-2.5" placeholder="Ciudad" required />
            </div>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientCreationComponent;
