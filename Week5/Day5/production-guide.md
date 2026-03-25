# Day 5 — CI-Style Deployment Automation + Capstone

## Objective
The goal of this capstone was to deploy a production-style full-stack application using Docker with reverse proxy, HTTPS, persistent storage, health checks, restart policies, environment-based configuration, and deployment automation.

## Stack
- Frontend: Next.js
- Backend: Node.js + Express
- Database: MongoDB
- Reverse Proxy: NGINX
- HTTPS: Local certificate mounted into reverse proxy container

## Important Features

### 1. Docker Volumes
MongoDB uses a named Docker volume for persistent database storage.

### 2. Compose Profiles
Services are grouped under the `prod` profile to simulate production deployment behavior.

### 3. Environment Configuration
Application settings are loaded from `.env` using `env_file`.

### 4. Log Rotation
Docker logging is configured using `json-file` with max file size and max file count to prevent unlimited log growth.

### 5. Health Checks
Health checks are configured for frontend, backend, and NGINX to monitor service readiness and availability.

### 6. Restart Policy
`restart: unless-stopped` ensures services restart automatically if they fail unexpectedly.

### 7. Reverse Proxy + HTTPS
NGINX terminates HTTPS and routes:
- `/` to Next.js frontend
- `/api/` to backend

It also redirects HTTP traffic to HTTPS.

## Deployment
Deployment is automated using:

```bash
./deploy.sh

### Verification

The deployment was verified using:

docker compose ps

docker compose logs

curl -I http://day5.local

curl -k https://day5.local/api/message

### Key Learnings

Production deployments require more than just running containers

Configuration should be externalized

Persistent data should be stored in volumes

Health checks and restart policies improve reliability

Reverse proxies centralize routing and HTTPS termination

Deployment scripts make environments reproducible