import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, PenTool, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function PublicOrcamento() {
  const { id } = useParams();

  const [orc, setOrc] = useState<any>(null);
  const [prof, setProf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aprovando, setAprovando] = useState(false);
  const [aprovado, setAprovado] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [assinado, setAssinado] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`/api/orcamentos/${id}`)
      .then(r => r.json())
      .then(async d => {
        if (!d.orcamento) throw new Error('Orçamento não encontrado');
        setOrc(d.orcamento);
        if (d.orcamento.status === 'aprovado') setAprovado(true);
        // Buscar profissional pelo mini site seria /api/profissional/me/:id
        const pr = await fetch(`/api/profissional/me/${d.orcamento.profissional_id}`);
        const pd = await pr.json();
        setProf(pd.profissional);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  }, [orc]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, rect: DOMRect) => {
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true); setAssinado(true);
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas.getBoundingClientRect()); if (!pos) return;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#0055FF';
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) ctx.beginPath(); }
  };
  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas.getBoundingClientRect()); if (!pos) return;
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
    setAssinado(false);
  };

  const handleAprovar = async () => {
    if (!id || !assinado) return;
    setAprovando(true);
    try {
      const canvas = canvasRef.current;
      const assinaturaUrl = canvas?.toDataURL('image/png') || null;
      const res = await fetch(`/api/orcamentos/${id}/aprovar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assinaturaUrl }),
      });
      if (!res.ok) throw new Error('Erro ao aprovar');
      setAprovado(true);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setAprovando(false);
    }
  };

  const items: any[] = (() => { try { return JSON.parse(orc?.items || '[]'); } catch { return []; } })();
  const validadeDate = orc ? (() => {
    const d = new Date(orc.created_at || Date.now());
    d.setDate(d.getDate() + (orc.validade_dias || 7));
    return d.toLocaleDateString('pt-BR');
  })() : '';
  const inicial = (prof?.name || 'P')[0].toUpperCase();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 p-6 text-center">
      <div>
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-surface-900 mb-2">Link inválido</h1>
        <p className="text-slate-500 text-sm">{erro}</p>
      </div>
    </div>
  );

  if (aprovado) return (
    <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 size={48} className="text-brand-green-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Orçamento Aprovado!</h1>
      <p className="text-brand-green-700 font-medium mb-8">
        {prof?.name || 'O profissional'} foi notificado e entrará em contato para agendar o serviço.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100 pb-safe font-sans">
      <div className="bg-brand-blue-600 pt-8 pb-12 px-6 rounded-b-[2rem] text-white shadow-sm text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-blue-600 font-display font-bold text-2xl shadow-md mx-auto mb-4">
          {inicial}
        </div>
        <h1 className="text-xl font-display font-bold">{prof?.name || 'Profissional'}</h1>
        <p className="text-brand-blue-100 text-sm mt-1">enviou um orçamento para você</p>
      </div>

      <div className="px-4 -mt-6 pb-12">
        <Card className="shadow-lg border-none overflow-hidden">
          <div className="w-full h-1 bg-brand-blue-500"></div>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-surface-900">R$ {fmt(orc?.valor_total || 0)}</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{orc?.titulo}</p>
            </div>

            <div className="space-y-3 mb-6">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-surface-50 rounded-lg border border-surface-100">
                  <span className="text-sm font-medium text-slate-700">{item.descricao}</span>
                  <span className="font-semibold text-surface-900">R$ {fmt(item.valor || 0)}</span>
                </div>
              ))}
              {items.length === 0 && (
                <>
                  <div className="flex justify-between items-center p-3 bg-surface-50 rounded-lg border border-surface-100">
                    <span className="text-sm font-medium text-slate-700">Mão de obra</span>
                    <span className="font-semibold text-surface-900">R$ {fmt(orc?.valor_mao_obra || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-50 rounded-lg border border-surface-100">
                    <span className="text-sm font-medium text-slate-700">Materiais</span>
                    <span className="font-semibold text-surface-900">R$ {fmt(orc?.valor_material || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {orc?.observacoes && (
              <div className="flex items-start gap-2 bg-amber-50 text-amber-900 p-4 rounded-xl text-sm leading-relaxed mb-8">
                <PenTool size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong className="block font-semibold mb-0.5">Observações:</strong>
                  {orc.observacoes}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mb-8">
              Orçamento válido até {validadeDate}.
            </p>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-bold text-surface-900 block mb-2">Assine no campo abaixo para aprovar</span>
                <div className="relative border-2 border-dashed border-surface-200 rounded-2xl overflow-hidden bg-surface-50 aspect-video w-full">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                  />
                  {assinado && (
                    <button 
                      onClick={clearSignature}
                      className="absolute bottom-3 right-3 text-xs font-semibold bg-white text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm transition-all"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAprovar}
                className="w-full h-14 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                disabled={aprovando || !assinado}
              >
                {aprovando ? 'Processando...' : 'Aprovar Orçamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}