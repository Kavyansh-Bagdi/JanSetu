import { useState, useEffect } from "react";

function DetailedReviews({ roadId, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchDetailedData();
  }, [roadId]);

  const fetchDetailedData = async () => {
    setLoading(true);
    try {
      // Fetch reviews
      const reviewRes = await fetch(
        `${import.meta.env.VITE_FLASK_API}/user/roads/${roadId}/reviews`
      );
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        setReviews(reviewData.reviews || []);
      }

      // Fetch ratings
      const ratingRes = await fetch(
        `${import.meta.env.VITE_FLASK_API}/user/roads/${roadId}/ratings/`
      );
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        console.log("Rating data:", ratingData);
        // API returns array directly, not wrapped in {ratings: []}
        const ratingsArray = Array.isArray(ratingData) ? ratingData : [];
        setRatings(ratingsArray);
        
        // Calculate average rating - parse strings to numbers
        if (ratingsArray.length > 0) {
          const avg = ratingsArray.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratingsArray.length;
          setAverageRating(avg.toFixed(1));
        }
      }
    } catch (err) {
      console.error("Error fetching detailed data:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          fontSize: "18px",
          color: i < Math.round(rating) ? "#FFD700" : "#ccc",
          marginRight: "2px",
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          borderRadius: "10px",
          padding: "20px",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            Detailed Reviews
          </h2>
          <button
            onClick={onClose}
            style={{
              cursor: "pointer",
              fontSize: "28px",
              background: "none",
              border: "none",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Loading reviews and ratings...
          </div>
        ) : (
          <>
            {/* Average Rating Section */}
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
                Average Rating
              </h3>
              <div style={{ fontSize: "48px", fontWeight: "bold", color: "#333" }}>
                {averageRating || "N/A"}
              </div>
              <div style={{ marginTop: "5px" }}>
                {averageRating > 0 && renderStars(parseFloat(averageRating))}
              </div>
              <p style={{ color: "#666", fontSize: "14px", marginTop: "5px" }}>
                Based on {ratings.length} rating{ratings.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Individual Ratings */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "5px",
                }}
              >
                All Ratings ({ratings.length})
              </h3>
              {ratings.length === 0 ? (
                <p style={{ color: "#999", fontStyle: "italic" }}>No ratings yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {ratings.map((rating, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #eee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          {renderStars(parseFloat(rating.rating))}
                          <span style={{ marginLeft: "10px", fontWeight: "bold" }}>
                            {parseFloat(rating.rating).toFixed(1)}/5
                          </span>
                        </div>
                        {rating.timestamp && (
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {new Date(rating.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {rating.location && rating.location !== "Unknown" && (
                        <p style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>
                          📍 {rating.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "5px",
                }}
              >
                All Reviews ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <p style={{ color: "#999", fontStyle: "italic" }}>No reviews yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {reviews.map((review, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #eee",
                      }}
                    >
                      {/* Review comment */}
                      {review.comment && (
                        <p
                          style={{
                            fontSize: "15px",
                            color: "#333",
                            marginBottom: "10px",
                            lineHeight: "1.5",
                            fontWeight: "500",
                          }}
                        >
                          {review.comment}
                        </p>
                      )}

                      {/* Review tags */}
                      {review.tags && review.tags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                            marginBottom: "10px",
                          }}
                        >
                          {review.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              style={{
                                backgroundColor: "#e3f2fd",
                                border: "1px solid #90caf9",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                color: "#1976d2",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Review image if available */}
                      {review.media && (
                        <img
                          src={review.media}
                          alt="Review media"
                          style={{
                            width: "100%",
                            maxHeight: "300px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            marginBottom: "10px",
                            border: "1px solid #ddd",
                          }}
                        />
                      )}

                      {/* User and Timestamp */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "10px",
                          paddingTop: "10px",
                          borderTop: "1px solid #eee",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          User ID: {review.user_id}
                        </span>
                        {review.timestamp && (
                          <span style={{ fontSize: "12px", color: "#999" }}>
                            {new Date(review.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetailedReviews;
