import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

function fmt(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }

export default function PreviewOrcamento() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [orc, setOrc] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [prof, setProf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id || id === 'draft') { setLoading(false); return; }
    fetch(`/api/orcamentos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async d => {
        setOrc(d.orcamento);
        if (d.orcamento?.cliente_id) {
          const cr = await fetch(`/api/clientes/${d.orcamento.cliente_id}`, { credentials: 'include' });
          const cd = await cr.json();
          setCliente(cd.cliente);
        }
        const pr = await fetch('/api/auth/me', { credentials: 'include' });
        const pd = await pr.json();
        setProf(pd.profissional);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnviar = async () => {
    if (!orc || !cliente) return;
    setEnviando(true);
    // Marcar como enviado
    await fetch(`/api/orcamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'enviado', enviadoEm: new Date().toISOString() }),
    }).catch(() => {});

    // Abrir WhatsApp com link de aprovação
    const msg = `Olá ${cliente.nome}! Segue o orçamento para ${orc.titulo}. Acesse para visualizar e aprovar:\n\n${orc.link_aprovacao || window.location.origin + '/orcamento/aprovar/' + id}\n\nQualquer dúvida estou à disposição!`;
    const phone = cliente.telefone?.replace(/\D/g, '') || '';
    const phoneLink = phone.startsWith('55') ? phone : `55${phone}`;
    if (phone) {
      window.open(`https://wa.me/${phoneLink}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    navigate('/orcamento/enviado');
  };

  const items: any[] = (() => {
    try { return JSON.parse(orc?.items || '[]'); } catch { return []; }
  })();

  const validadeDate = orc ? (() => {
    const d = new Date(orc.created_at || Date.now());
    d.setDate(d.getDate() + (orc.validade_dias || 7));
    return d.toLocaleDateString('pt-BR');
  })() : '';

  const numero = id?.slice(-4).toUpperCase() || '0000';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Preview do PDF</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-4">
            <div>
              <h1 className="text-xl font-display font-bold text-brand-blue-900">Mestrelo</h1>
              <p className="text-xs text-slate-500">{prof?.name || '—'}</p>
              {prof?.cnpj && <p className="text-xs text-slate-500">CNPJ: {prof.cnpj}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-surface-900">ORÇAMENTO</h2>
              <p className="text-xs font-medium text-slate-500">Nº {numero}</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Cliente */}
          {cliente && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-surface-900 mb-1">Para:</h3>
              <p className="text-sm text-slate-600">{cliente.nome}</p>
              {cliente.endereco && <p className="text-sm text-slate-600">{cliente.endereco}</p>}
            </div>
          )}

          {/* Serviço */}
          {orc?.titulo && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-surface-900 mb-2">Serviço:</h3>
              <p className="text-sm text-slate-600">{orc.titulo}</p>
            </div>
          )}

          {/* Itens */}
          {items.length > 0 && (
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="text-left py-2 font-bold uppercase tracking-wider">Descrição</th>
                  <th className="text-right py-2 font-bold uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 text-slate-600">{item.descricao}</td>
                    <td className="py-2 text-right text-surface-900 font-bold">R$ {fmt(item.valor || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals & Notes */}
          <div className="flex flex-col items-end gap-1 mb-6 border-b pb-4">
            {orc?.desconto > 0 && (
              <span className="text-sm text-red-500">Desconto: - R$ {fmt(orc.desconto)}</span>
            )}
            <span className="text-lg font-display font-bold text-brand-blue-600">
              Total: R$ {fmt(orc?.valor_total || 0)}
            </span>
          </div>

          {orc?.observacoes && (
            <div className="mb-6 text-xs text-slate-500 leading-relaxed bg-surface-50 p-4 rounded-xl">
              <strong>Observações:</strong>
              <p className="mt-1">{orc.observacoes}</p>
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            Este orçamento é válido até {validadeDate}.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          className="w-full h-14 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold rounded-xl shadow-md text-base flex items-center justify-center gap-2"
          disabled={enviando}
          onClick={handleEnviar}
        >
          {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
          {enviando ? 'Enviando...' : 'Enviar por WhatsApp'}
        </Button>
      </div>
    </div>
  );
}