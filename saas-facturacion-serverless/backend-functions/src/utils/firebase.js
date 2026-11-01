const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Cargar las credenciales de la cuenta de servicio de forma absoluta
const serviceAccount = require(path.resolve(__dirname, '../../serviceAccountKey.json'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: "saas-facturacion-peru-6b3e3"
});
// Obtener la instancia de Firestore
const db = getFirestore();


module.exports = { db };