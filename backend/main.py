import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routes import (
    auth,
    chatbot_routes,
    faq_routes,
    conversation_routes,
    activity_routes,
    notification_routes,
    email_routes,
    agent_routes,
    websocket_routes,
    message_routes,
    quick_solutions_routes,
)
from app.services.scheduler_service import start_scheduler, stop_scheduler
from app.core.config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application
    Handles startup and shutdown events
    """
    # Startup: Start the reminder scheduler
    start_scheduler()
    yield
    # Shutdown: Stop the scheduler
    stop_scheduler()


app = FastAPI(lifespan=lifespan)

# Configure CORS origins
frontend_url = Config.FRONTEND_URL or "http://localhost:3000"
is_production = Config.ENVIRONMENT == "production"

# In production, use the specific frontend URL from environment
# In development, allow localhost variations
if is_production:
    origins = [
        frontend_url,
        frontend_url.replace("https://", "http://"),  # Allow both http and https
    ]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.8:3000",
    ]

logging.info(f"🌍 Environment: {Config.ENVIRONMENT}")
logging.info(f"🔗 Allowed CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose headers for frontend
)

app.include_router(auth.router, prefix="/auth")
app.include_router(chatbot_routes.router, prefix="/chatbot")
app.include_router(faq_routes.router, prefix="/faq")
app.include_router(conversation_routes.router, prefix="/conversations")
app.include_router(activity_routes.router, prefix="/activities")
app.include_router(notification_routes.router, prefix="/notifications")
app.include_router(email_routes.router, prefix="/email")
app.include_router(agent_routes.router, prefix="/agent")
app.include_router(message_routes.router)  # Message routes with images
app.include_router(websocket_routes.router)  # WebSocket routes
app.include_router(quick_solutions_routes.router)  # Quick solutions/knowledge base


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
