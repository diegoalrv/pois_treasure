from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/pois", tags=["POIs"])

@router.get("/", response_model=list[schemas.POIOut])
def list_pois(db: Session = Depends(get_db)):
    return db.query(models.POI).all()
