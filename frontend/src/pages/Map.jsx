import { useState, useRef } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import NavBar from "../components/Navbar";
import AddRoad from "../components/AddRoad";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 26.8638863957155,
  lng: 75.81090426260857,
};

function Map() {
  const mapRef = useRef(null);
  const [addRoadMode, setAddRoadMode] = useState(false);
  const { role } = useRole(); // safe now, wrapped by RoleProvider in App.jsx

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  return (
    <>
      <NavBar />
      {/* Add Road Button */}
      {role === "manager" && (
        <button
          onClick={() => setAddRoadMode((prev) => !prev)}
          className={`w-14 h-14 flex items-center justify-center rounded-full cursor-pointer transition ${
            addRoadMode
              ? "bg-white text-blue-600 hover:bg-blue-500 hover:text-white"
              : "bg-blue-600 text-white hover:bg-white hover:text-blue-600"
          } absolute top-4 right-4 z-50`}
        >
          {addRoadMode ? "Stop" : "Add"}
        </button>
      )}


      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={17}
          onLoad={handleMapLoad}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
            zoomControl: false,
            scaleControl: false,
            rotateControl: false,
          }}
        >
          {/* Only activate AddRoad when button is toggled */}
          {addRoadMode && <AddRoad mapRef={mapRef} />}
        </GoogleMap>
      </LoadScript>
    </>
  );
}

export default Map;
