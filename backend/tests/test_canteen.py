import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_full_canteen_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Cashier
        login_res = await ac.post("/api/v1/auth/login", json={
            "username": "cashier",
            "password": "cashier123"
        })
        assert login_res.status_code == 200
        cashier_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {cashier_token}"}

        # 2. Get Menu Items
        menu_res = await ac.get("/api/v1/menu")
        assert menu_res.status_code == 200
        items = menu_res.json()
        assert len(items) > 0
        first_item = items[0]

        # 3. Create Order 1
        order1_res = await ac.post("/api/v1/orders", json={
            "customer_name": "Alex Johnson",
            "items": [{"menu_item_id": first_item["id"], "quantity": 2}],
            "payment_method": "CASH"
        }, headers=headers)
        assert order1_res.status_code == 201
        order1_data = order1_res.json()
        assert order1_data["daily_order_number"] is not None
        assert order1_data["status"] == "PREPARING"
        assert order1_data["customer_name"] == "Alex Johnson"

        # 4. Create Order 2
        order2_res = await ac.post("/api/v1/orders", json={
            "customer_name": "Sarah Connor",
            "items": [{"menu_item_id": first_item["id"], "quantity": 1}],
            "payment_method": "UPI"
        }, headers=headers)
        assert order2_res.status_code == 201
        order2_data = order2_res.json()
        assert order2_data["daily_order_number"] is not None

        # 5. Check Customer Display View (Public Endpoint)
        display_res = await ac.get("/api/v1/orders/display")
        assert display_res.status_code == 200
        display_orders = display_res.json()
        assert len(display_orders) >= 2

        # 6. Mark Order 1 as READY
        update_res = await ac.patch(
            f"/api/v1/orders/{order1_data['id']}/status",
            json={"status": "READY"},
            headers=headers
        )
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "READY"

        # 7. Check Public System Settings Config
        config_res = await ac.get("/api/v1/settings/config")
        assert config_res.status_code == 200
        config_data = config_res.json()
        assert config_data["canteen_name"] == "Campus Smart Canteen"
