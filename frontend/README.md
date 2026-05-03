# Frontend (React + Vite)

This service is the Community Portal user interface.

## Stack

- React 19
- Vite 8
- Axios
- React Router
- i18next
- Vitest + Testing Library

## App Responsibilities

- Public pages for browsing and submitting reports
- Admin login and dashboard
- Category and site-settings management UI
- Multi-language rendering (English/Portuguese)

## Routes

- `/`: home/report list
- `/create`: create report form
- `/reports/:id`: report detail
- `/about`: about page
- `/admin`: admin login
- `/admin/dashboard`: admin dashboard

## API Integration

The app uses Axios services in `src/services/`.

Default API behavior:

- `VITE_API_URL` if explicitly provided
- otherwise relative `/api/v1`

In development, Vite proxies:

- `/api` -> backend target
- `/media` -> backend target

This makes local Docker and Codespaces development more reliable.

## Environment Variables

- `VITE_API_URL` (optional): full API base URL
  - Example: `http://localhost:8000/api/v1`
- `VITE_BACKEND_PROXY_TARGET` (optional): Vite proxy target host
  - Default: `http://localhost:8000`
  - Docker Compose uses: `http://backend:8000`

## Local Setup (No Docker)

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

App URL:

- `http://localhost:5173`

## Docker Setup

From repo root:

```bash
docker compose up -d --build frontend
```

With full stack:

```bash
docker compose up -d --build db backend frontend
```

## NPM Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview built app
- `npm run clean`: remove `dist`
- `npm test`: run tests once
- `npm run test:watch`: run tests in watch mode

## Testing

Run tests locally:

```bash
cd frontend
npm test
```

Run tests in Docker container:

```bash
docker compose exec frontend npm test
```

## Admin Login Notes

- Admin login submits credentials to `/api/v1/auth/login/`.
- The returned token is stored in local storage and attached to protected requests.
- You must create a backend superuser first.

## Troubleshooting

### Login fails with network error

- Ensure backend is running on `8000`.
- If in Codespaces, open frontend from forwarded `5173` port.

### `Failed to fetch site settings`

- Confirm backend service is reachable and not returning host validation 400.

### Categories not shown in create report form

- The form renders categories only if `/api/v1/categories/` returns records.
- Add categories via admin dashboard.