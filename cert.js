const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.nfse.io/v2',
  headers: {
    'Authorization': 'Token 8bGbW5DsmBxFAMePxeSuofAM9zZ5HWRl9oR2KLhFH0hkpbBbDLJbBjyY4PLS6mWm0c0',
    'Content-Type': 'application/json'
  }
});

const companyId = '3c414721022b487ba7c34da19eb9bb87'; // substitua pelo seu company_id

async function consultarCertificado() {
  try {
    const response = await api.get(`/companies/${companyId}/certificates`);
    console.log('✅ Certificados encontrados:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erro ao consultar certificado:');
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

consultarCertificado();
