import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
function diasAtraso(vencimento: string) {
  const v = new Date(vencimento);
  const hoje = new Date();
  return Math.max(0, Math.floor((hoje.getTime() - v.getTime()) / 86400000));
}

export default function EnviarCobranca() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profissional } = useAuth();

  const [pagamento, setPagamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!id || !profissional?.id) return;
    fetch(`/api/pagamentos?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const pag = (d.pagamentos || []).find((p: any) => p.id === id);
        setPagamento(pag || null);
      })
      .finally(() => setLoading(false));
  }, [id, profissional?.id]);

  const handleSendCobranca = () => {
    if (!pagamento) return;
    const phone = pagamento.clienteTelefone?.replace(/\D/g, '') || '';
    const phoneLink = phone.startsWith('55') ? phone : `55${phone}`;
    const text = `Olá ${pagamento.clienteNome || ''}, tudo bem? Aqui é ${profissional?.name || 'o prestador'}. 👷\n\nEstou passando para lembrar que o pagamento do serviço (${pagamento.descricao}) no valor de R$ ${fmt(pagamento.valor_total)} está pendente${pagamento.vencimento ? ` desde ${new Date(pagamento.vencimento).toLocaleDateString('pt-BR')}` : ''}.\n\nQualquer dúvida, estou à disposição!`;
    if (phone) {
      window.open(`https://wa.me/${phoneLink}?text=${encodeURIComponent(text)}`, '_blank');
    }
    setEnviado(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (enviado) return (
    <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 size={48} className="text-brand-green-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Cobrança Enviada!</h1>
      <p className="text-brand-green-700 font-medium mb-8">
        A mensagem foi enviada para {pagamento?.clienteNome || 'o cliente'} no WhatsApp.
      </p>
      <Button className="w-full" size="lg" onClick={() => navigate('/dinheiro')}>Voltar para Dinheiro</Button>
    </div>
  );

  const dias = pagamento?.vencimento ? diasAtraso(pagamento.vencimento) : 0;

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">Enviar Cobrança</h1>
      </header>

      <div className="p-4 space-y-6">
        {dias > 0 && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Atrasado há {dias} dia{dias !== 1 ? 's' : ''}</h3>
              {pagamento?.vencimento && (
                <p className="text-xs mt-1 text-red-600">
                  Vencimento: {new Date(pagamento.vencimento).toLocaleDateString('pt-BR')}. Valor: R$ {fmt(pagamento.valor_total)}.
                </p>
              )}
            </div>
          </div>
        )}

        {pagamento && (
          <div className="space-y-3">
            <label className="text-sm font-bold text-surface-900">Mensagem que será enviada:</label>
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="w-full h-1 bg-[#25D366]"></div>
              <CardContent className="p-5">
                <div className="bg-[#e5ddd5] p-3 rounded-xl border relative shadow-inner max-w-[280px] text-xs leading-relaxed text-surface-900">
                  <p className="whitespace-pre-wrap text-slate-800">
                    {`Olá ${pagamento.clienteNome || ''}, tudo bem? Aqui é ${profissional?.name || 'o prestador'}. 👷\n\nEstou passando para lembrar que o pagamento do serviço (${pagamento.descricao}) no valor de R$ ${fmt(pagamento.valor_total)} está pendente${pagamento.vencimento ? ` desde ${new Date(pagamento.vencimento).toLocaleDateString('pt-BR')}` : ''}.\n\nQualquer dúvida, estou à disposição!`}
                  </p>
                  <span className="text-[9px] text-slate-400 absolute bottom-1 right-2">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSendCobranca}
              className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base mt-4"
            >
              <MessageCircle size={18} /> Enviar Cobrança por WhatsApp
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}