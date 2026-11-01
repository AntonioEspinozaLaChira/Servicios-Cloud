const { PubSub } = require('@google-cloud/pubsub');
const path = require('path');

// Apuntar con ruta absoluta exacta para evitar fallos de ubicación
const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');

// Usar el ID real de tu proyecto en Google Cloud
const pubSubClient = new PubSub({
  keyFilename: keyPath,
  projectId: "saas-facturacion-peru-6b3e3" // <-- Apuntando al proyecto correcto donde creaste el tema
});

const TOPIC_NAME = 'cola-emision-boletas';
async function publishInvoiceToQueue(invoiceData, xmlContent) {
  try {
    const topic = pubSubClient.topic(TOPIC_NAME);
    
    const messagePayload = {
      invoiceID: invoiceData.invoiceID,
      issueDate: invoiceData.issueDate,
      supplierRuc: invoiceData.accountingSupplierParty.partyIdentification.id,
      totalPayable: invoiceData.legalMonetaryTotal.payableAmount.value,
      xmlContent: xmlContent,
      queuedAt: new Date().toISOString()
    };

    const dataBuffer = Buffer.from(JSON.stringify(messagePayload));

    const messageId = await topic.publishMessage({ data: dataBuffer });
    console.log(`[PUBSUB] Mensaje encolado exitosamente con ID: ${messageId} para la factura ${invoiceData.invoiceID}`);
    
    return messageId;
  } catch (error) {
    console.error('[PUBSUB ERROR] No se pudo encolar el comprobante:', error.message);
    throw new Error('Error al enviar el comprobante a la cola asíncrona');
  }
}

module.exports = { publishInvoiceToQueue };