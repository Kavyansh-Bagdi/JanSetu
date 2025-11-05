from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Review(Base):
    __tablename__ = "review"

    review_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    road_id = Column(Integer, ForeignKey("road.road_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    media = Column(String, nullable=True)  # Image/video link
    tags = Column(String, nullable=True)  # Tags related to the review
    timestamp = Column(DateTime, nullable=False)

    # Relationships
    road = relationship("Road", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

    def __repr__(self):
        return f"<Review(review_id={self.review_id}, timestamp={self.timestamp})>"
