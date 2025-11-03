from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    total_contributions = Column(Integer, default=0)

    # Relationships
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(user_id={self.user_id}, name='{self.name}')>"
 