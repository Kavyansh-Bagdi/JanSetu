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
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <NavBar />

      {/* Manager Add Road Button */}
      {/* Manager Add Button */}
      {role === "manager" && (
        <button
          onClick={() => setAddRoadMode((prev) => !prev)}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: addRoadMode ? "#EEEEEE" : "#00ADB5",
            color: addRoadMode ? "#00ADB5" : "#FFFFFF",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            zIndex: 1000,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = 0.9)}
          onMouseLeave={(e) => (e.target.style.opacity = 1)}
        >
          {addRoadMode ? "+" : "Add"}
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
            mapId: "YOUR_MAP_ID_IF_ANY",
            draggableCursor: role === "manager" ? "crosshair" : "grab",
            draggingCursor: role === "manager" ? "crosshair" : "grabbing",
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
    </div>
  );
}

export default Map;
