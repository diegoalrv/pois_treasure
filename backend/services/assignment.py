from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict
from models import POI, UserPOIAssignment, Profile

def assign_pois_for_user(db: Session, user_id: int, rules: Dict[str, int]) -> None:
    """Asigna POIs aleatoriamente por categoría según las reglas del profile.
       Idempotente: no duplica si ya existe (uconstraint)."""
    for category, needed in rules.items():
        if needed <= 0:
            continue
        # POIs ya asignados de esa categoría
        existing_ids = {
            r.poi_id for r in db.query(UserPOIAssignment)
                                 .join(POI, POI.id == UserPOIAssignment.poi_id)
                                 .filter(UserPOIAssignment.user_id == user_id,
                                         POI.category == category)
        }

        # Tomar más si faltan
        missing = max(0, needed - len(existing_ids))
        if missing == 0:
            continue

        # Sample aleatorio en DB
        candidates = (
            db.query(POI.id)
              .filter(POI.category == category, ~POI.id.in_(existing_ids))
              .order_by(func.random())
              .limit(missing)
              .all()
        )
        for (poi_id,) in candidates:
            db.add(UserPOIAssignment(user_id=user_id, poi_id=poi_id))

    db.commit()
