from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/surveys", tags=["Surveys"])

@router.post("/")
def create_survey(body: schemas.SurveyCreate, db: Session = Depends(get_db)):
    s = models.SurveyReport(
        user_id=body.user_id,
        title=body.title,
        description=body.description,
        option=body.option,
        wkt_point=body.wkt_point,
        photo_url=body.photo_url
    )
    db.add(s); db.commit()
    return {"ok": True, "id": s.id}
