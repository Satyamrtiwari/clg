import pytest
import pytest_asyncio
from app.core.database import engine, Base, AsyncSessionLocal
from app.utils.seed_data import seed_initial_data

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
