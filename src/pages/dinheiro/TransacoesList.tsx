import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function TransacoesList() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [filter, setFilter] = useState<'todas' | 'entradas' | 'saidas'>('todas');
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!profissional?.id) return;
    setLoading(true);
    const [ano, mesNum] = mes.split('-');
    fetch(`/api/financeiro/dashboard?profissionalId=${profissional.id}&mes=${mesNum}&ano=${ano}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setTransacoes(d.transacoes || []))
      .finally(() => setLoading(false));
  }, [profissional?.id, mes]);

  const filtered = transacoes.filter(t => {
    if (filter === 'entradas') return t.tipo === 'entrada';
    if (filter === 'saidas') return t.tipo === 'saida';
    return true;
  });

  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const mesLabel = (() => {
    const [ano, m] = mes.split('-');
    return `${MESES[parseInt(m) - 1]} ${ano}`;
  })();

  const prevMes = () => {
    const [ano, m] = mes.split('-').map(Number);
    const d = new Date(ano, m - 2);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMes = () => {
    const [ano, m] = mes.split('-').map(Number);
    const d = new Date(ano, m);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500 hover:text-surface-900 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-display font-bold text-lg text-surface-900">Extrato</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs text-slate-500 hover:text-slate-700" onClick={prevMes}>◀</button>
            <span className="text-sm font-bold text-surface-900">{mesLabel}</span>
            <button className="text-xs text-slate-500 hover:text-slate-700" onClick={nextMes}>▶</button>
          </div>
        </div>

        <div className="flex gap-2">
          {(['todas', 'entradas', 'saidas'] as const).map(f => (
            <button
              key={f}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full border transition-all ${
                filter === f
                  ? f === 'entradas' ? 'bg-emerald-500 text-white border-emerald-500'
                    : f === 'saidas' ? 'bg-red-500 text-white border-red-500'
                    : 'bg-surface-900 text-white border-surface-900'
                  : f === 'entradas' ? 'bg-white text-emerald-600 border-surface-200'
                    : f === 'saidas' ? 'bg-white text-red-600 border-surface-200'
                    : 'bg-white text-slate-500 border-surface-200'
              }`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-3 pb-24">
        {loading && (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 px-4">
            <Filter size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-surface-900 mb-2">Nenhuma transação</h3>
            <p className="text-sm text-slate-500">Você ainda não tem lançamentos para este período.</p>
          </div>
        )}

        {filtered.map(t => (
          <Card
            key={t.id}
            className="border-none shadow-sm overflow-hidden cursor-pointer hover:bg-surface-50 active:scale-[0.98] transition-all"
            onClick={() => navigate(`/dinheiro/transacao/${t.id}`)}
          >
            <CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {t.tipo === 'entrada' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-surface-900 text-sm leading-tight">{t.descricao}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '—'}</span>
                    {t.categoria && <>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-xs text-slate-500">{t.categoria}</span>
                    </>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-display font-bold text-sm ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'} R$ {fmt(t.valor || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}