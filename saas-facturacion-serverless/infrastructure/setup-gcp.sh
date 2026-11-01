#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue de Infraestructura en Google Cloud Platform (Bash / Cloud Shell)
# Curso: Servicios Cloud / Arquitecturas en la Nube
# Proyecto: SaaS Facturación Electrónica UBL 2.1 (SUNAT)
# ==============================================================================

set -e

PROJECT_ID="saas-facturacion-peru-6b3e3"
REGION="us-central1"
TOPIC_NAME="cola-emision-boletas"
SUBSCRIPTION_NAME="cola-emision-boletas-sub"

echo ">>> Configurando Proyecto Google Cloud: $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

echo ">>> Habilitando APIs necesarias (Pub/Sub, Firestore, Cloud Run)..."
gcloud services enable pubsub.googleapis.com firestore.googleapis.com run.googleapis.com

echo ">>> Verificando / Creando Tópico de Cloud Pub/Sub: $TOPIC_NAME..."
gcloud pubsub topics create "$TOPIC_NAME" || echo "El tópico $TOPIC_NAME ya existe."

echo ">>> Verificando / Creando Suscripción de Cloud Pub/Sub: $SUBSCRIPTION_NAME..."
gcloud pubsub subscriptions create "$SUBSCRIPTION_NAME" \
  --topic="$TOPIC_NAME" \
  --ack-deadline=60 || echo "La suscripción $SUBSCRIPTION_NAME ya existe."

echo "=============================================================================="
echo "✓ Infraestructura base en GCP lista para conectar backend y worker."
echo "=============================================================================="

