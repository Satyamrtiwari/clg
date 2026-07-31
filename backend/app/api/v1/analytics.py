from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.schemas.analytics import AnalyticsDashboard
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboard)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    return await AnalyticsService.get_dashboard_analytics(db)
