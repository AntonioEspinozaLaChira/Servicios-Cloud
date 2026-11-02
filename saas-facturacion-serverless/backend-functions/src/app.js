console.log(`[BOOT] Iniciando backend Facturación Electrónica UBL 2.1... Node: ${process.version}, PORT: ${process.env.PORT}`);

const express = require('express');
const dotenv = require('dotenv');
const { generateUBLXML } = require('./utils/xmlBuilder');
const { db } = require('./utils/firebase');
// 1. Importar la función para publicar en la cola de Pub/Sub
const { publishInvoiceToQueue } = require('./utils/pubsub');

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// Middleware de CORS para permitir peticiones desde el frontend (POS)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * 🔒 Middleware de Seguridad (Fase 2.3): Validación de API Key
 */
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const VALID_API_KEY = process.env.API_KEY || 'mi-super-api-key-secreta-2026';

  if (!apiKey || apiKey !== VALID_API_KEY) {
    console.warn('[SECURITY] Intento de acceso no autorizado detectado sin API Key válida.');
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Acceso no autorizado. Se requiere una API Key válida en el encabezado (x-api-key).'
    });
  }

  next();
};

/**
 * Endpoint Raíz de Bienvenida y Salud
 */
app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'online',
    service: 'SaaS Facturación Electrónica UBL 2.1 (SUNAT)',
    endpoints: {
      health: '/api/v1/health',
      invoice: '/api/v1/invoice'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint de Salud / Verificación de estado de la API
 */
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    status: 'online',
    service: 'SaaS Facturación Electrónica UBL 2.1 (SUNAT)',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint para Consultar Comprobante por ID
 */
app.get('/api/v1/invoice/:id', verifyApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = await db.collection('invoices').doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: `No se encontró ningún comprobante con ID: ${id}`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: docRef.data()
    });
  } catch (error) {
    console.error('[ERROR] Fallo al consultar el comprobante:', error.message);
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error al consultar la factura en Firestore',
      details: error.message
    });
  }
});

/**
 * Fase 3: Endpoint Protegido con Persistencia en Firestore y Encolamiento en Pub/Sub
 */
app.post('/api/v1/invoice', verifyApiKey, async (req, res) => {
  try {
    const invoiceData = req.body;

    // 1. Validación estricta de campos obligatorios
    if (!invoiceData.invoiceID || !invoiceData.accountingSupplierParty || !invoiceData.invoiceLine) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Faltan datos obligatorios (RUC del emisor, ID de factura o líneas de productos) en la estructura UBL 2.1.'
      });
    }

    console.log(`[INFO] Procesando comprobante ID: ${invoiceData.invoiceID}...`);

    // 2. Generación del documento XML UBL 2.1
    const xmlContent = generateUBLXML(invoiceData);
    const processingTimestamp = new Date().toISOString();

    // 3. Persistencia Real en Firestore con estado inicial PENDING_SUNAT_APPROVAL
    const invoiceRef = db.collection('invoices').doc(invoiceData.invoiceID);
    await invoiceRef.set({
      invoiceID: invoiceData.invoiceID,
      issueDate: invoiceData.issueDate,
      supplierRuc: invoiceData.accountingSupplierParty.partyIdentification.id,
      customerName: invoiceData.accountingCustomerParty.partyName.name,
      totalPayable: invoiceData.legalMonetaryTotal.payableAmount.value,
      xmlContent: xmlContent,
      status: 'PENDING_SUNAT_APPROVAL',
      createdAt: processingTimestamp
    });
    console.log(`[FIRESTORE EXITO] Documento escrito en la ruta: invoices/${invoiceData.invoiceID}`);
    console.log(`[FIRESTORE] Factura ${invoiceData.invoiceID} guardada exitosamente con estado PENDING_SUNAT_APPROVAL.`);

    // 4. Encolamiento Asíncrono en Cloud Pub/Sub (Fase 3)
    const messageId = await publishInvoiceToQueue(invoiceData, xmlContent);

    // 5. Respuesta exitosa hacia el POS emisor
    return res.status(200).json({
      status: 'success',
      code: 'PROCESSED_SAVED_AND_QUEUED',
      message: 'Comprobante UBL 2.1 procesado, guardado en Firestore y encolado en Pub/Sub exitosamente',
      data: {
        invoiceID: invoiceData.invoiceID,
        status: 'PENDING_SUNAT_APPROVAL',
        issueDate: invoiceData.issueDate,
        processedAt: processingTimestamp,
        totalPayable: invoiceData.legalMonetaryTotal.payableAmount.value,
        pubSubMessageId: messageId,
        xmlPreview: xmlContent
      }
    });

  } catch (error) {
    console.error('[ERROR CRÍTICO] Fallo en el procesamiento o encolamiento:', error.message);
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error al procesar, guardar o encolar el documento UBL 2.1',
      details: error.message
    });
  }
});

// Puerto de escucha del servidor backend (0.0.0.0 requerido por Cloud Run)
const PORT = parseInt(process.env.PORT, 10) || 8080;
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BOOT] Servidor backend UBL 2.1 escuchando exitosamente en http://0.0.0.0:${PORT}`);
  });
}

module.exports = { app, server };
