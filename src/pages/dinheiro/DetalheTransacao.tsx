import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Tag, AlignLeft, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function DetalheTransacao() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profesional } = useAuth();
  const [transacao, setTransacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profisional?.id) return;
    const d = new Date();

    const buscarMes = async (mes: number, ano: number) => {
      const mm = String(mes).padStart(2, '0');
      const res = await fetch(`/api/financeiro/dashboard?profissionalId=${profisional.id}&mes=${mm}&ano=${ano}`, { credentials: 'include' });
      const data = await res.json();
      return (data.transacoes || []).find((t: any) => t.id === id);
    };

    const mesAtual = d.getMonth() + 1;
    const anoAtual = d.getFullYear();
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
    const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

    Promise.all([
      buscarMes(mesAtual, anoAtual),
      buscarMes(mesAnterior, anoAnterior),
    ]).then(([t1, t2]) => {
      setTransacao(t1 || t2 || null);
    }).finally(() => setLoading(false));
  }, [id, profesional?.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (!transacao) return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-slate-500 mb-4">Transação não encontrada.</p>
      <button onClick={() => navigate(-1)} className="text-brand-blue-600 font-bold text-sm">Voltar</button>
    </div>
  );

  const isEntrada = transacao.tipo === 'entrada';

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className={`${isEntrada ? 'bg-emerald-600' : 'bg-red-600'} text-white px-4 py-4 rounded-b-[2rem] shadow-sm relative`}>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg">
            {isEntrada ? 'Detalhe do Recebimento' : 'Detalhe do Pagamento'}
          </h1>
        </div>

        <div className="text-center relative z-10 pb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
            {isEntrada ? <ArrowDownRight size={32} /> : <ArrowUpRight size={32} />}
          </div>
          <h2 className="text-3xl font-display font-bold mb-1">
            {isEntrada ? '+' : '-'} R$ {fmt(transacao.valor || 0)}
          </h2>
          <p className="text-white/80">{transacao.descricao}</p>
        </div>

        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      </header>

      <div className="p-4 space-y-4 -mt-4 relative z-20">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3 pt-2">
              {transacao.categoria && (
                <div className="flex gap-3">
                  <Tag size={18} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Categoria</span>
                    <span className="font-medium text-surface-900">{transacao.categoria}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Calendar size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-medium text-slate-500">Data</span>
                  <span className="font-medium text-surface-900">
                    {transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <AlignLeft size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs font-medium text-slate-500">Descrição</span>
                  <span className="text-surface-900 text-sm leading-relaxed">{transacao.descricao || '—'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-[18px] shrink-0 mt-0.5 text-slate-400 font-bold text-xs flex items-start justify-center">R$</div>
                <div>
                  <span className="block text-xs font-medium text-slate-500">Tipo</span>
                  <span className={`font-bold ${isEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isEntrada ? 'Entrada' : 'Saída'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
