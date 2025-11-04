import { useRef, useState, useCallback } from "react";
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
  const [currentRoad, setCurrentRoad] = useState([]); // rough points while drawing
  const [roads, setRoads] = useState([]); // snapped roads
  const [isSnapping, setIsSnapping] = useState(false);
  const autocompleteRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // ✅ Autocomplete setup
  const onLoad = (autocomplete) => (autocompleteRef.current = autocomplete);
  const onMapLoad = useCallback((mapInstance) => setMap(mapInstance), []);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry) return;

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      const location = place.geometry.location;
      const newCenter = { lat: location.lat(), lng: location.lng() };
      setCenter(newCenter);
      map.setCenter(newCenter);
      map.setZoom(25);
    }
  };

  // 🧭 Capture user clicks for rough line
  const handleMapClick = (event) => {
    if (isSnapping) return; // prevent clicks during snapping
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setCurrentRoad((prev) => [...prev, { lat, lng }]);
  };

  // 🚀 Snap entire path using Roads API
  const snapToRoads = async (path) => {
    if (path.length < 2) return [];

    const pathString = path.map((p) => `${p.lat},${p.lng}`).join("|");
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${pathString}&interpolate=true&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.snappedPoints) {
        return data.snappedPoints.map((p) => ({
          lat: p.location.latitude,
          lng: p.location.longitude,
        }));
      } else {
        console.warn("No snapped points found");
        return [];
      }
    } catch (error) {
      console.error("Error snapping to roads:", error);
      return [];
    }
  };

  // 💾 Snap + Save
  const handleSnapAndSave = async () => {
    if (currentRoad.length < 2) {
      alert("Draw a road first by clicking at least two points.");
      return;
    }

    const pathToSnap = [...currentRoad];
    setIsSnapping(true);
    setCurrentRoad([]); // remove rough line immediately

    const snapped = await snapToRoads(pathToSnap);
    setIsSnapping(false);

    if (snapped.length > 0) {
      setRoads((prev) => [...prev, { id: Date.now(), coordinates: snapped }]);
    } else {
      alert("Could not snap to road. Try again.");
    }
  };

  const handleClearRoads = () => {
    setRoads([]);
    setCurrentRoad([]);
  };

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
      {/* 🔍 Search + Buttons */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Search location..."
            className="w-80 px-4 py-2 rounded-lg shadow-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </Autocomplete>

        <button
          onClick={handleSnapAndSave}
          disabled={isSnapping}
          className={`px-4 py-2 rounded text-white transition ${
            isSnapping ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isSnapping ? "Snapping..." : "Snap to Road"}
        </button>

        <button
          onClick={handleClearRoads}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Clear
        </button>
      </div>

      {/* 🗺️ Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
        onLoad={onMapLoad}
        onClick={handleMapClick}
      >
        {/* ✳️ Rough user-drawn line (only while drawing) */}
        {currentRoad.length > 1 && (
          <Polyline
            path={currentRoad}
            options={{
              strokeColor: "#FFA500",
              strokeOpacity: 0.8,
              strokeWeight: 3,
              strokeDasharray: [8, 8],
            }}
          />
        )}

        {/* ✅ Render snapped (final) roads */}
        {roads.map((road) => (
          <Polyline
            key={road.id}
            path={road.coordinates}
            options={{
              strokeColor: "#00FF00",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}

export default Add_Road_Map;
