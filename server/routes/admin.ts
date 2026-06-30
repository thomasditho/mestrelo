import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fallbackDb } from '../db/index';
import { getSystemSettings, saveSystemSettings } from '../lib/settings';
import {
  ADMIN_COOKIE,
  ADMIN_SECRET,
  JWT_SECRET,
  COOKIE_NAME,
  adminRateLimit,
  authenticateAdmin,
} from '../middleware/auth';

const router = Router();

// POST /admin/login
router.post('/admin/login', adminRateLimit, (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });

  const token = jwt.sign({ admin: true }, ADMIN_SECRET, { expiresIn: '8h' });
  // Usar sempre SameSite=None e Secure para funcionar dentro do iframe do AI Studio e no deploy em HTTPS (Railway)
  const secure = '; Secure';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=None; Max-Age=${8 * 3600}${secure}`);
  return res.json({ success: true });
});

// POST /admin/logout
router.post('/admin/logout', (_req, res) => {
  const secure = '; Secure';
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=None; Max-Age=0${secure}`);
  return res.json({ success: true });
});

// GET /admin/me
router.get('/admin/me', authenticateAdmin, (_req, res) => {
  return res.json({ success: true, admin: true });
});

// GET /admin/stats
router.get('/admin/stats', authenticateAdmin, async (_req, res) => {
  try {
    const profs = await fallbackDb.findMany('profissionais');
    const servicos = await fallbackDb.findMany('servicos');
    const pagamentos = await fallbackDb.findMany('pagamentos');
    const orcamentos = await fallbackDb.findMany('orcamentos');

    const now = Date.now();
    const dia7 = new Date(now - 7 * 86400000).toISOString();
    const dia30 = new Date(now - 30 * 86400000).toISOString();

    const totalProfs = profs.length;
    const comNome = profs.filter((p: any) => p.name).length;
    const comWhats = profs.filter((p: any) => p.whatsapp_conectado).length;
    const comServico = new Set(servicos.map((s: any) => s.profissional_id)).size;
    const comOrcamento = new Set(orcamentos.map((o: any) => o.profissional_id)).size;
    const novos7d = profs.filter((p: any) => p.created_at && new Date(p.created_at).toISOString() > dia7).length;
    const novos30d = profs.filter((p: any) => p.created_at && new Date(p.created_at).toISOString() > dia30).length;

    const pagos = pagamentos.filter((p: any) => p.status === 'pago');
    const receitaTotal = pagos.reduce((s: number, p: any) => s + (p.valor_total || 0), 0);
    const receita30d = pagos
      .filter((p: any) => p.pago_em && new Date(p.pago_em).toISOString() > dia30)
      .reduce((s: number, p: any) => s + (p.valor_total || 0), 0);

    let dbSize = 'N/A';
    try {
      const stat = fs.statSync(path.join(process.cwd(), 'db_fallback.json'));
      dbSize = (stat.size / 1024).toFixed(1) + ' KB';
    } catch {}

    return res.json({
      success: true,
      funil: { totalProfs, comNome, comWhats, comServico, comOrcamento, novos7d, novos30d },
      receita: { total: receitaTotal, ultimos30d: receita30d, totalPagamentos: pagos.length },
      sistema: { dbSize, uptime: Math.floor(process.uptime() / 60) + ' min', nodeEnv: process.env.NODE_ENV || 'development' },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /admin/profissionais
router.get('/admin/profissionais', authenticateAdmin, async (req, res) => {
  const { busca, page = '1' } = req.query;
  const perPage = 20;
  const pageNum = parseInt(page as string);
  try {
    let profs = await fallbackDb.findMany('profissionais');
    if (busca) {
      const q = (busca as string).toLowerCase();
      profs = profs.filter((p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.specialty?.toLowerCase().includes(q)
      );
    }
    const enriched = await Promise.all(
      profs.map(async (p: any) => {
        const srvs = await fallbackDb.findMany('servicos', (s: any) => s.profissional_id === p.id);
        const orcs = await fallbackDb.findMany('orcamentos', (o: any) => o.profissional_id === p.id);
        const pags = await fallbackDb.findMany('pagamentos', (pg: any) => pg.profissional_id === p.id && pg.status === 'pago');
        const receita = pags.reduce((s: number, pg: any) => s + (pg.valor_total || 0), 0);
        const ultimoServico = srvs.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        return {
          id: p.id, name: p.name, phone: p.phone, specialty: p.specialty,
          city: p.city, slug: p.slug, whatsapp_conectado: p.whatsapp_conectado,
          created_at: p.created_at, ativo: !p.suspenso,
          totalServicos: srvs.length, totalOrcamentos: orcs.length,
          receitaTotal: receita, ultimoAcessoEm: ultimoServico?.created_at || p.created_at,
        };
      })
    );
    const total = enriched.length;
    const paginated = enriched.slice((pageNum - 1) * perPage, pageNum * perPage);
    return res.json({ success: true, profissionais: paginated, total, page: pageNum, pages: Math.ceil(total / perPage) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /admin/profissionais/:id/suspender
router.post('/admin/profissionais/:id/suspender', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { suspender } = req.body;
  try {
    await fallbackDb.update('profissionais', id, { suspenso: suspender });
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /admin/impersonar/:id
router.post('/admin/impersonar/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const prof = await fallbackDb.findOne('profissionais', (p: any) => p.id === id);
    if (!prof) return res.status(404).json({ error: 'Profissional não encontrado.' });
    const impersonateToken = jwt.sign(
      { profissionalId: prof.id, phone: prof.phone, name: prof.name, slug: prof.slug, impersonated: true },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ success: true, token: impersonateToken, profissional: prof });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /admin/impersonar/ativar?token=xxx
router.get('/admin/impersonar/ativar', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Token inválido.');
  try {
    jwt.verify(token as string, JWT_SECRET);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=3600${secure}`);
    return res.redirect('/hoje');
  } catch {
    return res.status(401).send('Token expirado ou inválido.');
  }
});

// GET /admin/settings
router.get('/admin/settings', authenticateAdmin, (_req, res) => {
  try {
    const settings = getSystemSettings();
    return res.json({ success: true, settings });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /admin/settings
router.post('/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'As configurações são obrigatórias.' });
    }
    saveSystemSettings(settings);
    return res.json({ success: true, settings });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
