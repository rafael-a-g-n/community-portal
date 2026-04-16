# Backend Setup Guide

This backend is a Django + Django REST Framework API with PostgreSQL, filtering, throttling, image upload validation, and OpenAPI docs via drf-spectacular.

## Tech Stack

- Python 3.12
- Django
- Django REST Framework
- PostgreSQL
- django-filter
- drf-spectacular
- pytest + pytest-django

## 1. Environment Variables

Create environment variables before running in non-debug environments.

Required/important variables:

- SECRET_KEY: Django secret key
- DEBUG: true/false (default: true)
- ALLOWED_HOSTS: comma-separated hosts (example: localhost,127.0.0.1)
- CORS_ALLOWED_ORIGINS: comma-separated origins
- CSRF_TRUSTED_ORIGINS: comma-separated origins

Database variables:

- DB_NAME
- DB_USER
- DB_PASSWORD
- DB_HOST
- DB_PORT
- DB_SSLMODE (default: prefer)

Production security controls (optional overrides):

- SECURE_SSL_REDIRECT (default true when DEBUG=false)
- SECURE_HSTS_SECONDS (default 31536000)
- SECURE_HSTS_INCLUDE_SUBDOMAINS (default true)
- SECURE_HSTS_PRELOAD (default true)
- CORS_ALLOW_CREDENTIALS (default false)

### Example (.env style)

```env
SECRET_KEY=change-me
DEBUG=true
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DB_NAME=setubal_resolve
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_SSLMODE=prefer
```

## 2. Local Setup (Without Docker)

From repository root:

```bash
python -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r backend/requirements.txt
```

## 3. Run Migrations

From backend folder:

```bash
cd backend
../.venv/bin/python manage.py makemigrations
../.venv/bin/python manage.py migrate
```

## 4. Run Development Server

```bash
cd backend
../.venv/bin/python manage.py runserver 0.0.0.0:8000
```

## 5. API Docs (Swagger/ReDoc)

When DEBUG=true:

- Schema: /api/schema/
- Swagger UI: /api/docs/swagger/
- ReDoc: /api/docs/redoc/

## 6. Run Tests (pytest)

```bash
cd backend
../.venv/bin/python -m pytest reports/tests.py -v
```

Run all backend tests:

```bash
cd backend
../.venv/bin/python -m pytest -v
```

## 7. Lint

Flake8 config is in backend/.flake8.

```bash
cd backend
../.venv/bin/python -m flake8 .
```

## 8. Docker / Compose

From repository root:

```bash
docker compose -f docker-compose.yml up -d --build db backend
```

Apply migrations inside backend container:

```bash
docker compose -f docker-compose.yml exec backend python manage.py migrate
```

Run tests inside backend container:

```bash
docker compose -f docker-compose.yml exec backend python -m pytest reports/tests.py -v
```

## 9. Common Troubleshooting

1. Error: database connection refused
- Ensure Postgres is running.
- Confirm DB_HOST/DB_PORT values and exposed ports.

2. Error: SECRET_KEY must be set in non-debug environments
- Set SECRET_KEY and DEBUG=false only with full production env vars.

3. Error: DB_PASSWORD must be set to a non-default value in non-debug environments
- Set a strong DB_PASSWORD before running with DEBUG=false.

4. Pytest DB setup errors
- Ensure DB_* variables are set consistently for local runs.
- Confirm postgres service is reachable from host/container context.

## 10. API Behavior Notes

- Category listing is public and unpaginated.
- Report creation is public; incoming status is ignored and forced to open.
- Report detail PATCH is admin-only.
- Report filters support strict status and category filtering.
- Ordering allowlist is strict: created_at and status only.
- Photo uploads are validated (size/type), and filenames are UUID-based.

## 11. Endpoint Reference

Base API prefix:

- /api/v1/

### 11.1 Categories

Endpoint:

- GET /api/v1/categories/

Description:

- Returns all categories.
- Public endpoint.
- Unpaginated response (plain JSON list).

Query params:

- None.

Response codes:

- 200: Success.

Example response:

```json
[
	{
		"id": 1,
		"name": "Pothole",
		"slug": "pothole",
		"icon": "road"
	}
]
```

### 11.2 Reports List

Endpoint:

- GET /api/v1/reports/

Description:

- Returns paginated reports list.
- Public endpoint.

Query params:

- status: open | in_progress | resolved
- category: category primary key
- ordering: created_at | -created_at | status | -status

Notes:

- Invalid status returns 400.
- Invalid ordering field returns 400.

Response codes:

- 200: Success.
- 400: Invalid filter/order parameter.

Example request:

```http
GET /api/v1/reports/?status=open&ordering=-created_at
```

Example response shape:

```json
{
	"count": 1,
	"next": null,
	"previous": null,
	"results": [
		{
			"id": "3b6f2d06-fc31-456f-a2d7-7d57e5f0e4c2",
			"title": "Broken streetlight",
			"description": "Streetlight is off for 2 nights.",
			"category": {
				"id": 2,
				"name": "Lighting",
				"slug": "lighting",
				"icon": "bulb"
			},
			"status": "open",
			"status_display": "Open",
			"photo": null,
			"created_at": "2026-04-16T10:00:00Z",
			"updated_at": "2026-04-16T10:00:00Z"
		}
	]
}
```

### 11.3 Report Create

Endpoint:

- POST /api/v1/reports/

Description:

- Creates a report.
- Public endpoint.
- Anonymous requests are throttled by DRF anon throttle settings.

Request fields:

- title (string, required, min 5 chars, trimmed)
- description (string, required, min 10, max 5000, trimmed)
- category_id (integer, required)
- status (optional, ignored on create and forced to open)
- photo (optional image upload)

Photo constraints:

- Max size: 5 MB
- Allowed formats: JPEG, PNG, WEBP, GIF
- Invalid image bytes rejected
- Stored filename is UUID-based (original filename is not preserved)

Response codes:

- 201: Created.
- 400: Validation failed.
- 429: Rate limited.

Example JSON request (without photo):

```json
{
	"title": "Damaged bench",
	"description": "The bench in the park is broken and unsafe.",
	"category_id": 4,
	"status": "resolved"
}
```

Expected behavior:

- Stored status will still be open.

### 11.4 Report Detail

Endpoint:

- GET /api/v1/reports/<uuid:pk>/

Description:

- Returns a single report by UUID.
- Public endpoint.

Response codes:

- 200: Success.
- 404: Not found.

### 11.5 Report Partial Update (Admin only)

Endpoint:

- PATCH /api/v1/reports/<uuid:pk>/

Description:

- Partially updates a report.
- Admin-only endpoint (IsAdminUser).

Auth:

- Anonymous/non-staff users: 403.
- Staff users: 200 on valid patch.

Updatable fields:

- title
- description
- category_id
- status
- photo

Response codes:

- 200: Updated.
- 400: Validation failed.
- 403: Forbidden (non-admin).
- 404: Not found.

Example PATCH request:

```json
{
	"status": "resolved"
}
```

### 11.6 OpenAPI/Swagger Endpoints

Available when DEBUG=true:

- GET /api/schema/
- GET /api/docs/swagger/
- GET /api/docs/redoc/
