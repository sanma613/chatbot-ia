import os

from dotenv import load_dotenv
from supabase import Client, create_client


class Config:
    load_dotenv()  # Cargar variables de entorno desde el archivo .env

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

    # Image upload limits
    MAX_IMAGE_SIZE_MB = 10  # 10MB max
    ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "image/gif",
    ]


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"
    DATABASE_URI = "sqlite:///development.db"  # Ejemplo de URI para SQLite


class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"
    DATABASE_URI = os.getenv("DATABASE_URI")  # URI de la base de datos para producción


SUPABASE_URL = Config.SUPABASE_URL
SUPABASE_KEY = Config.SUPABASE_SERVICE_ROLE_KEY

assert SUPABASE_URL is not None
assert SUPABASE_KEY is not None

supabase_: Client = create_client(
    SUPABASE_URL, SUPABASE_KEY
)  # Inicializar el cliente de Supabase con la URL y la clave de servicio


def get_supabase() -> Client:
    """
    Dependency function to get Supabase client
    Returns the initialized Supabase client
    """
    return supabase_
