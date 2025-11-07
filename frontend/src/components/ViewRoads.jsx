import { useEffect, useState } from "react";
import { Polyline } from "@react-google-maps/api";
import DetailedReviews from "./DetailedReviews";

const statusColors = {
  planned: "#1E90FF",             // blue
  "under construction": "#FFA500", // orange
  maintaining: "#32CD32",         // green
  completed: "#000",              // black
};

const conditionTags = [
  "Severely Damaged",
  "Potholes Present",
  "Uneven Surface",
  "Waterlogged",
  "Dirty/Littered",
  "Under Repair",
  "Average Condition",
  "Good Condition",
  "Well Maintained",
  "Excellent Condition",
];

function ViewRoads() {
  const [roads, setRoads] = useState([]);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [tagCounts, setTagCounts] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetailedReviews, setShowDetailedReviews] = useState(false);

  useEffect(() => {
    const fetchRoads = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_FLASK_API}/`);
        if (!res.ok) throw new Error("Failed to fetch roads");
        const data = await res.json();

        const formattedRoads = (data.all_roads_data || []).map((road) => ({
          id: road.road_id,
          path: road.polyline_data,
          builder_id: road.builder_id,
          maintained_by: road.maintained_by,
          cost: road.cost,
          status: road.status || "planned",
          started_date: road.started_date,
          ended_date: road.ended_date,
          chief_engineer: road.chief_engineer || "N/A",
          date_verified: road.date_verified || "Not verified",
          employee_id: road.employee_id,
        }));

        setRoads(formattedRoads);
      } catch (err) {
        console.error("Error loading roads:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoads();
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async () => {
    if (!selectedRoad) return;
    if (!comment.trim() && selectedTags.length === 0 && rating === 0 && !selectedFile) {
      alert("Please provide at least one of: comment, tag, rating, or image.");
      return;
    }

    const tagsString = selectedTags.join(",");
    const reviewText = comment + (tagsString ? `,${tagsString}` : "");

    try {
      setSubmitting(true);

      // --- Submit review ---
      const reviewForm = new FormData();
      reviewForm.append("road_id", selectedRoad.id);
      reviewForm.append("tags", reviewText);
      
      // Add file if selected
      if (selectedFile) {
        reviewForm.append("media_file", selectedFile);
      }

      await fetch(`${import.meta.env.VITE_FLASK_API}/user/roads/review/`, {
        method: "POST",
        body: reviewForm,
      });

      // --- Submit rating ---
      if (rating > 0) {
        const ratingResponse = await fetch(`${import.meta.env.VITE_FLASK_API}/user/roads/rate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            road_id: selectedRoad.id,
            rating: rating,
            location: "Unknown",
          }),
        });
        
        if (!ratingResponse.ok) {
          const errorData = await ratingResponse.text();
          console.error("Rating submission failed:", errorData);
          throw new Error(`Rating submission failed: ${ratingResponse.status}`);
        }
        
        console.log("Rating submitted successfully");
      }

      // --- Refresh review list & tag counts ---
      await fetchReviews(selectedRoad.id);

      alert("✅ Review and rating submitted successfully!");
      setComment("");
      setSelectedTags([]);
      setRating(0);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoadColor = (status) => statusColors[status] || "#000000";

  const getStreetViewImage = (road) => {
    if (!road.path?.length) return null;
    const { lat, lng } = road.path[0];
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/streetview?size=400x200&location=${lat},${lng}&key=${apiKey}`;
  };

  const fetchReviews = async (roadId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_FLASK_API}/user/roads/${roadId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
      setTagCounts(data.tag_counts || {});
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  return (
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* Loading/Error Messages */}
      {loading && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "#fff",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "5px",
        }}>
          Loading roads...
        </div>
      )}

      {error && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "#fee",
          border: "1px solid #f99",
          padding: "10px",
          borderRadius: "5px",
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
          onClick={() => {
            setSelectedRoad(road);
            fetchReviews(road.id);
          }}
        />
      ))}

      {/* Drawer */}
      {selectedRoad && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "400px",
          height: "100%",
          backgroundColor: "white",
          borderLeft: "2px solid #ccc",
          padding: "20px",
          overflowY: "auto",
          boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
          zIndex: 9999,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Road Details</h2>
            <button
              onClick={() => setSelectedRoad(null)}
              style={{
                cursor: "pointer",
                fontSize: "20px",
                background: "none",
                border: "none",
              }}
            >
              ×
            </button>
          </div>

          {/* Street View Preview */}
          {getStreetViewImage(selectedRoad) ? (
            <img
              src={getStreetViewImage(selectedRoad)}
              alt="Street View"
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
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
              marginBottom: "10px",
            }}>
              No Image Available
            </div>
          )}

          {/* Road Info */}
          {Object.entries({
            "Road ID": selectedRoad.id,
            Status: selectedRoad.status,
            "Builder ID": selectedRoad.builder_id,
            "Maintained By": selectedRoad.maintained_by,
            "Employee ID": selectedRoad.employee_id,
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
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>{label}:</span>
              <span>{value}</span>
            </div>
          ))}

          <hr style={{ margin: "20px 0" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
            Leave a Review
          </h3>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              resize: "none",
              marginBottom: "10px",
            }}
          />

          {/* Tags */}
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Select Tags:</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {conditionTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "16px",
                    border: "1px solid #888",
                    backgroundColor: selectedTags.includes(tag) ? "#4CAF50" : "#f5f5f5",
                    color: selectedTags.includes(tag) ? "white" : "#333",
                    cursor: "pointer",
                    fontSize: "13px",
                    userSelect: "none",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Rate this road:</p>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                onClick={() => setRating(i + 1)}
                style={{
                  cursor: "pointer",
                  fontSize: "22px",
                  color: i < rating ? "#FFD700" : "#ccc",
                  marginRight: "4px",
                }}
              >
                ★
              </span>
            ))}
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Upload Image (optional):</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              value=""
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            {selectedFile && (
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmitReview}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: submitting ? "#888" : "#333",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>

          {/* Detailed Reviews Button */}
          <button
            onClick={() => setShowDetailedReviews(true)}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            View Detailed Reviews
          </button>

          {/* --- Tag Summary --- */}
          <hr style={{ margin: "20px 0" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
            Road Tag Summary
          </h3>

          {Object.keys(tagCounts).length === 0 ? (
            <p style={{ color: "#777" }}>No tag data available yet.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "15px",
              }}
            >
              {Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: "#e9f5e9",
                      border: "1px solid #ccc",
                      padding: "6px 10px",
                      borderRadius: "16px",
                      fontSize: "13px",
                      color: "#333",
                    }}
                  >
                    {tag} — {count}
                  </span>
                ))}
            </div>
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
}

export default ViewRoads;
