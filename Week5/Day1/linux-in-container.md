# Linux Inside Container Observation

## Container Details
- Image Name: `week5-day1-node-app`
- Container Name: `week5-day1-container`
- Base Image: `node:20-alpine`

## Objective
The purpose of this exercise was to understand Docker fundamentals and inspect Linux internals inside a running container.

## Commands Used

### Enter container
```sh
docker exec -it week5-day1-container /bin/sh

Explore filesystem

pwd
ls
ls -lah

Check user and OS

whoami
hostname
cat /etc/os-release

Check processes and environment

ps
env

Check disk usage

du -sh /app
df -h

Check logs from host

docker logs week5-day1-container

Working directory

The working directory inside the container was /app, which was set using WORKDIR /app in the Dockerfile.

Files inside the container

The application files such as app.js and package.json were present inside the /app directory.

User

The container was running as root by default.

Operating system

The container used Alpine Linux because the base image was node:20-alpine.

Processes

The container had very few running processes, showing that containers are lightweight and usually run only the main application process.

Logs

Application logs were visible using docker logs, which means Docker captured stdout/stderr from the Node process.

Disk usage

The /app directory contained the application files, and disk commands showed the container filesystem layout.