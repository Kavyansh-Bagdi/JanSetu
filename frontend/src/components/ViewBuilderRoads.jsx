import { useState, useEffect } from "react";
import { Polyline } from "@react-google-maps/api";

const statusColors = {
  planned: "#1E90FF",             // Blue
  "under construction": "#FFA500", // Orange
  maintaining: "#32CD32",         // Green
};

const ViewBuilderRoads = ({ onPolylineLoad }) => {
  const [builderId, setBuilderId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoad, setSelectedRoad] = useState(null);

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
        console.log("✅ Builder Roads:", data);

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
          average_rating: r.average_rating,
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

  const getRoadColor = (status) => statusColors[status] || "#000000";

  return (
    <>
      {/* 🔹 Ask for Builder ID */}
      {!submitted && (
        <div className="absolute top-5 left-5 bg-white bg-opacity-95 shadow-lg rounded-lg p-4 z-50 pointer-events-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (builderId.trim()) setSubmitted(true);
            }}
          >
            <h2 className="text-md font-semibold mb-2">Enter Builder ID</h2>
            <input
              type="number"
              value={builderId}
              onChange={(e) => setBuilderId(e.target.value)}
              placeholder="Builder ID"
              className="w-48 border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
              required
            />
            <button
              type="submit"
              className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-500"
            >
              View
            </button>
          </form>
        </div>
      )}

      {/* 🔹 Loading / Error Messages */}
      {submitted && (
        <>
          {loading && (
            <div className="absolute top-5 left-5 bg-white shadow-md rounded px-3 py-2 text-sm z-50">
              Loading assigned roads...
            </div>
          )}
          {error && (
            <div className="absolute top-5 left-5 bg-red-100 text-red-700 shadow-md rounded px-3 py-2 text-sm z-50">
              Error: {error}
            </div>
          )}
        </>
      )}

      {/* 🔹 Render Builder Roads */}
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
          onLoad={(polyline) => {
            if (typeof onPolylineLoad === "function") onPolylineLoad(polyline);
          }}
        />
      ))}

      {/* 🔹 Road Info Modal */}
      {selectedRoad && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button
              onClick={() => setSelectedRoad(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-3">
              Road ID: {selectedRoad.id}
            </h2>
            <ul className="text-sm space-y-1">
              <li><strong>Status:</strong> {selectedRoad.status}</li>
              <li><strong>Builder ID:</strong> {selectedRoad.builder_id}</li>
              <li><strong>Maintained By:</strong> {selectedRoad.maintained_by}</li>
              <li><strong>Cost:</strong> ₹{selectedRoad.cost}</li>
              <li><strong>Start Date:</strong> {selectedRoad.started_date}</li>
              <li><strong>End Date:</strong> {selectedRoad.ended_date}</li>
              <li><strong>Chief Engineer:</strong> {selectedRoad.chief_engineer}</li>
              <li><strong>Date Verified:</strong> {selectedRoad.date_verified}</li>
              <li><strong>Average Rating:</strong> {selectedRoad.average_rating ?? "No ratings yet"}</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewBuilderRoads;
