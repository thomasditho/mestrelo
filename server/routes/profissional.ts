import { Router } from 'express';
import { fallbackDb, db, useFallback } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { getProfissionalBySlug } from '../lib/helpers';
import { getSystemSettings } from '../lib/settings';

function getGeminiClient() {
  const settings = getSystemSettings();
  const apiKey = settings.credenciais.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = require('@google/genai');
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize Gemini API:', err);
    return null;
  }
}

const router = Router();

// POST /api/profissional/cadastro
router.post('/api/profissional/cadastro', async (req, res) => {
  const { id, name, photoUrl, specialty, city, areaOfExpertise } = req.body;
  if (!id) return res.status(400).json({ error: 'ID do profissional é obrigatório.' });

  try {
    let current: any = null;
    if (useFallback) {
      current = await fallbackDb.findOne('profissionais', (p: any) => p.id === id);
    } else {
      const result = await db.select().from(schema.profissionais).where(eq(schema.profissionais.id, id)).limit(1).execute();
      current = result[0];
    }
    if (!current) return res.status(404).json({ error: 'Profissional não encontrado.' });

    const updated = {
      ...current,
      name: name ?? current.name,
      photoUrl: photoUrl ?? current.photoUrl,
      specialty: specialty ?? current.specialty,
      city: city ?? current.city,
      areaOfExpertise: areaOfExpertise ?? current.areaOfExpertise,
    };

    if (useFallback) {
      await fallbackDb.update('profissionais', id, updated);
    } else {
      await db.update(schema.profissionais).set(updated).where(eq(schema.profissionais.id, id)).execute();
    }
    return res.json({ success: true, profissional: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Erro ao salvar perfil.' });
  }
});

// POST /api/profissional/generate-bio
router.post('/api/profissional/generate-bio', async (req, res) => {
  const { name, specialty } = req.body;
  if (!name || !specialty) return res.status(400).json({ error: 'Nome e especialidade são obrigatórios.' });

  try {
    let bioText = '';
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `Escreva uma biografia curta, muito profissional e atraente para o mini-site de um prestador de serviços. Nome do profissional: ${name}. Especialidade: ${specialty}. Regras: 1. Escreva em português do Brasil. 2. Deve ser curto (máximo de 3 parágrafos ou 4 linhas). 3. Use um tom de confiança, honestidade, pontualidade e capricho. 4. Escreva em primeira pessoa do singular ou de forma neutra e direta. 5. Não adicione placeholders ou informações falsas. Escreva apenas o texto final da biografia.`;
      const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
      bioText = response.text?.trim() || '';
    }
    if (!bioText) {
      bioText = `Olá, sou o ${name}, especialista em ${specialty}. Busco sempre entregar um serviço com alto padrão de qualidade, organização e pontualidade. Realizo cada atendimento de forma dedicada e com foco na satisfação total dos meus clientes. Conte comigo para garantir segurança e perfeição no seu projeto!`;
    }
    return res.json({ success: true, bio: bioText });
  } catch (error) {
    console.error('Error generating bio:', error);
    const fallbackBio = `Olá, sou o ${name}, especialista em ${specialty}. Realizo serviços com total dedicação, foco em qualidade, organização e respeito aos prazos combinados. Fale comigo para agendar seu orçamento!`;
    return res.json({ success: true, bio: fallbackBio });
  }
});

// POST/PUT /api/profissional/mini-site-settings
async function handleMiniSiteSettings(req: any, res: any) {
  const body = req.body;
  const profId = body.id || body.profissionalId;
  if (!profId) return res.status(400).json({ error: 'ID do profissional é obrigatório.' });

  try {
    let current: any = null;
    if (useFallback) {
      current = await fallbackDb.findOne('profissionais', (p: any) => p.id === profId);
    } else {
      const result = await db.select().from(schema.profissionais).where(eq(schema.profissionais.id, profId)).limit(1).execute();
      current = result[0];
    }
    if (!current) return res.status(404).json({ error: 'Profissional não encontrado.' });

    const newSlug = body.slug ? body.slug.toLowerCase().trim() : undefined;
    if (newSlug && newSlug !== current.slug?.toLowerCase().trim()) {
      const existing = await getProfissionalBySlug(newSlug);
      if (existing && existing.id !== profId) {
        return res.status(400).json({ error: 'Este link de mini-site já está em uso. Escolha outro.' });
      }
    }

    const newThemeColor = body.theme_color ?? body.themeColor;
    const updated = {
      ...current,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.pix_key !== undefined && { pix_key: body.pix_key }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.specialty !== undefined && { specialty: body.specialty }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(newSlug !== undefined && { slug: newSlug }),
      ...(newThemeColor !== undefined && { themeColor: newThemeColor }),
    };

    if (useFallback) {
      await fallbackDb.update('profissionais', profId, updated);
    } else {
      await db.update(schema.profissionais).set(updated).where(eq(schema.profissionais.id, profId)).execute();
    }
    return res.json({ success: true, profissional: updated });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
}

router.post('/api/profissional/mini-site-settings', handleMiniSiteSettings);
router.put('/api/profissional/mini-site-settings', handleMiniSiteSettings);

// GET /api/profissional/mini-site/:slug
router.get('/api/profissional/mini-site/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const prof = await getProfissionalBySlug(slug);
    if (!prof) return res.status(404).json({ error: 'Mini-site não encontrado.' });
    return res.json({ success: true, profissional: prof });
  } catch (error) {
    console.error('Error fetching mini-site:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do mini-site.' });
  }
});

// GET /api/profissional/me/:id
router.get('/api/profissional/me/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let current: any = null;
    if (useFallback) {
      current = await fallbackDb.findOne('profissionais', (p: any) => p.id === id);
    } else {
      const result = await db.select().from(schema.profissionais).where(eq(schema.profissionais.id, id)).limit(1).execute();
      current = result[0];
    }
    if (!current) return res.status(404).json({ error: 'Profissional não encontrado.' });
    return res.json({ success: true, profissional: current });
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

export default router;
