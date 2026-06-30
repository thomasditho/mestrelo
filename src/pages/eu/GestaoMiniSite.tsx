import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Palette, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function GestaoMiniSite() {
  const navigate = useNavigate();
  const { profissional, updateProfissional } = useAuth();
  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('blue');
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerandoBio, setGerandoBio] = useState(false);
  const [erro, setErro] = useState('');

  const themes = [
    { id: 'blue', hex: 'bg-brand-blue-600', text: 'text-brand-blue-600' },
    { id: 'green', hex: 'bg-emerald-600', text: 'text-emerald-600' },
    { id: 'amber', hex: 'bg-amber-500', text: 'text-amber-500' },
    { id: 'slate', hex: 'bg-slate-800', text: 'text-slate-800' },
    { id: 'purple', hex: 'bg-purple-600', text: 'text-purple-600' },
  ];

  useEffect(() => {
    if (profissional) {
      setNome(profissional.name || '');
      setBio(profissional.bio || '');
      setSlug(profissional.slug || '');
      setColor((profissional as any).theme_color || 'blue');
    }
  }, [profissional?.id]);

  const handleGerarBio = async () => {
    if (!profissional?.id) return;
    setGerandoBio(true);
    try {
      const res = await fetch('/api/profissional/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profissionalId: profissional.id, specialty: profissional.specialty }),
      });
      const d = await res.json();
      if (d.bio) setBio(d.bio);
    } catch {} finally { setGerandoBio(false); }
  };

  const handleSave = async () => {
    if (!profissional?.id) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/profissional/mini-site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profissionalId: profissional.id, name: nome, bio, slug, theme_color: color }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      updateProfissional({ name: nome, bio, slug });
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
          Editar Mini Site
        </h1>
      </header>

      <div className="p-4 space-y-6 pb-24">
        
        {/* Preview Header */}
        <div className={`pt-8 pb-12 px-6 rounded-3xl text-white text-center relative overflow-hidden shadow-sm transition-colors ${themes.find(t => t.id === color)?.hex}`}>
          <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center text-surface-900 font-display font-bold text-3xl shadow-xl mx-auto mb-4 relative z-10">
            {(nome || profissional?.name || 'P').charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-display font-bold relative z-10">{nome || 'Seu Nome'}</h2>
          <p className="text-white/80 text-xs mt-2 relative z-10 line-clamp-2">{bio || 'Sua bio aqui...'}</p>
        </div>

        {erro && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{erro}</div>}

        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">Nome de Exibição</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full h-12 px-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900">Link do Mini Site (slug)</label>
              <div className="flex items-center border border-surface-200 rounded-xl overflow-hidden">
                <span className="px-3 py-3 text-sm text-slate-400 bg-surface-50 border-r border-surface-200">mestrelo.com/</span>
                <input
                  type="text"
                  placeholder="seu-nome"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 h-12 px-3 text-sm focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-surface-900">Sua Biografia</label>
                <button 
                  onClick={handleGerarBio}
                  disabled={gerandoBio}
                  className="text-xs font-bold text-brand-blue-600 bg-brand-blue-50 hover:bg-brand-blue-100 transition-colors px-2 py-1 rounded"
                >
                  {gerandoBio ? 'Gerando...' : 'Gerar Bio com IA'}
                </button>
              </div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Conte sobre sua experiência, especialidades, etc."
                className="w-full p-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                <Palette size={16} className="text-slate-400" /> Tema de Cor
              </label>
              <div className="flex gap-3 pt-1">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setColor(t.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${color === t.id ? 'border-surface-900 scale-110' : 'border-transparent hover:scale-105'}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${t.hex}`} />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleSave}
          disabled={salvando || salvo}
          className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          {salvo ? '✓ Configurações Salvas!' : 'Salvar Mini Site'}
        </Button>
      </div>
    </div>
  );
}