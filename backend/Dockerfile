# 1. Use Python 3.12 for maximum support window (EOL Oct 2028)
FROM python:3.12-slim

WORKDIR /app
# 2. Set environment variables
ENV PYTHONPATH "${PYTHONPATH}:/app"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Install minimal system dependencies
# Added libpq-dev in case you switch from psycopg[binary] to source later
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    netcat-openbsd\
 && rm -rf /var/lib/apt/lists/*

# 4. Use a Virtual Environment inside Docker
# This is a best practice to avoid conflicts with system packages
RUN python -m venv /opt/venv

# 5. Install dependencies
COPY requirements/ /app/requirements/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements/base.txt

# 6. Copy Project
COPY . /app

EXPOSE 8000

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
# 7. Use a production-grade server
# Requires adding 'gunicorn' to your requirements.txt
CMD ["bash", "-lc", "python manage.py runserver 0.0.0.0:8000"]




