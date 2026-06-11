#!/bin/sh
# Inicializa los buckets de MinIO al arrancar el contenedor minio-init

set -e

echo "Esperando a MinIO..."
sleep 3

mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"

echo "Creando bucket product-images..."
mc mb --ignore-existing local/product-images

echo "Configurando política pública de lectura para product-images..."
mc anonymous set download local/product-images

echo "Buckets inicializados correctamente."
