# ==============================================================================
# Dockerfile para Despliegue en Google Cloud Run (Serverless Container)
# Proyecto: SaaS Facturación Electrónica UBL 2.1 (SUNAT)
# ==============================================================================

FROM node:20-alpine

# Definir directorio de trabajo
WORKDIR /usr/src/app

# Copiar manifiestos de dependencias
COPY backend-functions/package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el código fuente del backend
COPY backend-functions/src/ ./src/

# Variable de entorno de puerto para Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Iniciar el servicio HTTP
CMD ["node", "src/app.js"]

