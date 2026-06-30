import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Plus, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getWeekDates(base: Date) {
  const d = new Date(base);
  d.setDate(d.getDate() - d.getDay()); // domingo
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

const STATUS_COLOR: Record<string, string> = {
  agendado: 'bg-brand-blue-500',
  em_execucao: 'bg-amber-500',
  concluido: 'bg-brand-green-500',
};

export default function AgendaCompleta() {
  const navigate = useNavigate();
  const { profissional } = useAuth();

  const [weekBase, setWeekBase] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDates = getWeekDates(weekBase);

  const selectedStr = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!profissional?.id) return;
    setLoading(true);
    fetch(`/api/servicos?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setServicos(d.servicos || []))
      .finally(() => setLoading(false));
  }, [profissional?.id]);

  const servicosDoDia = servicos.filter(s => s.data === selectedStr);

  const hasEvent = (date: Date) => {
    const str = date.toISOString().split('T')[0];
    return servicos.some(s => s.data === str);
  };

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe flex flex-col">
      <header className="bg-brand-blue-600 text-white px-4 pt-12 pb-6 shadow-md rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-display font-bold text-xl">Agenda</h1>
          </div>
          <button onClick={() => navigate('/servico/rapido')} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-6 px-2">
          <button className="p-1 hover:bg-white/10 rounded-full" onClick={prevWeek}><ChevronLeft size={20} /></button>
          <span className="font-bold text-lg">{MESES[weekBase.getMonth()]} {weekBase.getFullYear()}</span>
          <button className="p-1 hover:bg-white/10 rounded-full" onClick={nextWeek}><ChevronRight size={20} /></button>
        </div>

        <div className="flex justify-between px-2">
          {weekDates.map((date, i) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setSelectedDate(date)}>
                <span className="text-xs text-brand-blue-200 font-medium">{DIAS[date.getDay()]}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative transition-all ${
                  isSelected ? 'bg-white text-brand-blue-600 shadow-md scale-110' : isToday ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10'
                }`}>
                  {date.getDate()}
                  {hasEvent(date) && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-amber-400 rounded-full"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <div className="flex-1 p-4 pt-6 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-bold text-surface-900">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <span className="text-sm font-bold text-brand-blue-600 bg-brand-blue-50 px-3 py-1 rounded-full">
            {servicosDoDia.length} serviço{servicosDoDia.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>
        )}

        {!loading && servicosDoDia.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">Nenhum serviço para este dia.</p>
            <Button size="sm" onClick={() => navigate('/servico/rapido')}>
              <Plus size={16} className="mr-1" /> Adicionar Serviço
            </Button>
          </div>
        )}

        {servicosDoDia.map(srv => (
          <div key={srv.id} className="flex gap-3">
            <div className="flex flex-col items-center w-12 shrink-0">
              <span className="text-sm font-bold text-surface-900">{srv.horario || '--:--'}</span>
              <div className="w-px flex-1 bg-surface-200 mt-2 relative">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 ${STATUS_COLOR[srv.status] || 'bg-slate-400'} rounded-full border-2 border-surface-50`}></div>
              </div>
            </div>
            <Card className="flex-1 overflow-hidden shadow-sm">
              <div className={`w-full h-1 ${STATUS_COLOR[srv.status] || 'bg-slate-400'}`}></div>
              <CardContent className="p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{srv.status}</span>
                <h3 className="font-bold text-surface-900 mb-1">{srv.titulo}</h3>
                {srv.clienteNome && <p className="text-sm text-slate-500 mb-1">{srv.clienteNome}</p>}
                {srv.local && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={12} /> {srv.local}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs" 
                    onClick={() => navigate(`/servico/${srv.id}`)}
                  >
                    Detalhes
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs bg-brand-blue-600 hover:bg-brand-blue-700 text-white"
                    onClick={() => navigate(`/servico/execucao/${srv.id}`)}
                  >
                    {srv.status === 'em_andamento' ? 'Continuar' : 'Iniciar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}