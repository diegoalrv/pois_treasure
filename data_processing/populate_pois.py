import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import geopandas as gpd
import warnings
warnings.filterwarnings("ignore")

def main():
    load_dotenv(dotenv_path="./.env.prod")

    # --- Configuración ---
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
    
    PARQUET_FILE = "data/pois_categorizados_filtrados_refinados.parquet"

    # --- Leer archivo ---
    print("📥 Cargando POIs...")
    gdf = gpd.read_parquet(PARQUET_FILE)
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        gdf.set_crs("EPSG:4326", inplace=True, allow_override=True)
    gdf_ = gdf[gdf['category'].notna()].copy()
    gdf_points = gdf_[gdf_.geometry.type == 'Point'].copy()
    gdf_polygons = gdf_[gdf_.geometry.type.isin(['Polygon', 'MultiPolygon'])].copy()
    gdf_polygons['geometry'] = gdf_polygons.centroid
    gdf = pd.concat([gdf_points, gdf_polygons], ignore_index=True)
    gdf = gpd.GeoDataFrame(gdf, geometry='geometry', crs=gdf.crs)
    print(gdf.head())

    print("✅ Archivo leído. Primeras filas:")

    gdf["geometry"] = gdf["geometry"].apply(lambda g: g.wkt)
    # --- Crear/asegurar columna name ---
    if "name" not in gdf.columns:
        # intenta usar alguna columna alternativa
        for alt in ["Name", "NAME", "addr:full", "brand"]:
            if alt in gdf.columns:
                gdf["name"] = gdf[alt]
                break
        else:
            # Si no hay ninguna, creamos name vacío
            gdf["name"] = None

    # Reemplazar NaN/None por texto
    gdf["name"] = gdf["name"].fillna("Unnamed POI").astype(str).str.strip()


    export_cols = ['name', 'category', 'geometry']
    gdf_export = gdf[export_cols]
    gdf_export.rename(columns={'geometry': 'wkt_geometry'}, inplace=True)
    gdf["category"] = gdf["category"].fillna("unknown").astype(str).str.strip()
    
    # --- Conectar y cargar ---
    print(f"🔗 Conectando a Postgres...")
    engine = create_engine(DATABASE_URL)

    print("🚀 Insertando datos en la tabla 'pois'...")
    gdf_export.to_sql("pois", engine, if_exists="append", index=False)

    print("✅ Carga completa!")

if __name__ == "__main__":
    main()
