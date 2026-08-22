# 🌍 GlobeTrotter — Intelligent Travel Itinerary & Budget Planner

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express-4.18-green?style=flat&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)

**GlobeTrotter** is a full-stack, AI-inspired travel planning and budget estimation platform designed for seamless multi-city journey creation. It features interactive 3D globe visualizations, drag-and-drop itinerary builders, real-time cost breakdown engines, calendar timelines, and public trip sharing.

---

## 🌟 Key Features

* 🌐 **Interactive 3D Destination Globe**: Built with `react-globe.gl` and Three.js for immersive geographic exploration, arc animations, and one-click destination bookings.
* 🗺️ **Drag-and-Drop Itinerary Builder**: Organize multi-city stops, adjust stay durations, and arrange activities across morning, afternoon, and evening slots with `@dnd-kit`.
* 📊 **Smart Budget Engine**: Automatic category breakdown (Transport, Stays, Activities, Meals) using city-specific cost tiers, interactive visual charts with `Recharts`, and real-time expense alerts.
* 📅 **Calendar & Timeline View**: Day-by-day itinerary schedules with interactive time cards, notes, and activity durations.
* 🔗 **Public Trip Sharing & Forking**: Share customized itineraries with unique share slugs or fork community trips with one click into your personal dashboard.
* 🔐 **Robust Authentication**: JWT token auth, Google OAuth 2.0 integration, password hashing via bcrypt, user profile settings, and role-based access control (User/Admin).
* 👑 **Admin Analytics Dashboard**: Live metrics tracking active users, total itineraries created, destination popularity rankings, and account management tools.
* ⚡ **Resilient Dual-Engine Backend**: Native PostgreSQL database with Prisma ORM alongside an automatic, in-memory query engine for development environments.

---

## 📁 Repository Structure

```
GlobeTrotter/
├── globetrotter/            # Primary Next.js 16 (App Router) Frontend
│   ├── app/                 # Routes: /dashboard, /trips, /profile, /admin, /login
│   ├── components/          # 3D Globe, TopBar, Itinerary Cards, Auth sync
│   ├── store/               # Zustand state stores (Auth, Itinerary, Globe, Trips)
│   ├── lib/                 # Centralized API client, mock datasets, auth actions
│   └── types/               # TypeScript interfaces
│
├── backend/                 # Node.js + Express.js REST API Server
│   ├── config/              # PostgreSQL pool & resilient fallback DB
│   ├── db/                  # SQL schema definitions and migrations
│   ├── middleware/          # JWT auth, admin authorization, error handling
│   ├── routes/              # Auth, Trips, Cities, Activities, Budget, Sharing, Admin
│   ├── scripts/             # Data seeders & raw city/activity datasets
│   ├── server.js            # API server entrypoint (Port 5000)
│   └── prisma/              # Prisma schema & generator
│
├── frontend/                # Standalone Vite + React + Leaflet client
└── docker-compose.yml       # Docker orchestrator for multi-container deployment
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js** v18+ (v20+ recommended)
* **npm** v9+
* **PostgreSQL** 14+ *(optional — in-memory fallback included)*

---

### Step 1: Clone Repository

```bash
git clone https://github.com/kashviporwal-byte/Odoo-LD-Hackathon.git
cd Odoo-LD-Hackathon
```

---

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file (adjust PostgreSQL credentials if necessary):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/globetrotter
   JWT_SECRET=hackathon_super_secret_token_12345
   JWT_EXPIRES_IN=7d
   ```

4. Install dependencies and generate Prisma client:
   ```bash
   npm install
   npx prisma generate
   ```

5. Seed the database with the rich trip dataset (25 cities, 30+ activities, 12 itineraries):
   ```bash
   node scripts/seedFullTripDataset.js
   ```

6. Start the backend API server:
   ```bash
   npm run dev
   ```
   > Backend running at **[http://localhost:5000](http://localhost:5000)**  
   > Health Check: **[http://localhost:5000/health](http://localhost:5000/health)**

---

### Step 3: Frontend Setup (`globetrotter`)

1. Open a new terminal and navigate to `globetrotter`:
   ```bash
   cd globetrotter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   > Frontend running at **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Accounts & Credentials

The database comes pre-seeded with ready-to-test accounts:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Primary Traveler** | `traveler@odoo.com` | `password123` | **7 rich global itineraries** (Europe, Japan, SEA, Nordic, Mediterranean, USA, Swiss Alps) with stops, activities & budgets |
| **Administrator** | `admin@odoo.com` | `admin123` | Full access to platform analytics, user tables, and lock toggles |
| **Community Explorer** | `alex@globe.io` | `password123` | Arabian Nights & African Safari trips with public share links |
| **Community Explorer** | `priya@globe.io` | `password123` | Iberian Sun & Ottoman Crossroads itineraries |

---

## 🛠️ REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/users/profile` | Get current authenticated user profile | Private |
| `PUT` | `/api/users/profile` | Update profile details (name, photo) | Private |
| `GET` | `/api/trips` | List all user trips with destination count | Private |
| `POST` | `/api/trips` | Create a new trip | Private |
| `GET` | `/api/trips/:id` | Get trip details and full itinerary | Private |
| `PUT` | `/api/trips/:id` | Update trip dates, name, or photo | Private |
| `DELETE` | `/api/trips/:id` | Delete a trip | Private |
| `GET` | `/api/trips/:id/calendar` | Get calendar events for a trip | Private |
| `POST` | `/api/trips/:id/stops` | Add a city stop to an itinerary | Private |
| `DELETE` | `/api/trips/:id/stops/:stopId` | Remove a stop from an itinerary | Private |
| `GET` | `/api/cities` | Search and filter global destination cities | Public |
| `GET` | `/api/activities/cities/:cityId` | Get activities for a specific city | Public |
| `POST` | `/api/activities/stops/:stopId` | Schedule an activity on an itinerary stop | Private |
| `GET` | `/api/budget/:tripId` | Get automated and saved budget calculations | Private |
| `PUT` | `/api/budget/:tripId` | Update customized trip budget categories | Private |
| `GET` | `/api/sharing/public/:token` | View public shared trip summary | Public |
| `POST` | `/api/sharing/trips/:id/fork` | Clone/fork a shared trip into personal trips | Private |
| `GET` | `/api/admin/stats` | Retrieve platform aggregate metrics | Admin |
| `GET` | `/api/admin/top-cities` | Retrieve most popular itinerary cities | Admin |

---

## 💻 Tech Stack

### **Frontend**
* **Framework**: Next.js 16 (React 19, App Router)
* **Styling**: Tailwind CSS 4, Lucide React Icons, Framer Motion
* **3D Visuals & Maps**: `react-globe.gl`, Three.js, Leaflet, React Leaflet
* **State & Data Fetching**: Zustand, TanStack React Query v5
* **Charts & Interactions**: Recharts, `@dnd-kit`

### **Backend**
* **Server**: Node.js & Express.js
* **Database**: PostgreSQL with `pg` connection pool
* **ORM**: Prisma ORM v5
* **Security & Auth**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Helmet, Express Rate Limit
* **Validation**: Zod schema validation

---

## 📄 License

This project was created for the **Odoo LD Hackathon**. Distributed under the MIT License.
