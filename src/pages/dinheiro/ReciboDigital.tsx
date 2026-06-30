import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Printer, CheckCircle, Share2, Calendar, User, Award, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function ReciboDigital() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profissional } = useAuth();
  const [copied, setCopied] = useState(false);
  const [servico, setServico] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/servicos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setServico(d.servico || d || null))
      .finally(() => setLoading(false));
  }, [id]);

  const receiptNumber = `REC-${new Date().getFullYear()}-${id?.slice(-6).toUpperCase() || '000000'}`;
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const clienteNome = servico?.cliente?.nome || '—';
  const clientePhone = servico?.cliente?.telefone?.replace(/\D/g, '') || '';
  const valorTotal = servico?.valor_total || 0;
  const garantiaDias = servico?.garantia_dias;
  const titulo = servico?.titulo || '—';

  const handleShareWhatsApp = () => {
    const phoneLink = clientePhone.startsWith('55') ? clientePhone : `55${clientePhone}`;
    const text = `Olá *${clienteNome}*! Aqui está o seu *Recibo Digital* de *${profissional?.name || ''}*.\n\n📄 *Recibo Nº:* ${receiptNumber}\n📅 *Data:* ${dateStr}\n🛠️ *Serviço:* ${titulo}\n💰 *Valor Total:* R$ ${fmt(valorTotal)}${garantiaDias ? `\n🔒 *Garantia:* ${garantiaDias} dias` : ''}\n\nObrigado pela preferência!`;
    if (clientePhone) window.open(`https://wa.me/${phoneLink}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => { window.print(); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans print:bg-white print:pb-0">
      {/* Header Bar - Hidden on print */}
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/hoje')} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Recibo Digital</h1>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={handleCopyLink} 
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
            title="Copiar Link"
          >
            {copied ? <Check size={20} className="text-brand-green-600" /> : <Share2 size={20} />}
          </button>
          <button 
            onClick={handlePrint} 
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
            title="Imprimir Recibo"
          >
            <Printer size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-4 print:p-0 print:mt-0">
        
        {/* Receipt Paper Effect Container */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative print:shadow-none print:border-none">
          {/* Top Notch Brand Header */}
          <div className="bg-brand-blue-600 px-6 py-8 text-white text-center relative">
            <div className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
              {servico?.forma_pagamento ? `Pago via ${servico.forma_pagamento}` : 'Quitado'}
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h2 className="font-display font-black text-2xl tracking-tight">RECIBO DE QUITAÇÃO</h2>
            <p className="text-xs text-blue-100 mt-1">Nº {receiptNumber} • {dateStr}</p>
          </div>

          {/* Paper Dashed Tear Line */}
          <div className="relative h-4 bg-white flex items-center">
            <div className="absolute inset-x-0 border-t-2 border-dashed border-slate-200"></div>
            {/* Half circles on the sides */}
            <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded-full absolute -left-2 z-10 print:hidden"></div>
            <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded-full absolute -right-2 z-10 print:hidden"></div>
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-6">
            
            {/* Professional Info */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <p className="font-display font-black text-slate-900 text-lg">{profissional?.name || '—'}</p>
                {profissional?.specialty && <p className="text-xs text-slate-500">{profissional.specialty}</p>}
              </div>
              <div className="text-right">
                <span className="inline-block bg-brand-green-50 text-brand-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Mestrelo
                </span>
              </div>
            </div>

            {/* Client info card */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5"><User size={14} /> Cliente</span>
                <span className="font-bold text-slate-900">{clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5"><Calendar size={14} /> Data Emissão</span>
                <span className="text-slate-800">{dateStr}</span>
              </div>
              {garantiaDias && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><Award size={14} /> Garantia</span>
                  <span className="text-brand-blue-600 font-bold">{garantiaDias} dias</span>
                </div>
              )}
            </div>

            {/* Service & Items Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição dos Serviços</h3>
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Serviço Técnico / Mão de Obra</span>
                  <span className="text-xs text-slate-400">{titulo}</span>
                </div>
                <span className="font-bold text-slate-900">R$ {fmt(valorTotal)}</span>
              </div>
            </div>

            {/* Total Section */}
            <div className="bg-brand-blue-50/50 p-4 rounded-2xl border border-brand-blue-100 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-brand-blue-600 uppercase tracking-widest">Total Geral Pago</span>
                <span className="text-slate-500 text-xs mt-0.5">Sem pendências financeiras</span>
              </div>
              <div className="text-2xl font-display font-black text-brand-blue-600">
                R$ {fmt(valorTotal)}
              </div>
            </div>

            {/* Stamp */}
            <div className="flex flex-col items-center justify-center pt-4 border-t border-slate-100 space-y-3">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emitido via Mestrelo</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{receiptNumber}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Share Receipt Panel - Hidden on Print */}
        <div className="space-y-3 print:hidden">
          <Button 
            onClick={handleShareWhatsApp} 
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] h-12 text-sm shadow-md font-bold text-white border-none"
          >
            <Send size={18} className="mr-2" /> Compartilhar Recibo no WhatsApp
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/hoje')} 
            className="w-full h-12 text-sm bg-white"
          >
            Voltar para Hoje
          </Button>
        </div>

      </div>
    </div>
  );
}
