#!/usr/bin/env python3
import os
import random
import string
import requests
from dotenv import load_dotenv

def random_username(prefix: str) -> str:
    """Genera un username aleatorio con un prefijo."""
    return f"{prefix}_{''.join(random.choices(string.ascii_lowercase + string.digits, k=5))}"

def main():
    # --- Configuración ---
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ENV_PATH = os.path.join(BASE_DIR, "..", "backend", ".env_local")
    load_dotenv(ENV_PATH)

    # Dirección del backend (puedes cambiarla si está desplegado en otro host)
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
    USERS_JOIN_URL = f"{BACKEND_URL}/users/join"

    # --- Perfiles disponibles ---
    profiles = [
        "elderly",
        "student",
        "office_worker",
        "tourist",
        "families",
        "shop_owner"
    ]

    print("🚀 Creando usuarios de prueba y asignando POIs...")
    for profile in profiles:
        for _ in range(3):
            username = random_username(profile)
            payload = {
                "username": username,
                "profile": profile
            }
            try:
                resp = requests.post(USERS_JOIN_URL, json=payload, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"✅ Usuario '{data['username']}' creado con ID {data['id']} y {len(data.get('assigned_pois', []))} POIs asignados.")
                else:
                    print(f"⚠️ Error creando usuario '{username}' para perfil '{profile}': {resp.status_code} - {resp.text}")
            except requests.RequestException as e:
                print(f"❌ Error de conexión creando usuario '{username}' para perfil '{profile}': {e}")

    print("🎯 Creación de usuarios de prueba completada.")

if __name__ == "__main__":
    main()
