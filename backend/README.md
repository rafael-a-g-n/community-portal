# Backend (Django API)

This service provides the REST API for Community Portal.

## Stack

- Python 3.12
- Django + Django REST Framework
- PostgreSQL
- django-filter
- drf-spectacular (OpenAPI docs)
- pytest + pytest-django

## Main Apps

- `reports`: categories and citizen reports
- `siteconfig`: site-wide editable content/settings
- `core`: project settings and URL wiring

## API Base Paths

- API root: `/api/v1/`
- Auth login: `/api/v1/auth/login/`
- OpenAPI schema: `/api/schema/`
- Swagger UI: `/api/docs/swagger/`
- ReDoc: `/api/docs/redoc/`

## Key Endpoints

### Categories

- `GET /api/v1/categories/`: list categories (public, unpaginated)
- `POST /api/v1/categories/`: create category (admin)
- `GET /api/v1/categories/<id>/`: get category (public)
- `PATCH /api/v1/categories/<id>/`: update category (admin)
- `DELETE /api/v1/categories/<id>/`: delete category (admin)

### Reports

- `GET /api/v1/reports/`: list reports (public, paginated)
- `POST /api/v1/reports/`: create report (public)
- `GET /api/v1/reports/<uuid>/`: get report (public)
- `PATCH /api/v1/reports/<uuid>/`: update report (admin)
- `DELETE /api/v1/reports/<uuid>/`: delete report (admin)

### Site Settings

- `GET /api/v1/settings/`: retrieve settings singleton (public)
- `PATCH /api/v1/settings/`: update settings (admin)

## Behavior Notes

- Category list endpoint is intentionally unpaginated.
- Report creation forces status to `open` even if status is sent by client.
- Report listing supports strict ordering allowlist (`created_at`, `status`).
- Anonymous report creation is throttled.
- Photo uploads validate size/type and are stored with UUID-based filenames.

## Environment Variables

### Core

- `SECRET_KEY` (default dev value exists)
- `DEBUG` (`true` by default)
- `ALLOWED_HOSTS` (comma-separated)

### Database

- `DB_NAME` (default: `setubal_resolve`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `DB_HOST` (default: `127.0.0.1`)
- `DB_PORT` (default: `5432`)
- `DB_SSLMODE` (default: `prefer`)

### CORS/CSRF

- `CORS_ALLOWED_ORIGINS` (comma-separated origins)
- `CSRF_TRUSTED_ORIGINS` (comma-separated origins)
- `CORS_ALLOW_CREDENTIALS` (default: `false`)

### Production Security (used when `DEBUG=false`)

- `SECURE_SSL_REDIRECT`
- `SECURE_HSTS_SECONDS`
- `SECURE_HSTS_INCLUDE_SUBDOMAINS`
- `SECURE_HSTS_PRELOAD`

## Local Setup (No Docker)

From repo root:

```bash
python -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backend/requirements.txt
```

Run migrations and server:

```bash
cd backend
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py runserver 0.0.0.0:8000
```

## Docker Setup

From repo root:

```bash
docker compose up -d --build db backend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## Testing

Run all tests (local venv):

```bash
cd backend
../.venv/bin/python -m pytest -v
```

Run all tests (Docker):

```bash
docker compose exec backend python -m pytest -v
```

## Lint

```bash
cd backend
../.venv/bin/python -m flake8 .
```

## Admin Access

- Django admin panel: `/admin/` (backend site)
- API admin operations: via token auth from `/api/v1/auth/login/`

Create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Troubleshooting

### 400 responses in Codespaces for otherwise valid requests

- Recreate backend with current `ALLOWED_HOSTS` values from compose.

### Database connection refused

- Verify Postgres is running and `DB_HOST`/`DB_PORT` are correct.

### No categories in UI

- API returns an empty list until an admin creates category records.

### `SECRET_KEY` / `DB_PASSWORD` errors with `DEBUG=false`

- Set secure production values before starting server.