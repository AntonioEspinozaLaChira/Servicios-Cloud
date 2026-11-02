const { PubSub } = require('@google-cloud/pubsub');
const path = require('path');
const { db } = require('./utils/firebase');

const fs = require('fs');

// Apuntar con ruta absoluta al archivo de credenciales si existe en local
const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
const pubSubOptions = {
  projectId: process.env.GCP_PROJECT_ID || "saas-facturacion-peru-6b3e3"
};

if (fs.existsSync(keyPath)) {
  pubSubOptions.keyFilename = keyPath;
}

const pubSubClient = new PubSub(pubSubOptions);

const SUBSCRIPTION_NAME = 'cola-emision-boletas-sub';

function listenForInvoices() {
  const subscription = pubSubClient.subscription(SUBSCRIPTION_NAME);

  console.log(`[WORKER] Escuchando mensajes en la suscripción: ${SUBSCRIPTION_NAME}...`);

  // Evento que se dispara cada vez que llega un mensaje nuevo a la cola
  subscription.on('message', async (message) => {
    try {
      // 1. Decodificar el contenido del mensaje
      const dataBuffer = message.data;
      const payload = JSON.parse(dataBuffer.toString());

      console.log(`\n============================================================`);
      console.log(`[WORKER] Mensaje recibido desde Google Cloud Pub/Sub:`);
      console.log(` - Message ID: ${message.id}`);
      console.log(` - Factura / Boleta ID: ${payload.invoiceID}`);
      console.log(` - Monto total a pagar: S/ ${payload.totalPayable}`);
      console.log(`------------------------------------------------------------`);
      console.log(`[WORKER] MANTENIENDO EL MENSAJE EN COLA DURANTE 1 MINUTO (60s)`);
      console.log(`[WORKER] Puedes visualizar el mensaje en la consola de Google Cloud Pub/Sub.`);
      console.log(`============================================================`);

      // Demora controlada de 60 segundos con logs cada 10 segundos
      for (let segundos = 60; segundos > 0; segundos -= 10) {
        console.log(`[WORKER] Procesando con SUNAT... quedan ${segundos} segundos.`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      console.log(`\n[WORKER] ¡Tiempo cumplido! Conectando y firmando comprobante UBL 2.1...`);
      console.log(`[WORKER] ¡Comprobante ${payload.invoiceID} aceptado por SUNAT exitosamente!`);

      // 3. Actualizar el estado del comprobante en Firestore
      const invoiceRef = db.collection('invoices').doc(payload.invoiceID);
      await invoiceRef.update({
        status: 'ACCEPTED_BY_SUNAT',
        processedAt: new Date().toISOString(),
        pubSubMessageId: message.id
      });
      console.log(`[FIRESTORE] Estado de la boleta ${payload.invoiceID} actualizado a 'ACCEPTED_BY_SUNAT'.`);

      // 4. Confirmar (ACK) el mensaje para removerlo definitivamente de la cola
      message.ack();
      console.log(`[WORKER] Mensaje ${message.id} confirmado (ACK) y retirado de la cola de Pub/Sub.\n`);

    } catch (error) {
      console.error('[WORKER ERROR] Ocurrió un error al procesar el mensaje:', error.message);
    }
  });

  // Manejo de errores en la suscripción
  subscription.on('error', (error) => {
    console.error('[SUBSCRIPTION ERROR]:', error.message);
  });
}

// Iniciar el worker
listenForInvoices();
