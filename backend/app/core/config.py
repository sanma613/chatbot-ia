import os

from dotenv import load_dotenv
from supabase import Client, create_client


class Config:
    load_dotenv()  # Cargar variables de entorno desde el archivo .env

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


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
