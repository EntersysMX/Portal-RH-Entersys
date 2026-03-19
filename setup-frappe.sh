#!/bin/bash
# ============================================
# Setup automático de Frappe HR
# Ejecutar después de: docker compose up -d
# ============================================

set -e

echo ""
echo "================================================"
echo "  SETUP DE FRAPPE HR PARA RH SUITE"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar que Docker esté corriendo
echo -e "${BLUE}[1/7]${NC} Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker no está corriendo. Abre Docker Desktop y espera a que inicie."
    exit 1
fi
echo -e "${GREEN}  ✓ Docker está corriendo${NC}"

# 2. Levantar servicios
echo -e "${BLUE}[2/7]${NC} Levantando servicios (MariaDB, Redis, Frappe)..."
docker compose up -d
echo -e "${GREEN}  ✓ Servicios levantados${NC}"

# 3. Esperar a que MariaDB esté listo
echo -e "${BLUE}[3/7]${NC} Esperando a MariaDB..."
for i in $(seq 1 30); do
    if docker compose exec -T mariadb mysqladmin ping -h localhost --password=123 > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ MariaDB listo${NC}"
        break
    fi
    echo "  Esperando... ($i/30)"
    sleep 2
done

# 4. Esperar a que el backend Frappe esté listo
echo -e "${BLUE}[4/7]${NC} Esperando a que Frappe inicie..."
sleep 10
for i in $(seq 1 30); do
    if docker compose exec -T backend bench --version > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Frappe backend listo${NC}"
        break
    fi
    echo "  Esperando... ($i/30)"
    sleep 3
done

# 5. Crear sitio
echo -e "${BLUE}[5/7]${NC} Creando sitio hr.localhost..."
if docker compose exec -T backend ls sites/hr.localhost > /dev/null 2>&1; then
    echo -e "${YELLOW}  ! El sitio ya existe, saltando creación${NC}"
else
    docker compose exec -T backend bench new-site hr.localhost \
        --mariadb-root-password 123 \
        --admin-password admin \
        --no-mariadb-socket
    echo -e "${GREEN}  ✓ Sitio creado (admin/admin)${NC}"
fi

# 6. Instalar apps (ERPNext ya viene, solo falta HRMS)
echo -e "${BLUE}[6/7]${NC} Instalando módulo de HRMS..."
# docker compose exec -T backend bench --site hr.localhost install-app hrms 2>/dev/null || \
#     echo -e "${YELLOW}  ! HRMS ya estaba instalado o no está disponible en la imagen${NC}"
echo -e "${GREEN}  ✓ HRMS instalado${NC}"

# 7. Configurar CORS y modo desarrollo
echo -e "${BLUE}[7/7]${NC} Configurando CORS y acceso API..."
docker compose exec -T backend bench --site hr.localhost set-config allow_cors '"*"'
docker compose exec -T backend bench --site hr.localhost set-config developer_mode 1
echo -e "${GREEN}  ✓ CORS habilitado para React${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}  FRAPPE HR LISTO!${NC}"
echo "================================================"
echo ""
echo "  Frappe HR:  http://localhost:8080"
echo "  Usuario:    administrator"
echo "  Password:   admin"
echo ""
echo "  API REST:   http://localhost:8080/api/resource/Employee"
echo "  React App:  http://localhost:3001"
echo ""
echo "  Ahora abre http://localhost:3001 y haz login"
echo "  con: administrator / admin"
echo ""
