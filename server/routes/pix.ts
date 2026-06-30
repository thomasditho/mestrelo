import { Router } from 'express';
import { fallbackDb } from '../db/index';
import { getSystemSettings } from '../lib/settings';

const router = Router();

// POST /api/pix/gerar — gera payload EMV/BR Code sem gateway
router.post('/api/pix/gerar', async (req, res) => {
  const settings = getSystemSettings();
  if (settings.formasPagamento && settings.formasPagamento.pixGlobalAtivo === false) {
    return res.status(400).json({ error: 'O pagamento via Pix está temporariamente desabilitado pelo administrador do sistema.' });
  }

  const { profissionalId, valor, descricao, txid } = req.body;
  if (!profissionalId || !valor) {
    return res.status(400).json({ error: 'profissionalId e valor obrigatórios.' });
  }
  try {
    const prof = await fallbackDb.findOne('profissionais', (p: any) => p.id === profissionalId);
    const chavePix = prof?.phone?.replace(/\D/g, '') || '';
    if (!chavePix) return res.status(400).json({ error: 'Profissional sem chave PIX cadastrada.' });

    const nomeMerchant = (prof?.name || 'Profissional').substring(0, 25).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const cidadeMerchant = (prof?.city || 'BRASIL').substring(0, 15).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const txidClean = ((txid || 'MST' + Date.now()).replace(/[^A-Z0-9]/gi, '')).substring(0, 25);
    const valorFormatado = parseFloat(valor).toFixed(2);
    const descricaoClean = (descricao || 'Pagamento').substring(0, 35).replace(/[^\w\s]/g, '');

    function tlv(id: string, value: string) {
      return id + String(value.length).padStart(2, '0') + value;
    }
    function crc16(str: string) {
      let crc = 0xffff;
      for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        }
      }
      return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
    }

    const gui = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chavePix) + tlv('02', descricaoClean);
    const merchantAccountInfo = tlv('26', gui);
    const payload = [
      tlv('00', '01'),
      merchantAccountInfo,
      tlv('52', '0000'),
      tlv('53', '986'),
      tlv('54', valorFormatado),
      tlv('58', 'BR'),
      tlv('59', nomeMerchant),
      tlv('60', cidadeMerchant),
      tlv('62', tlv('05', txidClean)),
      '6304',
    ].join('');
    const payloadFinal = payload.slice(0, -4) + '6304' + crc16(payload.slice(0, -4) + '6304');

    return res.json({
      success: true,
      payload: payloadFinal,
      chavePix,
      valor: valorFormatado,
      nomeProfissional: nomeMerchant,
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'Erro ao gerar PIX: ' + e.message });
  }
});

export default router;
