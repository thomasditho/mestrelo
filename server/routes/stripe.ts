import { Router } from 'express';
import Stripe from 'stripe';
import { fallbackDb, db, useFallback } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { registrarEntradaPagamento } from '../lib/helpers';
import { getSystemSettings } from '../lib/settings';

const router = Router();

function getStripe(): Stripe {
  const settings = getSystemSettings();
  const key = settings.credenciais.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required');
  return new Stripe(key, { apiVersion: '2025-01-27' as any });
}

// POST /api/checkout/create-session
router.post('/api/checkout/create-session', async (req, res) => {
  const { title, amount, successUrl, cancelUrl, servicoId, clienteId, profissionalId } = req.body;
  if (!amount || !title) return res.status(400).json({ error: 'Título e valor são obrigatórios.' });

  const settings = getSystemSettings();
  if (settings.formasPagamento && settings.formasPagamento.cartaoStripeAtivo === false) {
    return res.status(400).json({ error: 'O pagamento via Cartão de Crédito está temporariamente desabilitado pelo administrador do sistema.' });
  }

  const stripeKey = settings.credenciais.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    const simulatedSessionId = 'cs_sim_' + Math.random().toString(36).substr(2, 10);
    const simulatedUrl = `${successUrl || 'http://localhost:3000/'}${successUrl?.includes('?') ? '&' : '?'}session_id=${simulatedSessionId}&simulated=true`;
    return res.json({ success: true, simulated: true, sessionId: simulatedSessionId, url: simulatedUrl });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: title },
          unit_amount: Math.round(Number(amount) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${successUrl || 'http://localhost:3000/'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || 'http://localhost:3000/',
      metadata: {
        servicoId: servicoId || '',
        clienteId: clienteId || '',
        profissionalId: profissionalId || '',
      },
    });
    return res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Erro ao criar checkout.' });
  }
});

// POST /api/checkout/webhook
router.post('/api/checkout/webhook', async (req: any, res) => {
  const sig = req.headers['stripe-signature'];
  const settings = getSystemSettings();
  const webhookSecret = settings.credenciais.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;

  if (webhookSecret && sig) {
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    event = req.body;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { servicoId, clienteId, profissionalId } = session.metadata || {};
    const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

    if (servicoId) {
      try {
        if (useFallback) {
          const servico = await fallbackDb.findOne('servicos', (s: any) => s.id === servicoId);
          if (servico) await fallbackDb.update('servicos', servicoId, { ...servico, statusPagamento: 'Pago' });
        } else {
          await db.update(schema.servicos).set({ statusPagamento: 'Pago' } as any).where(eq(schema.servicos.id, servicoId)).execute();
        }
      } catch (err) {
        console.error('Failed to update service status:', err);
      }
    }

    if (profissionalId && amountTotal > 0) {
      await registrarEntradaPagamento(
        profissionalId,
        amountTotal,
        `Pagamento de Serviço${servicoId ? ' #' + servicoId.substr(-4) : ''} via Stripe`
      );
    }
  }

  res.json({ received: true });
});

export default router;
