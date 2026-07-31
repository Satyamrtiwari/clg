# Smart Canteen POS & Live Order Display System 🍔🥤

A commercial-grade, production-ready **Smart Canteen Order Management & TV Display System** built for modern college canteens, cafes, and quick-service restaurant environments.

Inspired by top restaurant POS systems (Burger King, McDonald's, Toast POS, Square POS), this application is designed for **single-cashier operation with zero learning curve**, real-time TV display screens, and view-only customer QR menus.

---

## 🌟 Key Features

* **Touch POS Cashier Interface**: Rapid food selection by category, item search, mandatory customer name input, discount calculations, 5% tax support, and instant order creation.
* **Daily Reset Order Sequence**: Order numbers reset automatically at midnight starting from `001`, `002`, `003`...
* **Real-Time Customer Display (TV Screen)**:
  * Split screen: **PREPARING** (Amber) vs **READY** (Emerald Green).
  * Massive 3-digit fonts visible from across the dining area.
  * Web Audio sound chime on status change to READY.
  * Configurable auto-removal timer (Default: 5 minutes) to clear picked-up orders.
* **Customer QR Digital Menu**:
  * View-only menu for scanning table QR codes.
  * Category tabs, product search, images, prices, available vs blurred unavailable badges, and Today's Special highlights.
* **Executive Admin Dashboard & Settings**:
  * Daily metrics: Today's Orders, Revenue, Active Orders, Average Order Value, top selling items.
  * Category & Menu Item manager with image upload support.
  * System configurations (Auto remove timer, tax rate, canteen name, cashier permission policies).
  * Printable QR code poster generator.
* **Real-Time WebSockets Engine**: Instant sync between Cashier POS terminals, Kitchen queue, and Customer TV displays.

---

## 🛠️ Tech Stack

### Backend
* **FastAPI** (Python 3.13+)
* **SQLAlchemy 2.0 Async**
* **PostgreSQL** & **AsyncSQLite**
* **Alembic** Migrations
* **Pydantic v2**
* **JWT Authentication & Bcrypt**
* **WebSockets**
* **Redis**
* **UV** Package Manager

### Frontend
* **React 19**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **React Router v7**
* **TanStack Query (React Query)**
* **Zustand** State Management
* **Framer Motion**
* **Lucide Icons**

---

## 🔑 Default Credentials

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Dashboard, Menu Editor, Settings, Staff & Permissions |
| **Cashier** | `cashier` | `cashier123` | POS Touch Screen, Payment Acceptance, Live Order Queue |

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
uv venv
.venv\Scripts\activate  # On Windows PowerShell
uv pip install -e .[dev]
uv run uvicorn app.main:app --reload --port 8000
```
Backend API interactive documentation available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web app running at: `http://localhost:5173`

---

## 🐳 Docker Production Deployment

To launch the complete production stack (PostgreSQL + Redis + FastAPI + Nginx React Frontend):

```bash
docker-compose up --build -d
```

- **Web Application & POS**: `http://localhost`
- **Customer TV Display Screen**: `http://localhost/display`
- **Customer View-Only QR Menu**: `http://localhost/qr-menu`
- **FastAPI Backend API**: `http://localhost:8000/api/v1`

---

## 🧪 Running Automated Tests

```bash
cd backend
uv run --extra dev pytest
```
