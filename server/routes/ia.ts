import { Router } from 'express';
import { getSystemSettings } from '../lib/settings';

const router = Router();

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

// POST /api/ia/transcrever — transcrição de áudio/voz via Gemini multimodal
router.post('/api/ia/transcrever', async (req, res) => {
  const { audio, mimeType, prompt } = req.body;
  if (!audio) return res.status(400).json({ error: 'Os dados do áudio em base64 são obrigatórios.' });

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: true,
      simulated: true,
      transcription: "Transcrição simulada: 'Lembrar de comprar 3 latas de tinta acrílica Suvinil fosca na cor branco gelo, 2 lixas nº 150 e uma fita crepe larga. O serviço na sala do apartamento da Dona Maria precisa começar às 8h da quarta-feira.'",
    });
  }

  try {
    const audioPart = { inlineData: { mimeType: mimeType || 'audio/webm', data: audio } };
    const textPart = {
      text: prompt || 'Transcreva este áudio do microfone com precisão de mestre de obras. Corrija termos técnicos ou nomes se necessário, mas mantenha o texto original do profissional. Formate o resultado separando em: 1. Transcrição Direta 2. Lista de Tarefas / Materiais Identificados.',
    };
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [audioPart, textPart] },
    });
    return res.json({ success: true, transcription: response.text?.trim() || '' });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: error.message || 'Erro ao processar áudio.' });
  }
});

// POST /api/ia/gerar-bio — gera bio para mini-site via Gemini
router.post('/api/ia/gerar-bio', async (req, res) => {
  const { name, specialty } = req.body;
  if (!name || !specialty) return res.status(400).json({ error: 'Nome e especialidade são obrigatórios.' });

  const ai = getGeminiClient();
  if (!ai) {
    const fallbackBio = `Olá, sou o ${name}, especialista em ${specialty}. Busco sempre entregar um serviço com alto padrão de qualidade, organização e pontualidade. Realizo cada atendimento de forma dedicada e com foco na satisfação total dos meus clientes. Conte comigo para garantir segurança e perfeição no seu projeto!`;
    return res.json({ success: true, simulated: true, bio: fallbackBio });
  }

  try {
    const prompt = `Escreva uma biografia curta, muito profissional e atraente para o mini-site de um prestador de serviços. Nome do profissional: ${name}. Especialidade: ${specialty}. Regras: 1. Escreva em português do Brasil. 2. Deve ser curto (máximo de 3 parágrafos ou 4 linhas). 3. Use um tom de confiança, honestidade, pontualidade e capricho. 4. Escreva em primeira pessoa do singular ou de forma neutra e direta. 5. Não adicione placeholders ou informações falsas. Escreva apenas o texto final da biografia.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
    return res.json({ success: true, bio: response.text?.trim() || '' });
  } catch (error: any) {
    console.error('Error generating bio:', error);
    const fallbackBio = `Olá, sou o ${name}, especialista em ${specialty}. Realizo serviços com total dedicação, foco em qualidade, organização e respeito aos prazos combinados. Fale comigo para agendar seu orçamento!`;
    return res.json({ success: true, bio: fallbackBio });
  }
});

export default router;
