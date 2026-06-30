import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Tag, CalendarClock, CreditCard, AlignLeft, Percent } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function ConfigurarOrcamento() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [validade, setValidade] = useState('7');
  const [parcelamento, setParcelamento] = useState('1');
  const [desconto, setDesconto] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState<'percentual' | 'dinheiro'>('dinheiro');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id || id === 'draft') return;
    fetch(`/api/orcamentos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.orcamento) {
          setValidade(String(d.orcamento.validade_dias || 7));
          setParcelamento(String(d.orcamento.parcelamento || 1));
          setDesconto(d.orcamento.desconto ? String(d.orcamento.desconto) : '');
          setObservacoes(d.orcamento.observacoes || '');
        }
      })
      .catch(() => {});
  }, [id]);

  const handleVisualizar = async () => {
    if (!id || id === 'draft') { navigate('/orcamento/preview/draft'); return; }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          validadeDias: parseInt(validade),
          parcelamento: parseInt(parcelamento),
          desconto: desconto ? parseFloat(desconto.replace(',', '.')) : 0,
          observacoes,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      navigate(`/orcamento/preview/${id}`);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Configurar Orçamento</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-28">
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>}

        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Tag size={18} className="text-brand-blue-500" /> Adicionar Desconto
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 bg-surface-100 p-1 rounded-lg flex h-12">
                <button
                  className={`flex-1 text-sm font-bold rounded-md ${tipoDesconto === 'dinheiro' ? 'bg-white shadow-sm text-brand-blue-600' : 'text-slate-500'}`}
                  onClick={() => setTipoDesconto('dinheiro')}
                >R$</button>
                <button
                  className={`flex-1 text-sm font-bold rounded-md flex items-center justify-center gap-1 ${tipoDesconto === 'percentual' ? 'bg-white shadow-sm text-brand-blue-600' : 'text-slate-500'}`}
                  onClick={() => setTipoDesconto('percentual')}
                ><Percent size={14} /> %</button>
              </div>
              <div className="flex-1 relative">
                {tipoDesconto === 'dinheiro' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>}
                {tipoDesconto === 'percentual' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>}
                <input
                  type="number"
                  placeholder="0,00"
                  value={desconto}
                  onChange={e => setDesconto(e.target.value)}
                  className={`w-full h-12 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white ${tipoDesconto === 'dinheiro' ? 'pl-9 pr-3' : 'pl-3 pr-8'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-bold text-surface-900 mb-3 flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-brand-blue-500" /> Parcelamento
              </h3>
              <select
                value={parcelamento}
                onChange={e => setParcelamento(e.target.value)}
                className="w-full h-10 px-2 text-sm border border-surface-200 rounded-lg focus:outline-none bg-white"
              >
                <option value="1">À vista</option>
                <option value="2">2x sem juros</option>
                <option value="3">3x sem juros</option>
                <option value="6">6x com juros</option>
                <option value="12">12x com juros</option>
              </select>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-bold text-surface-900 mb-3 flex items-center gap-2 text-sm">
                <CalendarClock size={16} className="text-brand-blue-500" /> Validade
              </h3>
              <select
                value={validade}
                onChange={e => setValidade(e.target.value)}
                className="w-full h-10 px-2 text-sm border border-surface-200 rounded-lg focus:outline-none bg-white"
              >
                <option value="3">3 dias</option>
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
              </select>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-bold text-surface-900 mb-3 flex items-center gap-2">
              <AlignLeft size={18} className="text-brand-blue-500" /> Observações (Opcional)
            </h3>
            <textarea
              placeholder="Ex: Garantia de 3 meses para mão de obra. Materiais não inclusos na garantia de instalação."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="w-full p-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md text-base"
          disabled={salvando}
          onClick={handleVisualizar}
        >
          {salvando ? 'Salvando...' : 'Visualizar Orçamento'}
        </Button>
      </div>
    </div>
  );
}