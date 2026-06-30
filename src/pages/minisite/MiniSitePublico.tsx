import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Star, MessageCircle, MapPin, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function MiniSitePublico() {
  const { slug } = useParams();
  const [profissional, setProfissional] = useState<any>(null);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isOpenLeadModal, setIsOpenLeadModal] = useState(false);
  const [leadNome, setLeadNome] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadDescricao, setLeadDescricao] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/profissional/mini-site/${slug}`)
      .then(r => r.json())
      .then(async d => {
        if (!d.success || !d.profissional) { setNotFound(true); return; }
        const prof = d.profissional;
        setProfissional(prof);
        // Buscar avaliações públicas
        if (prof.id) {
          try {
            const ar = await fetch(`/api/avaliacoes?profissionalId=${prof.id}`);
            const ad = await ar.json();
            if (ad.success && Array.isArray(ad.avaliacoes)) {
              setAvaliacoes(ad.avaliacoes.filter((a: any) => a.nota && a.respondida));
            }
          } catch {}
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadNome || !leadWhatsapp || !leadDescricao) return;
    setLeadSubmitted(true);
  };

  const handleSendToWhatsapp = () => {
    const phone = profissional?.phone?.replace(/\D/g, '') || '';
    const phoneLink = phone.startsWith('55') ? phone : `55${phone}`;
    const message = `Olá ${profissional?.name || ''}! 👋\n\nMe chamo *${leadNome}* e preenchi uma solicitação de orçamento no seu Mini Site Mestrelo:\n\n*Serviço:* ${leadDescricao}\n*Meu Contato:* ${leadWhatsapp}\n\nFico no aguardo do orçamento!`;
    window.open(`https://wa.me/${phoneLink}?text=${encodeURIComponent(message)}`, '_blank');
    setIsOpenLeadModal(false);
    setLeadSubmitted(false);
    setLeadNome(''); setLeadWhatsapp(''); setLeadDescricao('');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Profissional não encontrado</h1>
      <p className="text-slate-500 text-sm">O link que você acessou não corresponde a nenhum perfil ativo.</p>
    </div>
  );

  const mediaAvg = avaliacoes.length
    ? (avaliacoes.reduce((s: number, a: any) => s + (a.nota || 0), 0) / avaliacoes.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-surface-50 font-sans pb-safe">
      <div className="bg-surface-900 pt-16 pb-20 px-6 rounded-b-[3rem] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full bg-brand-blue-500 blur-3xl"></div>
        </div>
        {profissional?.photoUrl ? (
          <img src={profissional.photoUrl} alt={profissional.name} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl mx-auto mb-6 relative z-10" />
        ) : (
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-surface-900 font-display font-bold text-4xl shadow-xl mx-auto mb-6 relative z-10">
            {(profissional?.name || 'P').charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl font-display font-bold relative z-10">{profissional?.name}</h1>
        {profissional?.city && (
          <p className="text-surface-300 text-sm mt-2 relative z-10 flex items-center justify-center gap-1">
            <MapPin size={14} /> {profissional.city}
          </p>
        )}
        {mediaAvg && (
          <div className="flex justify-center gap-1 mt-4 relative z-10 items-center">
            {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
            <span className="ml-2 font-medium">{mediaAvg} ({avaliacoes.length} avaliações)</span>
          </div>
        )}
        {profissional?.bio && (
          <p className="text-surface-300 text-sm mt-4 relative z-10 max-w-xs mx-auto">{profissional.bio}</p>
        )}
      </div>

      <div className="px-4 -mt-8 relative z-20">
        <Button
          size="lg"
          onClick={() => setIsOpenLeadModal(true)}
          className="w-full shadow-xl h-14 text-base bg-[#25D366] hover:bg-[#20bd5a] text-white border-none rounded-2xl mb-8"
        >
          <MessageCircle size={20} className="mr-2" /> Solicitar Orçamento Grátis
        </Button>

        {profissional?.specialty && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-xl text-surface-900 mb-4 px-2">Especialidade</h2>
            <div className="flex flex-wrap gap-2 px-2">
              {profissional.specialty.split(',').map((esp: string, i: number) => (
                <span key={i} className="bg-white border border-surface-200 text-surface-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                  {esp.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {profissional?.portfolio?.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-xl text-surface-900 mb-4 px-2">Portfólio</h2>
            <div className="grid grid-cols-2 gap-3">
              {profissional.portfolio.map((foto: any, i: number) => (
                <div key={i} className="aspect-square bg-slate-200 rounded-2xl overflow-hidden relative shadow-sm">
                  <img src={foto.url} alt={foto.desc || ''} className="w-full h-full object-cover" />
                  {foto.desc && <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg font-medium">{foto.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {avaliacoes.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-xl text-surface-900 mb-4 px-2">Avaliações</h2>
            <div className="space-y-4">
              {avaliacoes.map((av: any, i: number) => (
                <Card key={i} className="border-none shadow-sm rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-surface-900">{av.clienteNome || av.nome || '—'}</h4>
                        <p className="text-xs text-slate-500">{av.criadoEm ? new Date(av.criadoEm).toLocaleDateString('pt-BR') : ''}</p>
                      </div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={12} className={j < (av.nota || 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{av.comentario || av.texto || ''}</p>
                    <div className="mt-3 inline-flex items-center gap-1 bg-brand-green-50 text-brand-green-700 text-xs font-medium px-2 py-1 rounded-md">
                      <CheckCircle2 size={12} /> Serviço Verificado
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lead Modal */}
      {isOpenLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden pb-safe animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-5 border-b border-surface-100">
              <div>
                <h3 className="font-display font-bold text-lg text-surface-900">Solicitar Orçamento</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sem compromisso, direto com {profissional?.name}</p>
              </div>
              <button onClick={() => { setIsOpenLeadModal(false); setLeadSubmitted(false); }} className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-slate-500 hover:bg-surface-200">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {!leadSubmitted ? (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seu Nome</label>
                    <input type="text" required placeholder="Ex: Maria Souza" className="w-full h-11 px-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-surface-50" value={leadNome} onChange={e => setLeadNome(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seu WhatsApp</label>
                    <input type="tel" required placeholder="Ex: (11) 99999-9999" className="w-full h-11 px-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-surface-50" value={leadWhatsapp} onChange={e => setLeadWhatsapp(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">O que você precisa?</label>
                    <textarea required rows={3} placeholder="Descreva o serviço. Ex: Instalação de 3 tomadas novas no quarto." className="w-full p-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-surface-50 resize-none" value={leadDescricao} onChange={e => setLeadDescricao(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-brand-blue-600 hover:bg-brand-blue-700 font-bold text-white border-none shadow-md">
                    Prosseguir para o WhatsApp
                  </Button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto text-brand-green-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-surface-900">Pedido pronto para envio!</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">Clique no botão abaixo para abrir o WhatsApp e enviar as informações diretamente para {profissional?.name}.</p>
                  </div>
                  <Button onClick={handleSendToWhatsapp} className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] font-bold text-white border-none shadow-md">
                    <MessageCircle size={18} className="mr-2" /> Abrir no WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}