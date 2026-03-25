# Service Architecture — Day 2 Docker Compose Multi-Container App

## Objective
The goal of this task was to deploy a multi-container application using Docker Compose. The application includes a React client, a Node/Express server, and a MongoDB database. All services are started together using a single command.

## Services

### Client
- Technology: React
- Role: Provides the frontend user interface
- Host Port: 3000
- Container Port: 3000

### Server
- Technology: Node.js + Express
- Role: Handles backend API requests
- Host Port: 5000
- Container Port: 5000
- Connects to MongoDB using Docker internal networking

### MongoDB
- Technology: MongoDB 6
- Role: Stores persistent data
- Container Port: 27017
- Uses a Docker volume for persistence

## Architecture Flow

User → React Client → Node Server → MongoDB

- The browser accesses the React client on `http://localhost:3000`
- The backend API is available on `http://localhost:5000`
- The server connects to MongoDB using the Compose service name `mongo`

## Docker Networking
Docker Compose automatically created a shared internal network for all services.

The server connects to MongoDB using this connection string:

```text
mongodb://mongo:27017/day2app

Here, mongo is the Compose service name and acts as the hostname inside the Docker network.

This shows that containers communicate using service discovery instead of localhost.

Persistent Storage

MongoDB data is stored in a named Docker volume:

volumes:
  - mongo_data:/data/db

This ensures that database data remains available even if the MongoDB container is removed and recreated.

Logs

Logs can be inspected using:

docker compose logs
docker compose logs client
docker compose logs server
docker compose logs mongo

Deployment

The full application stack is started using:

docker compose up -d --build

Verification

The setup was verified using:
docker compose ps
curl http://localhost:5000/health
curl http://localhost:5000/api/message