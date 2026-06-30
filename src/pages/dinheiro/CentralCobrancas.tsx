import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Send, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function CentralCobrancas() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [tab, setTab] = useState<'pendentes' | 'pagas'>('pendentes');
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profissional?.id) return;
    setLoading(true);
    fetch(`/api/pagamentos?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setPagamentos(d.pagamentos || []))
      .finally(() => setLoading(false));
  }, [profissional?.id]);

  const hoje = new Date().toISOString().split('T')[0];
  const pendentes = pagamentos.filter(p => p.status === 'pendente');
  const pagas = pagamentos.filter(p => p.status === 'pago');
  const lista = tab === 'pendentes' ? pendentes : pagas;

  const isAtrasado = (p: any) => p.vencimento && p.vencimento < hoje;

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Cobranças</h1>
        </div>
        <div className="flex border-t border-surface-100">
          <button
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'pendentes' ? 'border-brand-blue-600 text-brand-blue-600' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab('pendentes')}
          >
            A Receber ({pendentes.length})
          </button>
          <button
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'pagas' ? 'border-brand-blue-600 text-brand-blue-600' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab('pagas')}
          >
            Pagas ({pagas.length})
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>}

        {!loading && lista.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p>Nenhum pagamento {tab === 'pendentes' ? 'pendente' : 'pago'} ainda.</p>
          </div>
        )}

        {lista.map(p => (
          <Card key={p.id} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-surface-900">{p.clienteNome || '—'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.descricao}</p>
                  <p className="font-display font-bold text-lg text-brand-blue-600 mt-2">
                    R$ {fmt(p.valor_total || 0)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  {p.status === 'pendente' && (
                    <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${
                      isAtrasado(p) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Clock size={12} /> {isAtrasado(p) ? 'Atrasado' : 'Pendente'}
                    </div>
                  )}
                  {p.status === 'pago' && (
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                      ✓ Pago
                    </div>
                  )}
                  {p.vencimento && (
                    <p className="text-xs text-slate-400">
                      {p.status === 'pago' ? 'Pago em' : 'Vence em'}: {new Date(p.vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {p.status === 'pendente' && (
                <div className="bg-surface-50 p-3 border-t border-surface-100 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs bg-white"
                    onClick={() => navigate(`/dinheiro/baixa/${p.id}`)}
                  >
                    Dar Baixa (Manual)
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-[#25D366] hover:bg-[#20bd5a] border-none text-white font-bold"
                    onClick={() => navigate(`/dinheiro/pix/${p.id}`)}
                  >
                    <Send size={12} className="mr-1" /> Enviar PIX
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
          