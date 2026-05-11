# Backend (Django API)

REST API for Community Portal, deployed on Railway.

**Production URL:** `https://community-portal-production.up.railway.app/api/v1/`

## Stack

- Python 3.12
- Django + Django REST Framework
- TiDB Cloud (MySQL-compatible) in production; PostgreSQL locally via Docker Compose
- django-filter
- drf-spectacular (OpenAPI docs)
- gunicorn (production server)
- WhiteNoise (static file serving)
- pytest + pytest-django

## Apps

- `reports` — categories and citizen reports
- `siteconfig` — site-wide editable content/settings
- `core` — project settings and URL routing

## API Reference

| Path | Description |
|---|---|
| `/api/v1/` | API root |
| `/api/v1/auth/login/` | Admin token login |
| `/api/schema/` | OpenAPI schema |
| `/api/docs/swagger/` | Swagger UI |
| `/api/docs/redoc/` | ReDoc |

### Categories

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v1/categories/` | Public |
| `POST` | `/api/v1/categories/` | Admin |
| `GET` | `/api/v1/categories/<id>/` | Public |
| `PATCH` | `/api/v1/categories/<id>/` | Admin |
| `DELETE` | `/api/v1/categories/<id>/` | Admin |

### Reports

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v1/reports/` | Public |
| `POST` | `/api/v1/reports/` | Public |
| `GET` | `/api/v1/reports/<uuid>/` | Public |
| `PATCH` | `/api/v1/reports/<uuid>/` | Admin |
| `DELETE` | `/api/v1/reports/<uuid>/` | Admin |

### Site Settings

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v1/settings/` | Public |
| `PATCH` | `/api/v1/settings/` | Admin |

## Behavior Notes

- Category list is intentionally unpaginated.
- Report creation forces `status=open` regardless of client input.
- Report listing supports ordering by `created_at` and `status`.
- Anonymous report creation is throttled.
- Photo uploads validate size/type; filenames are UUID-based.

## Environment Variables

### Core

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | dev value | Django secret key |
| `DEBUG` | `true` | Set `false` in production |
| `ALLOWED_HOSTS` | — | Comma-separated hostnames |

### Database

| Variable | Default | Description |
|---|---|---|
| `DB_ENGINE` | `django.db.backends.postgresql` | Use `mysql` for TiDB/MySQL |
| `DB_NAME` | `community_portal` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_HOST` | `127.0.0.1` | Database host |
| `DB_PORT` | `5432` | Database port (`4000` for TiDB) |
| `DB_SSL_MODE` | — | Set `REQUIRED` for TiDB Cloud |

### CORS / CSRF

| Variable | Description |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated trusted origins |

### Production Security (active when `DEBUG=false`)

| Variable | Description |
|---|---|
| `SECURE_SSL_REDIRECT` | Redirect HTTP → HTTPS |
| `SECURE_HSTS_SECONDS` | HSTS max-age |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | HSTS subdomains flag |
| `SECURE_HSTS_PRELOAD` | HSTS preload flag |

## Local Setup (No Docker)

From repo root:

```bash
python -m venv .venv
.venv/Scripts/activate   # Windows
# source .venv/bin/activate  # Linux/macOS

pip install -r backend/requirements.txt
```

Run migrations and dev server:

```bash
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Local Setup (Docker Compose)

From repo root:

```bash
docker compose up -d --build db backend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## Testing

```bash
cd backend
python -m pytest -v
```

## Admin Access

- Frontend admin login: `/admin` (token-based via API)
- Django admin panel: `/admin/` on the backend service

Create a superuser:

```bash
python manage.py createsuperuser
```

## Troubleshooting

### Database connection refused

Verify `DB_HOST` and `DB_PORT` are correct and the database is reachable.

### No categories in UI

The API returns an empty list until an admin creates category records via the dashboard.

### `SECRET_KEY` / `DB_PASSWORD` errors

Ensure all required environment variables are set before starting the server.