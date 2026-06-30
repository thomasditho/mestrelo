import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Clock, Bolt, CheckCircle2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function NovoServicoRapido() {
  const navigate = useNavigate();
  const { profissional } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [horario, setHorario] = useState('');
  const [clienteBusca, setClienteBusca] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const [criado, setCriado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!profissional?.id) return;
    fetch(`/api/clientes?profissionalId=${profissional.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setClientes(d.clientes || []));
  }, [profissional?.id]);

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(clienteBusca.toLowerCase()) ||
    c.telefone?.includes(clienteBusca)
  ).slice(0, 5);

  const handleSalvar = async () => {
    if (!profissional?.id || !titulo || !data) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: profissional.id,
          clienteId: clienteSelecionado?.id || '',
          titulo,
          data,
          horario: horario || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao criar serviço');

      // Se tiver valor, criar pagamento
      if (valor && parseFloat(valor) > 0 && clienteSelecionado) {
        await fetch('/api/pagamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            profissionalId: profissional.id,
            clienteId: clienteSelecionado.id,
            servicoId: d.servico.id,
            descricao: titulo,
            valorTotal: parseFloat(valor.replace(',', '.')),
            vencimento: data,
          }),
        }).catch(() => {});
      }

      setCriado(true);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (criado) return (
    <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center font-sans">
      <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 size={48} className="text-brand-green-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Serviço Criado!</h1>
      <p className="text-brand-green-700 font-medium mb-8">Adicionado à sua agenda com sucesso.</p>
      <Button className="w-full" size="lg" onClick={() => navigate('/hoje')}>Voltar para Hoje</Button>
    </div>
  );

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900 flex items-center gap-2">
          <Bolt size={18} className="text-amber-500 fill-amber-500" /> Serviço Rápido
        </h1>
      </header>

      <div className="p-4 space-y-6 pb-28">
        <p className="text-sm text-slate-600">
          Crie um serviço direto na agenda sem precisar passar por um orçamento. Ideal para manutenções avulsas.
        </p>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>}

        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">O que vai ser feito?</label>
              <input
                type="text"
                placeholder="Ex: Troca de tomada"
                className="w-full h-14 px-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">Qual cliente?</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Nome ou telefone"
                  className="w-full h-14 pl-11 pr-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                  value={clienteSelecionado ? clienteSelecionado.nome : clienteBusca}
                  onChange={e => { setClienteBusca(e.target.value); setClienteSelecionado(null); }}
                />
              </div>
              {!clienteSelecionado && clienteBusca && clientesFiltrados.length > 0 && (
                <div className="bg-white border border-surface-200 rounded-xl shadow-md overflow-hidden">
                  {clientesFiltrados.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-3 hover:bg-surface-50 border-b border-surface-100 last:border-b-0 text-sm font-medium text-surface-900"
                      onClick={() => setClienteSelecionado(c)}
                    >
                      {c.nome} ({c.telefone})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                  <Calendar size={16} className="text-slate-400" /> Data
                </label>
                <input
                  type="date"
                  className="w-full h-14 px-3 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                  <Clock size={16} className="text-slate-400" /> Horário (Opcional)
                </label>
                <input
                  type="time"
                  className="w-full h-14 px-3 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                  value={horario}
                  onChange={e => setHorario(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                <DollarSign size={16} className="text-slate-400" /> Valor Cobrado (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  className="w-full h-14 pl-11 pr-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                />
              </div>
              {valor && parseFloat(valor) > 0 && !clienteSelecionado && (
                <p className="text-xs text-amber-600 font-medium">⚠️ É preciso selecionar um cliente para gerar a cobrança automática.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleSave}
          disabled={salvando || !titulo || !data}
          className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md text-base"
        >
          {salvando ? 'Criando...' : 'Criar Serviço Rápido'}
        </Button>
      </div>
    </div>
  );
}