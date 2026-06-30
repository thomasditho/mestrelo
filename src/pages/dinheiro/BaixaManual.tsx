import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, DollarSign, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function BaixaManual() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profissional } = useAuth();

  const [pagamento, setPagamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id || !profissional?.id) return;
    fetch(`/api/pagamentos?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const pag = (d.pagamentos || []).find((p: any) => p.id === id);
        setPagamento(pag || null);
      })
      .finally(() => setLoading(false));
  }, [id, profissional?.id]);

  const handleConfirm = async () => {
    if (!id) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(`/api/pagamentos/${id}/receber`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ formaPagamento: method }),
      });
      if (!res.ok) throw new Error('Erro ao confirmar pagamento');
      setSalvo(true);
      setTimeout(() => navigate('/dinheiro'), 1500);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">Confirmar Pagamento</h1>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <div className="text-center py-6">
          {pagamento?.clienteNome && (
            <p className="text-sm font-medium text-slate-500 mb-1">{pagamento.clienteNome}</p>
          )}
          <h2 className="text-4xl font-display font-bold text-surface-900">
            R$ {fmt(pagamento?.valor_total || 0)}
          </h2>
          {pagamento?.descricao && (
            <p className="text-xs text-slate-400 mt-2">{pagamento.descricao}</p>
          )}
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>}

        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-surface-900 mb-2">Como você recebeu?</h3>

            <div className="space-y-3">
              {[
                { key: 'pix', icon: <Smartphone size={20} />, label: 'Transferência PIX', sub: 'Caiu direto na conta', color: '#25D366' },
                { key: 'dinheiro', icon: <DollarSign size={20} />, label: 'Dinheiro em Espécie', sub: 'Recebeu em mãos', color: '#10b981' },
                { key: 'cartao', icon: <CreditCard size={20} />, label: 'Cartão / Maquininha', sub: 'Débito ou Crédito', color: '#3b82f6' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setMethod(opt.key as any)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${method === opt.key ? 'border-current bg-current/5' : 'border-surface-200 bg-white hover:border-surface-300'}`}
                  style={method === opt.key ? { borderColor: opt.color, backgroundColor: opt.color + '10' } : {}}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: method === opt.key ? opt.color : '#f1f5f9', color: method === opt.key ? '#fff' : '#64748b' }}>
                    {opt.icon}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-surface-900">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.sub}</p>
                  </div>
                  {method === opt.key && <CheckCircle2 size={20} style={{ color: opt.color }} />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleConfirm}
          disabled={salvando || salvo}
          className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {salvo ? '✓ Confirmado!' : 'Confirmar Recebimento'}
        </Button>
      </div>
    </div>
  );
}