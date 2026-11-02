const { PubSub } = require('@google-cloud/pubsub');
const path = require('path');
const fs = require('fs');

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const pubSubOptions = {
  projectId: process.env.GCP_PROJECT_ID || "saas-facturacion-peru-6b3e3"
};

// Si el archivo existe en local, se usa. En Cloud Run se usan credenciales nativas (ADC).
if (fs.existsSync(keyPath)) {
  pubSubOptions.keyFilename = keyPath;
}

const pubSubClient = new PubSub(pubSubOptions);
const TOPIC_NAME = process.env.PUBSUB_TOPIC_NAME || 'cola-emision-boletas';

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
