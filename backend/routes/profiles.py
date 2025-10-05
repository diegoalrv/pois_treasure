from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/profiles", tags=["Profiles"])

@router.post("/", response_model=schemas.ProfileOut)
def create_profile(body: schemas.ProfileCreate, db: Session = Depends(get_db)):
    if db.query(models.Profile).filter_by(slug=body.slug).first():
        raise HTTPException(status_code=409, detail="Profile slug exists")
    p = models.Profile(slug=body.slug, name=body.name, description=body.description, rules=body.rules)
    db.add(p); db.commit(); db.refresh(p)
    return p

@router.get("/", response_model=list[schemas.ProfileOut])
def list_profiles(db: Session = Depends(get_db)):
    return db.query(models.Profile).all()
