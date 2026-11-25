# Islamic Learning & Values Questionnaire — Full Stack

Full-stack questionnaire and integrated admin dashboard built with React + Vite (`frontend/`) and Node.js + Express + MongoDB Atlas (`backend/`).

## Project Structure

- `frontend/` — Public questionnaire (`/`), Admin Sign In (`/admin/login`), and Protected Admin Dashboard (`/admin`)
- `backend/` — Organized Express API (`config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `utils/`) connected to MongoDB Atlas database `IslamicForm` (`questionnaire_responses` and `admins` collections)
- `render.yaml` — Render Web Service configuration for `backend/`
- `frontend/vercel.json` — Vercel SPA rewrite configuration for `/admin` routes

## Local Development

### 1. Backend (`backend/`)
1. Copy `backend/.env.example` to `backend/.env` and configure `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (or `ADMIN_PASSWORD_HASH`), and `FRONTEND_URL=http://localhost:5173`.
2. Install and start:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Health check: `http://localhost:5000/api/health`

### 2. Frontend (`frontend/`)
1. Copy `frontend/.env.example` to `frontend/.env` with `VITE_API_URL=http://localhost:5000`.
2. Install and start:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Public Questionnaire: `http://localhost:5173/`
   - Admin Dashboard: `http://localhost:5173/admin`

## Backend API Endpoints

- `GET /api/health` — Public health and MongoDB connection status
- `POST /api/questionnaire/submit` — Public questionnaire submission
- `POST /api/admin/login` — Admin JWT login
- `GET /api/admin/dashboard` — Admin dashboard statistics (JWT protected)
- `GET /api/admin/responses` — Paginated, searchable, date-filterable submissions (JWT protected)
- `GET /api/admin/responses/:id` — Full individual submission details (JWT protected)
- `GET /api/admin/responses/export` — Export submissions as UTF-8 BOM CSV for Excel (JWT protected)
