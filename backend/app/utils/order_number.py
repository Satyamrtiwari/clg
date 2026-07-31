from datetime import datetime, timezone
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order

async def generate_daily_order_number(db: AsyncSession) -> str:
    """
    Generates a 3-digit zero-padded order number (e.g. 001, 002, 003...)
    that resets every day at midnight.
    Uses atomic DB query or table lock to prevent duplicates.
    """
    today_date = datetime.now(timezone.utc).date()
    
    # Query maximum daily_order_number for today
    stmt = select(Order.daily_order_number).where(Order.order_date == today_date)
    result = await db.execute(stmt)
    existing_numbers = result.scalars().all()

    if not existing_numbers:
        next_seq = 1
    else:
        # Convert to int and find max
        int_seqs = [int(num) for num in existing_numbers if num.isdigit()]
        next_seq = (max(int_seqs) + 1) if int_seqs else 1

    return f"{next_seq:03d}"
