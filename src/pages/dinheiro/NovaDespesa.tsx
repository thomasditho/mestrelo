import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, AlignLeft, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function NovaDespesa() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');

  const handleSalvar = async () => {
    if (!profissional?.id || !valor || !descricao || !categoria) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: profissional.id,
          valor: parseFloat(valor.replace(',', '.')),
          descricao,
          categoria,
          data,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao salvar despesa');
      }
      setSalvo(true);
      setTimeout(() => navigate('/dinheiro'), 1500);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (salvo) return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={48} className="text-red-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-red-900 mb-2">Despesa Salva!</h1>
      <p className="text-red-700 font-medium">Lançamento registrado no seu extrato.</p>
    </div>
  );

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-red-600 text-white px-4 py-3 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg">Nova Despesa</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-28">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200 text-center">
          <p className="text-sm font-medium text-slate-500 mb-2">Valor da despesa</p>
          <div className="flex items-center justify-center text-4xl font-display font-bold text-red-600">
            <span className="text-2xl mr-1 text-red-400">R$</span>
            <input
              type="number"
              placeholder="0,00"
              className="bg-transparent border-none p-0 w-32 text-center focus:outline-none focus:ring-0 placeholder:text-red-200"
              value={valor}
              onChange={e => setValor(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                O que foi comprado/pago?
              </label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Ex: Material para a obra da Maria" 
                  className="w-full h-12 pl-10 pr-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                Categoria
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  className="w-full h-12 pl-10 pr-10 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white appearance-none"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                >
                  <option value="" disabled>Selecione uma categoria...</option>
                  <option value="material">Material (Fios, Disjuntor, etc)</option>
                  <option value="transporte">Transporte (Gasolina, Uber)</option>
                  <option value="alimentacao">Alimentação</option>
                  <option value="ajudante">Pagamento de Ajudante</option>
                  <option value="outros">Outros</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-t-4 border-t-slate-400 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                Data do pagamento
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" 
                  className="w-full h-12 pl-10 pr-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleSalvar}
          disabled={salvando || !valor || !descricao || !categoria}
          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {salvando ? 'Salvando...' : 'Registrar Despesa'}
        </Button>
      </div>
    </div>
  );
}
