# Day 4 — SSL + mkcert + HTTPS Setup

## Objective
The goal of this task was to enable HTTPS locally using NGINX inside Docker, terminate TLS at NGINX, and redirect all HTTP traffic to HTTPS.

## Concepts Used

### SSL/TLS
TLS encrypts traffic between browser and server and uses certificates to prove server identity.

### mkcert
mkcert was used to generate locally trusted development certificates for the local domain.

### HTTPS termination
NGINX handles the HTTPS connection and forwards normal HTTP traffic internally to the backend container.

### HTTP to HTTPS redirect
A port 80 server block was configured to permanently redirect all traffic to HTTPS.

## Local Domain
The domain `day4.local` was mapped to `127.0.0.1` in `/etc/hosts`.

## Certificate Generation
Certificates were generated using:

```bash
mkcert -install
mkcert -cert-file day4.local.pem -key-file day4.local-key.pem day4.local localhost 127.0.0.1 ::1

### Docker Setup

The NGINX container mounts:

nginx.conf

certificate files from ./certs

The backend container runs the Node application internally on port 3000.

### NGINX HTTPS Configuration

NGINX listens on:

port 80 for HTTP redirect

port 443 with SSL enabled

It uses:

ssl_certificate

ssl_certificate_key

and proxies requests to the backend container.

### Verification

The setup was verified by:

checking HTTP redirect with curl -I http://day4.local

opening https://day4.local in the browser

confirming the lock icon appeared

confirming backend response loaded correctly through NGINX