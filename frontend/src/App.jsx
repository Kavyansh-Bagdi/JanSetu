import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [path, setPath] = useState([]);
  const [map, setMap] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const userInteractionTimeout = useRef(null);

  // --- Initial location ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const start = { lat: latitude, lng: longitude };
          setPath([start]);
          if (map) map.panTo(start);
        },
        (err) => console.error("Initial location error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, [map]);

  // --- Snap to Roads Helper ---
  const snapToRoads = async (points) => {
    if (points.length < 2) return points;

    const pathParam = points.map((p) => `${p.lat},${p.lng}`).join("|");
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${pathParam}&interpolate=true&key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.snappedPoints) return points;

      return data.snappedPoints.map((p) => ({
        lat: p.location.latitude,
        lng: p.location.longitude,
      }));
    } catch (err) {
      console.error("Snap to Roads failed:", err);
      return points;
    }
  };

  // --- Start tracking ---
  const startTracking = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPoint = { lat: latitude, lng: longitude };

          setPath((prev) => {
            const updated = [...prev, newPoint];

            if (updated.length % 5 === 0) {
              snapToRoads(updated).then((snapped) => {
                setPath(snapped);
                if (polylineRef.current) polylineRef.current.setPath(snapped);
              });
            } else if (polylineRef.current) {
              polylineRef.current.setPath(updated);
            }

            if (markerRef.current) markerRef.current.setPosition(newPoint);
            if (map && !isUserInteracting) map.panTo(newPoint);

            return updated;
          });
        },
        (err) => console.error("Tracking error:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );

      setWatchId(id);
      setIsTracking(true);
    }
  };

  // --- Pause tracking ---
  const pauseTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setIsTracking(false);
  };

  // --- Map load handler ---
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);

    polylineRef.current = new window.google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: "#007bff",
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: mapInstance,
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapInstance,
      position: null,
    });

    mapInstance.addListener("dragstart", () => {
      setIsUserInteracting(true);
      clearTimeout(userInteractionTimeout.current);
    });
    mapInstance.addListener("zoom_changed", () => {
      setIsUserInteracting(true);
      clearTimeout(userInteractionTimeout.current);
    });

    mapInstance.addListener("idle", () => {
      clearTimeout(userInteractionTimeout.current);
      userInteractionTimeout.current = setTimeout(() => {
        setIsUserInteracting(false);
      }, 3000);
    });
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (markerRef.current) markerRef.current.setMap(null);
  }, []);

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="relative w-screen h-screen">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={path[0] || { lat: 0, lng: 0 }}
          zoom={17}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        />

        {/* Control buttons */}
        <div className="absolute bottom-5 left-5 bg-white rounded-lg shadow-md p-3 flex gap-3">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="px-4 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition"
            >
              ▶ Start
            </button>
          ) : (
            <button
              onClick={pauseTracking}
              className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 transition"
            >
              ⏸ Pause
            </button>
          )}
        </div>
      </div>
    </LoadScript>
  );
}

export default App;
