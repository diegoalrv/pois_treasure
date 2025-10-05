from fastapi import APIRouter, Depends, File, UploadFile, Form
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import Optional

router = APIRouter(prefix="/surveys", tags=["Surveys"])

@router.post("/")
async def create_survey(
    user_id: int = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    wkt_point: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint para recibir encuestas de movilidad con ubicación GPS.
    Acepta FormData para manejar foto opcional.
    """
    
    # TODO: Manejar upload de foto a S3/storage
    photo_url = None
    if photo:
        # Aquí guardarías la foto en tu storage
        # photo_url = await upload_to_storage(photo)
        print(f"📷 Foto recibida: {photo.filename}")
    
    # Crear registro en la base de datos
    survey = models.SurveyReport(
        user_id=user_id,
        title=f"{category} observation",  # Generamos un título automático
        description=description,
        option=category,
        wkt_point=wkt_point,
        photo_url=photo_url
    )
    
    db.add(survey)
    db.commit()
    db.refresh(survey)
    
    return {
        "ok": True,
        "id": survey.id,
        "message": "Survey submitted successfully"
    }


@router.get("/user/{user_id}")
def get_user_surveys(user_id: int, db: Session = Depends(get_db)):
    """
    Obtiene todas las encuestas de un usuario.
    """
    surveys = db.query(models.SurveyReport).filter(
        models.SurveyReport.user_id == user_id
    ).order_by(models.SurveyReport.created_at.desc()).all()
    
    return surveys