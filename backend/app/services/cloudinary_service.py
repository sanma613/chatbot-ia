"""
Servicio para gestionar la subida de imágenes a Cloudinary
"""

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from app.core.config import Config
import logging

logger = logging.getLogger(__name__)

# Configurar Cloudinary
cloudinary.config(
    cloud_name=Config.CLOUDINARY_CLOUD_NAME,
    api_key=Config.CLOUDINARY_API_KEY,
    api_secret=Config.CLOUDINARY_API_SECRET,
    secure=True,
)


class CloudinaryService:
    """Servicio para manejar uploads a Cloudinary"""

    @staticmethod
    async def upload_image(
        file: UploadFile, folder: str = "chat_images", max_size_mb: int = None
    ) -> str:
        """
        Sube una imagen a Cloudinary y retorna la URL

        Args:
            file: Archivo de imagen a subir
            folder: Carpeta en Cloudinary donde guardar (default: 'chat_images')
            max_size_mb: Tamaño máximo permitido en MB

        Returns:
            str: URL segura de la imagen en Cloudinary

        Raises:
            HTTPException: Si hay error en la subida o validación
        """
        try:
            # Validar tipo de archivo
            if file.content_type not in Config.ALLOWED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo de archivo no permitido. Permitidos: {', '.join(Config.ALLOWED_IMAGE_TYPES)}",
                )

            # Validar tamaño de archivo
            max_size = max_size_mb or Config.MAX_IMAGE_SIZE_MB
            contents = await file.read()
            file_size_mb = len(contents) / (1024 * 1024)

            if file_size_mb > max_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"Archivo demasiado grande. Tamaño máximo: {max_size}MB",
                )

            # Subir a Cloudinary
            upload_result = cloudinary.uploader.upload(
                contents,
                folder=folder,
                resource_type="image",
                transformation=[
                    {
                        "width": 1200,
                        "height": 1200,
                        "crop": "limit",
                    },  # Limitar tamaño máximo
                    {"quality": "auto:good"},  # Optimizar calidad
                    {
                        "fetch_format": "auto"
                    },  # Formato automático (WebP si es soportado)
                ],
            )

            # Retornar URL segura
            image_url = upload_result.get("secure_url")
            logger.info(f"Imagen subida exitosamente: {image_url}")

            return image_url

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error subiendo imagen a Cloudinary: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Error al subir imagen: {str(e)}"
            )

    @staticmethod
    async def delete_image(image_url: str) -> bool:
        """
        Elimina una imagen de Cloudinary usando su URL

        Args:
            image_url: URL de la imagen a eliminar

        Returns:
            bool: True si se eliminó exitosamente
        """
        try:
            # Extraer public_id de la URL
            # Ejemplo URL: https://res.cloudinary.com/cloud_name/image/upload/v123456/chat_images/abc123.jpg
            # public_id sería: chat_images/abc123

            parts = image_url.split("/")
            if "upload" in parts:
                upload_index = parts.index("upload")
                # Obtener todo después de 'upload/vXXXXXX/'
                public_id_parts = parts[upload_index + 2 :]  # Saltar 'upload' y version
                public_id = "/".join(public_id_parts).rsplit(".", 1)[
                    0
                ]  # Remover extensión

                result = cloudinary.uploader.destroy(public_id)
                logger.info(f"Imagen eliminada: {public_id}, resultado: {result}")
                return result.get("result") == "ok"

            return False

        except Exception as e:
            logger.error(f"Error eliminando imagen de Cloudinary: {str(e)}")
            return False


cloudinary_service = CloudinaryService()
