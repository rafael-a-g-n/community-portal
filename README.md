# Community Portal

Community Portal is a full-stack web application for reporting community issues (potholes, graffiti, broken lighting, etc.), tracking report status, and managing platform content from an admin dashboard.

**Live deployment on Railway:**

| Service | URL |
|---|---|
| Frontend | https://industrious-fascination-production-f419.up.railway.app |
| Backend API | https://community-portal-production.up.railway.app/api/v1/ |

## Features

- Public report submission with optional photo upload
- Public report listing and detail views with filtering, ordering, and search
- Admin token authentication
- Admin dashboard to update report status and resolution comments
- Admin category management
- Site settings CMS (hero text, about page, labels, etc.)
- English and Portuguese UI

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Axios, React Router, i18next, Vitest |
| Backend | Python 3.12, Django, Django REST Framework, django-filter, drf-spectacular, pytest |
| Database | TiDB Cloud (MySQL-compatible) |
| Hosting | Railway (backend + frontend as separate services) |
| CI | GitHub Actions |

## Repository Structure

```text
.
├── backend/          # Django API (see backend/README.md)
│   ├── core/
│   ├── reports/
│   ├── siteconfig/
│   └── manage.py
├── frontend/         # React/Vite SPA (see frontend/README.md)
│   ├── src/
│   └── public/
└── docker-compose.yml  # Local development only
```

## Deployment

The application is deployed on [Railway](https://railway.app). Railway watches the `main` branch and automatically rebuilds and redeploys each service when a push passes CI.

- Backend service uses the `backend/Dockerfile` (gunicorn + WhiteNoise).
- Frontend service uses the `frontend/Dockerfile` (Vite build → `serve`).
- Database is TiDB Cloud (external, SSL required).

### Required Railway environment variables

**Backend service:**

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `false` in production |
| `ALLOWED_HOSTS` | Comma-separated hostnames |
| `DB_ENGINE` | `mysql` |
| `DB_HOST` | TiDB Cloud gateway host |
| `DB_PORT` | `4000` |
| `DB_NAME` | Database name |
| `DB_USER` | TiDB user |
| `DB_PASSWORD` | TiDB password |
| `DB_SSL_MODE` | `REQUIRED` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin |
| `CSRF_TRUSTED_ORIGINS` | Frontend origin |

**Frontend service:**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full backend API base URL |

## Local Development

The `docker-compose.yml` spins up a local stack with PostgreSQL for development.

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1/`
- API Docs: `http://localhost:8000/api/docs/swagger/`

For setup without Docker, see `backend/README.md` and `frontend/README.md`.

## CI

GitHub Actions runs on every push to `main`:

- **Backend Tests**: pytest inside a Python 3.12 environment
- **Frontend Tests**: Vitest

Both jobs must pass before Railway deploys.

## Common Tasks

### Add categories

New databases have no categories by default. Add them from the Admin Dashboard so they appear in the report submission form.

### Run tests locally

```bash
# Backend
cd backend && python -m pytest -v

# Frontend
cd frontend && npm test
```

## License

MIT — see [LICENSE](LICENSE).