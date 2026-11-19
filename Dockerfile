FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=NDO.settings

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    zlib1g \
    ca-certificates \
    openssl \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8080

CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn NDO.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 4 --timeout 120 --access-logfile - --error-logfile -"]
