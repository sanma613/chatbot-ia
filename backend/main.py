import logging
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
)
from app.services.scheduler_service import start_scheduler, stop_scheduler

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

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.8:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(chatbot_routes.router, prefix="/chatbot")
app.include_router(faq_routes.router, prefix="/faq")
app.include_router(conversation_routes.router, prefix="/conversations")
app.include_router(activity_routes.router, prefix="/activities")
app.include_router(notification_routes.router, prefix="/notifications")
app.include_router(email_routes.router, prefix="/email")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
