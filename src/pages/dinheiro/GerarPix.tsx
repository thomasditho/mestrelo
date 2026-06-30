import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Copy, Share2, QrCode, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function GerarPix() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profissional } = useAuth();

  const [pagamento, setPagamento] = useState<any>(null);
  const [pixPayload, setPixPayload] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id || !profissional?.id) return;
    // Buscar pagamento pelo ID
    fetch(`/api/pagamentos?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async d => {
        const pag = (d.pagamentos || []).find((p: any) => p.id === id);
        if (!pag) { setErro('Pagamento não encontrado'); setLoading(false); return; }
        setPagamento(pag);
        // Gerar PIX
        const pixRes = await fetch('/api/pix/gerar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            profissionalId: profissional.id,
            valor: pag.valor_total,
            descricao: pag.descricao,
            txid: pag.id,
          }),
        });
        const pixData = await pixRes.json();
        if (pixData.payload) setPixPayload(pixData.payload);
        else setErro(pixData.error || 'Erro ao gerar PIX');
      })
      .finally(() => setLoading(false));
  }, [id, profissional?.id]);

  const handleCopy = () => {
    if (pixPayload) navigator.clipboard.writeText(pixPayload).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!pagamento || !pixPayload) return;
    const phone = pagamento.clienteTelefone?.replace(/\D/g, '') || '';
    const phoneLink = phone.startsWith('55') ? phone : `55${phone}`;
    const text = `Olá ${pagamento.clienteNome || ''}! Segue o código PIX Copia-e-Cola para o pagamento de *R$ ${fmt(pagamento.valor_total)}*:\n\n${pixPayload}\n\nMuito obrigado!`;
    window.open(`https://wa.me/${phoneLink}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-brand-blue-600 text-white px-4 py-4 rounded-b-[2rem] shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-brand-blue-100 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg">Receber Pagamento</h1>
      </header>

      <div className="p-4 space-y-6 mt-2">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>
        )}

        <Card className="border-none shadow-md overflow-hidden bg-white">
          <div className="w-full h-1 bg-[#25D366]"></div>
          <CardContent className="p-6 text-center">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 block">Valor a Receber</span>
            <h2 className="text-4xl font-display font-bold text-surface-900 mb-2">
              R$ {fmt(pagamento?.valor_total || 0)}
            </h2>
            {pagamento?.clienteNome && (
              <p className="text-sm text-slate-500 mb-2">{pagamento.clienteNome}</p>
            )}
            {pagamento?.descricao && (
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto truncate">{pagamento.descricao}</p>
            )}

            {pixPayload && (
              <div className="mt-8 flex flex-col items-center">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner mb-6 flex flex-col items-center gap-3 relative">
                  <QrCode size={180} className="text-surface-900" />
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">PIX Estático</span>
                </div>

                <div className="w-full space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={pixPayload}
                      className="w-full h-12 pl-4 pr-12 text-xs text-slate-500 border border-surface-200 rounded-xl bg-surface-50 focus:outline-none select-all"
                    />
                    <button 
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                    >
                      {copiado ? <span className="text-[10px] font-bold text-emerald-600">Copiado!</span> : <Copy size={16} />}
                    </button>
                  </div>

                  <Button 
                    onClick={handleWhatsApp}
                    className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} /> Enviar Código por WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}