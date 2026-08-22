# GlobeTrotter — Travel Itinerary & Budget Planner

Welcome to the GlobeTrotter project! This is a full-stack monorepo scaffolded for React (Vite) on the frontend and Node.js + Express + PostgreSQL on the backend.

## Project Structure

```
GlobeTrotter/
├── docker-compose.yml       # Standard Docker orchestrator (DB + Backend + Frontend)
├── README.md                # This setup guide
├── backend/                 # Node.js + Express backend (Person A, B, C)
└── frontend/                # React (Vite) + Tailwind CSS + Leaflet frontend
```

---

## 🚀 Getting Started

### Option 1: Docker Compose (Quickest)
To start the entire stack (PostgreSQL, backend API server, and React dev server) in one command, run:
```bash
docker-compose up --build
```
- The **Frontend** will be running at [http://localhost:5173](http://localhost:5173)
- The **Backend API** will be running at [http://localhost:5000](http://localhost:5000)
- **PostgreSQL** is exposed on port `5432` with credentials `postgres/postgres` (database `globetrotter`).

---

### Option 2: Running Locally (Recommended for rapid development)

#### 1. Database (PostgreSQL)
Ensure you have a PostgreSQL server running locally, or use a Docker container for just the DB:
```bash
docker run --name globetrotter-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=globetrotter -p 5432:5432 -d postgres:15-alpine
```

#### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the environment template and configure your local settings:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Seed the initial database schema (run the SQL in `db/schema.sql` on your PostgreSQL instance).
5. Start the backend with hot-reloading:
   ```bash
   npm run dev
   ```

#### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 🧑💻 Dev Team Division of Labor

### 🧑💻 PERSON A: Database, Auth, Core Trip Management & DevOps
- **Files**:
  - `backend/config/db.js` (finalizes connection pool)
  - `backend/db/schema.sql` (finalizes SQL migrations/schema)
  - `backend/routes/auth.js` & `backend/routes/users.js`
  - `backend/middleware/authMiddleware.js`
- **Scope**: User authentication (Signup/Login/JWT), Profile management, Trips CRUD, and DevOps/Deployment setups.

### 🧑💻 PERSON B: Itinerary Builder, City/Activity Discovery & Map Data
- **Files**:
  - `backend/routes/trips.js` (stops endpoints)
  - `backend/routes/cities.js` (city search & Nominatim seeding scraper)
  - `backend/routes/activities.js` (activity search & stop linking)
- **Scope**: Stops management, seeding Nominatim cities, activities integration, structuring the itinerary response to return `{ days, route }` ready for Leaflet map polylines.

### 🧑💻 PERSON C: Budget Engine, Sharing, Admin & API Documentation
- **Files**:
  - `backend/routes/budget.js`
  - `backend/routes/sharing.js` (token generator + cloning engine)
  - `backend/routes/admin.js` (admin dashboards statistics and user toggling)
- **Scope**: Budget engine, social share OpenGraph payload, public read-only trip viewer, cloning trips to another user's account, admin statistics endpoint, and keeping the Postman collections updated.
