import { useState, useEffect } from "react";
import { Polyline } from "@react-google-maps/api";

const statusColors = {
  planned: "#555", // dark gray
  "under construction": "#888", // medium gray
  maintaining: "#333", // darker gray
  completed: "#000", // black
};

const ViewInspectorRoads = ({ onPolylineLoad }) => {
  const [inspectorId, setInspectorId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!submitted || !inspectorId) return;

    const fetchRoads = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_FLASK_API}/employee/inspector/roads?inspector_unique_id=${inspectorId}`
        );
        if (!res.ok) throw new Error("Failed to fetch inspector roads");
        const data = await res.json();

        const formatted = (data.roads || []).map((r) => ({
          id: r.road_id,
          path: r.polyline_data || [],
          builder_id: r.builder_id,
          maintained_by: r.maintained_by,
          cost: r.cost,
          status: r.status?.replace("_", " ") || "planned",
          started_date: r.started_date,
          ended_date: r.ended_date,
          chief_engineer: r.chief_engineer || "N/A",
          date_verified: r.date_verified || "Not verified",
        }));

        setRoads(formatted);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoads();
  }, [submitted, inspectorId]);

  const getRoadColor = (status) => statusColors[status] || "#555";

  const getStreetViewImage = (road) => {
    if (!road.path?.length) return null;
    const { lat, lng } = road.path[0];
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${lat},${lng}&key=${apiKey}`;
  };

  const handleVerify = async (road) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const res = await fetch(`http://localhost:8000/builder/roads/${road.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          builder_unique_id: road.builder_id,
          chief_engineer: road.chief_engineer,
          status: "completed",
          date_verified: today,
        }),
      });

      if (!res.ok) throw new Error("Failed to verify road");

      setRoads((prev) =>
        prev.map((r) =>
          r.id === road.id ? { ...r, status: "completed", date_verified: today } : r
        )
      );

      setSelectedRoad((prev) =>
        prev ? { ...prev, status: "completed", date_verified: today } : null
      );

      alert("✅ Road verified successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Verification failed: " + err.message);
    }
  };

  return (
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* Inspector Login */}
      {!submitted && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "320px",
          padding: "20px",
          backgroundColor: "whitesmoke",
          border: "2px solid #ccc",
          borderRadius: "8px",
          color: "#222",
          fontSize: "14px"
        }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: "bold" }}>Inspector Login</h2>
          <p style={{ marginBottom: "10px", fontSize: "13px" }}>Enter your Inspector ID to view assigned roads.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (inspectorId.trim()) setSubmitted(true); }}>
            <input
              type="text"
              value={inspectorId}
              onChange={(e) => setInspectorId(e.target.value)}
              placeholder="Inspector ID"
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                border: "1px solid #999",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <button type="submit" style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#444",
              color: "white",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}>
              View Roads
            </button>
          </form>
        </div>
      )}

      {/* Loading / Error */}
      {submitted && loading && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          padding: "10px",
          backgroundColor: "whitesmoke",
          border: "1px solid #999",
          borderRadius: "4px",
          fontSize: "13px",
        }}>
          Loading assigned roads...
        </div>
      )}
      {submitted && error && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          padding: "10px",
          backgroundColor: "#f8f8f8",
          border: "1px solid #999",
          borderRadius: "4px",
          color: "#222",
          fontSize: "13px",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Road Polylines */}
      {roads.map((road) => (
        <Polyline
          key={road.id}
          path={road.path}
          options={{
            strokeColor: getRoadColor(road.status),
            strokeOpacity: 0.9,
            strokeWeight: 4,
          }}
          onClick={() => setSelectedRoad(road)}
          onLoad={(polyline) => typeof onPolylineLoad === "function" && onPolylineLoad(polyline)}
        />
      ))}

      {/* Drawer */}
      {selectedRoad && (
        <div style={{
          position: "fixed",
          top: "0",
          right: "0",
          width: "400px",
          height: "100%",
          backgroundColor: "white",
          borderLeft: "2px solid #ccc",
          padding: "20px",
          overflowY: "auto",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Road Details</h2>
            <button onClick={() => setSelectedRoad(null)} style={{ cursor: "pointer", fontSize: "20px" }}>×</button>
          </div>

          {getStreetViewImage(selectedRoad) ? (
            <img
              src={getStreetViewImage(selectedRoad)}
              alt="Street View"
              style={{ width: "100%", height: "200px", objectFit: "cover", marginBottom: "10px", border: "1px solid #ccc" }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "200px",
              backgroundColor: "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #ccc",
              marginBottom: "10px"
            }}>
              No Image Available
            </div>
          )}

          {Object.entries({
            Status: selectedRoad.status,
            "Builder ID": selectedRoad.builder_id,
            "Maintained By": selectedRoad.maintained_by,
            Cost: `₹${selectedRoad.cost}`,
            "Start Date": selectedRoad.started_date,
            "End Date": selectedRoad.ended_date,
            "Chief Engineer": selectedRoad.chief_engineer,
            "Date Verified": selectedRoad.date_verified,
          }).map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
              <span style={{ fontWeight: "bold" }}>{label}:</span>
              <span>{value}</span>
            </div>
          ))}

          {selectedRoad.status !== "completed" && (
            <button onClick={() => handleVerify(selectedRoad)} style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#333",
              color: "white",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px",
              fontSize: "14px"
            }}>
              Verify Road
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewInspectorRoads;
