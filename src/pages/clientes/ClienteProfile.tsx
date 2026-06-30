import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Edit2, Calendar, FileText, CheckCircle2, ChevronRight, MessageCircle, Star, Save, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function ClienteProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico'>('resumo');
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable fields
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [notas, setNotas] = useState('');
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState('Ativo');

  const fetchCliente = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/clientes/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.cliente) {
          setCliente(data.cliente);
          setNome(data.cliente.nome || '');
          setTelefone(data.cliente.telefone || '');
          setEndereco(data.cliente.endereco || '');
          setNotas(data.cliente.notas || '');
          setRating(data.cliente.rating || 5);
          setStatus(data.cliente.status || 'Ativo');
        }
      })
      .catch(err => console.error("Error fetching client:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCliente();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome,
          telefone,
          endereco,
          notas,
          rating,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        setCliente(data.cliente);
        setIsEditing(false);
      } else {
        alert(data.error || 'Erro ao salvar alterações.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao conectar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-500" />
        <span className="text-xs font-semibold">Carregando perfil do cliente...</span>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 text-slate-400 p-4">
        <p className="text-sm font-semibold mb-4">Cliente não encontrado.</p>
        <Button onClick={() => navigate('/clientes')}>Voltar para Lista</Button>
      </div>
    );
  }

  // Formatting date
  const sinceDate = cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Maio 2026';

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      {/* Header Profile */}
      <div className="bg-brand-blue-600 pt-12 pb-6 px-4 rounded-b-[2rem] text-white shadow-sm relative">
        <button 
          onClick={() => navigate('/clientes')}
          className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
            isEditing ? 'bg-white text-brand-blue-600' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <Edit2 size={18} />
        </button>

        <div className="flex flex-col items-center mt-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-brand-blue-600 font-display font-bold text-3xl shadow-md mb-3">
            {cliente.nome.charAt(0)}
          </div>
          {isEditing ? (
            <input 
              type="text"
              className="text-2xl font-display font-bold bg-white/10 text-center text-white border border-white/20 rounded-lg px-2 focus:outline-none focus:bg-white/20 w-11/12 max-w-sm mb-2"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          ) : (
            <h1 className="text-2xl font-display font-bold">{cliente.nome}</h1>
          )}
          <p className="text-brand-blue-100 text-sm mt-1 flex items-center gap-1">
            <Calendar size={14} /> Cliente desde {sinceDate}
          </p>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Button variant="secondary" className="bg-white text-brand-blue-600 hover:bg-surface-50 h-10 rounded-full px-6 shadow-sm" onClick={() => navigate(`/orcamento/novo/${cliente.id}`)}>
            <FileText size={16} className="mr-2" /> Novo Orçamento
          </Button>
          <Button 
            onClick={() => {
              const cleanPhone = cliente.telefone.replace(/\D/g, '');
              const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
              const text = encodeURIComponent(`Olá ${cliente.nome}! Tudo bem?`);
              window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
            }}
            className="bg-[#25D366] text-white hover:bg-[#20bd5a] h-10 rounded-full px-6 shadow-sm border-none"
          >
            <MessageCircle size={16} className="mr-2" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Info Card */}
        <Card className="mb-6 shadow-sm border-none">
          <CardContent className="p-0">
            {isEditing ? (
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    className="w-full h-11 px-3 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                  <input 
                    type="text" 
                    className="w-full h-11 px-3 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    className="w-full h-11 px-3 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">Avaliação Interna (Rating)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className="p-1" type="button">
                        <Star size={24} className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Anotações do Cliente</label>
                  <textarea 
                    className="w-full p-3 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 min-h-[80px] resize-none"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
                <Button className="w-full h-12 flex items-center justify-center gap-2 font-bold" onClick={handleUpdate} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  Salvar Alterações
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-surface-100">
                  <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Endereço</p>
                    <p className="font-medium text-surface-900">{cliente.endereco || 'Sem endereço cadastrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border-b border-surface-100">
                  <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Telefone</p>
                    <p className="font-medium text-surface-900">{cliente.telefone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border-b border-surface-100">
                  <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                    <Star size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Avaliação Interna</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className={i < (cliente.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                      ))}
                    </div>
                  </div>
                </div>
                {cliente.notas && (
                  <div className="p-4 bg-amber-50/50 rounded-b-xl border-t border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Anotações internas:</p>
                    <p className="text-sm text-slate-700 italic">"{cliente.notas}"</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-surface-200">
          <button 
            className={`pb-2 font-medium transition-colors relative ${activeTab === 'resumo' ? 'text-brand-blue-600' : 'text-slate-400'}`}
            onClick={() => setActiveTab('resumo')}
          >
            Resumo
            {activeTab === 'resumo' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue-600 rounded-t-full" />
            )}
          </button>
          <button 
            className={`pb-2 font-medium transition-colors relative ${activeTab === 'historico' ? 'text-brand-blue-600' : 'text-slate-400'}`}
            onClick={() => setActiveTab('historico')}
          >
            Histórico de Serviços
            {activeTab === 'historico' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'resumo' ? (
          <div className="grid grid-cols-2 gap-3 pb-8">
            <Card className="bg-brand-brown-50 border-none shadow-sm">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-brand-brown-100 text-brand-brown-600 flex items-center justify-center mb-2">
                  <FileText size={16} />
                </div>
                <h4 className="text-xl font-bold text-brand-brown-900">0</h4>
                <p className="text-sm font-medium text-brand-brown-600">Serviços feitos</p>
              </CardContent>
            </Card>
            <Card className="bg-brand-green-50 border-none shadow-sm">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-full bg-brand-green-100 text-brand-green-600 flex items-center justify-center mb-2">
                  <CheckCircle2 size={16} />
                </div>
                <h4 className="text-xl font-bold text-brand-green-900">R$ 0,00</h4>
                <p className="text-sm font-medium text-brand-green-600">Total pago</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-2 pb-8">
            <CheckCircle2 size={32} className="mx-auto text-slate-300" />
            <p className="text-sm">Nenhum serviço registrado para este cliente ainda.</p>
            <p className="text-xs">Crie um orçamento para agendar o primeiro serviço!</p>
          </div>
        )}
      </div>
    </div>
  );
}