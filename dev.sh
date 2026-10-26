#!/usr/bin/env bash
# Start backend (Django) and frontend (Next.js) together. Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")"

trap 'kill 0' EXIT

backend/.venv/bin/python backend/manage.py runserver 8080 &  # matches NEXT_PUBLIC_API_URL in frontend/package/.env.local
npm run dev --prefix frontend &

wait
