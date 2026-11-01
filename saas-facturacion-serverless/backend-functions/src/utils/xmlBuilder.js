const xml2js = require('xml2js');
const { buildUblInvoiceObject } = require('../schemas/ublSchema');

/**
 * Convierte los datos de la factura en un archivo XML UBL 2.1
 */
function generateUBLXML(invoiceData) {
  const ublObject = buildUblInvoiceObject(invoiceData);
  
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8', standalone: false },
    renderOpts: { pretty: true, indent: '  ', newline: '\n' }
  });

  return builder.buildObject(ublObject);
}

module.exports = { generateUBLXML };
