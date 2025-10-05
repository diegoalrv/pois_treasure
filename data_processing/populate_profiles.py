import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    # --- Cargar variables de entorno ---
    load_dotenv(dotenv_path="./.env.prod")

    DATABASE_URL = os.getenv("DATABASE_URL", None)
    if DATABASE_URL is None:
        # Construir la URL de la base de datos desde variables individuales
        POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
        POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", None)
        # POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
        POSTGRES_HOST = "localhost"
        POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
        POSTGRES_DB = os.getenv("POSTGRES_DB", "poisdb")

        DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    
    # --- Leer JSON de perfiles ---
    json_path = "data/profiles_pois.json"
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"No se encontró el archivo {json_path}")
    
    with open(json_path, "r", encoding="utf-8") as f:
        profiles = json.load(f)

    print(f"📥 Cargando {len(profiles)} perfiles desde {json_path}...")

    # --- Insertar en la base ---
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        print("🚀 Insertando perfiles...")
        for p in profiles:
            # Insert or update
            conn.execute(
                text("""
                    INSERT INTO profiles (name, description, rules)
                    VALUES (:name, :description, :rules)
                    ON CONFLICT (name) DO UPDATE
                    SET description = EXCLUDED.description,
                        rules = EXCLUDED.rules
                """),
                {
                    "name": p.get("name", ""),
                    "description": p.get("description", ""),
                    "rules": json.dumps(p.get("poi_distribution", {})),
                },
            )
        print("✅ Perfiles insertados o actualizados correctamente.")


if __name__ == "__main__":
    main()
