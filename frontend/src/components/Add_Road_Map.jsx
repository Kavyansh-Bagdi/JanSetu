import { useRef, useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Autocomplete, Polyline } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 26.8638863957155,
  lng: 75.81090426260857,
};

function Add_Road_Map() {
  const [center, setCenter] = useState(defaultCenter);
  const [map, setMap] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRoad, setCurrentRoad] = useState([]);
  const [mapKey, setMapKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const autocompleteRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const onLoad = (autocomplete) => (autocompleteRef.current = autocomplete);
  const onMapLoad = useCallback((mapInstance) => setMap(mapInstance), []);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry) return;
    if (map) {
      if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
      else {
        const loc = place.geometry.location;
        const newCenter = { lat: loc.lat(), lng: loc.lng() };
        setCenter(newCenter);
        map.setCenter(newCenter);
        map.setZoom(17);
      }
    }
  };

  const snapPointToRoad = async (lat, lng) => {
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${lat},${lng}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.snappedPoints?.length > 0) {
        const p = data.snappedPoints[0].location;
        return { lat: p.latitude, lng: p.longitude };
      }
      return { lat, lng };
    } catch (err) {
      console.error("Snap error:", err);
      return { lat, lng };
    }
  };

  const handleAddRoad = () => {
    setIsDrawing(true);
    setCurrentRoad([]);
  };

  const handleMapClick = async (event) => {
    if (!isDrawing) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    let newPoints = [];

    if (currentRoad.length === 0) {
      const snapped = await snapPointToRoad(lat, lng);
      newPoints = [snapped];
    } else {
      const lastPoint = currentRoad[currentRoad.length - 1];
      const pathString = `${lastPoint.lat},${lastPoint.lng}|${lat},${lng}`;
      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${pathString}&interpolate=true&key=${apiKey}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.snappedPoints?.length > 0) {
          newPoints = data.snappedPoints.map((p) => ({
            lat: p.location.latitude,
            lng: p.location.longitude,
          }));
        } else {
          newPoints = [{ lat, lng }];
        }
      } catch (err) {
        console.error("Snap error:", err);
        newPoints = [{ lat, lng }];
      }
    }

    setCurrentRoad((prev) => [...prev, ...newPoints]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z" && isDrawing) {
        setCurrentRoad((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawing]);

  const handleSaveRoad = () => {
    if (currentRoad.length < 2) {
      alert("Add at least 2 points before saving.");
      return;
    }

    setIsSaving(true);
    setIsDrawing(false);
    setIsSaving(false);
  };

  const handleClearAll = () => {
    if (confirm("Clear current road?")) {
      setCurrentRoad([]);
      setIsDrawing(false);
    }
  };

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-white/80 p-2 rounded-lg shadow-md">
        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Search location..."
            className="w-80 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </Autocomplete>

        <button
          onClick={handleAddRoad}
          disabled={isDrawing}
          className={`px-4 py-2 rounded text-white transition ${
            isDrawing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Add Road
        </button>

        {isDrawing && (
          <>
            <button
              onClick={handleSaveRoad}
              className={`px-4 py-2 rounded text-white transition ${
                isSaving ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={() => setCurrentRoad((prev) => prev.slice(0, -1))}
              className="px-4 py-2 rounded text-white bg-yellow-500 hover:bg-yellow-600 transition"
            >
              Undo (Ctrl+Z)
            </button>
          </>
        )}

        <button
          onClick={handleClearAll}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Clear
        </button>
      </div>

      <GoogleMap
        key={mapKey}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
        onLoad={onMapLoad}
        onClick={handleMapClick}
      >

        {currentRoad.length > 1 && (
          <Polyline
            path={currentRoad}
            options={{
              strokeColor: "#00BFFF",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default Add_Road_Map;
