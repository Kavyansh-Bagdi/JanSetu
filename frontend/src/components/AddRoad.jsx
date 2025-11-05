import { useState, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { Polyline } from "@react-google-maps/api";

function AddRoad({ mapRef }) {
  const { role } = useRole();

  const [roads, setRoads] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);

  // Form state
  const [editingRoad, setEditingRoad] = useState(null);
  const [formData, setFormData] = useState({
    builder_id: "",
    cost: "",
    started_date: "",
  });

  const [statusMessage, setStatusMessage] = useState(""); // To show success/error

  useEffect(() => {
    if (role !== "manager" || !mapRef.current) return;

    const map = mapRef.current;

    // Map click listener
    const listener = map.addListener("click", async (e) => {
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const updatedPoints = [...currentPoints, newPoint];
      setCurrentPoints(updatedPoints);

      if (updatedPoints.length >= 2) {
        const pathString = updatedPoints.map((p) => `${p.lat},${p.lng}`).join("|");

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
      }
    });

    // Ctrl+Z undo listener
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

  // When clicking save, open form and keep currentPoints
  const saveCurrentRoad = () => {
    if (currentPoints.length > 0) {
      setEditingRoad(currentPoints);
      setStatusMessage(""); // Clear previous status
    }
  };

  const submitRoadForm = async () => {
    if (!editingRoad) return;

    const payload = {
      ...formData,
      polyline: editingRoad,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_FAST_API}/add_road`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Save to map
        setRoads([...roads, editingRoad]);
        // Clear the current polyline from map
        setCurrentPoints([]);
        setEditingRoad(null);
        setFormData({ builder_id: "", cost: "", started_date: "" });
        setStatusMessage("Road successfully submitted");
      } else {
        const errText = await res.text();
        setStatusMessage(`Error submitting road: ${errText}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error submitting road: ${err.message}`);
    }
  };

  const cancelEditing = () => {
    setEditingRoad(null);
    setCurrentPoints([]); // Remove polyline from map
    setStatusMessage("Road creation cancelled");
  };

  return (
    <>
      {/* Save Road Button */}
      <button
        onClick={saveCurrentRoad}
        className="absolute top-24 right-4 z-50 w-14 h-14 flex items-center justify-center rounded-full cursor-pointer bg-green-600 text-white hover:bg-green-500"
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
            <h2 className="text-xl font-bold mb-4">Assign Road Details</h2>

            <label className="block mb-2">
              Builder ID:
              <input
                type="number"
                value={formData.builder_id}
                onChange={(e) =>
                  setFormData({ ...formData, builder_id: e.target.value })
                }
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              Cost (₹):
              <input
                type="number"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                className="w-full border px-2 py-1 rounded mt-1"
              />
            </label>

            <label className="block mb-4">
              Started Date:
              <input
                type="date"
                value={formData.started_date}
                onChange={(e) =>
                  setFormData({ ...formData, started_date: e.target.value })
                }
                className="w-full border px-2 py-1 rounded mt-1"
              />
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

      {/* Draw all saved roads */}
      {roads.map((road, index) => (
        <Polyline
          key={index}
          path={road}
          options={{
            strokeColor: "#FF0000",
            strokeOpacity: 1,
            strokeWeight: 4,
          }}
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
