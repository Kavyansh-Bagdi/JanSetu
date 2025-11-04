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
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

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

      // Convert to standard lat/lng format
      const snapped = data.snappedPoints.map((p) => ({
        lat: p.location.latitude,
        lng: p.location.longitude,
      }));
      return snapped;
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

          // Update local path
          setPath((prev) => {
            const updated = [...prev, newPoint];

            // Smooth path every 5 new points
            if (updated.length % 5 === 0) {
              snapToRoads(updated).then((snapped) => {
                setPath(snapped);
                if (polylineRef.current) polylineRef.current.setPath(snapped);
              });
            } else if (polylineRef.current) {
              polylineRef.current.setPath(updated);
            }

            // Move marker
            if (markerRef.current) markerRef.current.setPosition(newPoint);

            // Keep map centered
            if (map) map.panTo(newPoint);

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
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
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
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (markerRef.current) markerRef.current.setMap(null);
  }, []);

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div style={{ position: "relative" }}>
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

        {/* Controls */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          {!isTracking ? (
            <button onClick={startTracking}>▶ Start</button>
          ) : (
            <button onClick={pauseTracking}>⏸ Pause</button>
          )}
        </div>
      </div>
    </LoadScript>
  );
}

export default App;
