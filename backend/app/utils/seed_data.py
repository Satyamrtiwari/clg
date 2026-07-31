from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User, Role
from app.models.menu import Category, MenuItem
from app.models.setting import Setting
from app.core.security import get_password_hash

async def seed_initial_data(db: AsyncSession):
    # 1. Seed Roles
    admin_role_stmt = select(Role).where(Role.name == "ADMIN")
    res = await db.execute(admin_role_stmt)
    admin_role = res.scalar_one_or_none()

    if not admin_role:
        admin_role = Role(
            name="ADMIN",
            description="Full Canteen Owner & Manager permissions",
            permissions={"all": True}
        )
        db.add(admin_role)

    cashier_role_stmt = select(Role).where(Role.name == "CASHIER")
    res = await db.execute(cashier_role_stmt)
    cashier_role = res.scalar_one_or_none()

    if not cashier_role:
        cashier_role = Role(
            name="CASHIER",
            description="Cashier POS permissions",
            permissions={
                "create_order": True,
                "update_order_status": True,
                "cancel_order": True,
                "edit_order": True,
                "view_menu": True
            }
        )
        db.add(cashier_role)

    await db.flush()

    # 2. Seed Default Accounts
    admin_user_stmt = select(User).where(User.username == "admin")
    res = await db.execute(admin_user_stmt)
    if not res.scalar_one_or_none():
        admin_user = User(
            username="admin",
            email="admin@canteen.com",
            full_name="Canteen Manager",
            hashed_password=get_password_hash("admin123"),
            role_id=admin_role.id,
            is_active=True
        )
        db.add(admin_user)

    cashier_user_stmt = select(User).where(User.username == "cashier")
    res = await db.execute(cashier_user_stmt)
    if not res.scalar_one_or_none():
        cashier_user = User(
            username="cashier",
            email="cashier@canteen.com",
            full_name="Primary Cashier",
            hashed_password=get_password_hash("cashier123"),
            role_id=cashier_role.id,
            is_active=True
        )
        db.add(cashier_user)

    # 3. Seed Categories & Menu Items if empty
    cat_stmt = select(Category)
    res = await db.execute(cat_stmt)
    if not res.scalars().all():
        bev = Category(name="Beverages", description="Hot & cold drinks", display_order=1)
        snack = Category(name="Snacks & Quick Bites", description="Crispy snacks & fast food", display_order=2)
        mains = Category(name="South & North Mains", description="Full meals & dosas", display_order=3)
        des = Category(name="Desserts & Sweets", description="Sweet treats", display_order=4)

        db.add_all([bev, snack, mains, des])
        await db.flush()

        items = [
            MenuItem(
                category_id=bev.id,
                name="Masala Chai",
                description="Hot freshly brewed aromatic spice tea",
                price=20.0,
                is_available=True,
                is_todays_special=True,
            ),
            MenuItem(
                category_id=bev.id,
                name="Cold Coffee with Ice Cream",
                description="Rich espresso blended with thick milk and vanilla ice cream",
                price=75.0,
                is_available=True,
                is_todays_special=True,
            ),
            MenuItem(
                category_id=bev.id,
                name="Fresh Lime Soda",
                description="Refreshing fizzy lime soda with mint",
                price=40.0,
                is_available=True,
                is_todays_special=False,
            ),
            MenuItem(
                category_id=snack.id,
                name="Crispy Samosa (2 pcs)",
                description="Spiced potato stuffed crispy pastry with mint chutney",
                price=30.0,
                is_available=True,
                is_todays_special=True,
            ),
            MenuItem(
                category_id=snack.id,
                name="Paneer Bread Pakora",
                description="Stuffed cottage cheese deep fried bread snack",
                price=35.0,
                is_available=True,
                is_todays_special=False,
            ),
            MenuItem(
                category_id=mains.id,
                name="Masala Dosa",
                description="Crispy rice crepe filled with spiced potato masala",
                price=80.0,
                is_available=True,
                is_todays_special=True,
            ),
            MenuItem(
                category_id=mains.id,
                name="Special Veg Thali",
                description="Paneer butter masala, dal fry, 3 rotis, rice & sweet",
                price=130.0,
                is_available=True,
                is_todays_special=True,
            ),
            MenuItem(
                category_id=des.id,
                name="Gulab Jamun (2 pcs)",
                description="Warm soft milk solid dumplings in sugar syrup",
                price=40.0,
                is_available=True,
                is_todays_special=False,
            ),
        ]
        db.add_all(items)

    # 4. Seed Settings if empty
    setting_stmt = select(Setting)
    res = await db.execute(setting_stmt)
    if not res.scalars().all():
        default_settings = [
            Setting(
                key="canteen_name",
                value={"value": "Campus Smart Canteen"},
                category="general",
                description="Canteen Branding Name"
            ),
            Setting(
                key="canteen_tagline",
                value={"value": "Fresh. Fast. Delicious."},
                category="general",
                description="Canteen Subtitle Tagline"
            ),
            Setting(
                key="currency_symbol",
                value={"value": "₹"},
                category="general",
                description="Currency symbol used across POS & displays"
            ),
            Setting(
                key="tax_rate_percent",
                value={"value": 5.0},
                category="order",
                description="GST / Tax percentage added to orders"
            ),
            Setting(
                key="auto_remove_minutes",
                value={"value": 5},
                category="order",
                description="Auto-remove ready orders from display after minutes"
            ),
            Setting(
                key="cashier_permissions",
                value={
                    "can_edit_menu": False,
                    "can_cancel_order": True,
                    "can_give_discount": True
                },
                category="cashier",
                description="Permissions granted to Cashier role"
            )
        ]
        db.add_all(default_settings)

    await db.commit()
