import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from typing import Optional

# Configurar Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

async def upload_survey_photo(photo: UploadFile, user_id: int) -> Optional[str]:
    """
    Sube una foto de encuesta a Cloudinary y retorna la URL pública.
    
    Args:
        photo: Archivo de imagen
        user_id: ID del usuario (para organizar en carpetas)
    
    Returns:
        URL pública de la imagen o None si falla
    """
    if not photo:
        return None
    
    try:
        # Leer el contenido del archivo
        contents = await photo.read()
        
        # Subir a Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=f"mobility_surveys/user_{user_id}",
            resource_type="image",
            allowed_formats=["jpg", "jpeg", "png", "gif", "webp"],
            transformation=[
                {'width': 1200, 'crop': 'limit'},  # Limitar ancho máximo
                {'quality': 'auto:good'}  # Optimización automática
            ]
        )
        
        return result.get('secure_url')
        
    except Exception as e:
        print(f"❌ Error subiendo imagen: {e}")
        return None