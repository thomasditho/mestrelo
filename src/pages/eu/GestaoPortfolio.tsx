import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function GestaoPortfolio() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [tab, setTab] = useState<'fotos' | 'avaliacoes'>('fotos');
  const [fotos, setFotos] = useState<any[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profissional?.id) return;
    setLoading(true);
    Promise.all([
      // Buscar fotos dos serviços concluídos como portfólio
      fetch(`/api/servicos?profissionalId=${profissional.id}`, { credentials: 'include' }).then(r => r.json()),
      fetch(`/api/avaliacoes?profissionalId=${profissional.id}`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([srvData, avs]) => {
      // Extrair fotos_depois de todos os serviços como portfólio
      const todasFotos: any[] = [];
      (srvData.servicos || []).forEach((s: any) => {
        try {
          const depois = JSON.parse(s.fotos_depois || '[]');
          depois.forEach((url: string) => todasFotos.push({ url, desc: s.titulo || 'Serviço' }));
        } catch {}
      });
      setFotos(todasFotos);
      setAvaliacoes(avs?.avaliacoes || []);
    }).finally(() => setLoading(false));
  }, [profissional?.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profissional?.id) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('foto', file);
    fd.append('profissionalId', profesional.id);
    fd.append('tipo', 'portfolio');
    try {
      const res = await fetch('/api/upload/foto', { method: 'POST', credentials: 'include', body: fd });
      const d = await res.json();
      if (d.url) setFotos(prev => [...prev, { url: d.url, desc: file.name }]);
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const mediaAvg = avaliacoes.length
    ? (avaliacoes.reduce((s: number, a: any) => s + (a.nota || 0), 0) / avaliacoes.length).toFixed(1)
    : '—';

  return (
    <div className="bg-surface-50 min-h-screen pb-safe flex flex-col">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">
            Portfólio & Avaliações
          </h1>
        </div>
        
        <div className="flex border-t border-surface-100">
          <button
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'fotos' ? 'border-brand-blue-600 text-brand-blue-600' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab('fotos')}
          >
            Fotos ({fotos.length})
          </button>
          <button
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'avaliacoes' ? 'border-brand-blue-600 text-brand-blue-600' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab('avaliacoes')}
          >
            Avaliações ({avaliacoes.length})
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-blue-600" /></div>}

        {!loading && tab === 'fotos' && (
          <div className="space-y-4 animate-in fade-in">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <Button
              className="w-full h-12 bg-surface-200 text-surface-700 hover:bg-surface-300 border-none"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Plus size={20} className="mr-2" />}
              {uploading ? 'Enviando...' : 'Adicionar Foto ao Portfólio'}
            </Button>

            {fotos.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <p className="text-sm">Nenhuma foto ainda. Adicione fotos dos seus trabalhos!</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {fotos.map((foto, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-200">
                  <img src={foto.url} alt={foto.desc || ''} className="w-full h-full object-cover" />
                  {foto.desc && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg font-medium truncate">
                      {foto.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === 'avaliacoes' && (
          <div className="space-y-3 animate-in fade-in">
            <Card className="border-none shadow-sm bg-brand-blue-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-blue-600 uppercase tracking-widest block">Média de Notas</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-display font-black text-surface-900">{mediaAvg}</span>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className={i < Math.round(parseFloat(mediaAvg) || 0) ? 'fill-current' : 'opacity-30'} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-bold text-right">
                  {avaliacoes.length} avaliaç{avaliacoes.length === 1 ? 'ão' : 'ões'}
                </div>
              </CardContent>
            </Card>

            {avaliacoes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-surface-200">
                <Star size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Nenhuma avaliação recebida ainda.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">As avaliações aparecem aqui quando os clientes dão feedback.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map((item, i) => (
                  <Card key={item.id || i} className="border-none shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-surface-900">{item.cliente_nome || 'Cliente Anônimo'}</h4>
                          <span className="text-[10px] text-slate-400 block">{item.criado_em ? new Date(item.criado_em).toLocaleDateString('pt-BR') : '—'}</span>
                        </div>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} size={12} className={idx < (item.nota || 0) ? 'fill-current' : 'opacity-30'} />
                          ))}
                        </div>
                      </div>
                      {item.comentario && (
                        <p className="text-xs text-slate-600 leading-relaxed italic bg-surface-50 p-3 rounded-xl border border-surface-100">
                          "{item.comentario}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
