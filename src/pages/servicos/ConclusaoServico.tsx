import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, PenTool, Send, FileText, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function ConclusaoServico() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [servico, setServico] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [garantia, setGarantia] = useState('90');
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [assinado, setAssinado] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`/api/servicos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setServico(d.servico);
        setCliente(d.servico?.cliente || null);
        setGarantia(String(d.servico?.garantia_dias || 90));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  }, [servico]);

  const getPos = (e: any, rect: DOMRect) => {
    if ('touches' in e && e.touches.length > 0)
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const startDrawing = (e: any) => {
    setIsDrawing(true); setAssinado(true);
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, c.getBoundingClientRect());
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#0055FF';
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const stopDrawing = () => {
    setIsDrawing(false);
    const c = canvasRef.current; if (c) { const ctx = c.getContext('2d'); if (ctx) ctx.beginPath(); }
  };
  const draw = (e: any) => {
    if (!isDrawing) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, c.getBoundingClientRect());
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const clearSignature = () => {
    const c = canvasRef.current;
    if (c) { const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); }
    setAssinado(false);
  };

  const handleConcluir = async () => {
    if (!id) return;
    setSalvando(true);
    setErro('');
    try {
      const canvas = canvasRef.current;
      const assinaturaClienteUrl = assinado ? canvas?.toDataURL('image/png') : null;
      const res = await fetch(`/api/servicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'concluido',
          checkoutEm: new Date().toISOString(),
          garantiaDias: parseInt(garantia),
          observacoes: obs,
          assinaturaClienteUrl,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar conclusão');
      setEnviado(true);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (enviado) {
    const phone = cliente?.telefone?.replace(/\D/g, '') || '';
    const phoneLink = phone.startsWith('55') ? phone : `55${phone}`;
    const msg = `Olá ${cliente?.nome || ''}! Seu serviço foi finalizado com sucesso e o relatório já está disponível!\n\nVocê pode acessar o recibo aqui: ${window.location.origin}/dinheiro/recibo/${id}\n\nMuito obrigado!`;

    return (
      <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center">
        <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={48} className="text-brand-green-600" />
        </div>
        <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Serviço Concluído!</h1>
        <p className="text-brand-green-700 font-medium mb-8">Relatório em PDF pronto e Recibo Digital gerado com sucesso.</p>
        <div className="space-y-3 max-w-sm mx-auto w-full">
          {phone && (
            <Button
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] border-none shadow-md"
              size="lg"
              onClick={() => window.open(`https://wa.me/${phoneLink}?text=${encodeURIComponent(msg)}`, '_blank')}
            >
              <Send size={18} className="mr-2" /> Abrir WhatsApp do Cliente
            </Button>
          )}
          <Button
            className="w-full shadow-sm bg-brand-blue-600 hover:bg-brand-blue-700 text-white"
            size="lg"
            onClick={() => navigate(`/dinheiro/recibo/${id}`)}
          >
            <FileText size={18} className="mr-2" /> Visualizar Recibo Digital
          </Button>
          <Button variant="outline" className="w-full shadow-sm bg-white" size="lg" onClick={() => navigate('/hoje')}>
            Voltar para Hoje
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">Finalizar Serviço</h1>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {servico && (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="font-bold text-surface-900">{servico.titulo}</p>
              {cliente && <p className="text-sm text-slate-500 mt-0.5">{cliente.nome}</p>}
            </CardContent>
          </Card>
        )}

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-green-500" /> Garantia do Serviço (dias)
            </label>
            <input
              type="number"
              className="w-full h-12 px-3 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              value={garantia}
              onChange={e => setGarantia(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <PenTool size={16} className="text-amber-500" /> Observações no Protocolo
            </label>
            <textarea
              className="w-full p-3 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white min-h-[100px] resize-none"
              placeholder="Ex: Fiação principal estava oxidada, recomendada troca geral futura."
              value={obs}
              onChange={e => setObs(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-surface-900">Assinatura do Cliente (opcional)</label>
            {assinado && (
              <button onClick={clearSignature} className="text-xs text-slate-500 underline">Limpar</button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2">
            {cliente?.nome ? `Peça para ${cliente.nome} assinar para validar a entrega.` : 'Assinatura do cliente para validar o protocolo.'}
          </p>
          <div className="w-full h-40 bg-white border-2 border-dashed border-brand-blue-200 rounded-xl relative overflow-hidden shadow-sm">
            {!assinado && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-brand-blue-400 font-medium opacity-50 select-none">Assinar aqui</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onMouseMove={draw}
              onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>
        </div>

        <Button 
          onClick={handleConcluir} 
          disabled={salvando} 
          className="w-full h-14 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base mt-6"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {salvando ? 'Concluindo...' : 'Salvar e Gerar Recibo'}
        </Button>
      </div>
    </div>
  );
}
  