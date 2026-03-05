🔐 SSL Setup Documentation

📌 Objective

Configure HTTPS using NGINX with a locally trusted SSL certificate for a Dockerized backend application.

This setup includes:

SSL certificate generation using mkcert

Mounting certificates into NGINX container

Configuring HTTPS server block

Enabling HTTP → HTTPS redirection

Verifying SSL termination and load balancing


🧰 Tech Stack Used

Docker

Docker Compose

NGINX

mkcert (local CA certificate generator)

React frontend

Node.js backend

🪪 Step 1 — Install mkcert

📜 Step 2 — Generate SSL Certificate

This generates:

localhost.pem
localhost-key.pem

These files are used by NGINX for HTTPS.

🐳 Step 3 — Mount Certificates in Docker

In docker-compose.yml:

volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf
  - ./nginx/certs:/etc/nginx/certs

This makes certificates available inside the container.

🌐 Step 4 — Configure NGINX for HTTPS

🔁 Step 5 — Rebuild Containers

docker compose down
docker compose up --build

🧪 Step 6 — Verify HTTPS

Test in Terminal
curl -k https://localhost/api/health

Expected response:

{"container":"<container_id>"}

Test in Browser

Open:

https://localhost

Verify:

🔒 Lock icon visible

No certificate warnings

Application loads correctly

✅ Final Outcome

Successfully implemented:

Local trusted SSL certificate

HTTPS in Docker

SSL termination at NGINX

HTTP to HTTPS redirect

Load balancing across backend containers

Secure frontend-to-backend communication


