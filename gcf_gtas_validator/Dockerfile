# ── Base
FROM python:3.9-slim-buster

# ── Pathing & deps
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 -r requirements.txt
COPY . .

# ── Runtime env
ENV PORT=8080

# ── Launch (force shell so $PORT always expands)
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 main:app"]