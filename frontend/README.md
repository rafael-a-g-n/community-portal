# Frontend (React + Vite)

Community Portal user interface, deployed on Railway.

**Production URL:** `https://industrious-fascination-production-f419.up.railway.app`

## Stack

- React 19
- Vite
- Axios
- React Router v7
- i18next (English / Portuguese)
- Vitest + Testing Library

## Routes

| Path | Description |
|---|---|
| `/` | Home — report list |
| `/create` | Submit a report |
| `/reports/:id` | Report detail |
| `/about` | About page |
| `/admin` | Admin login |
| `/admin/dashboard` | Admin dashboard |

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full API base URL (e.g. `https://community-portal-production.up.railway.app/api/v1`). Required in production. Defaults to relative `/api/v1` for local dev. |

The variable is baked into the static build at build time by Vite. Set it in your Railway frontend service before deploying.

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

The Vite dev server proxies `/api` and `/media` requests to `http://localhost:8000` so no CORS configuration is needed locally.

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Testing

```bash
cd frontend
npm test
```

## Admin Notes

- Admin login posts to `/api/v1/auth/login/` and stores the returned token in `localStorage`.
- A backend superuser must exist before you can log in.
- Create one with `python manage.py createsuperuser` on the backend.

## Troubleshooting

### Login fails with network error

Ensure the backend is running and `VITE_API_URL` points to the correct host.

### Categories not shown in the create report form

`/api/v1/categories/` is returning an empty list. Add categories via the admin dashboard first.