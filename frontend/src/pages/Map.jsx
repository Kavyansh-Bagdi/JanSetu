import { useState, useRef, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import NavBar from "../components/Navbar";
import AddRoad from "../components/AddRoad";
import ViewRoads from "../components/ViewRoads";
import ViewInspectorRoads from "../components/ViewInspectorRoads";
import ViewBuilderRoads from "../components/ViewBuilderRoads";

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
  const polylineRefs = useRef([]);
  const [addRoadMode, setAddRoadMode] = useState(false);
  const { role } = useRole();

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const clearPolylines = () => {
    polylineRefs.current.forEach((polyline) => polyline.setMap(null));
    polylineRefs.current = [];
  };

  useEffect(() => {
    clearPolylines();
  }, [role, addRoadMode]);

  const mapKey = `map-${role}`;

  return (
    <>
      <NavBar />

      {/* Manager Add Button */}
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
          key={mapKey}
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
          {/* Manager Mode */}
          {role === "manager" && addRoadMode && <AddRoad mapRef={mapRef} />}

          {/* Citizen View */}
          {role === "citizen" && (
            <ViewRoads onPolylineLoad={(p) => polylineRefs.current.push(p)} />
          )}

          {/* Inspector View */}
          {role === "inspector" && (
            <ViewInspectorRoads
              onPolylineLoad={(p) => polylineRefs.current.push(p)}
            />
          )}

          {/* Builder View */}
          {role === "builder" && (
            <ViewBuilderRoads
              onPolylineLoad={(p) => polylineRefs.current.push(p)}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </>
  );
}

export default Map;
