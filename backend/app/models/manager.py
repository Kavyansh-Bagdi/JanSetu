from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Manager(Base):
    __tablename__ = "manager"

    unique_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.user_id"), unique=True, nullable=False)
    post = Column(String, nullable=False)  # Designation/Post
    department = Column(String, nullable=True)  # Department name
    location = Column(String, nullable=False)  # Work location
    employee_code = Column(String, unique=True, nullable=True)  # Government employee code
    
    # Relationships
    user = relationship("User", back_populates="manager_profile")
    
    managed_roads = relationship(
        "Road",
        back_populates="manager",
        foreign_keys="Road.manager_id"
    )
    

    def __repr__(self):
        return f"<Manager(unique_id={self.unique_id}, user_id={self.user_id}, post='{self.post}')>"
