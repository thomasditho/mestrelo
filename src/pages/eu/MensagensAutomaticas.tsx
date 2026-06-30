import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function MensagensAutomaticas() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!profissional?.id) return;
    fetch(`/api/mensagens-auto?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setMensagens(d.templates || []))
      .finally(() => setLoading(false));
  }, [profissional?.id]);

  const updateMsg = (id: string, texto: string) => {
    setMensagens(prev => prev.map(m => m.id === id ? { ...m, template: texto } : m));
  };

  const handleSave = async () => {
    setSalvando(true);
    try {
      await Promise.all(mensagens.map(m =>
        fetch(`/api/mensagens-auto/${m.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ template: m.template, ativo: m.ativo }),
        })
      ));
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } finally { setSalvando(false); }
  };

  const TIPO_LABELS: Record<string, { label: string; color: string }> = {
    orcamento_enviado: { label: 'Ao enviar Orçamento', color: 'text-brand-blue-500' },
    cobranca_lembrete: { label: 'Lembrete de Cobrança', color: 'text-brand-green-500' },
    confirmacao_agendamento: { label: 'Confirmação de Agendamento', color: 'text-amber-500' },
    pos_servico: { label: 'Pós-Serviço (Avaliação)', color: 'text-purple-500' },
    aniversario: { label: 'Aniversário do Cliente', color: 'text-rose-500' },
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Mensagens Automáticas</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <p className="text-sm text-slate-600">
          Personalize as mensagens enviadas automaticamente para seus clientes no WhatsApp.
          Use <code className="bg-surface-100 px-1 rounded text-xs">[Nome do Cliente]</code>, <code className="bg-surface-100 px-1 rounded text-xs">[Valor]</code>, <code className="bg-surface-100 px-1 rounded text-xs">[Link]</code> ou <code className="bg-surface-100 px-1 rounded text-xs">[Nome do Profissional]</code> como variáveis dinâmicas que serão substituídas na hora de enviar.
        </p>

        {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>}

        {!loading && (
          <div className="space-y-4">
            {mensagens.map(m => {
              const cfg = TIPO_LABELS[m.tipo] || { label: m.tipo, color: 'text-slate-600' };
              return (
                <Card key={m.id} className="border-none shadow-sm overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold flex items-center gap-2 ${cfg.color}`}>
                        <MessageSquare size={16} /> {cfg.label}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.ativo}
                          onChange={e => {
                            setMensagens(prev => prev.map(item => item.id === m.id ? { ...item, ativo: e.target.checked } : item));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-600"></div>
                      </label>
                    </div>

                    <textarea
                      rows={4}
                      className="w-full p-3.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white placeholder:text-slate-400 leading-relaxed font-sans"
                      value={m.template || ''}
                      onChange={e => updateMsg(m.id, e.target.value)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleSave}
          disabled={salvando || loading}
          className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base border-none"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          {salvo ? 'Mensagens Salvas!' : salvando ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}