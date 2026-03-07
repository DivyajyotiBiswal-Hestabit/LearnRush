# Production Deployment Guide

## Architecture

Client → Nginx → Backend Containers → MongoDB

## Requirements
- Docker
- Docker Compose

## Setup

1. Clone repository
2. Create .env file
3. Run deployment script

## Deployment

./deploy.sh

## Health Check

curl -k https://localhost/api/health

## Features

- Reverse proxy
- HTTPS support
- Docker containers
- Load balancing
- Health checks
- Persistent volumes