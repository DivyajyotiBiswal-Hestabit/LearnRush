#!/bin/bash

set -e

echo "Starting production-style deployment..."

docker compose -f docker-compose.prod.yml --profile prod down
docker compose -f docker-compose.prod.yml --profile prod up -d --build

echo "Deployment completed."
echo "Running containers:"
docker compose -f docker-compose.prod.yml --profile prod ps