# GlobeTrotter — Travel Itinerary & Budget Planner

Welcome to the GlobeTrotter project! This is a full-stack monorepo scaffolded for React (Vite) on the frontend and Node.js + Express + PostgreSQL on the backend.

## Project Structure

```
GlobeTrotter/
├── docker-compose.yml       # Standard Docker orchestrator (DB + Backend + Frontend)
├── README.md                # This setup guide
├── backend/                 # Node.js + Express backend API
└── frontend/                # React (Vite) + Tailwind CSS + Leaflet frontend
```

---

## 🌟 Vision & Mission

**Overall Vision**
To become a personalized, intelligent, and collaborative platform that transforms the way individuals plan and experience travel. Empowering users to dream, design, and organize trips with ease by offering an end-to-end travel planning tool that combines flexibility and interactivity.

It envisions a world where users can explore global destinations, visualize their journeys through structured itineraries, make cost-effective decisions, and share their travel plans within a community—making travel planning as exciting as the trip itself.

**Mission**
To build a user-centric, responsive application that simplifies the complexity of planning multi-city travel. The platform should provide travelers with intuitive tools to:
- Add and manage travel stops and durations
- Explore cities and activities of interest
- Estimate trip budgets automatically
- Visualize timelines and plans
- Share trip plans with others

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

### Option 2: Running Locally

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

## 🛠️ Main Features
1. **Login & Registration**: Auth system using JWT tokens to secure user settings and trips.
2. **Interactive Itinerary Builder**: Add/remove stops and organize drag-and-drop locations on Leaflet maps.
3. **Budget Engine**: Automatic daily rate estimation and overbudget category alerts.
4. **Calendar Timeline**: Expandable day grids mapping travel activities.
5. **Public Sharing**: Public URL link generation for read-only view and trip cloning.
6. **Admin Dashboard**: View user statistics, top cities, and manage accounts.
