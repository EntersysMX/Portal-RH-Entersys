# Portal RH EnterSys - Deployment Guide

Instructions for deploying and updating the Portal RH application on the EnterSys production server.

## Architecture

```
                    Internet
                       |
                   [Traefik]
                       |
              rh.entersys.mx (HTTPS)
                       |
                  [portal-rh]          <- nginx serving React SPA
                   /       \
            /api/*        /assets/*, /files/*
               |               |
        [frappe-backend]  [frappe-frontend]  <- Frappe internal nginx
               |
         [frappe-mariadb]
         [frappe-redis-cache]
         [frappe-redis-queue]
         [frappe-websocket]
         [frappe-worker]
         [frappe-scheduler]
```

**9 containers total**, all on `portal-rh-internal` network. Only `portal-rh` connects to the `traefik` external network.

## Server Details

- **Server:** prod-server (34.59.193.54), GCP e2-standard-4
- **App directory:** `/home/Usuario/portal-rh-entersys`
- **Domain:** https://rh.entersys.mx
- **Compose file:** `docker-compose.prod.yml`
- **Frappe site name:** `rh.entersys.mx`
- **Frappe admin:** `administrator` / `admin` (change in production)

## Prerequisites

- `gcloud` CLI authenticated with access to `prod-server`
- Git access to `https://github.com/EntersysMX/Portal-RH-Entersys.git`
- The Traefik network must exist on the server (`docker network ls | grep traefik`)

---

## Routine Update (Code Changes Only)

When React frontend code has been pushed to `main`:

```bash
# 1. SSH to server
gcloud compute ssh prod-server --zone=us-central1-c

# 2. Pull latest code
cd ~/portal-rh-entersys
git pull origin main

# 3. Rebuild only the portal-rh container
docker compose -f docker-compose.prod.yml build --no-cache portal-rh

# 4. Recreate just the portal-rh container (zero-downtime for Frappe)
docker compose -f docker-compose.prod.yml up -d portal-rh

# 5. Verify
docker compose -f docker-compose.prod.yml ps
curl -sf -o /dev/null -w '%{http_code}\n' https://rh.entersys.mx
```

## Full Redeployment (From Scratch)

If the server directory is missing or needs to be recreated:

```bash
# 1. SSH to server
gcloud compute ssh prod-server --zone=us-central1-c

# 2. Clone the repository
cd ~
git clone https://github.com/EntersysMX/Portal-RH-Entersys.git portal-rh-entersys
cd portal-rh-entersys

# 3. Create the .env file (NEVER commit this file)
cat > .env << 'EOF'
FRAPPE_SITE_NAME=rh.entersys.mx
MARIADB_ROOT_PASSWORD=<GENERATE_STRONG_PASSWORD>
VITE_FRAPPE_URL=https://rh.entersys.mx
EOF

# 4. Start infrastructure services first (MariaDB, Redis)
docker compose -f docker-compose.prod.yml up -d frappe-mariadb frappe-redis-cache frappe-redis-queue
sleep 10

# 5. Start Frappe backend (needs DB ready first)
docker compose -f docker-compose.prod.yml up -d frappe-backend
sleep 15

# 6. Configure Frappe to connect to Docker services
docker exec frappe-backend bash -c 'cat > /home/frappe/frappe-bench/sites/common_site_config.json << JSONEOF
{
  "db_host": "frappe-mariadb",
  "db_port": 3306,
  "redis_cache": "redis://frappe-redis-cache:6379",
  "redis_queue": "redis://frappe-redis-queue:6379",
  "redis_socketio": "redis://frappe-redis-queue:6379",
  "socketio_port": 9000
}
JSONEOF'

# 7. Create the Frappe site
source .env
docker exec frappe-backend bench new-site $FRAPPE_SITE_NAME \
  --mariadb-root-password "$MARIADB_ROOT_PASSWORD" \
  --admin-password admin \
  --force

# 8. Install ERPNext
docker exec frappe-backend bench --site $FRAPPE_SITE_NAME install-app erpnext

# 9. Enable CORS and scheduler
docker exec frappe-backend bench --site $FRAPPE_SITE_NAME set-config allow_cors '"*"'
docker exec frappe-backend bench --site $FRAPPE_SITE_NAME enable-scheduler

# 10. Start all remaining services
docker compose -f docker-compose.prod.yml up -d

# 11. Verify everything is healthy
docker compose -f docker-compose.prod.yml ps
curl -sf -o /dev/null -w '%{http_code}\n' https://rh.entersys.mx
```

## Compose File Reference

The production compose file is `docker-compose.prod.yml` (NOT `docker-compose.yml` which is for local dev).

### Services

| Container | Image | Port | Memory Reservation | Health Check |
|-----------|-------|------|-------------------|--------------|
| portal-rh | Built from Dockerfile | 80 (internal) | 128M | `curl -sf http://localhost/` |
| frappe-backend | frappe/erpnext:v15 | 8000 (internal) | 512M | `curl -sf -H 'Host: $FRAPPE_SITE_NAME' http://localhost:8000/api/method/ping` |
| frappe-frontend | frappe/erpnext:v15 | 8080 (internal) | 128M | `curl -sf http://localhost:8080/` |
| frappe-websocket | frappe/erpnext:v15 | 9000 (internal) | 128M | - |
| frappe-worker | frappe/erpnext:v15 | - | 256M | - |
| frappe-scheduler | frappe/erpnext:v15 | - | 256M | - |
| frappe-mariadb | mariadb:10.11 | 3306 (internal) | 256M | `mysqladmin ping` |
| frappe-redis-cache | redis:7-alpine | 6379 (internal) | 64M | `redis-cli ping` |
| frappe-redis-queue | redis:7-alpine | 6379 (internal) | 64M | `redis-cli ping` |

**Total estimated RAM:** ~1.8 GB (reservations only, no hard limits per EnterSys standard)

### Networks

- `traefik` (external) - Only `portal-rh` connects here for public HTTPS access
- `portal-rh-internal` (bridge) - All services communicate internally

### Volumes

- `frappe-mariadb-data` - MariaDB data
- `frappe-sites` - Frappe site config, assets, uploads
- `frappe-logs` - Frappe application logs

## Important Notes

### EnterSys Standards Applied

- **Traefik labels** on `portal-rh` for automatic HTTPS via Let's Encrypt
- **Soft limits only** (`deploy.resources.reservations.memory`) - NEVER use `mem_limit` or `limits`
- **Health checks** on all stateful services
- **Logging** with `json-file` driver, `max-size: 10m`, `max-file: 3`
- **No ports exposed to host** - everything goes through Traefik

### Frappe Health Check Requires Host Header

The Frappe backend requires a `Host` header matching the site name (`rh.entersys.mx`) for API requests to work. Without it, requests return 404. This is configured in the health check.

### HRMS Module

The `frappe/erpnext:v15` image does NOT include the standalone HRMS module. ERPNext's built-in HR module is available and sufficient for the Portal RH frontend.

### Common Site Config

The file `common_site_config.json` inside the `frappe-sites` volume must contain the Docker service hostnames (not `localhost`). This is created during initial setup (step 6 of Full Redeployment).

---

## Post-Deploy Checklist

After deployment, complete these on the server:

### Monitoring (in `~/entersys-monitoring-stack/configs/prometheus/`)

```yaml
# prometheus.yml - Add to blackbox-http targets:
- https://rh.entersys.mx
```

```yaml
# alerts/entersys-alerts.yml - Add to application_alerts group:
- alert: PortalRHDown
  expr: probe_success{job="blackbox-http", instance="https://rh.entersys.mx"} == 0
  for: 1m
  labels:
    severity: critical
    service: portal-rh
    component: website
  annotations:
    summary: "Portal RH no disponible"
    description: "https://rh.entersys.mx no responde"
    action: "Verificar contenedores portal-rh y frappe-backend"
```

Then reload Prometheus:
```bash
docker exec entersys-prometheus kill -HUP 1
```

### Backups (in `/srv/backups/`)

Add to `backup-databases.sh`:
```bash
# Portal RH - MariaDB (Frappe)
echo "[$(date)] Backup: frappe-mariadb..." | tee -a $LOG_FILE
docker exec frappe-mariadb sh -c 'mysqldump --all-databases -u root -p"$MYSQL_ROOT_PASSWORD"' | gzip > \
  $BACKUP_DIR/portal-rh-mariadb-$DATE.sql.gz
echo "[$(date)] OK portal-rh-mariadb ($(du -h $BACKUP_DIR/portal-rh-mariadb-$DATE.sql.gz | cut -f1))" | tee -a $LOG_FILE
```

Add to `backup-configs.sh`:
```bash
# Portal RH configs
tar -czf $BACKUP_DIR/portal-rh-config-$DATE.tar.gz \
  -C /home/Usuario portal-rh-entersys/.env \
  -C /home/Usuario portal-rh-entersys/docker-compose.prod.yml \
  -C /home/Usuario portal-rh-entersys/nginx.conf \
  2>&1 | tee -a $LOG_FILE
```

---

## Troubleshooting

### Containers won't start (health check fails)

```bash
# Check specific container logs
docker compose -f docker-compose.prod.yml logs <service-name> --tail=30

# Test health check manually
docker exec frappe-backend curl -sf -H 'Host: rh.entersys.mx' http://localhost:8000/api/method/ping
docker exec portal-rh curl -sf http://localhost/
```

### Frappe site not responding

```bash
# Check common_site_config.json
docker exec frappe-backend cat /home/frappe/frappe-bench/sites/common_site_config.json

# It MUST have db_host: "frappe-mariadb" (not localhost or 127.0.0.1)
```

### Need to recreate site (data loss)

```bash
source .env
docker exec frappe-backend bench new-site $FRAPPE_SITE_NAME \
  --mariadb-root-password "$MARIADB_ROOT_PASSWORD" \
  --admin-password admin \
  --force
docker exec frappe-backend bench --site $FRAPPE_SITE_NAME install-app erpnext
docker exec frappe-backend bench --site $FRAPPE_SITE_NAME set-config allow_cors '"*"'
docker exec frappe-backend bench --site $FRAPPE_SITE_NAME enable-scheduler
docker compose -f docker-compose.prod.yml restart
```

### Portal shows blank page

Check that the React build succeeded in the Docker image:
```bash
docker exec portal-rh ls /usr/share/nginx/html/
# Should show: index.html, assets/, vite.svg
```
