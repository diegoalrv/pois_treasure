#!/bin/bash

# Script para poblar la base de datos en Railway
# Uso: ./setup_railway_db.sh

echo "🚂 Configurando base de datos en Railway..."

# Verificar que Railway CLI esté instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo "📦 Instálalo con: npm i -g @railway/cli"
    exit 1
fi

# Verificar que estemos linkeados a un proyecto
if ! railway status &> /dev/null; then
    echo "❌ No estás conectado a un proyecto de Railway"
    echo "🔗 Ejecuta: railway link"
    exit 1
fi

echo "✅ Railway CLI detectado"
echo "📊 Poblando base de datos..."

# Ejecutar scripts de población
cd backend

echo "1️⃣ Poblando perfiles..."
railway run python ../data_processing/populate_profiles.py

echo "2️⃣ Poblando POIs..."
railway run python ../data_processing/populate_pois.py

echo "3️⃣ Creando usuarios de prueba..."
railway run python ../data_processing/populate_users.py

echo "✅ ¡Base de datos poblada exitosamente!"
echo "🌐 Puedes verificar los datos en el dashboard de Railway"