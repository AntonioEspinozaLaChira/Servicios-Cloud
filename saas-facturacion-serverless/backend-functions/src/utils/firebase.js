const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const config = { projectId: process.env.GCP_PROJECT_ID || "saas-facturacion-peru-6b3e3" };

// Si el archivo de credenciales existe en local, se usa.
// Si no existe (como en Google Cloud Run), usa Application Default Credentials (ADC) automáticamente.
if (fs.existsSync(keyPath)) {
  try {
    const serviceAccount = require(keyPath);
    config.credential = cert(serviceAccount);
  } catch (err) {
    console.warn('[FIREBASE] No se pudo cargar serviceAccountKey.json, usando ADC.');
  }
}

initializeApp(config);
const db = getFirestore();

module.exports = { db };
