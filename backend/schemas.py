from pydantic import BaseModel, Field
from typing import Dict, List, Optional

# ---- Profiles ----
class ProfileCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rules: Dict[str, int] = Field(default_factory=dict)

class ProfileOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    rules: Dict[str, int]
    created_at: Optional[str] = None
    class Config: from_attributes = True

# ---- Users ----
class UserRegister(BaseModel):
    username: str
    profile_name: str

class UserJoinRequest(BaseModel):
    username: str
    profile: str  # nombre exacto del profile ("student", "elderly", etc.)

class UserOut(BaseModel):
    id: int
    username: str
    uuid: str
    profile_id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    uuid: str        # 🔥 ahora también se retorna
    profile: str
    assigned_pois: List[int]

# ---- POIs ----
class POIOut(BaseModel):
    id: int
    name: str
    category: str
    wkt_geometry: str
    class Config: from_attributes = True

# ---- Assignments ----
class AssignmentOut(BaseModel):
    poi: POIOut
    visited: bool
    visited_at: Optional[str] = None

class VisitMarkIn(BaseModel):
    poi_id: int
    visited: bool = True

# ---- Survey ----
class SurveyCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    option: str
    wkt_point: str
    photo_url: Optional[str] = None

# ---- Tracking ----
class TrackPoint(BaseModel):
    user_id: int
    wkt_point: str
    timestamp: Optional[str] = None  # client clock opcional

class TrackBatch(BaseModel):
    points: List[TrackPoint]
