from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/tracking", tags=["Tracking"])

@router.post("/batch")
def ingest_batch(body: schemas.TrackBatch, db: Session = Depends(get_db)):
    for p in body.points:
        db.add(models.UserTracking(user_id=p.user_id, wkt_point=p.wkt_point))
        # si quieres usar timestamp del cliente, cámbialo aquí
    db.commit()
    return {"ok": True, "count": len(body.points)}
