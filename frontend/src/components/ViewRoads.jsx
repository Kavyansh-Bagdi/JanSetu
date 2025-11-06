import { useEffect, useState } from "react";
import { Polyline } from "@react-google-maps/api";

const statusColors = {
  planned: "#1E90FF",             // blue
  "under construction": "#FFA500", // orange
  maintaining: "#32CD32",         // green
};

function ViewRoads() {
  const [roads, setRoads] = useState([]);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_FLASK_API}/`);
        if (!res.ok) throw new Error("Failed to fetch roads");

        const data = await res.json();

        // ✅ Extract and format the road data correctly
        const formattedRoads = (data.all_roads_data || []).map((road) => ({
          id: road.road_id,
          path: road.polyline_data,
          // default or placeholder status (backend doesn’t send it yet)
          status: road.status || "planned",
        }));

        setRoads(formattedRoads);
      } catch (err) {
        console.error("Error loading roads:", err);
      }
    };

    fetchRoads();
  }, []);

  return (
    <>
      {roads.map((road) => (
        <Polyline
          key={road.id}
          path={road.path}
          options={{
            strokeColor: statusColors[road.status] || "#000000",
            strokeOpacity: 0.9,
            strokeWeight: 4,
          }}
        />
      ))}
    </>
  );
}

export default ViewRoads;
