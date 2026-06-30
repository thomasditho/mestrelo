import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

type Tab = 'antes' | 'durante' | 'depois';

interface Foto {
  id: string;
  type: Tab;
  url: string;
}

export default function GaleriaServico() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('antes');
  const [uploading, setUploading] = useState(false);
  const [loadingFotos, setLoadingFotos] = useState(true);

  // Buscar fotos existentes do serviço
  useEffect(() => {
    if (!id) return;
    fetch(`/api/servicos/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.servico) {
          const sv = d.servico;
          const antes: Foto[] = parseUrls(sv.fotos_antes, 'antes');
          const durante: Foto[] = parseUrls(sv.fotos_durante, 'durante');
          const depois: Foto[] = parseUrls(sv.fotos_depois, 'depois');
          setFotos([...antes, ...durante, ...depois]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingFotos(false));
  }, [id]);

  const parseUrls = (raw: string | null | undefined, type: Tab): Foto[] => {
    try {
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr)
        ? arr.map((url: string, i: number) => ({ id: `${type}_${i}_${url.slice(-8)}`, type, url }))
        : [];
    } catch { return []; }
  };

  const filteredFotos = fotos.filter(f => f.type === activeTab);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);
      formData.append('servicoId', id);
      formData.append('tipo', activeTab);

      const res = await fetch('/api/upload/foto', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const newFoto: Foto = {
          id: `${activeTab}_${Date.now()}`,
          type: activeTab,
          url: data.url,
        };
        setFotos(prev => [...prev, newFoto]);
      }
    } catch (e) {
      console.error('Erro no upload:', e);
      alert('Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setUploading(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    setFotos(prev => prev.filter(f => f.id !== photoId));
    // Nota: a remoção do arquivo no servidor pode ser implementada via DELETE /api/upload/foto/:id
  };

  return (
    <div className="bg-surface-50 min-h-screen pb-safe flex flex-col">
      {/* Input file oculto — captura câmera no celular */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <header className="bg-white border-b border-surface-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-display font-bold text-lg text-surface-900">Fotos do Serviço</h1>
          </div>
          <button
            className="text-brand-blue-600 p-1 disabled:opacity-50"
            onClick={handleCameraClick}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
          </button>
        </div>

        <div className="flex border-t border-surface-100">
          {(['antes', 'durante', 'depois'] as Tab[]).map(tab => (
            <button
              key={tab}
              className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === tab ? 'border-brand-blue-600 text-brand-blue-600' : 'border-transparent text-slate-500'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-4">
        {loadingFotos ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-brand-blue-500 mb-2" />
            <p className="text-sm font-medium">Buscando fotos da nuvem...</p>
          </div>
        ) : filteredFotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 px-4">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <ImageIcon size={32} />
            </div>
            <p className="font-bold text-sm text-surface-900">Sem fotos nesta etapa</p>
            <p className="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">
              Tire fotos do local {activeTab === 'antes' ? 'antes de começar' : activeTab === 'durante' ? 'durante a execução' : 'depois de pronto'} para registrar no protocolo.
            </p>
            <Button onClick={handleCameraClick} variant="secondary" className="mt-6 font-semibold" disabled={uploading}>
              <Plus size={16} className="mr-1" /> Adicionar Foto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-24">
            {filteredFotos.map((foto) => (
              <div key={foto.id} className="relative rounded-xl overflow-hidden aspect-square bg-slate-100 border shadow-sm group">
                <img src={foto.url} alt="Foto do serviço" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(foto.id)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/60 hover:bg-red-600/90 text-white rounded-lg backdrop-blur-sm transition-colors shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={handleCameraClick}
          disabled={uploading}
          className="flex-1 h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera size={18} />}
          {uploading ? 'Enviando...' : 'Tirar Foto Agora'}
        </Button>
      </div>
    </div>
  );
}