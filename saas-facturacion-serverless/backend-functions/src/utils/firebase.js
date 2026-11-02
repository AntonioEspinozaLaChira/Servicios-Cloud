const { initializeApp, cert, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const config = { projectId: process.env.GCP_PROJECT_ID || "saas-facturacion-peru-6b3e3" };

if (fs.existsSync(keyPath)) {
  try {
    const serviceAccount = require(keyPath);
    config.credential = cert(serviceAccount);
    console.log('[FIREBASE] Credenciales cargadas desde serviceAccountKey.json local.');
  } catch (err) {
    console.warn('[FIREBASE] No se pudo cargar serviceAccountKey.json, usando ADC.');
    try { config.credential = applicationDefault(); } catch (_) {}
  }
} else {
  try {
    config.credential = applicationDefault();
    console.log('[FIREBASE] Configurado con Application Default Credentials (ADC).');
  } catch (err) {
    console.warn('[FIREBASE] ADC implícito.');
  }
}

try {
  initializeApp(config);
} catch (err) {
  console.warn('[FIREBASE] Advertencia al inicializar Firebase:', err.message);
}

const db = getFirestore();

module.exports = { db };
