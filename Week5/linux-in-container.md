# Week 5 — Linux Inside Docker Container

## 1. Entering Container

Command used:

docker exec -it week5-container /bin/sh

This allows us to access the running container shell,
similar to SSH into a remote production server.

---

## 2. File Structure

Command:

ls -la

Observed:

- /app directory contains:
  - server.js
  - package.json
  - node_modules

This is the working directory defined in Dockerfile.

---

## 3. Running Processes

Command:

ps aux

Observation:

- Node process running
- PID visible
- Container runs minimal OS with few processes

---

## 4. Resource Monitoring

Command:

top

Observed:

- Node consuming memory
- CPU usage minimal

---

## 5. Disk Usage

Command:

df -h
du -sh .

Observation:

- Container has its own filesystem layer
- App folder size depends on node_modules

---

## 6. Logs

Command:

docker logs week5-container

Observation:

- Shows console.log output from server.js
- Logs are stored by Docker daemon

---

## Key Learning

A Docker container is:
- A lightweight Linux environment
- Running isolated processes
- With its own filesystem
- But sharing host kernel

This mirrors production servers.