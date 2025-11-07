import { useState, useRef, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import NavBar from "../components/Navbar";
import AddRoad from "../components/AddRoad";
import AddNewRoad from "../components/AddNewRoad.jsx";
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
  const { role } = useRole();

  // State
  const [isAdding, setIsAdding] = useState(false); // Controls Add button toggle
  const [selectedMode, setSelectedMode] = useState(null); // "snap" | "manual"

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  // Clear drawn polylines when mode or role changes
  const clearPolylines = () => {
    polylineRefs.current.forEach((polyline) => polyline.setMap(null));
    polylineRefs.current = [];
  };

  useEffect(() => {
    clearPolylines();
  }, [role, isAdding, selectedMode]);

  const mapKey = `map-${role}`;

  // 🟢 Add button click logic
  const handleAddClick = () => {
    if (isAdding) {
      // If already adding, close selector & exit
      setIsAdding(false);
      setSelectedMode(null);
    } else {
      // Open selector popup
      setIsAdding(true);
    }
  };

  // 🔙 When user cancels from child component (AddRoad/AddNewRoad)
  const handleCancelFromChild = () => {
    setIsAdding(false);
    setSelectedMode(null);
  };

  return (
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <NavBar />

      {/* 🟢 Manager Add Button */}
      {role === "manager" && (
        <>
          {/* Floating Add Button */}
          <button
            onClick={handleAddClick}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: isAdding ? "#EEEEEE" : "#00ADB5",
              color: isAdding ? "#00ADB5" : "#FFFFFF",
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
            {isAdding ? "×" : "Add"}
          </button>

          {/* 📋 Mode Selector (when Add is clicked) */}
          {isAdding && !selectedMode && (
            <div
              style={{
                position: "absolute",
                top: "80px",
                right: "16px",
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                zIndex: 1000,
                padding: "12px",
                width: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "#222",
                }}
              >
                Select Mode:
              </p>

              <button
                onClick={() => setSelectedMode("snap")}
                style={{
                  padding: "8px 10px",
                  backgroundColor: "#00ADB5",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                🚗 Snap-to-Road
              </button>

              <button
                onClick={() => setSelectedMode("manual")}
                style={{
                  padding: "8px 10px",
                  backgroundColor: "#393E46",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                ✏️ Manual Draw
              </button>
            </div>
          )}
        </>
      )}

      {/* 🗺️ Road Status Legend */}
<div
  style={{
    position: "absolute",
    bottom: "20px",
    left: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    border: "1px solid #000",
    padding: "12px 16px",
    fontSize: "16px",
    zIndex: 1000,
  }}
>
  <p style={{ margin: "0 0 6px 0", fontWeight: "bold" }}>Road Status Legend</p>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        backgroundColor: "#1E90FF",
        marginRight: "8px",
      }}
    ></span>
    Planned
  </div>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        backgroundColor: "#FF0000",
        marginRight: "8px",
      }}
    ></span>
    Under Construction
  </div>

  <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        backgroundColor: "#FFA500",
        marginRight: "8px",
      }}
    ></span>
    Maintaining
  </div>

  <div style={{ display: "flex", alignItems: "center" }}>
    <span
      style={{
        display: "inline-block",
        width: "18px",
        height: "18px",
        backgroundColor: "#32CD32",
        marginRight: "8px",
      }}
    ></span>
    Completed
  </div>
</div>


      {/* 🗺️ Google Map */}
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
            draggableCursor: role === "manager" ? "crosshair" : "grab",
            draggingCursor: role === "manager" ? "crosshair" : "grabbing",
          }}
        >
          {/* 👷 Manager Mode Components */}
          {role === "manager" && selectedMode === "snap" && (
            <AddRoad mapRef={mapRef} onCancel={handleCancelFromChild} />
          )}
          {role === "manager" && selectedMode === "manual" && (
            <AddNewRoad mapRef={mapRef} onCancel={handleCancelFromChild} />
          )}

          {/* 👥 Citizen View */}
          {role === "citizen" && (
            <ViewRoads
              onPolylineLoad={(p) => polylineRefs.current.push(p)}
            />
          )}

          {/* 🧑‍🏭 Inspector View */}
          {role === "inspector" && (
            <ViewInspectorRoads
              onPolylineLoad={(p) => polylineRefs.current.push(p)}
            />
          )}

          {/* 👷‍♂️ Builder View */}
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
