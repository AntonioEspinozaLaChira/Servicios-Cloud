/**
 * Mapeo y estructuración de los datos del POS hacia el esquema UBL 2.1
 */function buildUblInvoiceObject(data) {
  return {
    'Invoice': {
      $: {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
      },
      'cbc:UBLVersionID': data.ublVersion || '2.1',
      'cbc:CustomizationID': data.customizationID || '2.0',
      'cbc:ID': data.invoiceID,
      'cbc:IssueDate': data.issueDate,
      'cbc:IssueTime': data.issueTime,
      'cbc:InvoiceTypeCode': data.invoiceTypeCode,
      'cbc:DocumentCurrencyCode': data.documentCurrencyCode,
      
      // Datos del Emisor
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cac:PartyIdentification': {
            'cbc:ID': data.accountingSupplierParty.partyIdentification.id
          },
          'cac:PartyName': {
            'cbc:Name': data.accountingSupplierParty.partyName.name
          }
        }
      },
      
      // Datos del Cliente
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cac:PartyIdentification': {
            'cbc:ID': data.accountingCustomerParty.partyIdentification.id
          },
          'cac:PartyName': {
            'cbc:Name': data.accountingCustomerParty.partyName.name
          }
        }
      },
      
      // Totales de Impuestos
      'cac:TaxTotal': {
        'cbc:TaxAmount': { 
          $: { currencyID: data.documentCurrencyCode }, 
          _: data.taxTotal.taxAmount.value 
        }
      },
      
      // Importes Monetarios Totales
      'cac:LegalMonetaryTotal': {
        'cbc:PayableAmount': { 
          $: { currencyID: data.documentCurrencyCode }, 
          _: data.legalMonetaryTotal.payableAmount.value 
        }
      },

      // Líneas de Productos / Ítems de la Factura
      'cac:InvoiceLine': data.invoiceLine.map(line => ({
        'cbc:ID': line.id,
        'cbc:InvoicedQuantity': {
          $: { unitCode: line.invoicedQuantity.unitCode },
          _: line.invoicedQuantity.value
        },
        'cbc:LineExtensionAmount': {
          $: { currencyID: data.documentCurrencyCode },
          _: line.lineExtensionAmount.value
        },
        'cac:PricingReference': {
          'cac:AlternativeConditionPrice': {
            'cbc:PriceAmount': {
              $: { currencyID: data.documentCurrencyCode },
              _: line.pricingReference.alternativeConditionPrice.priceAmount.value
            },
            'cbc:PriceTypeCode': line.pricingReference.alternativeConditionPrice.priceTypeCode
          }
        },
        'cac:Item': {
          'cbc:Description': line.item.description
        },
        'cac:Price': {
          'cbc:PriceAmount': {
            $: { currencyID: data.documentCurrencyCode },
            _: line.price.priceAmount.value
          }
        }
      }))
    }
  };
}

module.exports = { buildUblInvoiceObject };