import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, DollarSign, Activity, Search,
  LogOut, ExternalLink, ShieldOff, Shield, RefreshCw,
  Wifi, WifiOff, ChevronLeft, ChevronRight, Server, Database,
  Eye, EyeOff, Save, Check, CreditCard, Lock, Settings, Sparkles, Send
} from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function pct(n: number, total: number) {
  if (!total) return '0%';
  return Math.round((n / total) * 100) + '%';
}
function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'blue' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400', green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400', red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const p = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${p}%` }} />
      </div>
      <span className="text-white text-xs font-bold w-12 text-right">{value} <span className="text-slate-500 font-normal">({p}%)</span></span>
    </div>
  );
}

// ─── Main Admin ───────────────────────────────────────────────────────────────

type Tab = 'overview' | 'profissionais' | 'receita' | 'sistema';

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [profs, setProfs] = useState<any[]>([]);
  const [totalProfs, setTotalProfs] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProfs, setLoadingProfs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados para as configurações globais do sistema
  const [settings, setSettings] = useState<any>({
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
  });
  const [showCreds, setShowCreds] = useState<Record<string, boolean>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/admin/settings', { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login'); return; }
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar configurações', e);
    }
  }, [navigate]);

  useEffect(() => {
    if (tab === 'sistema') {
      fetchSettings();
    }
  }, [tab, fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Erro ao salvar as configurações.');
      }
    } catch {
      alert('Erro de conexão ao salvar as configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const togglePlanoAtivo = (id: string) => {
    setSettings((prev: any) => ({
      ...prev,
      planos: prev.planos.map((p: any) => p.id === id ? { ...p, ativo: !p.ativo } : p)
    }));
  };

  const handlePlanoChange = (id: string, field: string, val: string) => {
    setSettings((prev: any) => ({
      ...prev,
      planos: prev.planos.map((p: any) => p.id === id ? { ...p, [field]: val } : p)
    }));
  };

  const toggleFormaPagamento = (field: string) => {
    setSettings((prev: any) => ({
      ...prev,
      formasPagamento: {
        ...prev.formasPagamento,
        [field]: !prev.formasPagamento[field]
      }
    }));
  };

  const handleCredChange = (field: string, val: string) => {
    setSettings((prev: any) => ({
      ...prev,
      credenciais: {
        ...prev.credenciais,
        [field]: val
      }
    }));
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/admin/stats', { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      setStats(data);
    } catch { console.error('Erro ao buscar stats'); }
    finally { setLoading(false); }
  }, [navigate]);

  const fetchProfs = useCallback(async () => {
    setLoadingProfs(true);
    try {
      const res = await fetch(`/admin/profissionais?busca=${encodeURIComponent(busca)}&page=${page}`, { credentials: 'include' });
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      setProfs(data.profissionais || []);
      setTotalProfs(data.total || 0);
      setPages(data.pages || 1);
    } catch { console.error('Erro ao buscar profissionais'); }
    finally { setLoadingProfs(false); }
  }, [busca, page, navigate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'profissionais') fetchProfs(); }, [tab, fetchProfs]);

  const handleLogout = async () => {
    await fetch('/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login');
  };

  const handleSuspender = async (id: string, suspender: boolean) => {
    setActionLoading(id + '_suspender');
    await fetch(`/admin/profissionais/${id}/suspender`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspender }),
    });
    setActionLoading(null);
    fetchProfs();
  };

  const handleImpersonar = async (id: string) => {
    setActionLoading(id + '_impersonar');
    try {
      const res = await fetch(`/admin/impersonar/${id}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.token) {
        window.open(`/admin/impersonar/ativar?token=${encodeURIComponent(data.token)}`, '_blank');
      }
    } catch { console.error('Erro ao impersonar'); }
    finally { setActionLoading(null); }
  };

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    setBusca(buscaInput);
    setPage(1);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
    { id: 'profissionais', label: 'Profissionais', icon: <Users size={16} /> },
    { id: 'receita', label: 'Receita', icon: <DollarSign size={16} /> },
    { id: 'sistema', label: 'Sistema', icon: <Server size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-56 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <div>
              <p className="text-white font-bold text-sm">Mestrelo</p>
              <p className="text-slate-500 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-brand-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="ml-56 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              {tabs.find(t => t.id === tab)?.label}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={fetchStats} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <RefreshCw size={15} /> Atualizar
          </button>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {loading ? (
              <div className="text-slate-400 text-sm">Carregando...</div>
            ) : stats ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-4 gap-4">
                  <StatCard icon={<Users size={20} />} label="Total Profissionais" value={stats.funil.totalProfs}
                    sub={`+${stats.funil.novos7d} últimos 7 dias`} color="blue" />
                  <StatCard icon={<TrendingUp size={20} />} label="Novos (30 dias)" value={stats.funil.novos30d}
                    sub="cadastros recentes" color="green" />
                  <StatCard icon={<DollarSign size={20} />} label="Receita (30 dias)"
                    value={fmt(stats.receita.ultimos30d)} sub={`${stats.receita.totalPagamentos} pagamentos`} color="amber" />
                  <StatCard icon={<Activity size={20} />} label="WhatsApp conectado"
                    value={stats.funil.comWhats}
                    sub={pct(stats.funil.comWhats, stats.funil.totalProfs) + ' do total'} color="green" />
                </div>

                {/* Funil de ativação */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h2 className="text-white font-bold mb-5">Funil de Ativação</h2>
                  <div className="space-y-4">
                    <FunnelBar label="Cadastrados" value={stats.funil.totalProfs} total={stats.funil.totalProfs} color="bg-blue-500" />
                    <FunnelBar label="Completou perfil" value={stats.funil.comNome} total={stats.funil.totalProfs} color="bg-indigo-500" />
                    <FunnelBar label="Conectou WhatsApp" value={stats.funil.comWhats} total={stats.funil.totalProfs} color="bg-emerald-500" />
                    <FunnelBar label="Criou 1º serviço" value={stats.funil.comServico} total={stats.funil.totalProfs} color="bg-amber-500" />
                    <FunnelBar label="Enviou 1º orçamento" value={stats.funil.comOrcamento} total={stats.funil.totalProfs} color="bg-orange-500" />
                  </div>
                </div>
              </>
            ) : <p className="text-slate-400">Erro ao carregar métricas.</p>}
          </div>
        )}

        {/* ── PROFISSIONAIS ── */}
        {tab === 'profissionais' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <form onSubmit={handleBusca} className="flex gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Nome, telefone, cidade..."
                    value={buscaInput} onChange={e => setBuscaInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <button type="submit" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Buscar
                </button>
              </form>
              <span className="text-slate-400 text-sm">{totalProfs} profissionais</span>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Nome', 'Telefone', 'Especialidade', 'Cidade', 'WhatsApp', 'Serviços', 'Receita', 'Cadastro', 'Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loadingProfs ? (
                    <tr><td colSpan={9} className="text-center py-8 text-slate-400">Carregando...</td></tr>
                  ) : profs.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-slate-400">Nenhum resultado.</td></tr>
                  ) : profs.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-slate-750 transition-colors ${!p.ativo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{p.name || <span className="text-slate-500 italic">Sem nome</span>}</p>
                        {p.slug && <p className="text-slate-500 text-xs">{p.slug}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{p.phone}</td>
                      <td className="px-4 py-3 text-slate-300">{p.specialty || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{p.city || '—'}</td>
                      <td className="px-4 py-3">
                        {p.whatsapp_conectado
                          ? <span className="flex items-center gap-1 text-emerald-400"><Wifi size={13} /> Conectado</span>
                          : <span className="flex items-center gap-1 text-slate-500"><WifiOff size={13} /> Não</span>}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{p.totalServicos}</td>
                      <td className="px-4 py-3 text-white font-medium">{fmt(p.receitaTotal)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleImpersonar(p.id)}
                            disabled={actionLoading === p.id + '_impersonar'}
                            title="Entrar como este profissional"
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-brand-blue-600 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => handleSuspender(p.id, p.ativo)}
                            disabled={actionLoading === p.id + '_suspender'}
                            title={p.ativo ? 'Suspender' : 'Reativar'}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              p.ativo ? 'bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white' : 'bg-emerald-600 text-white'
                            }`}>
                            {p.ativo ? <ShieldOff size={14} /> : <Shield size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Página {page} de {pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RECEITA ── */}
        {tab === 'receita' && (
          <div className="space-y-6">
            {loading ? <p className="text-slate-400">Carregando...</p> : stats ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon={<DollarSign size={20} />} label="Receita Total (plataforma)"
                    value={fmt(stats.receita.total)} sub="todos os tempos" color="green" />
                  <StatCard icon={<TrendingUp size={20} />} label="Receita (últimos 30 dias)"
                    value={fmt(stats.receita.ultimos30d)} sub="serviços pagos" color="blue" />
                  <StatCard icon={<Activity size={20} />} label="Total de Pagamentos"
                    value={stats.receita.totalPagamentos} sub="confirmados" color="amber" />
                </div>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <p className="text-slate-400 text-sm">
                    Integração Stripe ainda não configurada. Estes números refletem os pagamentos registrados
                    diretamente no banco pelos profissionais (PIX + dinheiro + outros).
                    Quando o Stripe estiver ativo, aqui aparecerão MRR, churn e taxa de conversão trial → pago.
                  </p>
                </div>
              </>
            ) : <p className="text-slate-400">Erro ao carregar dados.</p>}
          </div>
        )}

        {/* ── SISTEMA ── */}
        {tab === 'sistema' && (
          <div className="space-y-8 max-w-5xl">
            {loading ? (
              <p className="text-slate-400 text-sm">Carregando painel...</p>
            ) : stats ? (
              <form onSubmit={handleSaveSettings} className="space-y-8">
                {/* Métricas e Status Rápidos */}
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon={<Server size={20} />} label="Uptime do Servidor" value={stats.sistema.uptime} color="green" />
                  <StatCard icon={<Database size={20} />} label="Tamanho do Banco" value={stats.sistema.dbSize} color="blue" />
                  <StatCard icon={<Activity size={20} />} label="Ambiente Ativo" value={stats.sistema.nodeEnv} color="amber" />
                </div>

                {/* 1. MÓDULO DE GESTÃO DE PLANOS */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="text-brand-blue-500" size={20} />
                      <h2 className="text-white font-bold text-lg">Módulo de Gestão de Planos (Assinaturas)</h2>
                    </div>
                    <span className="text-slate-400 text-xs font-mono">Stripe Subscription Engine</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {settings.planos && settings.planos.map((plano: any) => (
                      <div key={plano.id} className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/50 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-44 shrink-0">
                          <p className="text-white font-bold text-sm">{plano.nome}</p>
                          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">{plano.id}</p>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 text-xs block mb-1">Preço Mensal (R$)</label>
                            <input
                              type="text"
                              value={plano.preco}
                              onChange={(e) => handlePlanoChange(plano.id, 'preco', e.target.value)}
                              placeholder="Ex: 49.90"
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 text-xs block mb-1">Stripe Price ID (price_...)</label>
                            <input
                              type="text"
                              value={plano.stripePriceId || ''}
                              onChange={(e) => handlePlanoChange(plano.id, 'stripePriceId', e.target.value)}
                              placeholder="Ex: price_1PqRst..."
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center mt-2 md:mt-0">
                          <button
                            type="button"
                            onClick={() => togglePlanoAtivo(plano.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              plano.ativo ? 'bg-brand-blue-600' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                plano.ativo ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-white text-xs w-16 font-medium">
                            {plano.ativo ? 'Disponível' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. MÓDULO DE CONTROLE GLOBAL DE FORMAS DE PAGAMENTO */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                    <Settings className="text-brand-blue-500" size={20} />
                    <h2 className="text-white font-bold text-lg">Módulo de Controle Global de Formas de Pagamento</h2>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Ligue ou desligue as formas de pagamento disponíveis em todo o sistema. Se desativado, os clientes dos profissionais não conseguirão selecionar essas formas de pagamento nos checkouts de serviços.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PIX */}
                    <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-700/50 flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <p className="text-white font-bold text-sm">Pix QR Code (Sem Gateway)</p>
                        <p className="text-slate-500 text-xs">Geração automática instantânea e gratuita com a chave do próprio profissional.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFormaPagamento('pixGlobalAtivo')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.formasPagamento?.pixGlobalAtivo ? 'bg-brand-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.formasPagamento?.pixGlobalAtivo ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Stripe Card */}
                    <div className="bg-slate-900/60 rounded-lg p-5 border border-slate-700/50 flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <p className="text-white font-bold text-sm">Cartão de Crédito (Stripe)</p>
                        <p className="text-slate-500 text-xs">Ativação do checkout para pagamentos via cartão de crédito utilizando a conta configurada.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFormaPagamento('cartaoStripeAtivo')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.formasPagamento?.cartaoStripeAtivo ? 'bg-brand-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.formasPagamento?.cartaoStripeAtivo ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. MÓDULO DE CONFIGURAÇÕES DO SISTEMA (WHATSAPP / IA) */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                    <Lock className="text-brand-blue-500" size={20} />
                    <h2 className="text-white font-bold text-lg">Módulo de Configurações de API (Credenciais)</h2>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Atualize os tokens de acesso e URLs de servidores de forma dinâmica. O sistema prioriza as chaves salvas abaixo, utilizando as variáveis do Railway apenas como backup silencioso.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Evolution URL */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 text-sm font-medium">Evolution API URL (WhatsApp)</label>
                      <input
                        type="text"
                        value={settings.credenciais?.evolutionApiUrl || ''}
                        onChange={(e) => handleCredChange('evolutionApiUrl', e.target.value)}
                        placeholder="Ex: https://api.sua-evolution.com"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      />
                    </div>

                    {/* Evolution Token */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 text-sm font-medium">Evolution API Token</label>
                      <div className="relative">
                        <input
                          type={showCreds['evolutionApiToken'] ? 'text' : 'password'}
                          value={settings.credenciais?.evolutionApiToken || ''}
                          onChange={(e) => handleCredChange('evolutionApiToken', e.target.value)}
                          placeholder="Token / Key da Evolution API"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreds(p => ({ ...p, evolutionApiToken: !p.evolutionApiToken }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCreds['evolutionApiToken'] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Gemini API Key */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 text-sm font-medium">Gemini API Key (Gerador de Bios & Transcrição)</label>
                      <div className="relative">
                        <input
                          type={showCreds['geminiApiKey'] ? 'text' : 'password'}
                          value={settings.credenciais?.geminiApiKey || ''}
                          onChange={(e) => handleCredChange('geminiApiKey', e.target.value)}
                          placeholder="Chave secreta do Google Gemini"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreds(p => ({ ...p, geminiApiKey: !p.geminiApiKey }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCreds['geminiApiKey'] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Stripe Secret Key */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 text-sm font-medium">Stripe Secret Key (sk_live_...)</label>
                      <div className="relative">
                        <input
                          type={showCreds['stripeSecretKey'] ? 'text' : 'password'}
                          value={settings.credenciais?.stripeSecretKey || ''}
                          onChange={(e) => handleCredChange('stripeSecretKey', e.target.value)}
                          placeholder="Chave secreta sk_live_ da Stripe"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-4 pr-10 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreds(p => ({ ...p, stripeSecretKey: !p.stripeSecretKey }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCreds['stripeSecretKey'] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Stripe Webhook Secret */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-slate-300 text-sm font-medium">Stripe Webhook Secret (whsec_...)</label>
                      <div className="relative">
                        <input
                          type={showCreds['stripeWebhookSecret'] ? 'text' : 'password'}
                          value={settings.credenciais?.stripeWebhookSecret || ''}
                          onChange={(e) => handleCredChange('stripeWebhookSecret', e.target.value)}
                          placeholder="Segredo de verificação de webhook da Stripe (whsec_...)"
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-4 pr-10 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreds(p => ({ ...p, stripeWebhookSecret: !p.stripeWebhookSecret }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showCreds['stripeWebhookSecret'] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Ações Flutuante / Botão de Salvar */}
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500">
                    Clique em salvar para persistir no arquivo de configurações globais e ativar os novos valores em tempo real.
                  </div>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all ${
                      saveSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-blue-600 hover:bg-brand-blue-700 hover:scale-[1.01] text-white cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Gravando...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check size={16} />
                        Configurações Salvas!
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Salvar Configurações do Sistema
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-400">Erro ao carregar dados do sistema.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
