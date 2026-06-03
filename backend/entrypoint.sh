#!/bin/sh

# Optional: Wait for database to be ready (replace 'db' and '5432' with your setup)
echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "Database started"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Execute the main container command (passed from CMD)
exec "$@"
