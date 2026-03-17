# Guia de Infraestructura para Despliegue de Nuevas Aplicaciones

**Documento para:** Planificacion de nuevas aplicaciones con IA
**Servidor:** prod-server (EnterSys Production)
**Ultima actualizacion:** 2 de Marzo, 2026

---

## 1. Especificaciones del Servidor

### Hardware (Google Cloud Platform)

| Recurso | Especificacion | Disponible |
|---------|----------------|------------|
| **CPU** | Intel Xeon @ 2.20GHz (2 cores, 4 threads) | 4 vCPUs |
| **RAM Total** | 16 GB | ~4.8 GB disponibles |
| **RAM Usada** | ~10 GB | 65% en uso |
| **Swap** | 8 GB | ~4 GB disponibles |
| **Disco Total** | 150 GB SSD (pd-balanced) | ~66 GB disponibles |
| **Disco Usado** | ~76 GB | 54% en uso |
| **Ubicacion** | us-central1-c | Iowa, USA |
| **Tipo Maquina** | e2-standard-4 | Proposito general |

### Sistema Operativo

- **OS:** Debian 12 (Bookworm)
- **Kernel:** Linux x86_64
- **Docker:** 28.3.2
- **Docker Compose:** v2.38.2

---

## 2. Arquitectura de Contenedores

### Estado Actual (Marzo 2026)

- **Contenedores activos:** 88 (3 pausados)
- **Redes Docker:** 22+
- **Volumenes persistentes:** 78+

### Reverse Proxy (Traefik)

Todas las aplicaciones web DEBEN usar Traefik como reverse proxy.

```yaml
# Configuracion requerida en docker-compose.yml
services:
  mi-app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mi-app.rule=Host(`miapp.dominio.com`)"
      - "traefik.http.routers.mi-app.entrypoints=websecure"
      - "traefik.http.routers.mi-app.tls.certresolver=letsencrypt"
      - "traefik.http.services.mi-app.loadbalancer.server.port=3000"
    networks:
      - traefik

networks:
  traefik:
    external: true
```

### Redes Docker Existentes

| Red | Proposito | Usar para |
|-----|-----------|-----------|
| `traefik` | Red principal de Traefik | Apps con dominio publico + comunicacion con proxy |
| `bridge` | Red por defecto | Apps aisladas |
| `saas-platform_scram-network` | SCRAM SaaS | Servicios SCRAM |
| `nutrition-intelligence-network` | Nutrition Intelligence | Servicios NI |
| `entersys-monitoring_monitoring` | Stack de monitoreo | Prometheus, Grafana, etc. |
| `ai-supra-agent_ai_internal` | AI Agent | Servicios de IA |
| `gestion-logistica_internal` | SCRAM Logistica | Servicios logistica |
| `web_intercel-internal` | Intercel | Servicios Intercel |
| `glpi_glpi_internal` | GLPI Helpdesk | Servicios GLPI |
| `matomo_matomo_internal` | Matomo Analytics | Servicios Matomo |
| `mautic_mautic_internal` | Mautic Marketing | Servicios Mautic |
| `wikijs_wikinet` | Wiki.js | Servicios Wiki |
| `content-management_entersys_net` | Content Management | API EnterSys |
| `scram-mautic-crm-network` | SCRAM Mautic CRM | Servicios CRM |
| `web-builder_default` | Web Builder | Servicios WebBuilder |
| `smartsheet-bind-internal` | Smartsheet Bind | Servicios Smartsheet |
| `internal-db-net` | Bases de datos internas | Conexiones DB internas |
| `natura-adminproyectos_default` | Natura AdminProyectos | Servicios Natura |
| `scram-repo_internal` | SCRAM Repo | Servicios SCRAM repo |

---

## 3. Puertos en Uso (NO DISPONIBLES)

Los siguientes puertos ya estan ocupados en el host:

| Puerto | Servicio | Acceso |
|--------|----------|--------|
| 22 | SSH | Externo (restringido) |
| 80 | Traefik (HTTP) | Publico |
| 443 | Traefik (HTTPS) | Publico |
| 3002 | SCRAM Landing Seguridad | Publico |
| 3003 | Nutrition Intelligence Frontend | Publico |
| 3100 | Loki (Logs) | Publico |
| 5050 | pgAdmin | Publico |
| 5432 | PostgreSQL (SCRAM prod) | Publico |
| 5434 | PostgreSQL (SCRAM logistica) | Solo localhost |
| 6379 | Redis (SCRAM prod) | Publico |
| 6381 | Redis (SCRAM logistica) | Solo localhost |
| 8000 | Nutrition Intelligence Backend | Publico |
| 8001 | Smartsheet Bind Awalab | Publico |
| 8080 | Traefik Dashboard | Publico |

**Nota:** La mayoria de contenedores exponen puertos solo internamente via Traefik, sin mapeo directo al host.

### Puertos Recomendados para Nuevas Apps

- **3004-3010**: Frontends adicionales
- **8002-8010**: APIs/Backends adicionales
- **5435-5440**: Bases de datos PostgreSQL adicionales
- **6382-6389**: Instancias Redis adicionales

---

## 4. Stack Tecnologico Existente

### Bases de Datos Disponibles

| Tipo | Version | Uso Actual | Instancias |
|------|---------|------------|------------|
| PostgreSQL | 16-alpine | Apps principales (SCRAM, NI, WebBuilder, Intercel, Wiki.js, AI Agent, Town, AtomicSales, Family Finance) | 10+ |
| MySQL | 8.0 | Mautic (x2), Matomo, GLPI (x2) | 5 |
| SQL Server | 2022-latest | Natura AdminProyectos, Colombia AdminProyectos | 2 |
| Redis | 7-alpine | Cache y sesiones (SCRAM, NI, Logistica SCRAM, Logistica Awalab, AtomicSales, Town) | 6 |

### Servicios de Soporte

| Servicio | Proposito |
|----------|-----------|
| Traefik v2.10 | Reverse proxy, SSL automatico |
| Socket Proxy | Proxy seguro para Docker API |
| Prometheus | Metricas (GOMEMLIMIT=2GiB, retencion 7d/3GB) |
| Grafana | Dashboards |
| AlertManager | Alertas por email |
| Loki | Agregacion de logs |
| Promtail | Recoleccion de logs |
| cAdvisor | Metricas de contenedores |
| Node Exporter | Metricas del sistema |
| Blackbox Exporter | Monitoreo HTTP/SSL externo |
| Alert Service | Servicio de alertas personalizado |
| MSSQL Exporter | Metricas de SQL Server |

---

## 5. Restricciones y Limites

### Recursos Criticos

```
ATENCION: Servidor optimizado Marzo 2026 pero requiere gestion cuidadosa

- RAM disponible: ~4.8 GB de 16 GB (65% en uso)
- CPU: 4 cores compartidos entre 88 contenedores (load avg ~3.5)
- Disco: ~66 GB libres de 150 GB (54% en uso)
- Swap activo (~4 GB usados): Normal para esta carga
- Cleanup Docker automatico: lunes y jueves 4 AM
```

### Limites Recomendados por Contenedor

**IMPORTANTE: Usar SOLO soft limits (reservations). NUNCA usar hard limits (limits).**
Los hard limits causan OOM kills que pueden tumbar todo el servidor.
El 2 de Marzo 2026, 37 OOM kills en matomo_app causaron reboot del servidor.

```yaml
# Ejemplo de reservations en docker-compose.yml
services:
  mi-app:
    deploy:
      resources:
        reservations:
          memory: 512M     # Soft limit - hint para scheduling
    # NUNCA usar:
    # mem_limit: 512M                    <- PROHIBIDO
    # deploy.resources.limits.memory     <- PROHIBIDO
```

### Aplicaciones que Consumen mas Recursos (Marzo 2026)

| Aplicacion | RAM | CPU | Notas |
|------------|-----|-----|-------|
| Prometheus | ~2.3 GB | <1% | Mayor consumidor, GOMEMLIMIT=2GiB, mem_limit 3g |
| cAdvisor | ~674 MB | <1% | Metricas contenedores, GOMEMLIMIT=750MiB, mem_limit 800m |
| AI Agent Backend | ~584 MB | <1% | AI Supra (reservation 1GB) |
| EnterSys Content API | ~500 MB | <1% | gunicorn -w 2 (optimizado de -w 4) |
| Natura SQL Server | ~397 MB | 2.8% | AdminProyectos (reservation 2GB) |
| Matomo App | ~324 MB | <1% | Analytics web (reservation 1GB) |
| Matomo MySQL | ~292 MB | 1% | Analytics DB (reservation 1GB) |
| n8n | ~298 MB | <1% | Automatizacion (reservation 1GB) |
| Col SQL Server | ~279 MB | 1.9% | AdminProyectos Colombia (reservation 2GB) |
| NI Backend | ~221 MB | <1% | Nutrition Intelligence API |
| Family Finance API | ~184 MB | <1% | API finanzas (reservation 450MB) |
| Traefik | ~139 MB | 2.4% | Reverse proxy (reservation 256MB) |

### Contenedores Pausados (Marzo 2026)

| Contenedor | RAM liberada | Razon |
|-----------|-------------|-------|
| smartsheet-bind-awalab | ~334 MB | No funciona como esperado |
| scram-frontend-test | ~63 MB | Test - pertenece a DEV |
| dev-entersys-postgres | ~29 MB | Dev - pertenece a DEV |

---

## 6. Requisitos para Nueva Aplicacion

### Checklist de Despliegue

**Infraestructura base:**
- [ ] Dockerfile optimizado (multi-stage build recomendado)
- [ ] docker-compose.yml con limites de recursos
- [ ] Labels de Traefik configurados
- [ ] Red `traefik` especificada
- [ ] Volumenes para datos persistentes
- [ ] Variables de entorno en archivo `.env`
- [ ] Health check configurado
- [ ] Puerto interno definido (no exponer directamente)

**Monitoreo (ver seccion 7):**
- [ ] Health check endpoint funcional (`/health` para APIs, `/` para webs)
- [ ] URL agregada al Blackbox Exporter en prometheus.yml
- [ ] Alertas configuradas en entersys-alerts.yml
- [ ] Metricas Prometheus (`/metrics`) expuestas (recomendado para APIs)
- [ ] Scrape job en prometheus.yml (si expone `/metrics`)
- [ ] Logging con formato JSON y limites de tamano

**Backups (ver seccion 8):**
- [ ] Base de datos agregada a `backup-databases.sh`
- [ ] Volumenes con datos persistentes respaldados
- [ ] docker-compose.yml y .env en `backup-configs.sh`
- [ ] Backup manual ejecutado y verificado

### Estructura Recomendada

```
/home/Usuario/mi-nueva-app/
├── docker-compose.yml
├── .env
├── Dockerfile
├── src/
└── data/          # Para volumenes si es necesario
```

### Template docker-compose.yml

```yaml
services:
  app:
    build: .
    container_name: mi-nueva-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mi-app.rule=Host(`app.midominio.com`)"
      - "traefik.http.routers.mi-app.entrypoints=websecure"
      - "traefik.http.routers.mi-app.tls.certresolver=letsencrypt"
      - "traefik.http.services.mi-app.loadbalancer.server.port=3000"
    networks:
      - traefik
      - internal
    deploy:
      resources:
        reservations:
          memory: 512M    # SOLO soft limits, NUNCA limits/mem_limit
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  database:
    image: postgres:16-alpine
    container_name: mi-app-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - internal
    deploy:
      resources:
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  traefik:
    external: true
  internal:
    driver: bridge

volumes:
  db-data:
```

---

## 7. Monitoreo y Observabilidad

Toda nueva app DEBE integrarse al stack de monitoreo existente. La configuracion
varia segun el tipo de aplicacion (API o App Web). A continuacion se detalla
cada nivel de monitoreo y las acciones requeridas por tipo.

### 7.1 Monitoreo Automatico (sin configuracion adicional)

Al desplegar cualquier contenedor, el stack ya recopila automaticamente:

| Componente | Que monitorea | Intervalo |
|------------|--------------|-----------|
| **cAdvisor** | CPU, RAM, red por contenedor (GOMEMLIMIT=750MiB) | 30s |
| **Node Exporter** | CPU, RAM, disco, red del host (sin systemd/processes) | 30s |
| **Loki + Promtail** | Logs de todos los contenedores | Tiempo real |
| **Prometheus** | Almacena todas las metricas | Retencion 7 dias / 3GB |
| **Grafana** | Visualizacion en https://monitoring.entersys.mx | - |

**No necesitas hacer nada** para que esto funcione. Solo despliega tu contenedor.

### 7.2 Health Checks en docker-compose.yml (OBLIGATORIO)

Todo contenedor DEBE tener un health check. Esto permite que Docker, Traefik
y el monitoreo sepan si la app esta funcionando.

**Para APIs (backend/REST/GraphQL):**

```yaml
services:
  mi-api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Tu API DEBE exponer un endpoint `/health` que retorne HTTP 200:

```json
// GET /health -> 200 OK
{ "status": "ok", "service": "mi-api", "version": "1.0.0" }
```

Para APIs con base de datos, incluir tambien la conectividad:

```json
// GET /health -> 200 OK
{ "status": "ok", "database": "connected", "redis": "connected" }
```

**Para Apps Web (frontend/SPA/SSR):**

```yaml
services:
  mi-web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```

**Para bases de datos:**

```yaml
services:
  mi-db-postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
      interval: 30s
      timeout: 5s
      retries: 3

  mi-db-mysql:
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 5s
      retries: 3

  mi-redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### 7.3 Monitoreo HTTP Externo via Blackbox Exporter (OBLIGATORIO para apps publicas)

El Blackbox Exporter verifica desde fuera que tus endpoints estan accesibles,
responden con HTTP 2xx, tienen SSL valido y no contienen errores en el body.

**Que valida automaticamente:**
- Status HTTP 200-308
- SSL presente y valido
- Body NO contiene: "Could not connect to database", "Internal Server Error",
  "Service Unavailable", "Bad Gateway"
- Timeout: 5 segundos

**Accion requerida:** Agregar tus URLs al archivo de Prometheus.

Archivo a modificar en el servidor:
`~/entersys-monitoring-stack/configs/prometheus/prometheus.yml`

```yaml
# Dentro del job 'blackbox-http', agregar tus URLs al bloque targets:
- job_name: 'blackbox-http'
  metrics_path: /probe
  params:
    module: [http_2xx]
  static_configs:
    - targets:
      # ... URLs existentes ...
      # === AGREGAR NUEVAS APPS AQUI ===
      - https://mi-app.entersys.mx              # App web publica
      - https://mi-api.entersys.mx/health       # Health check de API
      - https://mi-api.entersys.mx/api/v1/status # Endpoint de status
```

Despues de modificar, recargar Prometheus:
```bash
docker exec entersys-prometheus kill -HUP 1
# O reiniciar el contenedor:
docker restart entersys-prometheus
```

### 7.4 Metricas Prometheus Personalizadas (RECOMENDADO para APIs)

Si tu API expone un endpoint `/metrics` en formato Prometheus, puedes
habilitar scraping directo para metricas de negocio (requests/s, latencia,
errores por endpoint, etc).

**Librerias recomendadas por stack:**

| Stack | Libreria |
|-------|----------|
| Node.js/Express | `prom-client` |
| Python/FastAPI | `prometheus-fastapi-instrumentator` |
| Python/Django | `django-prometheus` |
| Go | `prometheus/client_golang` |
| .NET | `prometheus-net` |

**Ejemplo para FastAPI (Python):**

```python
# main.py
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
# Esto expone /metrics automaticamente con:
# - http_requests_total
# - http_request_duration_seconds
# - http_requests_in_progress
```

**Ejemplo para Express (Node.js):**

```javascript
// server.js
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

**Agregar scrape job en Prometheus:**

Archivo: `~/entersys-monitoring-stack/configs/prometheus/prometheus.yml`

```yaml
# Agregar NUEVO job al final de scrape_configs:
- job_name: 'mi-nueva-api'
  static_configs:
    - targets: ['mi-nueva-api:8000']
      labels:
        project: 'mi-proyecto'
        environment: 'production'
  scrape_interval: 30s
  metrics_path: '/metrics'
```

### 7.5 Alertas (OBLIGATORIO para apps criticas)

Las alertas se configuran en:
`~/entersys-monitoring-stack/configs/prometheus/alerts/entersys-alerts.yml`

**Canales de alerta configurados:**

| Severidad | Canal | Tiempo de repeticion |
|-----------|-------|---------------------|
| `critical` | WhatsApp (Twilio) + Webhook | Cada 30 minutos |
| `warning` | Email (SMTP) | Cada 30 minutos |

**Agregar alertas para tu nueva app:**

```yaml
# Agregar al grupo application_alerts en entersys-alerts.yml

# Para Apps Web - alerta si el sitio no responde
- alert: MiAppWebDown
  expr: probe_success{job="blackbox-http", instance="https://mi-app.entersys.mx"} == 0
  for: 1m
  labels:
    severity: critical
    service: mi-app
    component: website
  annotations:
    summary: "Mi App Web no disponible"
    description: "https://mi-app.entersys.mx no responde"
    action: "Verificar contenedor y Traefik"

# Para APIs - alerta si el health check falla
- alert: MiAPIDown
  expr: probe_success{job="blackbox-http", instance="https://mi-api.entersys.mx/health"} == 0
  for: 30s
  labels:
    severity: critical
    service: mi-api
    component: health-check
  annotations:
    summary: "API mi-api health check fallando"
    description: "El endpoint /health no responde"
    action: "Verificar API y base de datos"

# Para APIs con metricas - alerta por latencia alta
- alert: MiAPIHighLatency
  expr: http_request_duration_seconds{handler!="/metrics",handler!="/health",job="mi-nueva-api"} > 5
  for: 2m
  labels:
    severity: warning
    service: mi-api
    component: performance
  annotations:
    summary: "Latencia alta en mi-api"
    description: "Tiempo de respuesta: {{ $value }}s"
    action: "Optimizar endpoints lentos"

# Para APIs con metricas - alerta por tasa de errores alta
- alert: MiAPIHighErrorRate
  expr: rate(http_requests_total{status=~"5..",job="mi-nueva-api"}[5m]) / rate(http_requests_total{job="mi-nueva-api"}[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
    service: mi-api
    component: errors
  annotations:
    summary: "Alta tasa de errores 5xx en mi-api"
    description: "{{ $value | humanizePercentage }} de requests fallando"
    action: "Revisar logs de la API"
```

Despues de modificar alertas, recargar Prometheus:
```bash
docker exec entersys-prometheus kill -HUP 1
```

### 7.6 Logs

Los logs se recopilan automaticamente via Loki. Para mejor trazabilidad,
usa formato JSON estructurado:

```json
{"level":"info","timestamp":"2026-01-01T00:00:00Z","service":"mi-api","message":"Request processed","method":"GET","path":"/api/users","status":200,"duration_ms":45}
```

**Configuracion de logging en docker-compose.yml (recomendado):**

```yaml
services:
  mi-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        tag: "mi-app"
```

Consultar logs en Grafana: https://monitoring.entersys.mx → Explore → Loki
```
{container_name="mi-app"} |= "error"
```

### 7.7 Dashboard en Grafana (OPCIONAL)

Si tu app expone metricas Prometheus, puedes crear un dashboard dedicado.

Dashboards existentes como referencia:
- `entersys-web-apps.json` - Para apps web
- `api-monitoring.json` - Para APIs

Para desplegar un dashboard nuevo, usa el skill `grafana_deploy_dashboard`
o coloca el JSON en:
`~/entersys-monitoring-stack/configs/grafana/dashboards/mi-app-dashboard.json`

### 7.8 Resumen: Checklist de Monitoreo por Tipo de App

#### API / Backend

- [ ] Health check en docker-compose.yml (`/health` endpoint)
- [ ] URL de health check agregada a Blackbox Exporter en prometheus.yml
- [ ] Libreria de metricas Prometheus instalada (exponer `/metrics`)
- [ ] Scrape job agregado en prometheus.yml
- [ ] Alertas configuradas: endpoint down + latencia + error rate
- [ ] Logs en formato JSON estructurado
- [ ] Limites de logging configurados (max-size, max-file)

#### App Web / Frontend

- [ ] Health check en docker-compose.yml (responde en `/`)
- [ ] URL publica agregada a Blackbox Exporter en prometheus.yml
- [ ] Alerta configurada: sitio down
- [ ] Limites de logging configurados (max-size, max-file)

---

## 8. Backups

Toda nueva app que tenga base de datos o datos persistentes DEBE integrarse
al sistema de backups. Hay dos scripts centralizados que se ejecutan por cron.

### 8.1 Backup de Bases de Datos (Diario, 2 AM)

**Script:** `/srv/backups/backup-databases.sh` (cron en el servidor)
**Destino:** `/srv/backups/databases/`
**Retencion:** 7 dias (archivos mas antiguos se eliminan automaticamente)
**Log:** `/var/log/backups.log`

**Bases de datos actualmente respaldadas:**

| Contenedor | Tipo | Comando de dump |
|------------|------|----------------|
| entersys-postgres | PostgreSQL | `pg_dumpall -U postgres` |
| scram-postgres-prod | PostgreSQL | `pg_dumpall -U postgres` |
| wikijs_db | PostgreSQL | `pg_dumpall -U postgres` |
| matomo_mysql | MySQL | `mysqldump --all-databases` |
| mautic_db | MySQL | `mysqldump --all-databases` |
| scram-redis-prod | Redis | `BGSAVE` + copia de dump.rdb |

**Accion requerida: Agregar tu base de datos al script.**

Archivo a modificar en el servidor: `/srv/backups/backup-databases.sh`

**Para PostgreSQL:**

```bash
# N. Backup PostgreSQL Mi Nueva App
echo "[$(date)] Backup: mi-app-db..." | tee -a $LOG_FILE
docker exec mi-app-db pg_dumpall -U postgres | gzip > \
  $BACKUP_DIR/mi-app-postgres-$DATE.sql.gz
echo "[$(date)] ✓ mi-app-postgres completado ($(du -h $BACKUP_DIR/mi-app-postgres-$DATE.sql.gz | cut -f1))" | tee -a $LOG_FILE
```

**Para MySQL:**

```bash
# N. Backup MySQL Mi Nueva App
echo "[$(date)] Backup: mi-app-mysql..." | tee -a $LOG_FILE
docker exec mi-app-mysql sh -c 'mysqldump --all-databases -u root -p"$MYSQL_ROOT_PASSWORD"' | gzip > \
  $BACKUP_DIR/mi-app-mysql-$DATE.sql.gz
echo "[$(date)] ✓ mi-app-mysql completado ($(du -h $BACKUP_DIR/mi-app-mysql-$DATE.sql.gz | cut -f1))" | tee -a $LOG_FILE
```

**Para Redis:**

```bash
# N. Backup Redis Mi Nueva App
echo "[$(date)] Backup: mi-app-redis..." | tee -a $LOG_FILE
docker exec mi-app-redis redis-cli BGSAVE
sleep 5
docker cp mi-app-redis:/data/dump.rdb $BACKUP_DIR/mi-app-redis-$DATE.rdb 2>/dev/null || true
if [ -f "$BACKUP_DIR/mi-app-redis-$DATE.rdb" ]; then
  echo "[$(date)] ✓ mi-app-redis completado ($(du -h $BACKUP_DIR/mi-app-redis-$DATE.rdb | cut -f1))" | tee -a $LOG_FILE
else
  echo "[$(date)] ⚠ mi-app-redis: No se pudo copiar dump.rdb" | tee -a $LOG_FILE
fi
```

**Para SQL Server:**

```bash
# N. Backup SQL Server Mi Nueva App
echo "[$(date)] Backup: mi-app-mssql..." | tee -a $LOG_FILE
docker exec mi-app-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" \
  -Q "BACKUP DATABASE [MiAppDB] TO DISK = '/var/opt/mssql/backup/mi-app-$DATE.bak'"
docker cp mi-app-mssql:/var/opt/mssql/backup/mi-app-$DATE.bak $BACKUP_DIR/ 2>/dev/null || true
gzip $BACKUP_DIR/mi-app-$DATE.bak
echo "[$(date)] ✓ mi-app-mssql completado" | tee -a $LOG_FILE
```

### 8.2 Backup de Configuraciones (Semanal, Domingos 3 AM)

**Script:** `/srv/backups/backup-configs.sh` (cron en el servidor)
**Destino:** `/srv/backups/configs/`
**Retencion:** 30 dias

**Actualmente respalda:**
- Stack de monitoreo (Prometheus, Grafana, AlertManager configs)
- Configuracion de Traefik
- Configs de apps (nginx.conf, frontends)
- Archivos docker-compose

**Accion requerida: Agregar configs de tu app si tiene archivos de configuracion
externos (nginx.conf, configs custom, etc).**

Archivo a modificar: `/srv/backups/backup-configs.sh`

```bash
# N. Backup de configuracion Mi Nueva App
tar -czf $BACKUP_DIR/mi-nueva-app-config-$DATE.tar.gz \
  -C /home/Usuario mi-nueva-app/.env \
  -C /home/Usuario mi-nueva-app/docker-compose.yml \
  -C /home/Usuario mi-nueva-app/nginx.conf \
  2>&1 | tee -a $LOG_FILE
echo "[$(date)] ✓ Mi Nueva App config ($(du -h $BACKUP_DIR/mi-nueva-app-config-$DATE.tar.gz | cut -f1))" | tee -a $LOG_FILE
```

### 8.3 Backup de Volumenes Docker (para datos no-DB)

Si tu app genera archivos persistentes (uploads, media, PDFs, etc.) en volumenes
Docker, DEBES agregar backup de esos volumenes:

```bash
# Backup de volumen de uploads
docker run --rm -v mi-app-uploads:/data -v /srv/backups/volumes:/backup \
  alpine tar czf /backup/mi-app-uploads-$DATE.tar.gz -C /data .
```

### 8.4 Verificar que los Backups Funcionan

Despues de agregar tu app al script, ejecutar manualmente para verificar:

```bash
# Ejecutar script de backup manualmente
sudo /srv/backups/backup-databases.sh

# Verificar que se crearon los archivos
ls -lah /srv/backups/databases/ | grep mi-app

# Verificar que el archivo NO esta vacio (>100 bytes)
stat /srv/backups/databases/mi-app-postgres-*.sql.gz

# Ver log
tail -20 /var/log/backups.log
```

### 8.5 Cron Jobs Configurados

```bash
# Ver crontab actual
crontab -l

# Los jobs existentes:
# 0 2 * * * /srv/backups/backup-databases.sh          # Diario 2 AM
# 0 3 * * 0 /srv/backups/backup-configs.sh            # Domingos 3 AM
# 0 4 1 * * /srv/backups/test-restore.sh              # Mensual 1ro 4 AM
# 0 4 * * 1,4 /srv/backups/docker-cleanup.sh          # Lunes y Jueves 4 AM
```

### 8.6 Limpieza Automatica Docker

El script `/srv/backups/docker-cleanup.sh` se ejecuta lunes y jueves a las 4 AM:
- Limpia imagenes Docker >48h sin uso
- Limpia build cache >48h
- Limpia volumenes dangling
- El build cache crece ~5 GB/dia por deployments, sin limpieza llega a 15+ GB en 3 dias

### 8.7 Resumen: Checklist de Backups por Tipo de App

#### API con Base de Datos

- [ ] Agregar dump de BD al script `backup-databases.sh`
- [ ] Ejecutar backup manual y verificar archivo generado
- [ ] Verificar que el archivo no esta vacio
- [ ] Si tiene uploads/media, agregar backup de volumen
- [ ] Agregar docker-compose.yml y .env a `backup-configs.sh`

#### App Web (frontend estatico)

- [ ] Agregar docker-compose.yml y .env a `backup-configs.sh`
- [ ] Si tiene assets generados o uploads, agregar backup de volumen

#### App Web con BD (fullstack)

- [ ] Todo lo de "API con Base de Datos"
- [ ] Todo lo de "App Web"

---

## 9. Seguridad

### Reglas de Firewall GCP

| Puerto | Protocolo | Acceso |
|--------|-----------|--------|
| 22 | TCP | SSH (restringido) |
| 80 | TCP | HTTP (redirige a 443) |
| 443 | TCP | HTTPS |
| 8080 | TCP | Traefik Dashboard |
| 3100 | TCP | Loki (logs) |
| 5050 | TCP | pgAdmin |
| 8000-8001 | TCP | APIs Backend |

### Buenas Practicas

1. **NUNCA** exponer puertos directamente al exterior (usar Traefik)
2. **NUNCA** usar credenciales en el codigo (usar variables de entorno)
3. **SIEMPRE** usar HTTPS (Traefik lo maneja automaticamente)
4. **SIEMPRE** definir health checks
5. Usar imagenes oficiales o verificadas
6. Mantener imagenes actualizadas

### Secretos

```yaml
# Usar archivo .env (NO commitear a git)
environment:
  - DB_PASSWORD=${DB_PASSWORD}
  - API_KEY=${API_KEY}
```

---

## 10. Costos Asociados

### Costo Base del Servidor

| Concepto | MXN/mes | USD/mes |
|----------|---------|---------|
| VM e2-standard-4 | ~$1,720 | ~$98 |
| Disco 150GB | ~$263 | ~$15 |
| Snapshots | ~$20 | ~$1 |
| **Total Base** | **~$2,003** | **~$114** |

### Costos Adicionales Potenciales

| Servicio | Costo | Notas |
|----------|-------|-------|
| Vertex AI (Gemini) | ~$7 MXN/dia | Si se usa IA |
| Network Egress | Variable | Trafico saliente |
| Cloud Storage | $0.02/GB/mes | Si se requiere |

---

## 11. Proceso de Despliegue

### Pasos para Desplegar Nueva App

1. **Conectar al servidor:**
   ```bash
   gcloud compute ssh prod-server --zone=us-central1-c
   ```

2. **Crear directorio:**
   ```bash
   mkdir -p ~/mi-nueva-app && cd ~/mi-nueva-app
   ```

3. **Crear archivos de configuracion:**
   - docker-compose.yml
   - .env
   - Dockerfile (si aplica)

4. **Verificar red Traefik:**
   ```bash
   docker network ls | grep traefik
   ```

5. **Desplegar:**
   ```bash
   docker compose up -d
   ```

6. **Verificar estado:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

7. **Verificar en Traefik:**
   - Acceder a https://app.midominio.com
   - Revisar dashboard Traefik si hay errores

8. **Configurar monitoreo:**
   ```bash
   # Agregar URL al blackbox exporter en prometheus.yml
   nano ~/entersys-monitoring-stack/configs/prometheus/prometheus.yml
   # Agregar alertas en entersys-alerts.yml
   nano ~/entersys-monitoring-stack/configs/prometheus/alerts/entersys-alerts.yml
   # Recargar Prometheus
   docker exec entersys-prometheus kill -HUP 1
   ```

9. **Configurar backups:**
   ```bash
   # Agregar BD al script de backup
   nano /srv/backups/backup-databases.sh
   # Ejecutar backup manual de prueba
   sudo /srv/backups/backup-databases.sh
   # Verificar
   ls -lah /srv/backups/databases/ | grep mi-app
   ```

10. **Verificar integracion completa:**
    - Confirmar que la app aparece en Grafana (dashboard de contenedores)
    - Confirmar que Blackbox muestra `probe_success = 1`
    - Confirmar que el backup se genero correctamente
    - Confirmar que las alertas estan registradas (Prometheus → Alerts)

---

## 12. Herramientas de Claude Code (Skills y Commands Globales)

Se tienen instalados **skills, commands y agents** globalmente en `~/.claude/`
que estan disponibles en **todos los proyectos** de Claude Code.

### Skills Instalados

| Skill | Descripcion |
|-------|-------------|
| `create-plans` | Planificacion jerarquica de proyectos con milestones |
| `debug-like-expert` | Debugging sistematico con analisis de causa raiz |
| `create-agent-skills` | Crear nuevos skills para Claude Code |
| `create-mcp-servers` | Crear MCP servers (TypeScript o Python) |
| `create-hooks` | Crear hooks que se ejecutan en eventos |
| `create-meta-prompts` | Crear meta-prompts con dependencias |
| `create-slash-commands` | Crear nuevos slash commands |
| `create-subagents` | Crear subagentes especializados |
| `setup-ralph` | Configurar loop de codigo autonomo |
| `expertise/iphone-apps` | Desarrollo de apps iOS |
| `expertise/macos-apps` | Desarrollo de apps macOS |

### Slash Commands Disponibles

**Productividad:**
- `/create-plan` - Crea plan accionable para un proyecto
- `/run-plan` - Ejecuta un plan existente paso a paso
- `/debug` - Debugging metódico con evidencia
- `/whats-next` - Sugiere siguiente accion
- `/add-to-todos` - Captura ideas sin perder contexto
- `/check-todos` - Revisa lista de pendientes
- `/ask-me-questions` - Claude hace preguntas para entender mejor

**Creacion de herramientas:**
- `/create-agent-skill` - Crea un nuevo skill
- `/create-hook` - Crea un hook
- `/create-slash-command` - Crea un nuevo comando
- `/create-subagent` - Crea un subagente
- `/create-meta-prompt` - Crea meta-prompt
- `/create-prompt` - Crea prompt optimizado

**Modelos de pensamiento** (`/consider/`):
- `/consider/5-whys` - Los 5 porques (causa raiz)
- `/consider/first-principles` - Razonamiento desde cero
- `/consider/pareto` - Regla 80/20
- `/consider/swot` - Fortalezas, debilidades, oportunidades, amenazas
- `/consider/eisenhower-matrix` - Urgente vs importante
- `/consider/occams-razor` - Solucion mas simple
- `/consider/inversion` - Pensar al reves para evitar errores
- `/consider/second-order` - Efectos de segundo orden
- `/consider/10-10-10` - Impacto a 10 min, 10 meses, 10 anos
- `/consider/via-negativa` - Mejorar eliminando
- `/consider/opportunity-cost` - Costo de oportunidad
- `/consider/one-thing` - Lo mas importante ahora

**Investigacion** (`/research/`):
- `/research/deep-dive` - Analisis profundo de un tema
- `/research/technical` - Investigacion tecnica
- `/research/feasibility` - Estudio de factibilidad
- `/research/competitive` - Analisis de competencia
- `/research/open-source` - Buscar alternativas open source
- `/research/landscape` - Panorama general del mercado
- `/research/options` - Comparar opciones
- `/research/history` - Historia y evolucion de una tecnologia

### Prompt para usar en cualquier instancia de Claude Code

Copia y pega este prompt al inicio de una nueva conversacion para que
Claude Code use las herramientas instaladas:

```
Tienes skills, commands y agents instalados globalmente en ~/.claude/.
Antes de empezar cualquier tarea:

1. Revisa los skills disponibles en ~/.claude/skills/ - usalos cuando
   sean relevantes para la tarea (planificacion, debugging, creacion
   de herramientas).

2. Tienes slash commands en ~/.claude/commands/ que puedes sugerir al
   usuario:
   - /create-plan para planificar proyectos
   - /debug para debugging sistematico
   - /consider/* para frameworks de pensamiento (SWOT, Pareto, 5-whys, etc)
   - /research/* para investigacion (deep-dive, technical, feasibility, etc)
   - /whats-next para sugerir siguiente accion

3. Usa el skill "create-plans" para proyectos nuevos o complejos.
4. Usa el skill "debug-like-expert" cuando encuentres errores.
5. Para infraestructura EnterSys, consulta CLAUDE.md del proyecto
   Documentacion Infraestructura.

Contexto del equipo:
- Servidor prod: 34.59.193.54 (e2-standard-4, 4 vCPU, 16GB RAM)
- 88 contenedores Docker con Traefik, Prometheus, Grafana
- SOLO usar soft limits (reservations) - NUNCA hard limits (mem_limit)
- Dominios: *.entersys.mx, *.scram2k.com, comunicacionadcon.com
- Stack: Python/FastAPI, Node.js, React, PostgreSQL, MySQL, SQL Server, Redis
```

### Ubicacion de los archivos

```
C:\Users\Usuario\.claude\
├── commands/           <- Slash commands (27 comandos)
│   ├── consider/       <- 12 frameworks de pensamiento
│   └── research/       <- 8 tipos de investigacion
├── skills/             <- 10 skills autonomos
│   ├── create-plans/
│   ├── debug-like-expert/
│   ├── create-mcp-servers/
│   └── expertise/      <- iPhone, macOS, n8n
└── agents/             <- 3 agentes de auditoria
```

### Agregar skills a un proyecto nuevo

Los skills globales ya estan disponibles automaticamente. Si necesitas
skills **especificos para un proyecto**, crealos en la carpeta `.claude/`
del proyecto:

```bash
# Dentro del directorio del proyecto
mkdir -p .claude/commands .claude/skills

# Los skills del proyecto tienen prioridad sobre los globales
# y se comparten con otros programadores via git

 actualizar el CLAUDE.md para que los skills se usen de forma automatica segun el contexto del prompt, sin que tenga que pedirlo el usuario.
```

---

## 13. Tareas Pendientes de Optimizacion

Lista de mejoras identificadas en la sesion del 2 de Marzo 2026. No son urgentes
pero mejorarian el rendimiento y mantenibilidad del servidor.

Organizadas por prioridad: ALTA (hacerlo pronto), MEDIA (esta semana/proxima),
BAJA (cuando haya tiempo).

---

### 13.1 [ALTA] Push commit pendiente a GitHub

**Problema:** El commit `0ca99bf` en el servidor no se ha pusheado al repo de
GitHub porque no hay credenciales configuradas. Esto significa que si alguien
hace deploy desde GitHub, sobreescribira la optimizacion de gunicorn.

**Que cambio:** Archivo `/srv/servicios/entersys-apis/content-management/entrypoint.sh`
- Antes: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 120 app.main:app`
- Despues: `gunicorn --preload --max-requests 1000 --max-requests-jitter 50 -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 --timeout 300 --graceful-timeout 300 app.main:app`

**Impacto de no hacerlo:** Si armando despliega desde GitHub sin este commit,
el content-api volvera a consumir 655 MB en vez de 500 MB.

**Opcion A - Token personal (mas rapido):**
```bash
# 1. Conectar al servidor
gcloud compute ssh prod-server --zone=us-central1-c

# 2. Crear un Personal Access Token en GitHub:
#    GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
#    Permisos: repo (full control)
#    Copiar el token generado

# 3. En el servidor, ir al repo
cd /srv/servicios/entersys-apis/content-management

# 4. Configurar el remote con el token
sudo git remote set-url origin https://<TU_USUARIO>:<TOKEN>@github.com/<org>/entersys-backend.git

# 5. Push
sudo git push origin main

# 6. Verificar
sudo git log --oneline -3
# Debe mostrar: 0ca99bf Optimize gunicorn: reduce workers, add preload and max-requests

# 7. IMPORTANTE: Quitar el token del remote por seguridad
sudo git remote set-url origin https://github.com/<org>/entersys-backend.git
```

**Opcion B - Deploy key SSH (mas seguro, permanente):**
```bash
# 1. En el servidor, generar key SSH
sudo ssh-keygen -t ed25519 -C "prod-server-deploy" -f /root/.ssh/github_deploy -N ""

# 2. Ver la key publica
sudo cat /root/.ssh/github_deploy.pub
# Copiar toda la linea (ssh-ed25519 AAAA... prod-server-deploy)

# 3. En GitHub: ir al repo → Settings → Deploy Keys → Add deploy key
#    Title: "prod-server"
#    Key: pegar la key publica
#    Marcar "Allow write access"

# 4. Configurar SSH para usar esa key
sudo tee /root/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile /root/.ssh/github_deploy
  IdentitiesOnly yes
EOF
sudo chmod 600 /root/.ssh/config

# 5. Cambiar remote a SSH
cd /srv/servicios/entersys-apis/content-management
sudo git remote set-url origin git@github.com:<org>/entersys-backend.git

# 6. Probar conexion
sudo ssh -T git@github.com  # Debe decir "Hi <repo>! You've successfully authenticated"

# 7. Push
sudo git push origin main
```

**Opcion C - Hacerlo desde la PC local:**
```bash
# Si tienes el repo clonado localmente con credenciales:
cd ~/entersys-backend
git pull origin main

# Editar entrypoint.sh con el mismo cambio y commitear
# Luego push normal
git push origin main

# Luego en el servidor:
cd /srv/servicios/entersys-apis/content-management
sudo git pull  # Esto puede fallar tambien por credenciales
```

**Coordinacion:** Avisar a armando que el entrypoint.sh cambio y que no
sobreescriba el archivo cuando despliegue.

---

### 13.2 [ALTA] Credenciales fuera de docker-compose

**Problema:** Hay passwords de MySQL en texto plano dentro de 3 archivos
docker-compose.yml. Si alguien commitea estos archivos a git, las credenciales
quedan expuestas en el historial para siempre.

**Archivos afectados y credenciales expuestas:**

| Archivo | Credenciales en texto plano |
|---------|----------------------------|
| `/srv/servicios/matomo/docker-compose.yml` | MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, MATOMO_DATABASE_PASSWORD |
| `/srv/servicios/mautic/docker-compose.yml` | MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, MAUTIC_DB_PASSWORD |
| `/srv/scram-apps/scram-mautic-crm/docker-compose.yml` | MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, MAUTIC_DB_PASSWORD |

**Paso a paso para cada archivo:**

```bash
# 1. Conectar al servidor
gcloud compute ssh prod-server --zone=us-central1-c

# ========== MATOMO ==========
cd /srv/servicios/matomo

# 2. Crear archivo .env con las credenciales actuales
sudo tee .env << 'EOF'
MATOMO_MYSQL_ROOT_PASSWORD=<GENERATE_STRONG_PASSWORD>
MATOMO_MYSQL_PASSWORD=<GENERATE_STRONG_PASSWORD>
MATOMO_MYSQL_USER=matomo
MATOMO_MYSQL_DATABASE=matomo
EOF
sudo chmod 600 .env

# 3. Modificar docker-compose.yml para referenciar variables
# En matomo_db:
#   ANTES:  MYSQL_ROOT_PASSWORD: <PASSWORD_IN_PLAINTEXT>
#   DESPUES: MYSQL_ROOT_PASSWORD: ${MATOMO_MYSQL_ROOT_PASSWORD}
# En matomo_app:
#   ANTES:  - MATOMO_DATABASE_PASSWORD=<PASSWORD_IN_PLAINTEXT>
#   DESPUES: - MATOMO_DATABASE_PASSWORD=${MATOMO_MYSQL_PASSWORD}

# 4. Validar que funciona
docker compose config --quiet && echo "OK"

# 5. Recrear para verificar
docker compose up -d --force-recreate

# 6. Verificar salud
docker ps --format "{{.Names}} {{.Status}}" | grep matomo

# Repetir proceso para mautic y scram-mautic-crm
```

**Verificacion final:**
```bash
# Confirmar que no hay passwords en texto plano
grep -r "Password\|password" /srv/servicios/matomo/docker-compose.yml
# Solo debe mostrar ${VARIABLE} references, no valores reales

# Confirmar que .env NO esta en git
echo ".env" >> /srv/servicios/matomo/.gitignore
```

---

### 13.3 [MEDIA] Limpiar imagenes Docker pesadas (~5 GB disco)

**Problema:** El servidor tiene imagenes muy grandes y copias viejas que ocupan
espacio innecesario. El cleanup automatico (lun+jue) elimina dangling pero no
imagenes taggeadas no usadas.

**Inventario de imagenes pesadas:**

| Imagen | Tamano | Instancias | Problema |
|--------|--------|------------|----------|
| `mautic/mautic:latest` | 1.91 GB | 2 contenedores | Imagen base Debian full |
| `mcr.microsoft.com/mssql/server:2022-latest` | 1.61 GB | 2 contenedores (natura+col) | SQL Server es inherentemente pesado |
| `saas-platform-api:latest` | 1.4 GB | 1 contenedor | Tiene ~7 copias viejas `<none>:<none>` |
| `matomo:5.5.0` | ~800 MB | 1 contenedor | PHP + Apache full |

**Acciones inmediatas (sin riesgo):**
```bash
# 1. Conectar al servidor
gcloud compute ssh prod-server --zone=us-central1-c

# 2. Ver cuanto espacio ocupan las imagenes dangling
docker images -f "dangling=true" --format "{{.ID}} {{.Size}}" | wc -l
# Si hay mas de 0, limpiar:
docker image prune -f

# 3. Ver imagenes no usadas por ningun contenedor
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.ID}}" | sort -k3 -rh | head -20

# 4. Listar imagenes que NO tienen contenedor activo
docker images -q | while read img; do
  used=$(docker ps -q --filter "ancestor=$img" | wc -l)
  if [ "$used" -eq 0 ]; then
    docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" --filter "id=$img"
  fi
done

# 5. Eliminar imagenes especificas (verificar antes que no estan en uso)
# docker rmi <image_id>
```

**Acciones a futuro (requieren rebuild):**
- Mautic: no hay version slim oficial, pero se puede hacer Dockerfile custom
  que elimine paquetes innecesarios despues de la instalacion
- SQL Server: no tiene alternativa ligera, es inherentemente pesado (~1.6 GB)
- saas-platform-api: aplicar multi-stage build (ver 13.4)

---

### 13.4 [MEDIA] Multi-stage builds en Dockerfiles

**Problema:** Los Dockerfiles actuales copian TODO (source, node_modules,
dependencias de build) a la imagen final. Esto genera imagenes de 1+ GB cuando
el runtime real necesita ~200-400 MB.

**Que es multi-stage build:** Usar 2+ etapas en el Dockerfile. La primera
instala y compila todo. La segunda copia solo los archivos necesarios para
correr la app. El resultado es una imagen 50-80% mas pequena.

**Ejemplo completo para Python/FastAPI (saas-platform-api, content-api):**
```dockerfile
# ==========================================
# Stage 1: Builder - instala dependencias
# ==========================================
FROM python:3.11-slim AS builder

# Instalar dependencias de compilacion (solo en builder)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ==========================================
# Stage 2: Runtime - solo lo necesario
# ==========================================
FROM python:3.11-slim

# Solo instalar librerias runtime (no compiladores)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar solo las dependencias instaladas (no gcc, no pip cache)
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copiar codigo fuente
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Gunicorn optimizado (2 workers, preload, max-requests)
CMD ["gunicorn", "--preload", "--max-requests", "1000", "--max-requests-jitter", "50", \
     "-w", "2", "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", "--timeout", "300", "app.main:app"]
```

**Ejemplo completo para Node.js/React (frontends SCRAM, EnterSys):**
```dockerfile
# ==========================================
# Stage 1: Builder - compila React app
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias primero (cache de Docker layer)
COPY package*.json ./
RUN npm ci --only=production=false

# Copiar source y compilar
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Runtime - solo nginx + HTML estatico
# ==========================================
FROM nginx:1.25-alpine

# Copiar solo el build output (no node_modules, no source)
COPY --from=builder /app/build /usr/share/nginx/html

# Configuracion nginx custom (SPA routing, gzip, cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:80 || exit 1

EXPOSE 80
```

**nginx.conf recomendado para SPAs:**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA: todas las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

**Prioridad de aplicacion y ahorro estimado:**

| App | Imagen actual | Estimado despues | Ahorro |
|-----|--------------|-----------------|--------|
| `saas-platform-api` | 1.4 GB | ~300 MB | ~1.1 GB |
| `nutrition-intelligence-backend` | ~800 MB | ~250 MB | ~550 MB |
| `entersys-content-api` | ~700 MB | ~250 MB | ~450 MB |
| Frontends React (5+) | ~300 MB c/u | ~25 MB c/u | ~1.4 GB total |

**Proceso para aplicar a cada proyecto:**
1. Crear nuevo Dockerfile.multi (no sobreescribir el actual)
2. Build local: `docker build -f Dockerfile.multi -t app:test .`
3. Verificar que funciona: `docker run --rm -p 8000:8000 app:test`
4. Comparar tamano: `docker images | grep app`
5. Si funciona, renombrar: `mv Dockerfile Dockerfile.old && mv Dockerfile.multi Dockerfile`
6. Rebuild en servidor y deploy

---

### 13.5 [MEDIA] Centralizar logs con Loki

**Problema:** Loki y Promtail estan instalados y funcionando, pero:
- No todos los contenedores envian logs en formato estructurado
- No hay limite de tamano de logs en todos los compose files
- No hay un dashboard unificado en Grafana para ver logs por proyecto
- Cuando hay un error, hay que hacer `docker logs` contenedor por contenedor

**Estado actual de logs por proyecto:**

| Proyecto | Logging driver | Formato | Limite |
|----------|---------------|---------|--------|
| SCRAM SaaS | json-file | Texto plano | Sin limite |
| Nutrition Intelligence | json-file | Texto plano | Sin limite |
| Monitoring stack | json-file | Mixto | 10m/3 files |
| Content API | json-file | Python logging | Sin limite |
| Mautic/Matomo | json-file | Apache logs | Sin limite |
| Otros | json-file (default) | Variado | Sin limite |

**Accion 1: Agregar limites de logging a TODOS los compose files**

Sin limites, un contenedor con error puede llenar el disco con logs.
Agregar esto a cada servicio en cada docker-compose.yml:

```yaml
services:
  cualquier-servicio:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"     # Rotar cuando llegue a 10 MB
        max-file: "3"       # Mantener maximo 3 archivos (30 MB total)
```

**Archivos a modificar en el servidor:**
```bash
# Listar compose files que NO tienen logging configurado
for f in $(find /srv /home -name 'docker-compose*.yml' -not -path '*/node_modules/*' 2>/dev/null); do
  if ! grep -q "max-size" "$f" 2>/dev/null; then
    echo "FALTA LOGGING: $f"
  fi
done
```

**Accion 2: Logs JSON estructurados en APIs**

```python
# Para Python/FastAPI - agregar al inicio de main.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info and record.exc_info[0]:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

# Configurar root logger
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.root.handlers = [handler]
logging.root.setLevel(logging.INFO)
```

```javascript
// Para Node.js/Express - usar pino (mas rapido que winston)
// npm install pino pino-pretty
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
// Usar: logger.info({ userId: 123, action: 'login' }, 'User logged in');
```

**Accion 3: Dashboard en Grafana**

```bash
# 1. Ir a Grafana: https://monitoring.entersys.mx
# 2. Explore → Seleccionar Loki como datasource
# 3. Query ejemplo para ver errores de todos los contenedores:
{job="docker"} |= "error" | json

# 4. Para crear dashboard:
#    - New Dashboard → Add Panel
#    - Datasource: Loki
#    - Query: {container_name=~"scram-.*"} | json
#    - Visualization: Logs
#    - Guardar como "Application Logs"
```

---

### 13.6 [MEDIA] Configurar servidor DEV (34.134.14.202)

**Problema:** El server DEV esta pagandose (~$860 MXN/mes) pero no se usa.
Hay contenedores de test/dev corriendo en produccion que deberian estar ahi.

**Specs del server DEV:**
- IP: 34.134.14.202
- Tipo: e2-standard-2 (2 vCPU, 8 GB RAM)
- Disco: 50 GB SSD
- Zona: us-central1-c

**Contenedores a mover de PROD a DEV:**

| Contenedor | RAM en PROD | Estado actual |
|-----------|-------------|---------------|
| scram-frontend-test | 63 MB | Pausado |
| dev-entersys-postgres | 29 MB | Pausado |
| (futuros previews/staging) | Variable | - |

**Setup completo del server DEV:**

```bash
# ==========================================
# PASO 1: Verificar estado del server DEV
# ==========================================
gcloud compute ssh dev-server --zone=us-central1-c

# Ver si Docker esta instalado
docker --version 2>/dev/null || echo "Docker NO instalado"
docker compose version 2>/dev/null || echo "Compose NO instalado"

# Ver recursos
free -h
df -h
nproc

# ==========================================
# PASO 2: Instalar Docker (si no esta)
# ==========================================
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Reconectar para que tome efecto

# ==========================================
# PASO 3: Configurar red y Traefik basico
# ==========================================
docker network create traefik

# Crear directorio para Traefik
mkdir -p ~/traefik && cd ~/traefik

# docker-compose.yml para Traefik basico (sin monitoring)
cat > docker-compose.yml << 'EOF'
services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.letsencrypt.acme.email=armando.cortes@entersys.mx
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
    networks:
      - traefik
    deploy:
      resources:
        reservations:
          memory: 128M

networks:
  traefik:
    external: true

volumes:
  traefik-certs:
EOF

docker compose up -d

# ==========================================
# PASO 4: Configurar DNS en Cloudflare
# ==========================================
# Agregar registros A en Cloudflare:
# dev.entersys.mx       → 34.134.14.202
# *.dev.entersys.mx     → 34.134.14.202
# dev.scram2k.com       → 34.134.14.202
# *.dev.scram2k.com     → 34.134.14.202

# ==========================================
# PASO 5: Mover contenedores pausados
# ==========================================
# Copiar compose files desde PROD
# Ejemplo: scp los docker-compose.yml correspondientes

# Para scram-frontend-test:
# - Copiar el compose file
# - Cambiar el dominio a test.dev.scram2k.com
# - docker compose up -d
```

---

### 13.7 [MEDIA] CI/CD basico con GitHub Actions

**Problema:** Todos los deploys son manuales via SSH. Esto:
- Requiere acceso SSH al servidor cada vez
- Es propenso a errores humanos
- No hay rollback automatico
- El commit 0ca99bf sigue sin pushear por falta de credenciales

**Arquitectura propuesta:**
```
Developer pushes to main
         ↓
GitHub Actions trigger
         ↓
SSH to prod-server
         ↓
git pull → docker compose build → docker compose up -d
         ↓
Health check verification
         ↓
Notificacion (Slack/WhatsApp)
```

**Paso 1: Crear usuario deploy en el servidor**
```bash
gcloud compute ssh prod-server --zone=us-central1-c

# Crear usuario
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Generar SSH key para GitHub Actions
sudo -u deploy ssh-keygen -t ed25519 -C "github-actions-deploy" -f /home/deploy/.ssh/id_ed25519 -N ""

# Ver la key publica (guardarla para GitHub)
sudo cat /home/deploy/.ssh/id_ed25519.pub

# Ver la key privada (guardarla como GitHub Secret)
sudo cat /home/deploy/.ssh/id_ed25519

# Configurar authorized_keys
sudo cp /home/deploy/.ssh/id_ed25519.pub /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

**Paso 2: Configurar GitHub Secrets**
En cada repo → Settings → Secrets and variables → Actions:
- `SSH_PRIVATE_KEY`: la key privada generada arriba
- `SSH_HOST`: 34.59.193.54
- `SSH_USER`: deploy

**Paso 3: Crear workflow (ejemplo para saas-platform)**
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Permite ejecutar manualmente

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requiere aprobacion manual en GitHub
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd /srv/scram-frontend/saas-platform

            # Guardar hash actual por si hay rollback
            PREV_HASH=$(git rev-parse HEAD)

            # Pull cambios
            git pull origin main

            # Build y deploy
            docker compose -f docker-compose.yml -f docker-compose.prod.yml build
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate

            # Esperar a que los contenedores esten healthy
            sleep 30

            # Verificar health
            UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | grep "scram" || true)
            if [ -n "$UNHEALTHY" ]; then
              echo "UNHEALTHY CONTAINERS: $UNHEALTHY"
              echo "ROLLING BACK to $PREV_HASH"
              git checkout $PREV_HASH
              docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
              exit 1
            fi

            echo "Deploy successful!"

      - name: Notify on failure
        if: failure()
        run: echo "Deploy failed! Check GitHub Actions logs."
```

**Paso 4: Configurar environment protection**
En GitHub → Repo → Settings → Environments → production:
- Habilitar "Required reviewers" (para que no se despliegue sin aprobacion)
- O dejarlo automatico si confias en el CI

---

### 13.8 [BAJA] Considerar escalar servidor

**Situacion actual despues de optimizaciones:**
- RAM: 4.8 GB disponibles (65% uso) - SALUDABLE
- CPU: load avg 3.5 en 4 cores - ACEPTABLE
- Disco: 54% uso con cleanup automatico - ESTABLE

**No escalar todavia.** Las optimizaciones liberaron suficiente headroom.
Reevaluar si:

| Indicador | Umbral para escalar | Valor actual |
|-----------|-------------------|--------------|
| RAM disponible | < 2 GB sostenido | 4.8 GB |
| Load average | > 4.0 sostenido | 3.5 |
| Disco | > 85% despues de cleanup | 54% |
| Contenedores nuevos | +10 mas | 88 activos |

**Opciones cuando sea necesario:**

| Opcion | Costo MXN/mes | RAM | vCPU | Ventajas | Desventajas |
|--------|--------------|-----|------|----------|-------------|
| Actual (e2-standard-4) | ~$1,720 | 16 GB | 4 | Ya funciona | Limites cercanos |
| **e2-standard-8** | ~$3,440 | 32 GB | 8 | Facil, sin migracion | Doble costo |
| 2 servidores separados | ~$3,440 | 16+16 GB | 4+4 | Aislamiento, redundancia | Mas complejo de operar |
| e2-highmem-4 | ~$2,200 | 32 GB | 4 | Mas RAM, mismo CPU | No resuelve CPU |

**Como escalar (sin downtime):**
```bash
# 1. Crear snapshot del disco actual
gcloud compute disks snapshot prod-server --zone=us-central1-c \
  --snapshot-names=prod-server-pre-upgrade-$(date +%Y%m%d)

# 2. Detener la VM (downtime minimo ~2-3 min)
gcloud compute instances stop prod-server --zone=us-central1-c

# 3. Cambiar tipo de maquina
gcloud compute instances set-machine-type prod-server \
  --zone=us-central1-c --machine-type=e2-standard-8

# 4. Iniciar la VM
gcloud compute instances start prod-server --zone=us-central1-c

# 5. Verificar que todo arranco
gcloud compute ssh prod-server --zone=us-central1-c --command="docker ps | wc -l && free -h"
```

---

### 13.9 [BAJA] Limpiar imagenes y multi-stage builds a futuro

Esto se resuelve organicamente con el CI/CD (13.7) y el cleanup automatico.
No es urgente mientras el cleanup corra lunes y jueves.

**Cuando hacerlo:** Al implementar CI/CD, incluir multi-stage builds en los
Dockerfiles como parte del proceso de modernizacion de cada repo.

---

## 14. Comandos Utiles Docker

```bash
# Ver todos los contenedores
docker ps -a

# Ver logs de un contenedor
docker logs -f nombre-contenedor

# Ver uso de recursos
docker stats

# Limpiar recursos no usados
docker system prune -f

# Reiniciar aplicacion
docker compose restart

# Actualizar aplicacion
docker compose pull && docker compose up -d

# Ver redes
docker network ls

# Inspeccionar red
docker network inspect traefik
```

---

## 15. Contacto y Soporte

- **Administrador:** armando.cortes@entersys.mx
- **Alertas:** Configuradas via AlertManager
- **Monitoreo:** https://monitoring.entersys.mx

---

## Resumen Ejecutivo para IA

```
CAPACIDAD DEL SERVIDOR (Marzo 2026 - actualizado 02/03):
- CPU: 4 cores compartidos entre 88 contenedores (load avg ~3.5)
- RAM: ~4.8 GB disponibles de 16 GB (65% en uso)
- Disco: ~66 GB disponibles de 150 GB (54% en uso)
- Swap: ~4 GB usados de 8 GB
- Cleanup Docker automatico: lunes y jueves 4 AM

OPTIMIZACIONES APLICADAS (sesiones Feb-Mar 2026):
- Prometheus: 3 GB -> 1.9 GB (GOMEMLIMIT=2GiB, drops de metricas innecesarias)
- cAdvisor: 612 MB -> 68 MB inicial, estable ~674 MB (GOMEMLIMIT=750MiB)
- node-exporter: 30% CPU -> 0% (eliminados collectors systemd y processes)
- content-api: 655 MB -> 500 MB (gunicorn -w 4 -> -w 2 con --preload)
- Todos los contenedores: hard limits -> soft limits (reservations only)
- 3 contenedores pausados: smartsheet-bind, scram-frontend-test, dev-postgres
- Metricas Prometheus eliminadas: container_network_advance_tcp_stats_total
  (9,405 series = 42% del total), node_systemd_unit_state, container_memory_failures

TECNOLOGIA:
- Docker 28.3.2 + Docker Compose v2.38.2
- Traefik v2.10 como reverse proxy (SSL automatico)
- PostgreSQL (10+ instancias), MySQL (5), SQL Server (2), Redis (6)
- Prometheus 2.47 + Grafana 10.1 + Loki 2.9.2 + cAdvisor 0.47.2
- Cloudflare (DNS + WAF + DDoS) para todos los dominios

DOMINIOS CRITICOS:
- *.entersys.mx (plataforma principal)
- *.scram2k.com (SaaS SCRAM)
- comunicacionadcon.com (cliente importante - AdminProyectos Colombia)

RESTRICCIONES CRITICAS:
1. SOLO memory reservations (soft limits) - NUNCA hard limits (mem_limit PROHIBIDO)
   37 OOM kills de matomo_app causaron reboot del servidor el 2 Mar 2026
2. Usar red traefik para exposicion web
3. No exponer puertos directamente al host
4. Configurar health checks obligatorio
5. Preferir imagenes Alpine (menor tamano)
6. RAM es el recurso mas limitado - siempre agregar reservation a nuevos contenedores
7. Alertas de memoria: warning 75%, critical 85%, repeticion cada 30 min

MONITOREO OBLIGATORIO PARA NUEVAS APPS:
1. Health check en docker-compose.yml (SIEMPRE)
2. URL en Blackbox Exporter - prometheus.yml (apps publicas)
3. Alertas en entersys-alerts.yml (apps criticas)
4. Metricas /metrics + scrape job (recomendado para APIs)
5. Logs JSON + limites de tamano en logging driver
6. Memory reservation (soft limit) en docker-compose.yml

BACKUPS Y MANTENIMIENTO:
1. Backup DBs: diario 2 AM (backup-databases.sh, retencion 7 dias)
2. Backup configs: domingos 3 AM (backup-configs.sh, retencion 30 dias)
3. Test restore: mensual 1ro del mes (test-restore.sh)
4. Cleanup Docker: lunes y jueves 4 AM (docker-cleanup.sh)
5. Backup de volumenes con datos persistentes (uploads, media)

HERRAMIENTAS DE CLAUDE CODE:
- Skills y commands globales instalados en ~/.claude/
- Usar /create-plan para planificar, /debug para debugging
- /consider/* para frameworks de pensamiento
- /research/* para investigacion

PARA APPS QUE REQUIEREN MAS RECURSOS:
- Considerar servidor dedicado
- O escalar el servidor actual (e2-standard-8 = 32 GB RAM)
- El cleanup automatico evita acumulacion de disco
- Evaluar consolidar servicios duplicados (2 GLPI, 2 Mautic)
```

---

---

## 16. Herramientas de Productividad para Claude Code

Tres herramientas complementarias instaladas globalmente para optimizar el flujo de desarrollo con agentes IA.

### 16.1 Claude Code Templates (CCT)

**Paquete:** `claude-code-templates` v1.28.16
**Comando:** `claude-code-templates`
**Documentacion:** https://docs.aitmpl.com

Sistema de templates, agentes globales y dashboards para Claude Code. Permite estandarizar configuraciones entre proyectos y visualizar el uso de Claude.

#### Comandos principales

```bash
# Aplicar template a un proyecto (common, javascript-typescript, python, ruby)
claude-code-templates --template common --directory ./mi-proyecto

# Ver que se copiaria sin aplicar cambios
claude-code-templates --template python --dry-run

# Verificar la salud de tu setup de Claude Code
claude-code-templates --health-check

# Analizar commands, hooks y MCPs existentes con sugerencias de optimizacion
claude-code-templates --command-stats
claude-code-templates --hook-stats
claude-code-templates --mcp-stats

# Dashboards web (se abren en el navegador)
claude-code-templates --analytics      # Dashboard de uso en tiempo real
claude-code-templates --skills-manager # Explorar skills instalados
claude-code-templates --plugins        # Ver plugins y permisos
claude-code-templates --teams          # Sesiones de colaboracion multi-agente
```

#### Agentes globales

```bash
# Crear un agente global accesible desde cualquier directorio
claude-code-templates --create-agent mi-agente

# Listar agentes instalados
claude-code-templates --list-agents

# Instalar componentes individuales
claude-code-templates --agent <nombre>     # Agente especifico
claude-code-templates --command <nombre>   # Comando especifico
claude-code-templates --mcp <nombre>       # MCP server especifico
claude-code-templates --hook <nombre>      # Hook especifico
claude-code-templates --skill <nombre>     # Skill especifico
```

#### Uso tipico en EnterSys

```bash
# Al crear un nuevo proyecto, aplicar template base
cd /srv/nuevo-proyecto
claude-code-templates --template common

# Verificar que todo esta bien configurado
claude-code-templates --health-check

# Revisar si hay optimizaciones pendientes en commands
claude-code-templates --command-stats
```

---

### 16.2 Get Shit Done (GSD)

**Paquete:** `get-shit-done-cc` v1.22.4
**Comando:** `npx get-shit-done-cc`
**Autor:** TACHES

Sistema de meta-prompting, context engineering y desarrollo spec-driven. Instala prompts estructurados, statusline y workflows que transforman Claude Code en un sistema de desarrollo mas riguroso y organizado.

#### Instalacion en Claude Code

```bash
# Instalacion interactiva (pregunta runtime y ubicacion)
npx get-shit-done-cc

# Instalar para Claude Code de forma global (en ~/.claude/)
npx get-shit-done-cc --claude --global

# Instalar solo en el proyecto actual (en .claude/)
npx get-shit-done-cc --claude --local

# Desinstalar
npx get-shit-done-cc --claude --global --uninstall
```

#### Que instala GSD

GSD agrega a tu configuracion de Claude Code:

| Componente | Descripcion |
|-----------|-------------|
| **Statusline** | Barra de estado con contexto del proyecto en cada respuesta |
| **Meta-prompts** | Prompts estructurados para planificacion y ejecucion |
| **Spec-driven flow** | Flujo: Spec → Plan → Implementacion → Verificacion |
| **Context engineering** | Manejo inteligente de contexto para tareas largas |

#### Flujo de trabajo GSD

```
1. SPEC    → Definir que se quiere construir (requisitos claros)
2. PLAN    → Claude genera un plan paso a paso
3. BUILD   → Ejecucion del plan con verificacion en cada paso
4. VERIFY  → Validacion automatica del resultado
```

#### Runtimes soportados

| Runtime | Flag | Notas |
|---------|------|-------|
| Claude Code | `--claude` | Principal, totalmente soportado |
| OpenCode | `--opencode` | Alternativa open-source |
| Gemini CLI | `--gemini` | Google Gemini |
| Codex CLI | `--codex` | OpenAI Codex |
| Todos | `--all` | Instala para todos los runtimes |

---

### 16.3 Vibe Kanban

**Paquete:** `vibe-kanban` v0.1.24
**Comando:** `vibe-kanban`
**Web:** https://vibekanban.com

Herramienta visual de gestion de proyectos (tablero Kanban) disenada para desarrolladores. Se integra con repositorios git y agentes IA (Claude Code, Amp).

#### Inicio rapido

```bash
# Lanzar (abre interfaz web en el navegador)
vibe-kanban

# O sin instalacion global
npx vibe-kanban
```

#### Funcionalidades principales

| Categoria | Funcionalidad |
|-----------|---------------|
| **Proyectos** | Agregar repos git, busqueda de archivos, scripts custom |
| **Tareas** | Tablero Kanban (Todo → In Progress → Done), descripciones ricas |
| **Agentes IA** | Ejecutar tareas con Claude, Amp o Echo directamente |
| **Git Worktrees** | Entorno aislado por tarea, diff de cambios, merge al main |
| **Editores** | Abrir en VS Code, Cursor, Windsurf, IntelliJ, Zed |
| **Monitoreo** | Seguimiento en tiempo real, control de procesos, notificaciones |

#### Flujo de trabajo Vibe Kanban

```
1. AGREGAR PROYECTO  → Importar repo git existente o crear uno nuevo
2. CREAR TAREA       → Definir que construir o arreglar
3. EJECUTAR CON IA   → El agente trabaja en un worktree aislado
4. REVISAR CAMBIOS   → Ver diff exacto de lo que se modifico
5. MERGE             → Incorporar cambios exitosos al branch principal
```

#### Integracion con EnterSys

```bash
# Ejemplo: gestionar tareas del frontend
cd /srv/entersys-frontend
vibe-kanban
# → Agregar el repo como proyecto
# → Crear tareas para features o bugs
# → Ejecutar con Claude en worktrees aislados
# → Revisar y mergear cambios
```

---

### 16.4 Resumen de herramientas

| Herramienta | Proposito | Comando | Cuando usar |
|-------------|-----------|---------|-------------|
| **CCT** | Templates, agentes, dashboards | `claude-code-templates` | Setup de proyectos, auditar configs |
| **GSD** | Meta-prompting, specs, planificacion | `npx get-shit-done-cc` | Desarrollo estructurado con specs |
| **Vibe Kanban** | Tablero visual + agentes IA | `vibe-kanban` | Gestionar tareas con vista Kanban |

### 16.5 Guia de Activacion para Agentes Claude Code

> **INSTRUCCIONES PARA EL AGENTE:** Si estas leyendo esta guia como agente de Claude Code,
> sigue estos pasos para activar todas las herramientas de productividad en tu instancia
> y usarlas automaticamente cuando lo consideres necesario.

#### Paso 1: Verificar prerequisitos

Ejecuta estos comandos para confirmar que todo esta instalado:

```bash
# Verificar Node.js y npm
node -v    # Debe ser v22+
npm -v     # Debe ser v11+

# Verificar las 3 herramientas globales
npm list -g --depth=0 | grep -E "claude-code-templates|get-shit-done|vibe-kanban"
```

Si alguna falta, instala con:
```bash
npm install -g claude-code-templates get-shit-done-cc@latest vibe-kanban
```

#### Paso 2: Activar GSD (Get Shit Done) en tu instancia

GSD se instala UNA VEZ por instancia de Claude Code. Agrega slash commands, hooks y statusline.

```bash
# Instalar globalmente para Claude Code (disponible en todos los proyectos)
npx get-shit-done-cc --claude --global

# Para instalar SOLO en el proyecto actual (aislado)
npx get-shit-done-cc --claude --local
```

Despues de instalar, tendras disponibles estos slash commands:

| Comando | Cuando usarlo |
|---------|---------------|
| `/gsd:new-project` | Al iniciar un proyecto nuevo. Crea PROJECT.md con contexto profundo |
| `/gsd:plan-phase` | Para crear un plan detallado (PLAN.md) de una fase |
| `/gsd:execute-phase` | Para ejecutar los planes de una fase con paralelizacion |
| `/gsd:progress` | Para revisar avance y decidir que hacer despues |
| `/gsd:resume-work` | Para retomar trabajo de una sesion anterior con contexto completo |
| `/gsd:pause-work` | Para pausar y crear handoff cuando necesites detener el trabajo |
| `/gsd:quick` | Para tareas rapidas con commits atomicos y tracking |
| `/gsd:debug` | Para debugging sistematico con estado persistente |
| `/gsd:verify-work` | Para validar features construidas via UAT conversacional |
| `/gsd:map-codebase` | Para analizar el codebase con agentes en paralelo |
| `/gsd:check-todos` | Para ver pendientes y elegir uno |
| `/gsd:add-todo` | Para capturar ideas o tareas desde la conversacion |
| `/gsd:help` | Para ver todos los comandos GSD disponibles |

#### Paso 3: Aplicar templates CCT al proyecto

```bash
# Ver templates disponibles y que archivos copiarian (sin aplicar)
claude-code-templates --template common --dry-run

# Aplicar template al proyecto actual
claude-code-templates --template common

# Verificar que la configuracion quedo bien
claude-code-templates --health-check

# Auditar commands, hooks y MCPs existentes (sugiere optimizaciones)
claude-code-templates --command-stats
claude-code-templates --hook-stats
claude-code-templates --mcp-stats
```

#### Paso 4: Slash commands y skills ya disponibles

Estos ya estan instalados globalmente en `~/.claude/` y no requieren activacion adicional:

**Frameworks de pensamiento** (`/consider/*`) — usarlos para analisis y decisiones:
| Comando | Proposito |
|---------|-----------|
| `/consider:first-principles` | Descomponer hasta lo fundamental y reconstruir |
| `/consider:5-whys` | Encontrar causa raiz preguntando "por que" repetidamente |
| `/consider:pareto` | Aplicar regla 80/20 para priorizar |
| `/consider:eisenhower-matrix` | Clasificar por urgencia e importancia |
| `/consider:occams-razor` | Buscar la explicacion mas simple |
| `/consider:inversion` | Resolver al reves: que garantizaria el fracaso |
| `/consider:swot` | Mapear fortalezas, debilidades, oportunidades, amenazas |
| `/consider:second-order` | Pensar en consecuencias de las consecuencias |
| `/consider:via-negativa` | Mejorar quitando, no agregando |
| `/consider:one-thing` | Identificar la accion de mayor impacto |
| `/consider:opportunity-cost` | Analizar que pierdes al elegir esta opcion |
| `/consider:10-10-10` | Evaluar decisiones en 3 horizontes de tiempo |

**Investigacion** (`/research/*`) — usarlos para explorar antes de implementar:
| Comando | Proposito |
|---------|-----------|
| `/research:technical` | Como implementar algo: enfoques, librerias, tradeoffs |
| `/research:options` | Comparar opciones lado a lado con recomendacion |
| `/research:open-source` | Encontrar soluciones open-source existentes |
| `/research:landscape` | Mapear el espacio: herramientas, tendencias, gaps |
| `/research:feasibility` | Reality check: se puede hacer con nuestras restricciones? |
| `/research:deep-dive` | Investigacion exhaustiva de un tema |
| `/research:competitive` | Investigar competidores y alternativas |
| `/research:history` | Que se ha intentado antes, lecciones aprendidas |

**Desarrollo y planificacion:**
| Comando | Proposito |
|---------|-----------|
| `/create-plan` | Crear plan de proyecto jerarquico |
| `/create-prompt` | Crear prompt optimizado para pipelines Claude-a-Claude |
| `/create-meta-prompt` | Crear meta-prompts (research → plan → implement) |
| `/create-agent-skill` | Crear o editar skills para Claude Code |
| `/create-hook` | Crear hooks de automatizacion |
| `/create-slash-command` | Crear slash commands custom |
| `/create-subagent` | Crear subagentes especializados |
| `/run-plan` | Ejecutar un PLAN.md directamente |
| `/run-prompt` | Delegar prompts a sub-tareas en paralelo o secuencial |
| `/debug` | Debugging metodico con investigacion experta |
| `/whats-next` | Analizar conversacion y crear handoff para nueva sesion |
| `/ask-me-questions` | Recopilar requisitos con preguntas adaptativas |
| `/audit-skill` | Auditar skill por compliance YAML y mejores practicas |
| `/audit-subagent` | Auditar configuracion de subagente |
| `/heal-skill` | Reparar documentacion de skill con flujo de aprobacion |
| `/add-to-todos` | Agregar pendiente a TO-DOS.md |
| `/check-todos` | Listar pendientes y elegir uno |

**Skills de referencia** (en `~/.claude/skills/`):
| Skill | Se activa cuando... |
|-------|---------------------|
| `create-agent-skills` | Trabajas con archivos SKILL.md |
| `create-hooks` | Configuras hooks o event listeners |
| `create-mcp-servers` | Construyes integraciones MCP (TypeScript o Python) |
| `create-plans` | Planificas proyectos o fases |
| `create-meta-prompts` | Creas pipelines multi-etapa |
| `create-slash-commands` | Creas slash commands custom |
| `create-subagents` | Configuras subagentes |
| `debug-like-expert` | El troubleshooting estandar falla |
| `setup-ralph` | Necesitas un loop autonomo de desarrollo |

#### Paso 5: Cuando usar cada herramienta automaticamente

Como agente, aplica estas reglas para decidir que herramienta usar:

```
REGLA 1 - PROYECTO NUEVO:
  → Ejecutar /gsd:new-project para crear PROJECT.md
  → Luego claude-code-templates --template <tipo> para setup base
  → Luego /gsd:plan-phase para planificar la primera fase

REGLA 2 - TAREA COMPLEJA (mas de 3 archivos, multiples pasos):
  → Usar /gsd:plan-phase para planificar antes de ejecutar
  → Ejecutar con /gsd:execute-phase para tracking automatico
  → Validar con /gsd:verify-work

REGLA 3 - TAREA RAPIDA (un archivo, cambio puntual):
  → Usar /gsd:quick para commits atomicos con tracking
  → O simplemente hacerlo directo si es trivial

REGLA 4 - DEBUGGING:
  → Primero /consider:5-whys para encontrar causa raiz
  → Luego /gsd:debug o /debug para investigacion sistematica

REGLA 5 - DECISION DE ARQUITECTURA:
  → /research:technical para explorar enfoques
  → /research:options para comparar alternativas
  → /consider:first-principles para validar la decision

REGLA 6 - RETOMAR TRABAJO:
  → /gsd:resume-work para restaurar contexto completo
  → /gsd:progress para ver donde quedamos

REGLA 7 - PAUSAR TRABAJO:
  → /gsd:pause-work para crear handoff
  → O /whats-next para crear documento de continuacion

REGLA 8 - AUDITAR CONFIGURACION:
  → claude-code-templates --health-check
  → claude-code-templates --command-stats
  → /audit-skill, /audit-subagent segun aplique

REGLA 9 - ANTES DE IMPLEMENTAR ALGO GRANDE:
  → /consider:pareto para identificar el 20% que da el 80%
  → /consider:via-negativa para ver si puedes resolver quitando
  → /research:feasibility para reality check
```

#### Paso 6: Verificacion final

Despues de activar todo, verifica que funciona:

```bash
# 1. Health check de Claude Code Templates
claude-code-templates --health-check

# 2. Ver comandos GSD disponibles
# (desde Claude Code, escribir /gsd:help)

# 3. Verificar que los slash commands responden
# (desde Claude Code, escribir /consider:occams-razor con cualquier tema)

# 4. Verificar instalacion global
npm list -g --depth=0 | grep -E "claude-code-templates|get-shit-done|vibe-kanban"
```

Si todo responde correctamente, el ecosistema esta activo y listo para usar.

---

## 13. Buenas Practicas de Ingenieria de Software

Toda nueva aplicacion desplegada en la infraestructura EnterSys DEBE seguir estos
principios universales de ingenieria de software. Estos aplican independientemente
del lenguaje, framework o tipo de aplicacion.

### 13.1 Arquitectura y Patrones de Diseno

**Obligatorios:**
- **Clean Architecture**: Separar en capas Presentacion → Dominio → Datos. Las capas
  internas NUNCA dependen de las externas. Comunicacion via interfaces/contratos.
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface
  Segregation, Dependency Inversion.
- **Repository Pattern**: Todo acceso a datos pasa por un repositorio, nunca directo.
- **Circuit Breaker**: OBLIGATORIO para toda comunicacion con servicios externos.
  Estados: Cerrado → Abierto → Semi-abierto.

**Segun necesidad:**
- Factory (objetos complejos), Observer/Pub-Sub (eventos desacoplados),
  Strategy (algoritmos intercambiables), Adapter (integraciones externas),
  CQRS (separar lectura/escritura cuando la complejidad lo justifique).

### 13.2 Ejecucion Asincrona y Rendimiento

- TODA llamada a API externa DEBE ser asincrona. Sin excepciones.
- TODA operacion I/O (archivos, BD, red) DEBE ser asincrona.
- Procesos pesados (reportes, ETL, notificaciones masivas) → background workers
  con message queues. Workers DEBEN ser idempotentes.
- Implementar dead-letter queue para tareas que fallan repetidamente.
- **Lazy loading**, **paginacion** (cursor-based), **debounce/throttle**,
  **connection pooling**, **compresion** de respuestas.
- Cancelar operaciones asincronas cuando el contexto ya no sea valido.

### 13.3 Cache y Prevencion de Llamadas Redundantes

NUNCA hacer la misma llamada a API multiples veces cuando el dato ya esta disponible.

| Nivel | Uso | TTL tipico |
|-------|-----|------------|
| Memoria (L1) | Datos frecuentes, corta duracion | Segundos |
| Distribuido - Redis (L2) | Sesiones, config, datos compartidos | Minutos |
| HTTP (L3) | ETags, Cache-Control, Last-Modified | Variable |
| CDN (L4) | Assets estaticos e inmutables | Horas/dias |

- Definir TTL apropiado por tipo de dato.
- Invalidacion event-driven cuando sea posible.
- Request deduplication para evitar trabajo duplicado simultaneo.

### 13.4 Gestion de APIs y Comunicacion de Red

- **Rate Limiting**: En APIs propias para proteger el sistema.
- **Retry con Exponential Backoff + Jitter**: Espera exponencial + variacion
  aleatoria. Maximo 3-5 reintentos.
- **Timeout**: TODA llamada de red DEBE tener timeout. Jamas esperar indefinidamente.
- **Bulkhead**: Aislar recursos por servicio (falla de uno no afecta a otros).
- **Batching**: Agrupar multiples datos relacionados en una sola llamada.

### 13.5 Seguridad

**Autenticacion:**
- JWT con Access Token (15-30 min) + Refresh Token con rotacion.
- Web: HttpOnly + Secure + SameSite cookies. NUNCA en localStorage.
- Movil: Keychain (iOS) / Keystore (Android). NUNCA en texto plano.
- Revocacion de tokens (blacklist o verificacion contra BD).

**Comunicacion:**
- HTTPS obligatorio. CORS restrictivo (solo origenes permitidos).
- Headers: Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, HSTS.
- Certificate Pinning en apps moviles.
- Proteccion CSRF en apps web con estado.

**Validacion:**
- TODA entrada del usuario se valida y sanitiza en cliente Y servidor.
- Queries parametrizados SIEMPRE. Jamas concatenar inputs en queries.
- Prevenir: SQL injection, XSS, command injection, path traversal.
- Rate limiting por usuario/IP para prevenir fuerza bruta.

**Datos sensibles:**
- NUNCA loggear passwords, tokens, tarjetas, datos personales.
- Encriptar datos sensibles en reposo.
- Principio de minimo privilegio. Audit trail para operaciones sensibles.

### 13.6 Catalogo de Errores Estandarizado

Toda respuesta de error DEBE seguir esta estructura:

```json
{
  "code": "AUTH_001",
  "message": "Descripcion tecnica (para el desarrollador)",
  "userMessage": "Mensaje amigable (para el usuario, i18n ready)",
  "details": [{"field": "email", "error": "formato invalido"}],
  "timestamp": "2026-01-01T00:00:00Z",
  "traceId": "uuid-unico-de-la-peticion"
}
```

**Prefijos base:**

| Prefijo | Area | Ejemplos |
|---------|------|----------|
| AUTH_XXX | Autenticacion | Token expirado, invalido, permisos insuficientes |
| VAL_XXX | Validacion | Campo faltante, formato invalido, duplicado |
| BUS_XXX | Negocio | No encontrado, operacion no permitida, limite excedido |
| SYS_XXX | Infraestructura | Servicio no disponible, timeout, rate limit |
| NET_XXX | Red | Sin conexion, timeout, SSL invalido |

Cada modulo extiende con su propio prefijo (PAY_XXX, USR_XXX, etc).

**Manejo de excepciones:**
- NUNCA catch vacios (excepciones silenciosas).
- Global Error Handler obligatorio.
- Distinguir errores recuperables (reintentar, fallback) vs no recuperables (notificar).

### 13.7 Testing

**Piramide de testing:**

| Nivel | % | Que prueba |
|-------|---|-----------|
| Unit Tests | 70% | Funciones/clases individuales, logica de negocio |
| Integration Tests | 20% | Interaccion entre modulos, acceso a datos |
| E2E Tests | 10% | Flujos completos del usuario (solo criticos) |

- Cobertura minima: 80% en logica de negocio.
- Cada bug corregido incluye un test que lo reproduce.
- Tests independientes entre si, usando factories/fixtures.
- Tests de seguridad (SAST/DAST) en pipeline CI/CD.

### 13.8 Escalabilidad

- Componentes stateless (estado en almacenamiento externo).
- Health checks para que el orquestador gestione instancias.
- Graceful shutdown: completar requests en progreso antes de apagar.
- Esquemas de BD optimizados para consultas frecuentes (query-driven design).
- Indices en campos frecuentemente consultados (sin sobre-indexar).
- Migraciones versionadas y reversibles.
- Comunicacion asincrona entre servicios (eventos/colas sobre HTTP directo).
- Idempotencia: toda operacion puede recibirse multiples veces sin efectos secundarios.

### 13.9 CI/CD

- Build automatizado en cada push/merge.
- Pipeline: linters → analisis estatico → unit tests → integration → E2E → deploy.
- Escaneo de seguridad (dependencias vulnerables, secretos expuestos).
- Rollback automatizado si health checks fallan post-deploy.
- Feature flags para despliegues canary y rollback instantaneo.
- APIs publicas DEBEN estar versionadas (v1, v2).

### 13.10 Documentacion

- API documentada con OpenAPI/Swagger, generada desde el codigo.
- README con: como levantar el proyecto, variables de entorno, arquitectura.
- ADR (Architecture Decision Records) para decisiones arquitectonicas.
- Codigo limpio: nombres descriptivos, funciones pequenas, sin codigo muerto.
- DRY pero sin abstracciones prematuras.

### 13.11 Accesibilidad e Internacionalizacion

**Accesibilidad (a11y):**
- Semantica HTML correcta, navegacion por teclado, contraste suficiente.
- Labels y textos alternativos. Soporte para lectores de pantalla.

**Internacionalizacion (i18n):**
- NUNCA hardcodear textos de UI. Usar archivos de traduccion.
- Formatos de fecha, numero y moneda segun region.
- UI que tolere textos de diferentes longitudes.

### 13.12 Herramientas Disponibles

Para aplicar estos principios automaticamente, Claude Code tiene:

| Herramienta | Tipo | Que hace |
|-------------|------|----------|
| `software-engineering` | Skill | Aplica principios al disenar/desarrollar, audita proyectos completos |
| `swe_audit_project` | MCP Tool | Escanea proyecto y genera reporte con score por area |
| `swe_get_checklist` | MCP Tool | Checklist de buenas practicas por area |
| `swe_get_error_catalog` | MCP Tool | Catalogo base de errores estandarizado |
| `swe_get_template` | MCP Tool | Templates de codigo (docker-compose, health, errors, cache, etc.) |
| `swe_design_review` | MCP Tool | Genera preguntas de validacion pre-implementacion |

**Uso desde Claude Code:**
```
# Auditar un proyecto completo
/software-engineering audit /path/to/project

# O usar la herramienta MCP directamente
swe_audit_project con project_path="/path/to/project"
```

### 13.13 Prioridades (en orden)

```
1. Rendimiento
2. Escalabilidad
3. Mantenibilidad
4. Velocidad de desarrollo

NUNCA sacrificar seguridad por conveniencia.
Ante duda sincrono vs asincrono → asincrono.
```

---

**Documento generado por:** Claude Code
**Version:** 6.0 (Marzo 2026: buenas practicas de ingenieria de software, skill software-engineering, MCP software-engineering, auditoria de proyectos, 92 contenedores documentados)
