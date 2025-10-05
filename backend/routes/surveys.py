from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from typing import Optional
from services.storage import upload_survey_photo

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
    
    # Validar que el usuario existe
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado")
    
    # Validar categoría
    valid_categories = [
        "infrastructure", 
        "user_experience", 
        "vehicles", 
        "regulation", 
        "equity", 
        "other"
    ]
    if category not in valid_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"Categoría inválida. Use: {', '.join(valid_categories)}"
        )
    
    # Subir foto a Cloudinary si existe
    photo_url = None
    if photo:
        print(f"📷 Procesando foto: {photo.filename} ({photo.content_type})")
        photo_url = await upload_survey_photo(photo, user_id)
        
        if not photo_url:
            print("⚠️ No se pudo subir la foto, continuando sin ella")
    
    # Crear registro en la base de datos
    survey = models.SurveyReport(
        user_id=user_id,
        title=f"{category.replace('_', ' ').title()} observation",
        description=description,
        option=category,
        wkt_point=wkt_point,
        photo_url=photo_url
    )
    
    db.add(survey)
    db.commit()
    db.refresh(survey)
    
    print(f"✅ Encuesta guardada: ID={survey.id}, User={user_id}, Photo={'Sí' if photo_url else 'No'}")
    
    return {
        "ok": True,
        "id": survey.id,
        "message": "Survey submitted successfully",
        "photo_uploaded": photo_url is not None,
        "photo_url": photo_url
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


@router.get("/all")
def get_all_surveys(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las encuestas (para administración).
    """
    surveys = db.query(models.SurveyReport)\
        .order_by(models.SurveyReport.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return surveys