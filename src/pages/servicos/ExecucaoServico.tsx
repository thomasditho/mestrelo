import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Camera, Play, Square, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

interface ChecklistItem { id: string; texto: string; done: boolean; }

export default function ExecucaoServico() {
  const navigate = useNavigate();
  const { id } = useParams();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [servico, setServico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'agendado' | 'em_andamento' | 'concluido'>('agendado');
  const [timer, setTimer] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checkinTime, setCheckinTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/servicos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.servico) {
          const srv = data.servico;
          setServico(srv);
          setStatus(srv.status === 'em_andamento' ? 'em_andamento' : srv.status === 'concluido' ? 'concluido' : 'agendado');
          try {
            const cl = JSON.parse(srv.checklist || '[]');
            if (cl.length > 0) {
              setChecklist(cl.map((item: any) => ({
                id: item.id || String(Math.random()),
                texto: item.texto || item.text || '',
                done: item.done || false,
              })));
            }
          } catch {}
          if (srv.checkin_em) {
            const ci = new Date(srv.checkin_em);
            setCheckinTime(ci);
            setTimer(Math.floor((Date.now() - ci.getTime()) / 1000));
          }
        }
      }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (status === 'em_andamento') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}h ` : ''}${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
  };

  const handleCheckin = async () => {
    setSaving(true);
    try {
      await fetch(`/api/servicos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'em_andamento', checkinEm: new Date().toISOString() }),
      });
      setStatus('em_andamento');
      setCheckinTime(new Date());
      setTimer(0);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const toggleCheck = async (itemId: string) => {
    if (status !== 'em_andamento') return;
    const updated = checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    // Salvar no server de forma assíncrona (sem bloquear UI)
    fetch(`/api/servicos/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ checklist: JSON.stringify(updated) }),
    }).catch(console.error);
  };

  const isAllChecked = checklist.length > 0 && checklist.every(c => c.done);
  const checklistPct = checklist.length > 0
    ? Math.round(checklist.filter(c => c.done).length / checklist.length * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Carregando serviço...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-brand-blue-600 text-white px-4 pt-12 pb-6 rounded-b-[2rem] shadow-sm relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="mt-8">
          <span className="text-brand-blue-100 text-sm font-medium uppercase tracking-wider">
            {status === 'em_andamento' ? 'Execução em Andamento' : status === 'concluido' ? 'Serviço Concluído' : 'Serviço Agendado'}
          </span>
          <h1 className="font-display font-bold text-2xl mt-1">{servico?.titulo || 'Serviço'}</h1>
          {servico?.cliente?.nome && <p className="text-sm text-brand-blue-50 mt-0.5">{servico.cliente.nome}</p>}
          {servico?.local && (
            <p className="text-sm text-brand-blue-50 mt-1 flex items-center gap-1">
              <MapPin size={14} /> {servico.local}
            </p>
          )}
        </div>
      </header>

      <div className="p-4 space-y-6 mt-4 pb-24">
        {/* Timer Card */}
        <Card className="border-none shadow-md overflow-hidden text-center bg-white">
          <div className={`w-full h-1 ${status === 'em_andamento' ? 'bg-brand-blue-500' : status === 'concluido' ? 'bg-brand-green-500' : 'bg-slate-300'}`}></div>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Tempo Decorrido</span>
              <div className="text-4xl font-display font-bold text-surface-900 tabular-nums">
                {formatTime(timer)}
              </div>
              {checklist.length > 0 && status === 'em_andamento' && (
                <div className="w-full mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progresso do checklist</span><span>{checklistPct}%</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-1.5">
                    <div className="bg-brand-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${checklistPct}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              {status === 'agendado' && (
                <Button 
                  onClick={handleCheckin} 
                  disabled={saving} 
                  className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Play size={18} /> Iniciar Serviço (Check-in)
                </Button>
              )}
              {status === 'em_andamento' && (
                <Button 
                  onClick={() => navigate(`/servico/conclusao/${id}`)}
                  className="w-full h-14 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Square size={18} /> Concluir Serviço (Check-out)
                </Button>
              )}
              {status === 'concluido' && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-semibold text-brand-green-600 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Serviço finalizado com sucesso!
                  </span>
                  <Button variant="outline" className="w-full h-12 mt-4" onClick={() => navigate('/hoje')}>
                    Voltar ao Início
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklist Card */}
        {checklist.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-display font-bold text-surface-900 mb-4">Checklist do Serviço</h3>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => toggleCheck(item.id)}
                    className="flex items-center gap-3 w-full text-left p-3 hover:bg-surface-50 rounded-xl border border-surface-100 transition-colors"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.done 
                        ? 'border-brand-blue-600 bg-brand-blue-600 text-white' 
                        : 'border-surface-300 bg-white'
                    }`}>
                      {item.done && <CheckCircle2 size={14} className="fill-white text-brand-blue-600" />}
                    </div>
                    <span className={`text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                      {item.texto}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}