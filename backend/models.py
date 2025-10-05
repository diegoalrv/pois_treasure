from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
import uuid

# --- Profiles ---
class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    rules = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    users = relationship("User", back_populates="profile")


# --- Users ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    uuid = Column(
        String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4())
    )
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    profile = relationship("Profile", back_populates="users")
    assignments = relationship("UserPOIAssignment", back_populates="user", cascade="all, delete-orphan")


# --- POIs ---
class POI(Base):
    __tablename__ = "pois"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    category = Column(String(50), index=True, nullable=False)
    wkt_geometry = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    assignments = relationship("UserPOIAssignment", back_populates="poi", cascade="all, delete-orphan")


Index("idx_pois_category", POI.category)


# --- Asignaciones usuario<->POI ---
class UserPOIAssignment(Base):
    __tablename__ = "user_poi_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    poi_id = Column(Integer, ForeignKey("pois.id"), index=True, nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    visited = Column(Boolean, default=False, nullable=False)
    visited_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="assignments")
    poi = relationship("POI", back_populates="assignments")

    __table_args__ = (
        UniqueConstraint("user_id", "poi_id", name="uq_user_poi"),
    )


# --- Survey reports ---
class SurveyReport(Base):
    __tablename__ = "survey_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String(140), nullable=False)
    description = Column(Text, nullable=True)
    option = Column(String(80), nullable=False)
    photo_url = Column(Text, nullable=True)
    wkt_point = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# --- Tracking pasivo ---
class UserTracking(Base):
    __tablename__ = "user_tracking"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    wkt_point = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


Index("idx_user_tracking_user_time", UserTracking.user_id, UserTracking.timestamp)