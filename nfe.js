const axios = require('axios');

async function emitirNotaFiscal() {
  try {
    const response = await axios.post(
      'https://api.nfse.io/v2/companies/3c414721022b487ba7c34da19eb9bb87/consumerinvoices?emit=true',
      {
        environment: "production",
        operationNature: "Venda de mercadoria",
        model: "65",
        buyer: {
          name: "Roberta Espessoto Costa",
          federalTaxNumber: "17337428839",
          stateTaxNumberIndicator: "nonTaxPayer", // <-- Adicionado aqui
          address: {
            country: "BR",
            zipCode: "01001000",
            street: "Rua Genérica",
            body: "Casa 1",    
            number: "100",
            district: "Centro",
            city: { code: 3550308, name: "São Paulo" },
            state: "SP"
          }
        },
        items: [
          {
            code: "livia",
            description: "Bebê Reborn",
            quantity: 1,
            unitAmount: 249.97,
            totalAmount: 249.97,
            cfop: 5102,
            ncm: "95030021",
            origin: "0",
            tax: {
              totalTax: 0,
              icms: { origin: "0", csosn: "102" },
              pis: { amount: 0, rate: 0, baseTax: 0, cst: "49" },
              cofins: { amount: 0, rate: 0, baseTax: 0, cst: "49" }
            }
          }
        ],
        payments: [{ type: "01", value: 249.97 }]
      },
      {
        headers: {
          Authorization: 'Token 8bGbW5DsmBxFAMePxeSuofAM9zZ5HWRl9oR2KLhFH0hkpbBbDLJbBjyY4PLS6mWm0c0',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Nota fiscal emitida com sucesso:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Erro ao emitir NFC-e detalhado:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Erro inesperado ao emitir NFC-e:', error.message);
    }
  }
}

emitirNotaFiscal();
