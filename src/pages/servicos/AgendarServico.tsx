import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function AgendarServico() {
  const navigate = useNavigate();
  const { orcamentoId } = useParams();
  const { profissional } = useAuth();

  const [orc, setOrc] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(!!orcamentoId);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [local, setLocal] = useState('');
  const [agendando, setAgendando] = useState(false);
  const [agendado, setAgendado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!orcamentoId || orcamentoId === 'novo') { setLoading(false); return; }
    fetch(`/api/orcamentos/${orcamentoId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async d => {
        setOrc(d.orcamento);
        if (d.orcamento?.cliente_id) {
          const cr = await fetch(`/api/clientes/${d.orcamento.cliente_id}`, { credentials: 'include' });
          const cd = await cr.json();
          setCliente(cd.cliente);
          setLocal(cd.cliente?.endereco || '');
        }
      })
      .finally(() => setLoading(false));
  }, [orcamentoId]);

  const handleAgendar = async () => {
    if (!profissional?.id || !date || !time) return;
    setAgendando(true);
    setErro('');
    try {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: profissional.id,
          clienteId: orc?.cliente_id || '',
          orcamentoId: orcamentoId !== 'novo' ? orcamentoId : null,
          titulo: orc?.titulo || 'Serviço Agendado',
          data: date,
          horario: time,
          local: local || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao agendar');
      setAgendado(true);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setAgendando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (agendado) return (
    <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={48} className="text-brand-green-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Serviço Agendado!</h1>
      <p className="text-brand-green-700 font-medium mb-8">
        Bloqueado na sua agenda e notificação automática programada para o cliente.
      </p>
      <Button className="w-full" onClick={() => navigate('/hoje')}>Voltar para Hoje</Button>
    </div>
  );

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">Agendar Serviço</h1>
      </header>

      <div className="p-4 space-y-6 pb-12 max-w-md mx-auto">
        {orc && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-brand-blue-600 uppercase tracking-wider">Orçamento Base</span>
              <h3 className="font-semibold text-surface-900 mt-1">{orc.titulo || 'Sem título'}</h3>
              {cliente && <p className="text-sm text-slate-500 mt-1">{cliente.nome} • {cliente.celular}</p>}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-surface-900">Data do Serviço</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full h-12 pl-11 pr-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-surface-900">Horário</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)}
                className="w-full h-12 pl-11 pr-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-surface-900">Endereço do Serviço</label>
            <input 
              type="text" 
              value={local} 
              onChange={e => setLocal(e.target.value)}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full h-12 px-4 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white" 
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 font-medium">{erro}</p>
          )}

          <Button 
            onClick={handleAgendar} 
            className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl mt-6 shadow-md"
            disabled={agendando || !date || !time}
          >
            {agendando ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}