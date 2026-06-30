import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, AlignLeft, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function NovoCliente() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    endereco: '',
    anotacoes: ''
  });

  const handleSave = async () => {
    if (!profissional?.id) {
      alert('Erro: Profissional não identificado. Faça login novamente.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: profissional.id,
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco,
          notas: formData.anotacoes,
          tags: formData.cpf ? `CPF:${formData.cpf}` : ''
        })
      });
      const data = await res.json();
      if (data.success) {
        navigate('/clientes');
      } else {
        alert(data.error || 'Erro ao cadastrar cliente.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">
          Novo Cliente
        </h1>
      </header>

      <div className="p-4 space-y-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <User size={16} className="text-brand-blue-500" /> Nome Completo
              </label>
              <input 
                type="text" 
                placeholder="Ex: Carlos Silva" 
                className="w-full h-14 px-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all bg-white"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <Phone size={16} className="text-brand-green-500" /> Telefone / WhatsApp
              </label>
              <input 
                type="tel" 
                placeholder="(11) 99999-9999" 
                className="w-full h-14 px-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all bg-white"
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <CreditCard size={16} className="text-slate-500" /> CPF (Opcional)
              </label>
              <input 
                type="text" 
                placeholder="000.000.000-00" 
                className="w-full h-14 px-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all bg-white"
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <MapPin size={16} className="text-amber-500" /> Endereço
              </label>
              <textarea 
                placeholder="Rua, Número, Bairro, Cidade..." 
                className="w-full p-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all bg-white min-h-[100px] resize-none"
                value={formData.endereco}
                onChange={e => setFormData({...formData, endereco: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <AlignLeft size={16} className="text-slate-500" /> Anotações
              </label>
              <textarea 
                placeholder="Detalhes sobre o cliente, como horário de preferência, etc..." 
                className="w-full p-4 text-base border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 transition-all bg-white min-h-[100px] resize-none"
                value={formData.anotacoes}
                onChange={e => setFormData({...formData, anotacoes: e.target.value})}
              />
            </div>

          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          className="w-full h-14 shadow-md text-base font-bold flex items-center justify-center gap-2" 
          disabled={!formData.nome || !formData.telefone || loading}
          onClick={handleSave}
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </div>
  );
}
