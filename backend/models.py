from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database import Base
from datetime import datetime
import uuid

# --- Profiles ---
class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    rules: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    users = relationship("User", back_populates="profile")


# --- Users ---
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    uuid: Mapped[str] = mapped_column(  # 🔥 nuevo campo para identificar al usuario
        String(36),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),  # genera automáticamente un UUID v4
    )
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="users")
    assignments = relationship("UserPOIAssignment", back_populates="user", cascade="all, delete-orphan")


# --- POIs ---
class POI(Base):
    __tablename__ = "pois"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    wkt_geometry: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assignments = relationship("UserPOIAssignment", back_populates="poi", cascade="all, delete-orphan")


Index("idx_pois_category", POI.category)


# --- Asignaciones usuario<->POI ---
class UserPOIAssignment(Base):
    __tablename__ = "user_poi_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    poi_id: Mapped[int] = mapped_column(ForeignKey("pois.id"), index=True, nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    visited: Mapped[bool] = mapped_column(Boolean, default=False)
    visited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="assignments")
    poi = relationship("POI", back_populates="assignments")

    __table_args__ = (
        UniqueConstraint("user_id", "poi_id", name="uq_user_poi"),
    )


# --- Survey reports ---
class SurveyReport(Base):
    __tablename__ = "survey_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    option: Mapped[str] = mapped_column(String(80), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    wkt_point: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# --- Tracking pasivo ---
class UserTracking(Base):
    __tablename__ = "user_tracking"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    wkt_point: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


Index("idx_user_tracking_user_time", UserTracking.user_id, UserTracking.timestamp)
