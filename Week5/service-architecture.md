# Service Architecture

## 1. Overview

This application follows a containerized multi-service architecture using Docker Compose.  
The system is composed of three main services:

- Client (React Frontend)
- Server (Node.js + Express Backend)
- Database (MongoDB)
- Persistent Storage (Docker Volume)

All services communicate through Docker's internal bridge network.

---

## 2. High-Level Architecture

Browser (localhost:3001)
↓
React Client Container
↓ (Docker Internal Network)
Express Server Container (server:3000)
↓
MongoDB Container (mongo:27017)
↓
Docker Volume (week5_mongo-data)


---

## 3. Services Description

### 3.1 Client Service

- Technology: React
- Container Port: 3001
- Host Port: 3001
- Responsibility:
  - Provides the user interface
  - Sends HTTP requests to backend
  - Displays server response

The client communicates with the backend using the Docker service
Inside Docker, `localhost` cannot be used for inter-service communication.

---

### 3.2 Server Service

- Technology: Node.js + Express
- Container Port: 3000
- Host Port: 3000
- Responsibility:
  - Handles API requests
  - Connects to MongoDB
  - Processes data
  - Sends responses to client

MongoDB connection string used inside container:


mongodb://mongo:27017/week5db


Here:
- `mongo` is the Docker service name
- Docker provides automatic internal DNS resolution

---

### 3.3 Database Service

- Technology: MongoDB Official Image
- Container Port: 27017
- Host Port: Not exposed
- Responsibility:
  - Stores application data
  - Handles read/write operations

MongoDB is not exposed to the host for security reasons.

---

### 3.4 Docker Volume

Volume Name:


week5_mongo-data


Purpose:
- Stores MongoDB data outside the container filesystem
- Ensures persistence across container restarts
- Prevents data loss during redeployment

Volume Mapping:


week5_mongo-data:/data/db


---

## 4. Networking

Docker Compose automatically creates:

- A bridge network
- Internal DNS resolution
- Service-to-service communication

This allows containers to communicate using service names:

- client → server
- server → mongo

No manual network configuration is required.

---

## 5. Port Mapping

| Service | Container Port | Host Port |
|----------|---------------|-----------|
| Client   | 3001          | 3001      |
| Server   | 3000          | 3000      |
| MongoDB  | 27017         | Not Exposed |

---

## 6. Request Lifecycle

1. User opens browser at http://localhost:3001
2. React application loads from client container
3. React sends request to server container
4. Server processes request
5. Server communicates with MongoDB
6. MongoDB returns data
7. Server sends response back to client
8. Client updates UI

---

## 7. Deployment Command

Application is deployed using:


docker compose up --build -d


This command:
- Builds Docker images
- Creates containers
- Sets up network
- Attaches volumes
- Runs services in detached mode

---

## 8. Architecture Characteristics

- Containerized multi-service setup
- Internal service communication
- Persistent database storage
- Isolated service layers
- Production-style deployment structure

---

## 9. Conclusion

This architecture demonstrates:

- Full-stack containerization
- Service separation
- Internal Docker networking
- Data persistence using volumes
- Structured deployment using Docker Compose

The system is modular, maintainable, and aligned with modern DevOps practices.
