// Recebe o formulário do site e repassa o lead ao CRM (Avenzys).
// O endereço do CRM funciona como senha: fica só na variável de ambiente
// CRM_WEBHOOK_URL do projeto na Vercel, nunca no código nem no navegador.

const ORIGEM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'gbraid', 'wbraid', 'fbclid'];
const SITE = 'fisiobellaestetica.com.br';

function texto(v, max) {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  // Só aceita envios feitos pelo próprio site
  const origem = req.headers.origin || req.headers.referer || '';
  let host = '';
  try { host = new URL(origem).hostname; } catch (e) { /* sem origem */ }
  if (host !== SITE && host !== 'www.' + SITE && !host.endsWith('.vercel.app')) {
    return res.status(403).end();
  }

  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return res.status(500).json({ erro: 'CRM_WEBHOOK_URL não configurada' });

  let d = req.body || {};
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (e) { d = {}; }
  }

  // Campo invisível: robôs preenchem, pessoas não
  if (texto(d.empresa, 100)) return res.status(204).end();

  const nome = texto(d.nome, 80);
  const whatsapp = texto(d.whatsapp, 20).replace(/\D/g, '');
  if (nome.length < 2 || whatsapp.length < 10 || whatsapp.length > 11) {
    return res.status(400).json({ erro: 'dados inválidos' });
  }

  const lead = { nome: nome, whatsapp: whatsapp };
  const interesse = texto(d.interesse, 80);
  if (interesse) lead.interesse = interesse;
  for (const k of ORIGEM) {
    const v = texto(d[k], 200);
    if (v) lead[k] = v;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, 8000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      signal: ctrl.signal
    });
    if (!r.ok) {
      console.error('CRM respondeu', r.status);
      return res.status(502).json({ erro: 'CRM recusou' });
    }
    return res.status(204).end();
  } catch (e) {
    console.error('Falha ao enviar ao CRM', e && e.message);
    return res.status(502).json({ erro: 'CRM indisponível' });
  } finally {
    clearTimeout(timer);
  }
};
