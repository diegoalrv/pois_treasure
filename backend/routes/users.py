from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import schemas, models
import random

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/join", response_model=schemas.UserResponse)
def join_user(data: schemas.UserJoinRequest, db: Session = Depends(get_db)):
    """
    Endpoint llamado desde el frontend cuando el usuario entra vía QR:
    - Recibe: {username: "pepe", profile: "student"}
    - Crea un usuario con ese profile y le asigna POIs aleatorios según sus reglas.
    """
    # 1️⃣ Validar si username ya existe
    existing = db.query(models.User).filter(models.User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")

    # 2️⃣ Buscar el perfil por su nombre (name es unique/index)
    profile = db.query(models.Profile).filter(models.Profile.name == data.profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Perfil '{data.profile}' no encontrado")

    # 3️⃣ Crear usuario
    user = models.User(username=data.username, profile=profile)
    db.add(user)
    db.flush()  # obtiene user.id sin commitear aún

    # 4️⃣ Asignar POIs aleatorios según las reglas
    assigned_pois = []
    rules = profile.rules or {}
    for category, count in rules.items():
        if count > 0:
            pois = db.query(models.POI).filter(models.POI.category == category).all()
            if pois:
                sample = random.sample(pois, min(count, len(pois)))
                for poi in sample:
                    db.add(models.UserPOIAssignment(user_id=user.id, poi_id=poi.id))
                    assigned_pois.append(poi.id)

    db.commit()
    return schemas.UserResponse(
        id=user.id,
        username=user.username,
        uuid=user.uuid,        # 🔥 devolvemos el uuid generado
        profile=profile.name,
        assigned_pois=assigned_pois,
    )


@router.get("/{user_id}/assignments", response_model=list[schemas.AssignmentOut])
def get_assignments(user_id: int, db: Session = Depends(get_db)):
    """
    Devuelve todos los POIs asignados a un usuario con su estado de visita.
    """
    rows = (
        db.query(models.UserPOIAssignment, models.POI)
        .join(models.POI, models.POI.id == models.UserPOIAssignment.poi_id)
        .filter(models.UserPOIAssignment.user_id == user_id)
        .all()
    )

    return [
        schemas.AssignmentOut(
            poi=schemas.POIOut.model_validate(poi),
            visited=ua.visited,
            visited_at=ua.visited_at.isoformat() if ua.visited_at else None,
        )
        for ua, poi in rows
    ]


@router.post("/{user_id}/visit")
def mark_visit(user_id: int, body: schemas.VisitMarkIn, db: Session = Depends(get_db)):
    """
    Marca un POI como visitado o no visitado para un usuario.
    """
    ua = (
        db.query(models.UserPOIAssignment)
        .filter_by(user_id=user_id, poi_id=body.poi_id)
        .first()
    )
    if not ua:
        raise HTTPException(status_code=404, detail="Assignment not found")

    ua.visited = body.visited
    ua.visited_at = func.now() if body.visited else None
    db.commit()
    return {"ok": True}
