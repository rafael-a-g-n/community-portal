# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Run application as non-root user in container.
RUN addgroup --system app && adduser --system --ingroup app app

# Install system dependencies needed by mysqlclient
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app/

# Ensure media upload directories exist with correct permissions
RUN mkdir -p /app/media/reports/photos && chown -R app:app /app

USER app

# Collect static files for WhiteNoise
RUN SECRET_KEY=build-only-dummy-key DEBUG=true python manage.py collectstatic --noinput

CMD ["sh", "-c", "python manage.py migrate --no-input && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]