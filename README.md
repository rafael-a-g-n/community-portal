# Community Portal

Community Portal is a full-stack web application for reporting community issues (for example potholes, graffiti, or broken lighting), tracking report status, and managing platform content from an admin area.

The project is split into:

- `backend/`: Django + Django REST Framework API
- `frontend/`: React + Vite single-page app
- `docker-compose.yml`: local orchestration for Postgres, backend, and frontend

## Features

- Public report submission with optional photo upload
- Public report listing and detail views
- Report filtering, ordering, and search
- Admin authentication via token login
- Admin dashboard to update report status/comments
- Admin category management
- Site settings CMS (editable content for hero, about page, labels, etc.)
- English and Portuguese UI support

## Tech Stack

- Frontend: React 19, Vite, Axios, i18next, Vitest
- Backend: Python 3.12, Django, DRF, django-filter, drf-spectacular, pytest
- Database: PostgreSQL 15
- Containers: Docker + Docker Compose

## Quick Start (Docker, Recommended)

From repository root:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1/`
- Swagger: `http://localhost:8000/api/docs/swagger/`

## Running In Codespaces

This repository is configured to work in Codespaces with a Vite proxy setup.

1. Start services:

```bash
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

2. In the Ports panel, open forwarded port `5173`.

Notes:

- Frontend API calls default to relative `/api/v1` and are proxied by Vite.
- `docker-compose.yml` sets `VITE_BACKEND_PROXY_TARGET=http://backend:8000`.
- Backend `ALLOWED_HOSTS` includes Codespaces and container hostnames for development.

## Local Development (Without Docker)

See service-specific guides:

- Backend setup: `backend/README.md`
- Frontend setup: `frontend/README.md`

High-level order:

1. Start PostgreSQL
2. Run Django API on `0.0.0.0:8000`
3. Run Vite app on `0.0.0.0:5173`

## Repository Structure

```text
.
|- backend/
|  |- core/
|  |- reports/
|  |- siteconfig/
|  |- manage.py
|  `- requirements.txt
|- frontend/
|  |- src/
|  |- public/
|  `- package.json
`- docker-compose.yml
```

## Common Workflows

### Create your first admin user

```bash
docker compose exec backend python manage.py createsuperuser
```

Then sign in at `/admin` in the frontend app.

### Add categories

New databases have zero categories by default. Add categories from Admin Dashboard so they appear in the report form.

### Run backend tests

```bash
docker compose exec backend python -m pytest -v
```

### Run frontend tests

```bash
docker compose exec frontend npm test
```

## Environment Notes

Frontend supports:

- `VITE_API_URL` (optional): full API base URL, defaults to `/api/v1`
- `VITE_BACKEND_PROXY_TARGET` (dev proxy target, defaults to `http://localhost:8000`)

Backend supports:

- `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_SSLMODE`
- `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`

## Troubleshooting

### Frontend shows Axios Network Error

- Confirm containers are up: `docker compose ps`
- Confirm frontend is opened through forwarded port in Codespaces
- Confirm backend is reachable: `http://localhost:8000/api/v1/categories/`

### `Failed to fetch site settings` with status 400

- Usually host validation issue. Ensure backend container is recreated with current `ALLOWED_HOSTS` in `docker-compose.yml`.

### Categories not visible on report form

- Categories endpoint is empty. Add categories from admin UI.

## License

This project is licensed under the terms in `LICENSE`.