import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings_sistema.json');

export interface PlanoConfig {
  id: string;
  nome: string;
  preco: string;
  stripePriceId: string;
  ativo: boolean;
}

export interface SistemaSettings {
  planos: PlanoConfig[];
  formasPagamento: {
    pixGlobalAtivo: boolean;
    cartaoStripeAtivo: boolean;
  };
  credenciais: {
    evolutionApiUrl: string;
    evolutionApiToken: string;
    geminiApiKey: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
  };
}

const DEFAULT_SETTINGS: SistemaSettings = {
  planos: [
    { id: 'mensal', nome: 'Plano Pro Mensal', preco: '49.90', stripePriceId: '', ativo: true },
    { id: 'trimestral', nome: 'Plano Pro Trimestral', preco: '119.70', stripePriceId: '', ativo: false },
    { id: 'anual', nome: 'Plano Pro Anual', preco: '399.00', stripePriceId: '', ativo: false }
  ],
  formasPagamento: {
    pixGlobalAtivo: true,
    cartaoStripeAtivo: true
  },
  credenciais: {
    evolutionApiUrl: '',
    evolutionApiToken: '',
    geminiApiKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: ''
  }
};

export function getSystemSettings(): SistemaSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Garantir compatibilidade e fallback de dados mesclando com o padrão
      return {
        planos: Array.isArray(data.planos) ? data.planos : DEFAULT_SETTINGS.planos,
        formasPagamento: { ...DEFAULT_SETTINGS.formasPagamento, ...data.formasPagamento },
        credenciais: { ...DEFAULT_SETTINGS.credenciais, ...data.credenciais }
      };
    }
  } catch (e) {
    console.error('Falha ao ler settings_sistema.json, usando padrão:', e);
  }
  
  // Salvar padrão para futuras leituras limpas se não existia
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  } catch {}
  
  return DEFAULT_SETTINGS;
}

export function saveSystemSettings(settings: SistemaSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Falha ao gravar settings_sistema.json:', e);
  }
}
