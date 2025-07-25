const axios = require('axios');

const companyId = '3c414721022b487ba7c34da19eb9bb87'; // substitua pelo seu companyId
const apiToken = '8bGbW5DsmBxFAMePxeSuofAM9zZ5HWRl9oR2KLhFH0hkpbBbDLJbBjyY4PLS6mWm0c0'; // substitua pelo seu token

exports.listCertificates = async (req, res) => {
  try {
    const api = axios.create({
      baseURL: 'https://api.nfse.io/v2',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    const response = await api.get(`/companies/${companyId}/certificates`);
    const certificados = response.data.certificates || [];

    res.render('certificados', { certificates: certificados });
  } catch (error) {
    console.error('Erro ao buscar certificados:', error.message);
    res.status(500).send('Erro interno ao buscar certificados');
  }
};

