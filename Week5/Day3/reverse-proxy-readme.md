# Day 3 — NGINX Reverse Proxy + Load Balancing

## Objective
The goal of this task was to place NGINX in front of multiple backend containers and use it as a reverse proxy and load balancer.

## Architecture

User → NGINX → backend1 / backend2

NGINX receives incoming requests and forwards `/api` traffic to a backend pool containing two backend service instances.

## Services

### 1. NGINX
- Runs inside Docker
- Exposed on port 80
- Acts as reverse proxy
- Forwards `/api` requests to backend containers
- Performs round-robin load balancing

### 2. backend1
- Node.js + Express service
- Runs on port 3000 inside the container
- Identified by `INSTANCE_NAME=backend-1`

### 3. backend2
- Node.js + Express service
- Runs on port 3000 inside the container
- Identified by `INSTANCE_NAME=backend-2`

## Reverse Proxy
A reverse proxy sits in front of backend services and receives client requests first. Instead of exposing backend containers directly, only NGINX is exposed to the host.

This provides:
- a single entry point
- internal routing
- easier scaling
- better abstraction and control

## Load Balancing
NGINX uses an upstream block to define a pool of backend servers:

```nginx
upstream backend_pool {
    server backend1:3000;
    server backend2:3000;
}

This means requests are distributed across backend1 and backend2 one by one.

## Routing

Requests to:

http://localhost/api

are routed by NGINX to one of the backend instances.

## Verification

The setup was verified by:

starting all services with Docker Compose

hitting http://localhost/api multiple times

observing alternating backend instance names in the responses

## Key Learnings

NGINX can run as a reverse proxy inside Docker

Docker networking allows internal service routing by service name

Load balancing can be simulated using multiple backend containers

Round-robin distributes traffic across backend instances

Reverse proxies are a core part of production architectures

## Output Files

nginx.conf

reverse-proxy-readme.md

## Conclusion

This task demonstrated how NGINX can act as a reverse proxy and load balancer for multiple backend containers in a Docker-based environment.

## Stop everything

docker compose down