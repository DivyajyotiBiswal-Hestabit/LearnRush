# Week5 — NGINX Reverse Proxy + Load Balancing

## Objective
- Run two backend replicas of the Node.js server.
- Use NGINX as a reverse proxy to route `/api` requests.
- Implement **round-robin load balancing** between backend replicas.
- Serve frontend via NGINX.

---



---

## Key Files

### src/server.js
- Express backend running on port 3000.
- `/api/health` route returns container hostname for testing load balancing.
- Connects to MongoDB (`mongo:27017`).

```js
app.get("/api/health", (req, res) => {
  res.json({ container: process.env.HOSTNAME });
});

--- 

## docker-compose.yml

- Defines services: mongo, backend1, backend2, client, nginx.

- Backend replicas run on port 3000 internally; NGINX handles routing.

- Frontend served via NGINX /.

- MongoDB connected internally by backend containers.

---



## How to Run

# Stop and remove old containers
sudo docker compose down --remove-orphans

# Build and start the stack in detached mode
sudo docker compose up --build -d

# Check running containers
sudo docker ps

---


## Test Load Balancing

curl http://localhost/api/health
curl http://localhost/api/health
curl http://localhost/api/health

Response should alternate between backend replicas (backend1 and backend2) — confirms round-robin load balancing.