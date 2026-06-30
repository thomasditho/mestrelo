import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, MapPin, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function DadosComerciais() {
  const navigate = useNavigate();
  const { profissional, updateProfissional } = useAuth();
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    telefone: '',
    pix: '',
    regiao: '',
    especialidade: '',
  });

  useEffect(() => {
    if (profissional) {
      setFormData({
        telefone: profissional.phone || '',
        pix: (profissional as any).pix_key || '',
        regiao: profissional.city || '',
        especialidade: profissional.specialty || '',
      });
    }
  }, [profissional?.id]);

  const handleSave = async () => {
    if (!profissional?.id) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/profissional/mini-site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profissionalId: profissional.id,
          phone: formData.telefone,
          pix_key: formData.pix,
          city: formData.regiao,
          specialty: formData.especialidade,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      updateProfissional({
        phone: formData.telefone,
        city: formData.regiao,
        specialty: formData.especialidade,
      });
      setSalvo(true);
      setTimeout(() => { setSalvo(false); navigate(-1); }, 1500);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">
          Dados Comerciais
        </h1>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <p className="text-sm text-slate-600">
          Essas informações aparecem no seu Mini Site e nos orçamentos enviados aos clientes.
        </p>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>}

        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <Smartphone size={16} className="text-brand-blue-500" /> WhatsApp Profissional
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
                className="w-full h-12 px-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              />
              <p className="text-xs text-slate-500 mt-1">Este número receberá as mensagens dos clientes.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                Especialidade
              </label>
              <input
                type="text"
                placeholder="Ex: Eletricista Residencial"
                value={formData.especialidade}
                onChange={e => setFormData({...formData, especialidade: e.target.value})}
                className="w-full h-12 px-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand-green-500" /> Chave PIX Principal
              </label>
              <input
                type="text"
                placeholder="CPF, celular, e-mail ou chave aleatória"
                value={formData.pix}
                onChange={e => setFormData({...formData, pix: e.target.value})}
                className="w-full h-12 px-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              />
              <p className="text-xs text-slate-500 mt-1">Sua chave principal para recebimento via PIX QR Code.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <MapPin size={16} className="text-slate-500" /> Cidade / Região de Atendimento
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo - SP"
                value={formData.regiao}
                onChange={e => setFormData({...formData, regiao: e.target.value})}
                className="w-full h-12 px-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleSave}
          disabled={salvando}
          className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base border-none"
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}