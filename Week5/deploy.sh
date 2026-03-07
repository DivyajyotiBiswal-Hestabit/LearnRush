#!/bin/bash

echo "Stopping old containers..."
docker compose -f docker-compose.prod.yml down

echo "Building production containers..."
docker compose -f docker-compose.prod.yml up --build -d

echo "Deployment complete!"
docker ps