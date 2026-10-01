# Taskly: Task Manager

A simple full-stack task manager. You can create, edit, delete and filter tasks.

- **Frontend:** React + Vite + Tailwind CSS (`frontend/`), deployed on Vercel
- **Backend:** Node.js + Express (`backend/`), deployed on Render
- **Database:** PostgreSQL

```
.
├── backend/
│   ├── server.js       # Express app: routes, validation, error handling
│   ├── db.js           # PostgreSQL connection + creates the table on startup
│   ├── schema.sql      # Database schema
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx            # Dashboard: stats, filters, task grid
    │   ├── api.js             # fetch wrapper for the REST API
    │   ├── constants.js       # priorities, statuses, badge colors
    │   └── components/        # TaskCard, TaskForm (modal), Spinner
    └── .env.example
```

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer (installed locally, or a free hosted database)

## Run locally

### 1. Create the database

**Option A: local PostgreSQL**

```bash
psql -U postgres -c "CREATE DATABASE taskmanager;"
```

**Option B: no local install.** Deploy the Render database first (see [Deploy](#deploy)). Copy its **External Database URL** from the Render dashboard into `backend/.env` as `DATABASE_URL`, and set `DATABASE_SSL=true`.

You don't need to create the table yourself. The backend runs `schema.sql` on startup and creates the table if it's missing.

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env     # then edit DATABASE_URL if your password/port differ
npm run dev
```

The API runs at http://localhost:5000. To check it, open http://localhost:5000/api/health.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## Environment variables

| Where    | Variable        | Example                                               | Purpose |
|----------|-----------------|-------------------------------------------------------|---------|
| backend  | `DATABASE_URL`  | `postgres://postgres:postgres@localhost:5432/taskmanager` | Postgres connection string |
| backend  | `DATABASE_SSL`  | `false` locally, `true` on Render                     | Turns on SSL for hosted databases |
| backend  | `CORS_ORIGIN`   | `http://localhost:5173,https://taskly.vercel.app`     | Frontend URLs allowed to call the API (comma-separated) |
| backend  | `PORT`          | `5000`                                                | Port to listen on (Render sets this for you) |
| frontend | `VITE_API_URL`  | `https://taskly-api.onrender.com`                     | Backend URL, no trailing slash |

> `VITE_` variables are baked in at **build time**. If you change one on Vercel, redeploy.

## API

All responses are JSON. Errors look like `{ "error": "message" }`.

| Method | Endpoint          | Body / Query                                   | Response |
|--------|-------------------|------------------------------------------------|----------|
| GET    | `/api/tasks`      | optional `?status=Pending&priority=High`       | `200` array of tasks |
| GET    | `/api/tasks/:id`  |                                                | `200` task, or `404` |
| POST   | `/api/tasks`      | `{ title, description?, priority?, status? }`  | `201` created task |
| PUT    | `/api/tasks/:id`  | any of the fields above                        | `200` updated task |
| DELETE | `/api/tasks/:id`  |                                                | `204` |

- `title`: required, at most 200 characters
- `description`: optional, at most 2000 characters
- `priority`: `Low` | `Medium` (default) | `High`
- `status`: `Pending` (default) | `In Progress` | `Completed`

Invalid input returns `400` with a message. The database also enforces these rules with `CHECK` constraints.

Example:

```bash
curl -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d '{"title":"Write README","priority":"High"}'
```

## Deploy

### 1. Push to GitHub

Render and Vercel both deploy from GitHub. Create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2. Database + backend on Render (one click)

The [render.yaml](render.yaml) Blueprint creates the PostgreSQL database and the API, and connects them for you.

1. On render.com, go to **New → Blueprint** and pick your repo.
2. Render asks for `CORS_ORIGIN`. Enter `http://localhost:5173` for now; you'll change it in step 4.
3. Click **Apply**. When it's done, open `https://taskly-api.onrender.com/api/health` (use the URL Render shows if the name was taken). It should return `{"ok":true}`.

> - Free Render services sleep when idle, so the first request can take about 30 seconds while the frontend shows the loading spinner.
> - Free Render databases expire after 30 days. Upgrade the plan or move to Neon or Supabase to keep your data.

### 3. Frontend on Vercel

1. Go to **Add New → Project** and import the repo.
2. Set **Root Directory** to `frontend`. Vercel detects Vite automatically (build command `npm run build`, output folder `dist`).
3. Add the environment variable `VITE_API_URL` = `https://taskly-api.onrender.com` (your Render URL).
4. Deploy.

### 4. Connect them

In Render, open **taskly-api → Environment** and set `CORS_ORIGIN` to your Vercel URL, for example `https://taskly.vercel.app`. Use commas to allow more than one URL. Save, and Render redeploys automatically.

## Troubleshooting

- **"Cannot reach the server"**: the backend isn't running, or `VITE_API_URL` is wrong.
- **CORS error in the browser console**: the frontend's URL isn't listed in `CORS_ORIGIN`. Make sure it matches exactly, including `https://` and with no trailing slash.
- **"Could not connect to the database"** on startup: check `DATABASE_URL`. Hosted databases need `DATABASE_SSL=true`.
