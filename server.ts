import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// ── Middleware ────────────────────────────────────────────────────────────────
import { errorHandler, requestLogger } from './server/middleware/errorHandler';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './server/routes/auth';
import profissionalRoutes from './server/routes/profissional';
import clientesRoutes from './server/routes/clientes';
import servicosRoutes from './server/routes/servicos';
import orcamentosRoutes from './server/routes/orcamentos';
import pagamentosRoutes from './server/routes/pagamentos';
import financeiroRoutes from './server/routes/financeiro';
import avaliacoesRoutes from './server/routes/avaliacoes';
import pixRoutes from './server/routes/pix';
import uploadsRoutes from './server/routes/uploads';
import mensagensRoutes from './server/routes/mensagens';
import relatorioRoutes from './server/routes/relatorio';
import minisiteRoutes from './server/routes/minisite';
import whatsappRoutes from './server/routes/whatsapp';
import iaRoutes from './server/routes/ia';
import stripeRoutes from './server/routes/stripe';
import adminRoutes from './server/routes/admin';
import cronRoutes, { agendarCronDiario } from './server/routes/cron';

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Raw body parser support (Stripe webhook needs req.rawBody)
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Request logger (API routes only)
app.use(requestLogger);

// ── Mount all route modules ───────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profissionalRoutes);
app.use('/', clientesRoutes);
app.use('/', servicosRoutes);
app.use('/', orcamentosRoutes);
app.use('/', pagamentosRoutes);
app.use('/', financeiroRoutes);
app.use('/', avaliacoesRoutes);
app.use('/', pixRoutes);
app.use('/', uploadsRoutes);
app.use('/', mensagensRoutes);
app.use('/', relatorioRoutes);
app.use('/', minisiteRoutes);
app.use('/', whatsappRoutes);
app.use('/', iaRoutes);
app.use('/', stripeRoutes);
app.use('/', adminRoutes);
app.use('/', cronRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ── Vite dev server / Static production ──────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback — deve vir DEPOIS das rotas de API
    app.get('*', (req, res) => {
      // Não fazer fallback para rotas de API
      if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) {
        return res.status(404).json({ error: 'Route not found.' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔨 Mestrelo running on http://localhost:${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

// ── Global error handler (must come after all routes) ────────────────────────
app.use(errorHandler);

startServer().then(() => {
  agendarCronDiario(PORT);
});
