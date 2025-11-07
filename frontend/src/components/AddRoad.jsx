import { useState, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { Polyline } from "@react-google-maps/api";

// --- Road status colors ---
const statusColors = {
  planned: "#1E90FF",            // Blue  (Planned)
  "under_construction": "#FF0000", // Red   (Under Construction)
  maintaining: "#FFA500",        // Orange (Maintaining)
  completed: "#32CD32",          // Green  (Completed)
};

function AddRoad({ mapRef, onCancel }) {
  const { role } = useRole();
  const [roads, setRoads] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [editingRoad, setEditingRoad] = useState(null);
  const [snapping, setSnapping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [formData, setFormData] = useState({
    builder_id: "",
    inspector_assigned: "",
    cost: "",
    started_date: "",
    ended_date: "",
    status: "planned",
  });

  // 🛰️ Snap-to-Road API integration
  const snapToRoads = async (points) => {
    if (points.length < 2) return;
    setSnapping(true);
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
      console.error("Snap-to-road error:", err);
      setStatusMessage("⚠️ Snap-to-road failed");
    } finally {
      setSnapping(false);
    }
  };

  // 🗺️ Map click listener
  useEffect(() => {
    if (role !== "manager" || !mapRef.current) return;
    const map = mapRef.current;

    const clickListener = map.addListener("click", (e) => {
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const updated = [...currentPoints, newPoint];
      setCurrentPoints(updated);
      if (updated.length >= 2) snapToRoads(updated);
    });

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        setCurrentPoints((prev) => prev.slice(0, -1));
        setStatusMessage("↩️ Last point removed");
      }
      if (e.key === "Escape") handleCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clickListener.remove();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPoints, mapRef, role]);

  // 💾 Save road for details input
  const saveCurrentRoad = () => {
    if (!currentPoints.length) {
      setStatusMessage("⚠️ Draw at least one point first");
      return;
    }
    setEditingRoad(currentPoints);
    setStatusMessage("");
  };

  // 🧹 Clear current polyline
  const clearCurrent = () => {
    setCurrentPoints([]);
    setStatusMessage("🧹 Cleared current path");
  };

  // ❌ Cancel — resets and notifies parent
  const handleCancel = () => {
    setEditingRoad(null);
    setCurrentPoints([]);
    setFormData({
      builder_id: "",
      inspector_assigned: "",
      cost: "",
      started_date: "",
      ended_date: "",
      status: "planned",
    });
    setStatusMessage("❌ Road creation cancelled");

    if (onCancel) onCancel(); // 👈 informs Map.jsx
  };

  // 🚀 Submit road to backend
  const submitRoadForm = async () => {
    if (!editingRoad) return;
    const { builder_id, inspector_assigned, cost, started_date, ended_date, status } = formData;

    if (!builder_id || !inspector_assigned) {
      setStatusMessage("⚠️ Fill all required fields");
      return;
    }

    const payload = {
      builder_id: parseInt(builder_id, 10),
      inspector_assigned: parseInt(inspector_assigned, 10),
      cost: parseFloat(cost),
      started_date,
      ended_date: ended_date || null,
      status,
      polyline: editingRoad,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_FLASK_API}/employee/add_road`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        setStatusMessage(`❌ Error: ${text}`);
        return;
      }

      setRoads([...roads, editingRoad]);
      handleCancel();
      setStatusMessage("✅ Road submitted successfully!");
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Submission failed: ${err.message}`);
    }
  };

  if (role !== "manager") return null;

  return (
    <>
      {/* 🧭 Control Buttons */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 1000,
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={saveCurrentRoad}
          style={{
            padding: "10px 16px",
            backgroundColor: "#00ADB5",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save
        </button>

        <button
          onClick={clearCurrent}
          style={{
            padding: "10px 16px",
            backgroundColor: "#393E46",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>

        <button
          onClick={handleCancel}
          style={{
            padding: "10px 16px",
            backgroundColor: "#FF3B30",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {/* 🔔 Status Message */}
      {statusMessage && (
        <div
          style={{
            position: "fixed",
            top: 70,
            right: 20,
            padding: "8px 12px",
            backgroundColor: "#EEEEEE",
            color: "#222831",
            borderRadius: "4px",
            border: "1px solid #393E46",
            zIndex: 1000,
          }}
        >
          {snapping ? "⏳ Snapping points..." : statusMessage}
        </div>
      )}

      {/* 🧾 Road Details Modal */}
      {editingRoad && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "6px",
              width: "400px",
              fontFamily: "Helvetica, Roboto, sans-serif",
            }}
          >
            <h2 style={{ marginBottom: "12px" }}>Add Road Details</h2>

            {["builder_id", "inspector_assigned", "cost", "started_date", "ended_date"].map((field) => (
              <label key={field} style={{ display: "block", marginBottom: "10px" }}>
                {field.replace("_", " ").toUpperCase()}:
                <input
                  type={
                    field.includes("id") || field === "cost"
                      ? "number"
                      : field.includes("date")
                      ? "date"
                      : "text"
                  }
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    marginTop: "4px",
                    border: "1px solid #393E46",
                    borderRadius: "4px",
                  }}
                />
              </label>
            ))}

            <label style={{ display: "block", marginBottom: "10px" }}>
              Status:
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  marginTop: "4px",
                  border: "1px solid #393E46",
                  borderRadius: "4px",
                }}
              >
                <option value="planned">Planned</option>
                <option value="under construction">Under Construction</option>
                <option value="maintaining">Maintaining</option>
              </select>
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={handleCancel}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#393E46",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitRoadForm}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#00ADB5",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛣️ Drawn Roads */}
      {roads.map((road, i) => (
        <Polyline
          key={i}
          path={road}
          options={{
            strokeColor: "#393E46",
            strokeOpacity: 1,
            strokeWeight: 4,
          }}
        />
      ))}

      {/* ✏️ Current Drawing */}
      {currentPoints.length > 0 && (
        <Polyline
          path={currentPoints}
          options={{
            strokeColor: statusColors[formData.status] || "#00ADB5",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            strokeDasharray: [6, 4],
          }}
        />
      )}
    </>
  );
}

export default AddRoad;
