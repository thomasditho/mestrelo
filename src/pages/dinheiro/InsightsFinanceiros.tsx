import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function InsightsFinanceiros() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profissional?.id) return;
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear());
    Promise.all([
      fetch(`/api/financeiro/dashboard?profissionalId=${profissional.id}&mes=${mes}&ano=${ano}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/servicos?profissionalId=${profissional.id}`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([dashData, srvData]) => {
      setDashboard(dashData);
      setServicos(srvData.servicos || []);
    }).finally(() => setLoading(false));
  }, [profissional?.id]);

  // Agrupar serviços por título para calcular mais rentáveis
  const rankServicos = (() => {
    const count: Record<string, { total: number; n: number }> = {};
    servicos.forEach(s => {
      const k = s.titulo || 'Outros';
      if (!count[k]) count[k] = { total: 0, n: 0 };
      count[k].total += s.valor_total || 0;
      count[k].n++;
    });
    const items = Object.entries(count).map(([titulo, v]) => ({ titulo, ...v }));
    items.sort((a, b) => b.total - a.total);
    const totalGeral = items.reduce((s, i) => s + i.total, 0) || 1;
    return items.slice(0, 4).map(i => ({ ...i, pct: Math.round((i.total / totalGeral) * 100) }));
  })();

  const colors = ['bg-emerald-500', 'bg-emerald-400', 'bg-emerald-300', 'bg-emerald-200'];

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">Inteligência & Insights</h1>
      </header>

      <div className="p-4 space-y-4">
        <p className="text-sm text-slate-600 mb-6">Veja o que está dando mais resultado no seu negócio este mês.</p>

        {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>}

        {!loading && (
          <>
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" /> Serviços Mais Rentáveis
                </h3>

                {rankServicos.length === 0 ? (
                  <p className="text-sm text-slate-500">Sem dados suficientes ainda.</p>
                ) : (
                  <div className="space-y-4">
                    {rankServicos.map((item, i) => (
                      <div key={item.titulo}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-surface-900 truncate max-w-[70%]">{item.titulo}</span>
                          <span className="font-bold text-emerald-600">{item.pct}%</span>
                        </div>
                        <div className="w-full bg-surface-100 rounded-full h-2">
                          <div className={`${colors[i] || 'bg-emerald-200'} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.n} serviço{item.n !== 1 ? 's' : ''} · R$ {fmt(item.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-bold text-surface-900 mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500 fill-amber-500" /> Dicas de IA para Crescer
                </h3>
                <div className="space-y-3 pt-1">
                  <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold mb-1">💡 Ofereça Contratos de Manutenção</p>
                    {rankServicos[0] ? (
                      <p>Como <strong>{rankServicos[0].titulo}</strong> é o seu serviço mais rentável, tente sugerir um plano de manutenção preventiva semestral ou anual para esses clientes e garanta uma renda recorrente.</p>
                    ) : (
                      <p>Identifique seus clientes mais frequentes e proponha um plano mensal ou trimestral de manutenção preventiva para fidelizá-los e ter renda constante.</p>
                    )}
                  </div>

                  <div className="bg-brand-blue-50 border border-brand-blue-200/50 rounded-xl p-3 text-xs text-brand-blue-900 leading-relaxed">
                    <p className="font-bold mb-1">📊 Aumente o Ticket Médio</p>
                    <p>Clientes de maior poder aquisitivo valorizam rapidez e garantia. Ofereça uma opção de "Garantia Estendida" ou "Atendimento Prioritário de 24h" como um opcional pago nos próximos orçamentos.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}