#!/bin/sh
set -e

# Run database migrations if enabled (default: true)
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "Applying database migrations..."
  python manage.py migrate --noinput || echo "Warning: Migration check failed or DB unreachable at startup."
  
  echo "Synchronizing regulatory knowledge packs..."
  python manage.py load_knowledge_packs || echo "Warning: Knowledge pack loader encountered a non-fatal warning."
fi

# Execute passed command or default to Gunicorn
if [ $# -gt 0 ]; then
  exec "$@"
else
  echo "Starting ComplyWise Backend Gunicorn server on port ${PORT:-8000}..."
  exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${GUNICORN_WORKERS:-3}" \
    --threads "${GUNICORN_THREADS:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    --access-logfile - \
    --error-logfile -
fi
