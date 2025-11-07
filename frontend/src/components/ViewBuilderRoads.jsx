import { useState, useEffect } from "react";
import { Polyline } from "@react-google-maps/api";
import DetailedReviews from "./DetailedReviews";

const statusColors = {
  planned: "#1E90FF",
  "under construction": "#FFA500",
  maintaining: "#32CD32",
  completed: "#000",
};

const ViewBuilderRoads = ({ onPolylineLoad }) => {
  const [builderId, setBuilderId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({ chief_engineer: "", status: "" });
  const [showDetailedReviews, setShowDetailedReviews] = useState(false);

  useEffect(() => {
    if (!submitted || !builderId) return;

    const fetchRoads = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_FLASK_API}/builder/${builderId}/roads`
        );
        if (!res.ok) throw new Error("Failed to fetch builder roads");

        const data = await res.json();
        const formatted = (data.roads || []).map((r) => ({
          id: r.road_id,
          path: Array.isArray(r.polyline_data)
            ? r.polyline_data
            : JSON.parse(r.polyline_data || "[]"),
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
  }, [submitted, builderId]);

  const getRoadColor = (status) => statusColors[status] || "#555";

  const getStreetViewImage = (road) => {
    if (!road.path?.length) return null;
    const { lat, lng } = road.path[0];
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${lat},${lng}&key=${apiKey}`;
  };

  // PATCH request to update road
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${import.meta.env.VITE_FLASK_API}/builder/roads/${selectedRoad.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            builder_unique_id: parseInt(builderId),
            chief_engineer: formData.chief_engineer || null,
            status: formData.status || null,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update road");
      const updated = await res.json();

      // Update UI
      setRoads((prev) =>
        prev.map((r) =>
          r.id === selectedRoad.id
            ? {
                ...r,
                chief_engineer: updated.chief_engineer,
                status: updated.status,
              }
            : r
        )
      );

      setSelectedRoad((prev) =>
        prev
          ? {
              ...prev,
              chief_engineer: updated.chief_engineer,
              status: updated.status,
            }
          : null
      );

      alert("✅ Road updated successfully!");
      setShowUpdateForm(false);
    } catch (err) {
      console.error(err);
      alert("❌ Update failed: " + err.message);
    }
  };

  return (
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* Builder Login */}
      {!submitted && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "320px",
            padding: "20px",
            backgroundColor: "whitesmoke",
            border: "2px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h2>Builder Login</h2>
          <p>Enter your Builder ID to view your roads.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (builderId.trim()) setSubmitted(true);
            }}
          >
            <input
              type="text"
              value={builderId}
              onChange={(e) => setBuilderId(e.target.value)}
              placeholder="Builder ID"
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                border: "1px solid #999",
                borderRadius: "4px",
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              View Roads
            </button>
          </form>
        </div>
      )}

      {/* Loading / Error */}
      {submitted && loading && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "10px",
            backgroundColor: "whitesmoke",
            border: "1px solid #999",
            borderRadius: "4px",
          }}
        >
          Loading roads...
        </div>
      )}
      {submitted && error && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            padding: "10px",
            backgroundColor: "#f8f8f8",
            border: "1px solid #999",
            borderRadius: "4px",
          }}
        >
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
          onClick={() => {
            setSelectedRoad(road);
            setShowUpdateForm(false);
          }}
          onLoad={(polyline) =>
            typeof onPolylineLoad === "function" && onPolylineLoad(polyline)
          }
        />
      ))}

      {/* Drawer */}
      {/* Drawer */}
{selectedRoad && (
  <div
    style={{
      position: "fixed",
      top: "0",
      right: "0",
      width: "400px",
      height: "100%",
      backgroundColor: "white",
      borderLeft: "2px solid #ccc",
      padding: "20px",
      overflowY: "auto",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
      }}
    >
      <h2>Road Details</h2>
      <button
        onClick={() => setSelectedRoad(null)}
        style={{ cursor: "pointer", fontSize: "20px" }}
      >
        ×
      </button>
    </div>

    {/* Image */}
    {getStreetViewImage(selectedRoad) ? (
      <img
        src={getStreetViewImage(selectedRoad)}
        alt="Street View"
        style={{
          width: "100%",
          height: "200px",
          objectFit: "cover",
          marginBottom: "10px",
          border: "1px solid #ccc",
        }}
      />
    ) : (
      <div
        style={{
          width: "100%",
          height: "200px",
          backgroundColor: "#eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #ccc",
          marginBottom: "10px",
        }}
      >
        No Image Available
      </div>
    )}

    {/* ⭐ Rating Section */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "10px",
        fontSize: "16px",
      }}
    >
      <span style={{ fontWeight: "bold", marginRight: "10px" }}>Rating:</span>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            color: i < (selectedRoad.rating || 0) ? "#FFD700" : "#ccc",
            fontSize: "20px",
            marginRight: "2px",
          }}
        >
          ★
        </span>
      ))}
      <span style={{ marginLeft: "5px", fontSize: "14px", color: "#444" }}>
        ({selectedRoad.rating || 0}/5)
      </span>
    </div>

    {/* Details */}
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
      <div
        key={label}
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "14px",
        }}
      >
        <span style={{ fontWeight: "bold" }}>{label}:</span>
        <span>{value}</span>
      </div>
    ))}

    {/* Action Buttons */}
    <button
      onClick={() => setShowUpdateForm((prev) => !prev)}
      style={{
        width: "100%",
        padding: "10px",
        marginTop: "15px",
        backgroundColor: "#333",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        marginBottom: "10px",
      }}
    >
      {showUpdateForm ? "Cancel Update" : "Update Details"}
    </button>

    {/* View Detailed Reviews Button */}
    <button
      onClick={() => setShowDetailedReviews(true)}
      style={{
        width: "100%",
        padding: "10px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      View Reviews & Ratings
    </button>

    {/* Update Form */}
    {showUpdateForm && (
      <form
        onSubmit={handleUpdateSubmit}
        style={{
          marginTop: "15px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <label style={{ display: "block", marginBottom: "6px" }}>
          Chief Engineer:
        </label>
        <input
          type="text"
          value={formData.chief_engineer}
          onChange={(e) =>
            setFormData({ ...formData, chief_engineer: e.target.value })
          }
          placeholder="Enter Chief Engineer"
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "10px",
            border: "1px solid #999",
            borderRadius: "4px",
          }}
        />

        <label style={{ display: "block", marginBottom: "6px" }}>
          Status:
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value })
          }
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #999",
            borderRadius: "4px",
          }}
        >
          <option value="">Select status</option>
          <option value="planned">Planned</option>
          <option value="under construction">Under Construction</option>
          <option value="maintaining">Maintaining</option>
          <option value="completed">Completed</option>
        </select>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            backgroundColor: "#444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Submit Update
        </button>
      </form>
    )}
  </div>
)}

      {/* Detailed Reviews Modal */}
      {showDetailedReviews && selectedRoad && (
        <DetailedReviews
          roadId={selectedRoad.id}
          onClose={() => setShowDetailedReviews(false)}
        />
      )}
    </div>
  );
};

export default ViewBuilderRoads;
