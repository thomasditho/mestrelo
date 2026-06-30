import { useState, useEffect } from 'react';
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, Clock, MapPin, ChevronRight, TrendingUp, Bell, Plus, Bolt, X, Check, AlertCircle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function getSaudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDataHoje(): string {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatDataHojeISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Hoje() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [servicos, setServicos] = useState<any[]>([]);
  const [atrasados, setAtrasados] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [servicoReagendando, setServicoReagendando] = useState<any>(null);
  const [tempDate, setTempDate] = useState(1);
  const [tempTime, setTempTime] = useState('08:00');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const profId = profissional?.id;
  const nome = profissional?.name?.split(' ')[0] || 'Profissional';

  useEffect(() => {
    if (!profId) return;
    const hoje = formatDataHojeISO();
    Promise.all([
      fetch(`/api/servicos?profissionalId=${profId}&data=${hoje}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/pagamentos?profissionalId=${profId}&status=pendente`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/financeiro/dashboard?profissionalId=${profId}`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([srvData, pagsData, dashData]) => {
      setServicos(srvData.servicos || []);
      const atras = (pagsData.pagamentos || []).filter((p: any) =>
        p.vencimento && p.vencimento < hoje
      );
      setAtrasados(atras);
      setDashboard(dashData);
    }).catch(console.error).finally(() => setLoading(false));
  }, [profId]);

  const generateNextDays = () => {
    const dias = [];
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const base = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dias.push({
        index: i, dayNum: d.getDate(), weekday: weekdays[d.getDay()],
        monthName: months[d.getMonth()], isoDate: d.toISOString().split('T')[0],
        fullLabel: `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`,
      });
    }
    return dias;
  };
  const nextDays = generateNextDays();

  const handleConfirmReschedule = async () => {
    if (!servicoReagendando) return;
    const selectedDay = nextDays.find(d => d.index === tempDate);
    try {
      await fetch(`/api/servicos/${servicoReagendando.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: selectedDay?.isoDate, horario: tempTime }),
      });
      setServicos(prev => prev.map(s =>
        s.id === servicoReagendando.id ? { ...s, data: selectedDay?.isoDate, horario: tempTime } : s
      ));
      setIsRescheduling(false);
      setSuccessMsg(`${servicoReagendando.titulo} reagendado para ${selectedDay?.fullLabel} às ${tempTime}.`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (e) { console.error(e); }
  };

  const servicosHoje = servicos.filter(s => s.status !== 'cancelado');
  const metaPct = dashboard?.metaMensal > 0
    ? Math.min(Math.round((dashboard.entradas / dashboard.metaMensal) * 100), 100) : null;

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500 pb-20 relative">

      {showSuccess && (
        <div className="fixed top-4 left-4 right-4 bg-brand-green-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-top-6 duration-300">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check size={18} className="text-white" />
          </div>
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold text-surface-900">{getSaudacao()}, {nome}!</h1>
          <p className="text-slate-600 font-medium text-lg">
            {loading ? 'Carregando...' : servicosHoje.length === 0
              ? 'Nenhum serviço hoje.'
              : `Você tem ${servicosHoje.length} serviço${servicosHoje.length > 1 ? 's' : ''} hoje.`}
          </p>
          <p className="text-slate-400 text-sm capitalize">{formatDataHoje()}</p>
        </div>
        <button
          className="w-10 h-10 bg-white border border-surface-200 rounded-full flex items-center justify-center text-slate-600 relative hover:bg-surface-50 shadow-sm"
          onClick={() => navigate('/notificacoes')}
        >
          <Bell size={20} />
          {atrasados.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          )}
        </button>
      </div>

      {(atrasados.length > 0 || metaPct !== null || (dashboard && dashboard.totalAReceber > 0)) && (
        <section className="space-y-3 mb-8">
          <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider mb-2">O que importa agora</h2>

          {atrasados.slice(0, 2).map((pag: any) => (
            <Card key={pag.id} className="bg-red-50 border-none shadow-sm cursor-pointer" onClick={() => navigate(`/dinheiro/cobranca/${pag.id}`)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-900">{pag.clienteNome || 'Cliente'} deve {formatMoeda(pag.valor_total)}</p>
                  <p className="text-xs text-red-700 mt-0.5">Vencido em {new Date(pag.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}. Toque para cobrar.</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {metaPct !== null && dashboard && (
            <Card className="bg-brand-blue-50 border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center text-brand-blue-600 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-blue-900">{metaPct}% da meta do mês</p>
                  <p className="text-xs text-brand-blue-700 mt-0.5">{formatMoeda(dashboard.entradas)} de {formatMoeda(dashboard.metaMensal)}</p>
                  <div className="w-full bg-brand-blue-100 rounded-full h-1.5 mt-2">
                    <div className="bg-brand-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${metaPct}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {dashboard && dashboard.totalAReceber > 0 && (
            <Card className="bg-brand-green-50 border-none shadow-sm cursor-pointer" onClick={() => navigate('/dinheiro')}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-600 shrink-0">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-green-900">{formatMoeda(dashboard.totalAReceber)} a receber</p>
                  <p className="text-xs text-brand-green-700 mt-0.5">Pagamentos pendentes. Toque para ver.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {servicosHoje.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-surface-900">Sua Agenda</h2>
            <button className="text-sm font-medium text-brand-blue-600 flex items-center gap-1" onClick={() => navigate('/agenda')}>
              Ver todas <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {servicosHoje.map((srv: any) => (
              <Card key={srv.id} className="overflow-hidden border-brand-blue-100">
                <div className="w-full h-1 bg-brand-blue-500" />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-brand-blue-600 uppercase tracking-wider">{srv.categoria || 'Serviço'}</span>
                      <h3 className="font-semibold text-surface-900">{srv.titulo}</h3>
                      {srv.clienteNome && <p className="text-sm text-slate-500">{srv.clienteNome}</p>}
                    </div>
                    {srv.horario && (
                      <div className="bg-brand-blue-50 text-brand-blue-600 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <Clock size={12} /> {srv.horario}
                      </div>
                    )}
                  </div>
                  {srv.local && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                      <MapPin size={16} /> {srv.local}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-sm h-9"
                      onClick={() => { setServicoReagendando(srv); setTempTime(srv.horario || '08:00'); setIsRescheduling(true); }}>
                      Reagendar
                    </Button>
                    <Button className="flex-1 text-sm h-9 bg-brand-blue-600 hover:bg-brand-blue-700"
                      onClick={() => navigate(`/servico/execucao/${srv.id}`)}>
                      {srv.status === 'em_andamento' ? 'Continuar' : 'Iniciar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-32 h-32 mb-8 relative">
            <div className="absolute inset-0 bg-brand-blue-50 rounded-[2rem] rotate-6 shadow-sm"></div>
            <div className="absolute inset-0 bg-white rounded-[2rem] -rotate-3 shadow-sm border border-brand-blue-50 flex items-center justify-center">
              <Calendar size={48} className="text-brand-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-surface-900 mb-2">Seu dia está livre!</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
            Você não tem serviços agendados para hoje. Aproveite para organizar suas finanças ou captar novos clientes.
          </p>
          <div className="w-full space-y-3">
            <Button className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 shadow-md text-base" onClick={() => navigate('/servico/rapido')}>
              <Bolt size={20} className="mr-2 text-amber-300 fill-amber-300" /> Criar Serviço Rápido
            </Button>
            <Button variant="outline" className="w-full h-14 bg-white text-base border-surface-200" onClick={() => navigate('/orcamento/novo/1')}>
              <Plus size={20} className="mr-2 text-slate-500" /> Fazer Novo Orçamento
            </Button>
          </div>
        </div>
      )}

      {isRescheduling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden pb-safe animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <div>
                <h3 className="font-display font-bold text-lg text-surface-900">Reagendar Serviço</h3>
                {servicoReagendando && <p className="text-xs text-slate-500 mt-0.5">{servicoReagendando.titulo}</p>}
              </div>
              <button onClick={() => setIsRescheduling(false)}
                className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-slate-500 hover:bg-surface-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {nextDays.map((day) => (
                    <button key={day.index} onClick={() => setTempDate(day.index)}
                      className={`flex flex-col items-center p-2 rounded-xl border transition-all ${tempDate === day.index
                        ? 'bg-brand-blue-600 border-brand-blue-600 text-white shadow-md scale-105'
                        : 'bg-white border-surface-200 text-surface-800 hover:border-surface-300'}`}>
                      <span className={`text-[10px] uppercase font-bold tracking-tight ${tempDate === day.index ? 'text-blue-100' : 'text-slate-400'}`}>{day.weekday}</span>
                      <span className="text-sm font-display font-black mt-1">{day.dayNum}</span>
                      <span className={`text-[9px] mt-0.5 ${tempDate === day.index ? 'text-blue-100' : 'text-slate-400'}`}>{day.monthName}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Horário</span>
                <div className="grid grid-cols-4 gap-2">
                  {['07:00','08:00','09:00','10:00','13:00','14:00','15:00','17:00'].map((time) => (
                    <button key={time} onClick={() => setTempTime(time)}
                      className={`py-2 px-1 rounded-lg border text-xs font-bold text-center transition-colors ${tempTime === time
                        ? 'bg-brand-blue-600 border-brand-blue-600 text-white shadow-sm'
                        : 'bg-white border-surface-200 text-slate-600 hover:bg-surface-50'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 bg-surface-50 border-t border-surface-100 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 bg-white" onClick={() => setIsRescheduling(false)}>Cancelar</Button>
              <Button className="flex-1 h-12" onClick={handleConfirmReschedule}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
