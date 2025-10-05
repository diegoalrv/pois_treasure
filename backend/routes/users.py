from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import schemas, models
import random
import geopandas as gpd
from shapely import wkt

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/join", response_model=schemas.UserResponse)
def join_user(data: schemas.UserJoinRequest, db: Session = Depends(get_db)):
    """
    Endpoint llamado desde el frontend cuando el usuario entra vía QR:
    - Recibe: {username: "pepe", profile: "student"}
    - Si el usuario ya existe, lo devuelve.
    - Si no existe, lo crea y le asigna POIs aleatorios según las reglas de su perfil.
    """
    # 🔎 Buscar si ya existe el usuario
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if user:
        # Si ya existe devolvemos sus asignaciones
        assigned = (
            db.query(models.UserPOIAssignment.poi_id)
            .filter(models.UserPOIAssignment.user_id == user.id)
            .all()
        )
        assigned_pois = [a.poi_id for a in assigned]
        return schemas.UserResponse(
            id=user.id,
            username=user.username,
            profile=user.profile.name,
            uuid=user.uuid,                   # ✅
            assigned_pois=assigned_pois,
        )

    # 🔎 Buscar el perfil por nombre
    profile = db.query(models.Profile).filter(models.Profile.name == data.profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Perfil '{data.profile}' no encontrado")

    # ➕ Crear usuario
    user = models.User(username=data.username, profile=profile)
    db.add(user)
    db.flush()  # obtiene user.id antes de commitear

    # 🎲 Asignar POIs aleatorios según reglas
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
        profile=profile.name,
        uuid=user.uuid,                   # ✅
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


@router.get("/{user_id}/assignments_geojson")
def get_assignments_geojson(user_id: int, db: Session = Depends(get_db)):
    """
    Devuelve todos los POIs asignados a un usuario en formato GeoJSON.
    """
    # Obtenemos la info unida de asignaciones y POIs
    rows = (
        db.query(models.UserPOIAssignment, models.POI)
        .join(models.POI, models.POI.id == models.UserPOIAssignment.poi_id)
        .filter(models.UserPOIAssignment.user_id == user_id)
        .all()
    )

    if not rows:
        return {"type": "FeatureCollection", "features": []}

    # Creamos listas para las columnas del GeoDataFrame
    geometries = []
    ids = []
    names = []
    categories = []
    visited = []
    visited_at = []

    for ua, poi in rows:
        try:
            geom = wkt.loads(poi.wkt_geometry) if poi.wkt_geometry else None
        except Exception:
            geom = None

        geometries.append(geom)
        ids.append(poi.id)
        names.append(poi.name)
        categories.append(poi.category)
        visited.append(ua.visited)
        visited_at.append(ua.visited_at.isoformat() if ua.visited_at else None)

    gdf = gpd.GeoDataFrame(
        {
            "id": ids,
            "name": names,
            "category": categories,
            "visited": visited,
            "visited_at": visited_at,
        },
        geometry=geometries,
        crs="EPSG:4326"  # asegúrate que tus coordenadas estén en lon/lat
    )

    # Usamos to_json para obtener un GeoJSON válido
    return gdf.to_json()


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
