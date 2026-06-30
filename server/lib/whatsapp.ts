import { getSystemSettings } from './settings';

// ── Helper: chamar Evolution API ─────────────────────────────────────────────
export async function evolutionApiRequest(method: string, evoPath: string, body?: any) {
  const settings = getSystemSettings();
  const baseUrl = settings.credenciais.evolutionApiUrl || process.env.EVOLUTION_API_URL;
  const apiKey = settings.credenciais.evolutionApiToken || process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('Evolution API não configurada.');
  const response = await fetch(`${baseUrl}${evoPath}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Evolution API ${response.status}: ${err}`);
  }
  return response.json();
}

// ── Helper: preencher variáveis em template ───────────────────────────────────
export function preencherTemplate(template: string, vars: Record<string, string>): string {
  let msg = template;
  for (const [key, val] of Object.entries(vars)) {
    msg = msg.replaceAll(`{${key}}`, val || '');
  }
  return msg;
}

// ── Helper: enviar mensagem via Evolution API (com fallback de log) ──────────
export async function enviarMensagem(
  profissionalId: string,
  telefone: string,
  mensagem: string
) {
  const settings = getSystemSettings();
  const baseUrl = settings.credenciais.evolutionApiUrl || process.env.EVOLUTION_API_URL;
  const apiKey = settings.credenciais.evolutionApiToken || process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    console.log(`[WA Sim] → ${telefone}: ${mensagem.substring(0, 60)}...`);
    return;
  }
  const instanceName = `mestrelo_${profissionalId}`;
  const clean = telefone.replace(/\D/g, '');
  const phoneJid = (clean.startsWith('55') ? clean : `55${clean}`) + '@s.whatsapp.net';
  try {
    await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: phoneJid, text: mensagem }),
    });
  } catch (e) {
    console.error('Erro ao enviar WA:', e);
  }
}
