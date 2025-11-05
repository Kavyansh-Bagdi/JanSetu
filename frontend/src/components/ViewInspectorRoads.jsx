import { useState, useEffect } from "react";
import { useRole } from "../components/RoleContext.jsx";
import { Polyline } from "@react-google-maps/api";

// Custom hook to fetch roads assigned to the inspector
const useInspectorRoads = (inspectorId) => {
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspectorRoads = async () => {
      try {
        const response = await fetch(`/inspector/${inspectorId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch roads for inspector ${inspectorId}`);
        }
        const data = await response.json();
        setRoads(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (inspectorId) {
      fetchInspectorRoads();
    }
  }, [inspectorId]);

  return { roads, loading, error };
};

const ViewInspectorRoads = ({ inspectorId }) => {
  const { roads, loading, error } = useInspectorRoads(inspectorId);

  // Color logic based on road status
  const getRoadColor = (status) => {
    switch (status) {
      case "planned":
        return "#FFDD00"; // Yellow for planned
      case "under construction":
        return "#FF6347"; // Red for under construction
      case "maintaining":
        return "#4682B4"; // Blue for maintaining
      default:
        return "#000000"; // Default black if unknown status
    }
  };

  if (loading) return <div>Loading roads...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      {roads.length === 0 ? (
        <div>No roads assigned to this inspector.</div>
      ) : (
        roads.map((road) => (
          <Polyline
            key={road.id}
            path={road.coordinates}
            options={{
              strokeColor: getRoadColor(road.status),
              strokeOpacity: 1,
              strokeWeight: 4,
              icons: road.status === "under construction" ? [{ icon: "🔨", offset: "0", repeat: "20px" }] : []
            }}
          />
        ))
      )}
    </>
  );
};

export default ViewInspectorRoads;
