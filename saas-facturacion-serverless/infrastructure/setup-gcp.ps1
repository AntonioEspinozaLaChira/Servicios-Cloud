# ==============================================================================
# Script de Despliegue de Infraestructura en Google Cloud Platform (PowerShell)
# Curso: Servicios Cloud / Arquitecturas en la Nube
# Proyecto: SaaS Facturación Electrónica UBL 2.1 (SUNAT)
# ==============================================================================

$PROJECT_ID = "saas-facturacion-peru-6b3e3"
$REGION = "us-central1"
$TOPIC_NAME = "cola-emision-boletas"
$SUBSCRIPTION_NAME = "cola-emision-boletas-sub"

Write-Host ">>> Configurando Proyecto Google Cloud: $PROJECT_ID..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

Write-Host ">>> Habilitando APIs necesarias (Pub/Sub, Firestore, Cloud Run)..." -ForegroundColor Cyan
gcloud services enable pubsub.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable run.googleapis.com

Write-Host ">>> Verificando / Creando Tópico de Cloud Pub/Sub: $TOPIC_NAME..." -ForegroundColor Cyan
gcloud pubsub topics create $TOPIC_NAME 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Tópico $TOPIC_NAME creado exitosamente." -ForegroundColor Green
} else {
    Write-Host "i El tópico $TOPIC_NAME ya existe o fue verificado." -ForegroundColor Yellow
}

Write-Host ">>> Verificando / Creando Suscripción de Cloud Pub/Sub: $SUBSCRIPTION_NAME..." -ForegroundColor Cyan
gcloud pubsub subscriptions create $SUBSCRIPTION_NAME --topic=$TOPIC_NAME --ack-deadline=60 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Suscripción $SUBSCRIPTION_NAME creada exitosamente." -ForegroundColor Green
} else {
    Write-Host "i La suscripción $SUBSCRIPTION_NAME ya existe o fue verificada." -ForegroundColor Yellow
}

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " Infraestructura GCP lista para conectar backend y worker." -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green

