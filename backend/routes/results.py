from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from datetime import datetime, timedelta
from typing import Optional
import models
import geopandas as gpd
from shapely import wkt

router = APIRouter(prefix="/results", tags=["Results"])


@router.get("/surveys/geojson")
def get_surveys_geojson(
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna todas las encuestas en formato GeoJSON con filtros opcionales.
    """
    query = db.query(models.SurveyReport)
    
    # Aplicar filtros
    if category:
        query = query.filter(models.SurveyReport.option == category)
    
    if start_date:
        query = query.filter(models.SurveyReport.created_at >= start_date)
    
    if end_date:
        query = query.filter(models.SurveyReport.created_at <= end_date)
    
    surveys = query.order_by(models.SurveyReport.created_at.desc()).all()
    
    if not surveys:
        return {"type": "FeatureCollection", "features": []}
    
    # Crear GeoDataFrame
    geometries = []
    ids = []
    titles = []
    descriptions = []
    categories = []
    photo_urls = []
    created_ats = []
    user_ids = []
    
    for survey in surveys:
        try:
            geom = wkt.loads(survey.wkt_point) if survey.wkt_point else None
            if geom is None:
                continue  # ⭐ Saltar puntos sin geometría
        except Exception as e:
            print(f"Error parsing geometry: {e}")
            continue
        
        geometries.append(geom)
        ids.append(survey.id)
        titles.append(survey.title or "")
        descriptions.append(survey.description or "")
        categories.append(survey.option or "other")
        photo_urls.append(survey.photo_url or "")
        created_ats.append(survey.created_at.isoformat() if survey.created_at else "")
        user_ids.append(survey.user_id)
    
    if not geometries:
        return {"type": "FeatureCollection", "features": []}
    
    gdf = gpd.GeoDataFrame(
        {
            "id": ids,
            "title": titles,
            "description": descriptions,
            "category": categories,
            "photo_url": photo_urls,
            "created_at": created_ats,
            "user_id": user_ids,
        },
        geometry=geometries,
        crs="EPSG:4326"
    )
    
    # ⭐ Retornar como string, igual que assignments_geojson
    return gdf.to_json()


@router.get("/tracking/geojson")
def get_tracking_geojson(
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 1000,  # ⭐ Limitar resultados para evitar sobrecarga
    db: Session = Depends(get_db)
):
    """
    Retorna puntos de tracking en formato GeoJSON con filtros opcionales.
    """
    query = db.query(models.UserTracking)
    
    if user_id:
        query = query.filter(models.UserTracking.user_id == user_id)
    
    if start_date:
        query = query.filter(models.UserTracking.timestamp >= start_date)
    
    if end_date:
        query = query.filter(models.UserTracking.timestamp <= end_date)
    
    # ⭐ Ordenar y limitar
    points = query.order_by(models.UserTracking.timestamp.desc()).limit(limit).all()
    
    if not points:
        return {"type": "FeatureCollection", "features": []}
    
    geometries = []
    ids = []
    timestamps = []
    user_ids = []
    
    for point in points:
        try:
            geom = wkt.loads(point.wkt_point) if point.wkt_point else None
            if geom is None:
                continue  # ⭐ Saltar puntos sin geometría
        except Exception as e:
            print(f"Error parsing geometry: {e}")
            continue
        
        geometries.append(geom)
        ids.append(point.id)
        # ⭐ Manejar timestamps que puedan ser None
        timestamps.append(point.timestamp.isoformat() if point.timestamp else "")
        user_ids.append(point.user_id)
    
    if not geometries:
        return {"type": "FeatureCollection", "features": []}
    
    gdf = gpd.GeoDataFrame(
        {
            "id": ids,
            "timestamp": timestamps,
            "user_id": user_ids,
        },
        geometry=geometries,
        crs="EPSG:4326"
    )
    
    # ⭐ Retornar como string, igual que assignments_geojson
    return gdf.to_json()


@router.get("/stats")
def get_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna estadísticas generales del proyecto.
    """
    # Filtros de fecha
    survey_query = db.query(models.SurveyReport)
    tracking_query = db.query(models.UserTracking)
    
    if start_date:
        survey_query = survey_query.filter(models.SurveyReport.created_at >= start_date)
        tracking_query = tracking_query.filter(models.UserTracking.timestamp >= start_date)
    
    if end_date:
        survey_query = survey_query.filter(models.SurveyReport.created_at <= end_date)
        tracking_query = tracking_query.filter(models.UserTracking.timestamp <= end_date)
    
    # Contar encuestas por categoría
    category_stats = (
        db.query(
            models.SurveyReport.option,
            func.count(models.SurveyReport.id).label('count')
        )
        .group_by(models.SurveyReport.option)
        .all()
    )
    
    # Total de encuestas
    total_surveys = survey_query.count()
    
    # Total de puntos de tracking
    total_tracking_points = tracking_query.count()
    
    # Usuarios únicos
    unique_users = db.query(func.count(func.distinct(models.User.id))).scalar()
    
    # Usuarios con encuestas
    users_with_surveys = (
        db.query(func.count(func.distinct(models.SurveyReport.user_id)))
        .scalar()
    )
    
    # ⭐ Participación por perfil
    profile_participation = (
        db.query(
            models.Profile.name,
            func.count(func.distinct(models.User.id)).label('total_users'),
            func.count(func.distinct(models.SurveyReport.user_id)).label('users_with_surveys')
        )
        .outerjoin(models.User, models.User.profile_id == models.Profile.id)
        .outerjoin(models.SurveyReport, models.SurveyReport.user_id == models.User.id)
        .group_by(models.Profile.id, models.Profile.name)
        .all()
    )
    
    # ⭐ Encuestas por perfil
    surveys_by_profile = (
        db.query(
            models.Profile.name,
            func.count(models.SurveyReport.id).label('survey_count')
        )
        .join(models.User, models.User.profile_id == models.Profile.id)
        .join(models.SurveyReport, models.SurveyReport.user_id == models.User.id)
        .group_by(models.Profile.id, models.Profile.name)
        .all()
    )
    
    return {
        "total_surveys": total_surveys,
        "total_tracking_points": total_tracking_points,
        "unique_users": unique_users,
        "users_with_surveys": users_with_surveys,
        "surveys_by_category": [
            {"category": cat, "count": count}
            for cat, count in category_stats
        ],
        "profile_participation": [
            {
                "profile": name,
                "total_users": total or 0,
                "users_with_surveys": active or 0,
                "participation_rate": round((active / total * 100) if total > 0 else 0, 1)
            }
            for name, total, active in profile_participation
        ],
        "surveys_by_profile": [
            {"profile": name, "count": count}
            for name, count in surveys_by_profile
        ]
    }


@router.get("/heatmap")
def get_heatmap_data(
    type: str = Query("surveys", regex="^(surveys|tracking)$"),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna datos para generar un heatmap.
    Retorna array de [longitude, latitude, weight]
    """
    if type == "surveys":
        query = db.query(models.SurveyReport)
        if category:
            query = query.filter(models.SurveyReport.option == category)
        items = query.all()
        wkt_field = "wkt_point"
    else:  # tracking
        items = db.query(models.UserTracking).all()
        wkt_field = "wkt_point"
    
    points = []
    for item in items:
        try:
            geom = wkt.loads(getattr(item, wkt_field))
            # [lng, lat, weight]
            points.append([geom.x, geom.y, 1])
        except:
            continue
    
    return {"points": points}