const axios = require('axios');
const fs = require('fs');

const api = axios.create({
  baseURL: 'https://api.nfse.io/v2',
  headers: {
    Authorization: 'Token 8bGbW5DsmBxFAMePxeSuofAM9zZ5HWRl9oR2KLhFH0hkpbBbDLJbBjyY4PLS6mWm0c0',
  },
  responseType: 'stream' // importante para receber PDF como stream
});

const companyId = '3c414721022b487ba7c34da19eb9bb87';
const invoiceId = '7b0b3075158b44d5b662fb48611bb89d';

async function baixarPdfNfce() {
  try {
    const response = await api.get(
      `/companies/${companyId}/consumerinvoices/${invoiceId}/pdf`,
      {
        headers: {
          Accept: 'application/pdf'
        }
      }
    );

    const writer = fs.createWriteStream('nfce.pdf');

    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log('PDF da NFC-e salvo como nfce.pdf');
    });

    writer.on('error', (err) => {
      console.error('Erro ao salvar PDF:', err);
    });

  } catch (error) {
    if (error.response && error.response.data) {
      let errorMsg = '';
      try {
        // Tenta ler o corpo da resposta como string para mostrar o erro
        errorMsg = await streamToString(error.response.data);
      } catch {
        errorMsg = JSON.stringify(error.response.data);
      }
      console.error('Erro na resposta da API:', errorMsg);
    } else {
      console.error('Erro na requisição:', error.message);
    }
  }
}

// Função para converter stream para string (útil para erros)
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

baixarPdfNfce();
