const { supabase } = require('../models/supabaseClient');
const QRCode = require('qrcode');

exports.listarSkusComQr = async (req, res) => {
  try {
    const { data: skus, error } = await supabase
      .from('precos')
      .select('sku, preco, foto')
      .order('sku');

    if (error) throw error;

    const skusComQr = await Promise.all(
      skus.map(async (item) => {
        const qrDataUrl = await QRCode.toDataURL(item.sku);
        return {
          sku: item.sku,
          preco: item.preco,
          foto: item.foto,
          qrCode: qrDataUrl
        };
      })
    );

    res.json(skusComQr);
  } catch (err) {
    console.error('Erro ao listar SKUs com QR:', err);
    res.status(500).json({ erro: 'Erro ao listar SKUs.' });
  }
};

exports.page = (req, res) => {
  res.render('qrcodes');
};
