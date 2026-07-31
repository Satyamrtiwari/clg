from fastapi import APIRouter
from app.api.v1 import auth, users, categories, menu, orders, settings, analytics, upload, websockets

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(menu.router)
api_router.include_router(orders.router)
api_router.include_router(settings.router)
api_router.include_router(analytics.router)
api_router.include_router(upload.router)
api_router.include_router(websockets.router)
