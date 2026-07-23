#!/usr/bin/env bash
# Phase 1: Self-hosted Supabase install via official docker-compose
# VPS: Ubuntu 22.04+, 4 CPU / 8 GB RAM minimum
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/supabase}"

echo "==> Installing Docker (if missing)..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

echo "==> Cloning Supabase repo..."
if [ ! -d "$INSTALL_DIR" ]; then
  git clone --depth 1 https://github.com/supabase/supabase "$INSTALL_DIR"
fi

cd "$INSTALL_DIR/docker"

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "==> .env তৈরি হয়েছে: $INSTALL_DIR/docker/.env"
  echo "==> নিচের value গুলো পূরণ করুন তারপর এই script আবার চালান:"
  echo "    - POSTGRES_PASSWORD (strong random)"
  echo "    - JWT_SECRET (min 32 char)"
  echo "    - ANON_KEY (jwt.io দিয়ে JWT_SECRET signed)"
  echo "    - SERVICE_ROLE_KEY (jwt.io দিয়ে JWT_SECRET signed)"
  echo "    - DASHBOARD_USERNAME / DASHBOARD_PASSWORD"
  echo "    - SITE_URL=https://app.timescard.cloud"
  echo "    - API_EXTERNAL_URL=https://api.timescard.cloud"
  echo "    - SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_SENDER_NAME"
  echo ""
  echo "==> ANON/SERVICE key generate করার guide:"
  echo "    https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys"
  exit 0
fi

echo "==> Pulling images and starting stack..."
docker compose pull
docker compose up -d

echo ""
echo "==> Waiting for services to be healthy..."
sleep 20
docker compose ps

echo ""
echo "==> Install সম্পন্ন। Verify:"
echo "  Studio:   http://<vps-ip>:3000"
echo "  REST:     http://<vps-ip>:8000/rest/v1/"
echo "  Auth:     http://<vps-ip>:8000/auth/v1/health"
echo "  Storage:  http://<vps-ip>:8000/storage/v1/"
echo ""
echo "==> এরপর Nginx/Caddy দিয়ে HTTPS + subdomain routing সেট করুন:"
echo "    app.timescard.cloud → :3000 (Studio)"
echo "    api.timescard.cloud → :8000 (Kong API gateway)"
