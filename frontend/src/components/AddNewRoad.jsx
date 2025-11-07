import { useState, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { Polyline } from "@react-google-maps/api";

const statusColors = {
  planned: "#00ADB5", // Teal
  "under construction": "#FFCC00", // Yellow
  maintaining: "#32CD32", // Lime green
};

function AddNewRoad({ mapRef, onCancel }) {
  const { role } = useRole();
  const [roads, setRoads] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [editingRoad, setEditingRoad] = useState(null);
  const [formData, setFormData] = useState({
    builder_id: "",
    inspector_assigned: "",
    cost: "",
    started_date: "",
    ended_date: "",
    status: "planned",
  });
  const [statusMessage, setStatusMessage] = useState("");

  // 🗺️ Handle map click (no snapping)
  useEffect(() => {
    if (role !== "manager" || !mapRef.current) return;
    const map = mapRef.current;

    const clickListener = map.addListener("click", (e) => {
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setCurrentPoints((prev) => [...prev, newPoint]);
    });

    const handleKeyDown = (e) => {
      // Undo last point
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        setCurrentPoints((prev) => prev.slice(0, -1));
        setStatusMessage("↩️ Last point removed");
      }
      // Cancel current drawing
      if (e.key === "Escape") cancelEditing();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      if (clickListener) clickListener.remove();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mapRef, role]);

  if (role !== "manager") return null;

  // 💾 Save current road
  const saveCurrentRoad = () => {
    if (currentPoints.length < 2) {
      setStatusMessage("⚠️ Draw at least two points first");
      return;
    }
    setEditingRoad(currentPoints);
    setStatusMessage("");
  };

  // ❌ Cancel editing (inside modal)
  const cancelEditing = () => {
    setEditingRoad(null);
    setStatusMessage("❌ Road creation cancelled");
  };

  // 🔙 Cancel whole AddNewRoad flow
  const handleCancelAll = () => {
    setCurrentPoints([]);
    setEditingRoad(null);
    setFormData({
      builder_id: "",
      inspector_assigned: "",
      cost: "",
      started_date: "",
      ended_date: "",
      status: "planned",
    });
    setStatusMessage("🛑 Add new road cancelled");
    if (onCancel) onCancel(); // notify parent
  };

  // 🧹 Clear drawing
  const clearCurrent = () => {
    setCurrentPoints([]);
    setStatusMessage("🧹 Cleared current drawing");
  };

  // 📤 Submit road form
  const submitRoadForm = async () => {
    if (!editingRoad) {
      setStatusMessage("⚠️ No road drawn yet");
      return;
    }

    const { builder_id, inspector_assigned, cost, started_date, ended_date, status } = formData;

    if (!builder_id || !inspector_assigned || !cost || !started_date) {
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

      setRoads((prev) => [...prev, editingRoad]);
      setCurrentPoints([]);
      setEditingRoad(null);
      setFormData({
        builder_id: "",
        inspector_assigned: "",
        cost: "",
        started_date: "",
        ended_date: "",
        status: "planned",
      });
      setStatusMessage("✅ Road submitted successfully!");
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Submission failed: ${err.message}`);
    }
  };

  return (
    <>
      {/* 🎛️ Control Buttons */}
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
          onClick={handleCancelAll}
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

      {/* 🟡 Status Message */}
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
          {statusMessage}
        </div>
      )}

      {/* 🧾 Form Modal */}
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
            {["builder_id", "inspector_assigned", "cost", "started_date", "ended_date"].map(
              (field) => (
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
              )
            )}

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
                onClick={cancelEditing}
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
                disabled={!formData.builder_id || !formData.inspector_assigned}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#00ADB5",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  opacity:
                    !formData.builder_id || !formData.inspector_assigned
                      ? 0.6
                      : 1,
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛣️ Draw roads */}
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

      {/* ✏️ Current drawing */}
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

export default AddNewRoad;
