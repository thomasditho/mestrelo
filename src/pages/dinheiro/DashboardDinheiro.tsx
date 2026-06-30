import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';

function formatMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getMesNome(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatData(iso: string): string {
  if (!iso) return '';
  const hoje = new Date().toISOString().split('T')[0];
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (iso.startsWith(hoje)) return 'Hoje';
  if (iso.startsWith(ontem)) return 'Ontem';
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function DashboardDinheiro() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [tab, setTab] = useState<'resumo' | 'receber'>('resumo');
  const [dash, setDash] = useState<any>(null);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const profId = profissional?.id;
  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!profId) return;
    Promise.all([
      fetch(`/api/financeiro/dashboard?profissionalId=${profId}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/pagamentos?profissionalId=${profId}`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([dashData, pagsData]) => {
      setDash(dashData);
      setPagamentos(pagsData.pagamentos || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [profId]);

  const pendentes = pagamentos.filter(p => p.status === 'pendente');
  const filtrados = pendentes.filter(p =>
    !search || (p.clienteNome || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.descricao || '').toLowerCase().includes(search.toLowerCase())
  );

  const getDueBadge = (p: any) => {
    if (!p.vencimento) return { label: 'Sem vencimento', cls: 'bg-slate-100 text-slate-600' };
    if (p.vencimento < hoje) {
      const dias = Math.floor((new Date(hoje).getTime() - new Date(p.vencimento).getTime()) / 86400000);
      return { label: `Atrasado ${dias} dia${dias > 1 ? 's' : ''}`, cls: 'bg-red-50 text-red-600' };
    }
    if (p.vencimento === hoje) return { label: 'Vence hoje', cls: 'bg-amber-50 text-amber-600' };
    const dias = Math.floor((new Date(p.vencimento).getTime() - new Date(hoje).getTime()) / 86400000);
    return { label: `Vence em ${dias} dia${dias > 1 ? 's' : ''}`, cls: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-24 animate-in fade-in duration-500">
      <header className="bg-white border-b border-surface-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="font-display font-bold text-2xl text-surface-900">Dinheiro</h1>
        <div className="flex bg-surface-100 p-1 rounded-lg mt-4">
          <button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'resumo' ? 'bg-white text-surface-900 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setTab('resumo')}>Resumo do Mês</button>
          <button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'receber' ? 'bg-white text-surface-900 shadow-sm' : 'text-slate-500'}`}
            onClick={() => setTab('receber')}>A Receber {pendentes.length > 0 && `(${pendentes.length})`}</button>
        </div>
      </header>

      {tab === 'resumo' ? (
        <div className="p-4 space-y-6 mt-2">
          <Card className="bg-brand-blue-600 text-white border-none shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <CardContent className="p-5 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-brand-blue-100 text-sm font-medium">Saldo do Mês</span>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded uppercase tracking-wider font-medium capitalize">{getMesNome()}</span>
              </div>
              <h2 className="text-4xl font-display font-bold mb-4">
                {loading ? '...' : formatMoeda(dash?.saldo || 0)}
              </h2>
              {dash?.metaMensal > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-brand-blue-100 mb-1">
                    <span>Meta mensal</span>
                    <span>{Math.min(Math.round((dash.entradas / dash.metaMensal) * 100), 100)}%</span>
                  </div>
                  <div className="w-full bg-brand-blue-500 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(Math.round((dash.entradas / dash.metaMensal) * 100), 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 border-t border-brand-blue-500 pt-4">
                <div>
                  <div className="flex items-center gap-1 text-brand-blue-100 text-xs mb-1">
                    <ArrowDownRight size={14} className="text-emerald-300" /><span>Entradas</span>
                  </div>
                  <span className="font-semibold">{loading ? '...' : formatMoeda(dash?.entradas || 0)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-brand-blue-100 text-xs mb-1">
                    <ArrowUpRight size={14} className="text-red-300" /><span>Saídas</span>
                  </div>
                  <span className="font-semibold">{loading ? '...' : formatMoeda(dash?.saidas || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="w-10 h-10 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp size={20} />
                </div>
                <span className="text-2xl font-display font-bold text-surface-900">
                  {loading ? '...' : formatMoeda(dash?.totalAReceber || 0)}
                </span>
                <span className="text-xs text-slate-500 font-medium">A Receber</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                  <TrendingDown size={20} />
                </div>
                <span className="text-2xl font-display font-bold text-surface-900">
                  {loading ? '...' : formatMoeda(dash?.totalAtrasado || 0)}
                </span>
                <span className="text-xs text-slate-500 font-medium">Atrasados</span>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-sm h-12 text-sm font-bold"
              onClick={() => navigate('/dinheiro/despesa/nova')}>Lançar Despesa</Button>
            <Button className="flex-1 bg-brand-blue-50 text-brand-blue-600 hover:bg-brand-blue-100 border-none shadow-sm h-12 text-sm font-bold"
              onClick={() => setTab('receber')}>Receber Pagamento</Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button className="bg-white p-3 rounded-xl shadow-sm border border-surface-200 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
              onClick={() => navigate('/dinheiro/insights')}>
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><TrendingUp size={16} /></div>
              <span className="text-[10px] font-bold text-surface-900">Insights</span>
            </button>
            <button className="bg-white p-3 rounded-xl shadow-sm border border-surface-200 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
              onClick={() => navigate('/dinheiro/relatorio')}>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={16} /></div>
              <span className="text-[10px] font-bold text-surface-900">Relatório</span>
            </button>
            <button className="bg-white p-3 rounded-xl shadow-sm border border-surface-200 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
              onClick={() => navigate('/dinheiro/cobrancas')}>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={16} /></div>
              <span className="text-[10px] font-bold text-surface-900">Cobranças</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-bold text-surface-900">Últimas Transações</h3>
              <button className="text-sm font-medium text-brand-blue-600" onClick={() => navigate('/dinheiro/transacoes')}>Ver todas</button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-400 text-center py-6">Carregando...</p>
              ) : (dash?.transacoes || []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Nenhuma transação este mês.</p>
              ) : (dash.transacoes as any[]).slice(0, 6).map((t: any) => (
                <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-surface-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {t.tipo === 'entrada' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <h4 className="font-medium text-surface-900 text-sm">{t.descricao}</h4>
                      <p className="text-xs text-slate-500">{formatData(t.data)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-surface-900'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'} {formatMoeda(t.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TAB RECEBER */
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente ou descrição..."
              className="w-full h-12 pl-10 pr-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-400 text-center py-6">Carregando cobranças...</p>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="font-bold text-sm">Nenhuma cobrança pendente</p>
              <p className="text-xs text-slate-500 mt-1">Tudo em dia por aqui!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrados.map(p => {
                const badge = getDueBadge(p);
                return (
                  <Card key={p.id} className="border-none shadow-sm overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[70%]">
                          <h3 className="font-bold text-surface-900 text-sm leading-tight truncate">{p.clienteNome || 'Cliente'}</h3>
                          <p className="text-xs text-slate-500 mt-1 truncate">{p.descricao}</p>
                          <p className="font-display font-bold text-brand-blue-600 text-base mt-2">
                            {formatMoeda(p.valor_total || 0)}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {p.vencimento && (
                            <span className="text-[10px] text-slate-400">
                              Vence: {new Date(p.vencimento).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-surface-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-xs bg-white font-semibold"
                          onClick={() => navigate(`/dinheiro/baixa/${p.id}`)}
                        >
                          Dar Baixa
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-9 text-xs bg-brand-blue-600 hover:bg-brand-blue-700 font-semibold text-white"
                          onClick={() => navigate(`/dinheiro/cobranca/${p.id}`)}
                        >
                          Lembrar Cliente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
     