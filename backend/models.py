from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    profile = Column(String)

class POI(Base):
    __tablename__ = "pois"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String, default="")
    wkt_geometry = Column(String)
