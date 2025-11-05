import { useState, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { Polyline } from "@react-google-maps/api";

function AddRoad({ mapRef }) {
  const { role } = useRole(); // Only using role here since manager_id is manual input

  const [roads, setRoads] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [editingRoad, setEditingRoad] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    builder_id: "",
    inspector_id: "",
    manager_id: "",
    status: "planned",
  });
  const [statusMessage, setStatusMessage] = useState("");

  // --- Snap to Road API ---
  const snapToRoads = async (points) => {
    if (points.length < 2) return;
    const pathString = points.map((p) => `${p.lat},${p.lng}`).join("|");

    try {
      const res = await fetch(
        `https://roads.googleapis.com/v1/snapToRoads?path=${pathString}&interpolate=true&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.snappedPoints) {
        const snapped = data.snappedPoints.map((p) => ({
          lat: p.location.latitude,
          lng: p.location.longitude,
        }));
        setCurrentPoints(snapped);
      }
    } catch (err) {
      console.error("Error snapping to roads:", err);
    }
  };

  // --- Map click listener ---
  useEffect(() => {
    if (role !== "manager" || !mapRef.current) return;

    const map = mapRef.current;
    const listener = map.addListener("click", (e) => {
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const updatedPoints = [...currentPoints, newPoint];
      setCurrentPoints(updatedPoints);
      if (updatedPoints.length >= 2) snapToRoads(updatedPoints);
    });

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        setCurrentPoints((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      listener.remove();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPoints, mapRef, role]);

  if (role !== "manager") return null;

  // --- Save current road ---
  const saveCurrentRoad = () => {
    if (currentPoints.length === 0) {
      setStatusMessage("⚠️ Please draw a road first.");
      return;
    }

    const { lat, lng } = currentPoints[0];
    setFormData((prev) => ({
      ...prev,
      location: prev.location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    }));

    setEditingRoad(currentPoints);
    setStatusMessage("");
  };

  // --- Cancel editing ---
  const cancelEditing = () => {
    setEditingRoad(null);
    setCurrentPoints([]);
    setStatusMessage("Road creation cancelled.");
  };

  // --- Submit form ---
  const submitRoadForm = async () => {
    if (!editingRoad) return;

    const { name, location, builder_id, inspector_id, manager_id, status } = formData;

    if (!name || !builder_id || !inspector_id || !manager_id) {
      setStatusMessage("⚠️ Please fill all required fields.");
      return;
    }

    const payload = {
      name,
      location,
      polyline: editingRoad,
      builder_id: parseInt(builder_id, 10),
      inspector_id: parseInt(inspector_id, 10),
      manager_id: parseInt(manager_id, 10),
      status,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_FLASK_API}/add_road`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setRoads([...roads, editingRoad]);
        setCurrentPoints([]);
        setEditingRoad(null);
        setFormData({
          name: "",
          location: "",
          builder_id: "",
          inspector_id: "",
          manager_id: "",
          status: "planned",
        });
        setStatusMessage("✅ Road successfully submitted!");
      } else {
        const errText = await res.text();
        setStatusMessage(`❌ Error submitting road: ${errText}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Error submitting road: ${err.message}`);
    }
  };

  return (
    <>
      {/* Save Button */}
      <button
        onClick={saveCurrentRoad}
        className="absolute top-24 right-4 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-500"
      >
        Save
      </button>

      {/* Status Message */}
      {statusMessage && (
        <div className="absolute top-32 right-4 z-50 bg-gray-200 px-4 py-2 rounded shadow">
          {statusMessage}
        </div>
      )}

      {/* Form Modal */}
      {editingRoad && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add Road Details</h2>

            {["name", "location", "builder_id", "inspector_id", "manager_id"].map((field) => (
              <label key={field} className="block mb-2">
                {field.replace("_", " ").toUpperCase()}:
                <input
                  type={field.includes("id") ? "number" : "text"}
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  className="w-full border px-2 py-1 rounded mt-1"
                  required
                />
              </label>
            ))}

            <label className="block mb-4">
              Status:
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full border px-2 py-1 rounded mt-1"
              >
                <option value="planned">Planned</option>
                <option value="under construction">Under Construction</option>
                <option value="maintaining">Maintaining</option>
              </select>
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={submitRoadForm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw saved roads */}
      {roads.map((road, index) => (
        <Polyline
          key={index}
          path={road}
          options={{ strokeColor: "#FF0000", strokeOpacity: 1, strokeWeight: 4 }}
        />
      ))}

      {/* Draw current road */}
      {currentPoints.length > 0 && (
        <Polyline
          path={currentPoints}
          options={{
            strokeColor: "#0000FF",
            strokeOpacity: 0.7,
            strokeWeight: 3,
            strokeDasharray: [5, 5],
          }}
        />
      )}
    </>
  );
}

export default AddRoad;
