import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function RelatorioMensal() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return { m: d.getMonth() + 1, a: d.getFullYear() };
  });

  useEffect(() => {
    if (!profissional?.id) return;
    setLoading(true);
    fetch(`/api/financeiro/dashboard?profissionalId=${profissional.id}&mes=${String(mes.m).padStart(2,'0')}&ano=${mes.a}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, [profissional?.id, mes.m, mes.a]);

  const prevMes = () => setMes(prev => {
    if (prev.m === 1) return { m: 12, a: prev.a - 1 };
    return { m: prev.m - 1, a: prev.a };
  });
  const nextMes = () => setMes(prev => {
    if (prev.m === 12) return { m: 1, a: prev.a + 1 };
    return { m: prev.m + 1, a: prev.a };
  });

  const entradas = dashboard?.entradas || 0;
  const saidas = dashboard?.saidas || 0;
  const saldo = dashboard?.saldo || 0;
  const transacoes = dashboard?.transacoes || [];
  const numServicos = transacoes.filter((t: any) => t.tipo === 'entrada').length;
  const ticketMedio = numServicos > 0 ? entradas / numServicos : 0;

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">Relatório Mensal</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button className="text-slate-500 p-2" onClick={prevMes}><ArrowLeft size={16} /></button>
          <h2 className="font-bold text-surface-900">{MESES_FULL[mes.m - 1]} {mes.a}</h2>
          <button className="text-slate-500 p-2 rotate-180" onClick={nextMes}><ArrowLeft size={16} /></button>
        </div>

        {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>}

        {!loading && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="border-none shadow-sm bg-emerald-50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Total Entradas</p>
                  <p className="text-lg font-display font-bold text-emerald-600">R$ {fmt(entradas)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-medium text-red-700 mb-1">Total Saídas</p>
                  <p className="text-lg font-display font-bold text-red-600">R$ {fmt(saidas)}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm mb-6">
              <CardContent className="p-4 flex justify-between items-center bg-white rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Saldo Líquido</p>
                  <p className={`text-2xl font-display font-black ${saldo >= 0 ? 'text-brand-blue-600' : 'text-red-500'}`}>
                    R$ {fmt(saldo)}
                  </p>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${saldo >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {saldo >= 0 ? 'Positivo' : 'Negativo'}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Serviços Feitos</p>
                  <p className="text-2xl font-display font-black text-surface-900">{numServicos}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ticket Médio</p>
                  <p className="text-xl font-display font-black text-surface-900">R$ {fmt(ticketMedio)}</p>
                </CardContent>
              </Card>
            </div>

            <Button 
              onClick={() => alert('Download do PDF estruturado com IA Mestrelo iniciado!')}
              className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base"
            >
              <Download size={18} /> Exportar Relatório PDF
            </Button>
          </>
        )}
      </div>
    </div>
  );
}