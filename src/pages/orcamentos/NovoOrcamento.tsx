import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Mic, X, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

type OrcamentoItem = {
  id: string;
  descricao: string;
  tipo: 'mo' | 'material';
  valor: number;
};

export default function NovoOrcamento() {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  const { profissional } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [novoItemDesc, setNovoItemDesc] = useState('');
  const [novoItemValor, setNovoItemValor] = useState('');
  const [novoItemTipo, setNovoItemTipo] = useState<'mo' | 'material'>('mo');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Voice UI states (simulado — IA real via /api/ia/transcrever)
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('Diga o que você fez ou usou...');
  const [voiceStep, setVoiceStep] = useState(0);
  const [showVoiceSuccess, setShowVoiceSuccess] = useState(false);

  const startVoiceRecording = () => {
    setIsListening(true);
    setVoiceStep(1);
    setVoiceText('Ouvindo seu áudio...');
    setTimeout(() => setVoiceText('"Instalação de torneira elétrica de cento e cinquenta reais..."'), 1200);
    setTimeout(() => setVoiceText('"...e fita de vedação alta performance de quinze reais"'), 2800);
    setTimeout(() => { setVoiceStep(2); setVoiceText('Estruturando itens com IA Mestrelo...'); }, 4500);
    setTimeout(() => {
      setVoiceStep(3);
      setTitulo(prev => prev || 'Instalação de Torneira Elétrica');
      setItens(prev => [
        ...prev,
        { id: 'v1_' + Date.now(), descricao: 'Mão de obra: Instalação de Torneira', tipo: 'mo', valor: 150 },
        { id: 'v2_' + Date.now(), descricao: 'Material: Fita de Vedação Alta Performance', tipo: 'material', valor: 15 },
      ]);
      setIsListening(false);
      setShowVoiceSuccess(true);
      setTimeout(() => setShowVoiceSuccess(false), 3500);
    }, 6500);
  };

  const handleAddItem = () => {
    if (!novoItemDesc || !novoItemValor) return;
    setItens([...itens, {
      id: Date.now().toString(),
      descricao: novoItemDesc,
      tipo: novoItemTipo,
      valor: parseFloat(novoItemValor.replace(',', '.')),
    }]);
    setNovoItemDesc('');
    setNovoItemValor('');
  };

  const removeItem = (id: string) => setItens(itens.filter(i => i.id !== id));

  const totalMO = itens.filter(i => i.tipo === 'mo').reduce((acc, i) => acc + i.valor, 0);
  const totalMaterial = itens.filter(i => i.tipo === 'material').reduce((acc, i) => acc + i.valor, 0);
  const totalGeral = totalMO + totalMaterial;

  const handleProsseguir = async () => {
    if (!profissional?.id || !clienteId || !titulo || itens.length === 0) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: profissional.id,
          clienteId,
          titulo,
          items: itens,
          valorTotal: totalGeral,
          valorMaoObra: totalMO,
          valorMaterial: totalMaterial,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');
      navigate(`/orcamento/configurar/${data.orcamento.id}`);
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
          <h1 className="font-display font-bold text-lg text-surface-900">Novo Orçamento</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-40">
        {showVoiceSuccess && (
          <div className="bg-brand-green-50 border border-brand-green-200 text-brand-green-800 p-4 rounded-xl flex items-center gap-3 shadow-md animate-in slide-in-from-top duration-300">
            <Sparkles size={16} className="text-brand-green-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Estruturado por Voz!</p>
              <p className="text-xs">Itens adicionados automaticamente.</p>
            </div>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Título do Serviço</label>
          <input
            type="text"
            placeholder="Ex: Instalação de chuveiro elétrico"
            className="w-full h-12 px-3 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-display font-bold text-surface-900">Itens do Orçamento</h2>
            <button
              onClick={startVoiceRecording}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-blue-600 bg-brand-blue-50 hover:bg-brand-blue-100 transition-colors px-3 py-1.5 rounded-full shadow-sm"
            >
              <Mic size={14} /> Transcrever Áudio
            </button>
          </div>

          <Card className="mb-4 bg-white border-brand-blue-100">
            <CardContent className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Descrição do item..."
                className="w-full h-10 px-3 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                value={novoItemDesc}
                onChange={e => setNovoItemDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex bg-surface-100 rounded-md p-1 h-10">
                    <button
                      className={`flex-1 text-xs font-medium rounded ${novoItemTipo === 'mo' ? 'bg-white shadow-sm text-brand-blue-600' : 'text-slate-500'}`}
                      onClick={() => setNovoItemTipo('mo')}
                    >Mão de Obra</button>
                    <button
                      className={`flex-1 text-xs font-medium rounded ${novoItemTipo === 'material' ? 'bg-white shadow-sm text-brand-blue-600' : 'text-slate-500'}`}
                      onClick={() => setNovoItemTipo('material')}
                    >Material</button>
                  </div>
                </div>
                <div className="w-1/3 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                  <input
                    type="number"
                    placeholder="0,00"
                    className="w-full h-10 pl-8 pr-2 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    value={novoItemValor}
                    onChange={e => setNovoItemValor(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full h-10" variant="secondary">
                <Plus size={16} className="mr-1" /> Adicionar Item
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {itens.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-surface-200 rounded-lg">
                <div className="flex flex-col">
                  <span className="font-medium text-surface-900 text-sm">{item.descricao}</span>
                  <span className={`text-xs font-medium uppercase tracking-wider ${item.tipo === 'mo' ? 'text-brand-blue-500' : 'text-amber-600'}`}>
                    {item.tipo === 'mo' ? 'Mão de Obra' : 'Material'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-surface-900">
                    R$ {item.valor.toFixed(2).replace('.', ',')}
                  </span>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 p-1 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {itens.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">Nenhum item adicionado ainda.</p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center text-sm text-slate-600">
          <span>Mão de obra: R$ {totalMO.toFixed(2).replace('.', ',')}</span>
          <span>Material: R$ {totalMaterial.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-sm font-medium text-slate-500">Total</span>
            <p className="text-2xl font-display font-bold text-brand-blue-600">
              R$ {totalGeral.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <Button onClick={handleProsseguir} disabled={itens.length === 0 || !titulo || salvando} className="w-1/2">
            {salvando ? 'Salvando...' : 'Preview PDF'}
          </Button>
        </div>
      </div>

      {isListening && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-6 text-white animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-brand-blue-400">
              <Sparkles size={18} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">IA Mestrelo</span>
            </div>
            <button onClick={() => setIsListening(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center space-y-10 my-auto">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-blue-500/20 rounded-full animate-ping scale-150"></div>
              <div className="absolute inset-2 bg-brand-blue-500/30 rounded-full animate-ping delay-300"></div>
              <div className="w-24 h-24 bg-brand-blue-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,85,255,0.6)] relative z-10">
                <Mic size={40} className="text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center max-w-xs space-y-4">
              <h3 className="font-display font-bold text-xl">
                {voiceStep === 1 ? 'Ouvindo...' : 'Processando áudio...'}
              </h3>
              <p className="text-sm text-slate-300 italic leading-relaxed min-h-[4rem]">{voiceText}</p>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">
            Fale livremente. Ex: "Cobrei 200 reais pelo disjuntor e 50 reais de fita"
          </p>
        </div>
      )}
    </div>
  );
}
