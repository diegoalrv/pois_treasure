from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import POI

router = APIRouter(prefix="/pois", tags=["POIs"])

@router.get("/")
def list_pois(db: Session = Depends(get_db)):
    return [
        {"id": p.id, "name": p.name, "wkt_geometry": p.wkt_geometry}
        for p in db.query(POI).all()
    ]
