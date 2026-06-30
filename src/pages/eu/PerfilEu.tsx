import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, Star, ShieldCheck, Settings, LogOut, CheckCircle2, QrCode, Smartphone, MapPin, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

export default function PerfilEu() {
  const navigate = useNavigate();
  const { profissional, logout } = useAuth();
  const [copiado, setCopiado] = useState(false);

  const miniSiteUrl = profissional?.slug ? `mestrelo.com/${profissional.slug}` : '';

  const handleCopyLink = () => {
    if (miniSiteUrl) navigator.clipboard.writeText(`https://${miniSiteUrl}`).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (profissional?.name || 'P').charAt(0).toUpperCase();

  return (
    <div className="bg-surface-50 min-h-screen pb-24 animate-in fade-in duration-500">
      <header className="bg-white border-b border-surface-200 px-4 pt-12 pb-6">
        <h1 className="font-display font-bold text-2xl text-surface-900 mb-6">Meu Perfil</h1>

        <div className="flex items-center gap-4">
          {profissional?.photoUrl ? (
            <img src={profissional.photoUrl} alt={profissional.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="w-20 h-20 bg-brand-blue-600 rounded-2xl flex items-center justify-center text-white font-display font-bold text-3xl shadow-sm">
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-display font-bold text-xl text-surface-900">{profissional?.name || '—'}</h2>
            <p className="text-sm text-slate-500 mb-1">{profissional?.specialty || 'Profissional Autônomo'}</p>
            {profissional?.city && (
              <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={12} /> {profissional.city}</p>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        
        {/* Menu Principal de Gestão */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-none shadow-sm hover:bg-surface-50 active:scale-95 transition-all cursor-pointer" onClick={() => navigate('/eu/mei')}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-sm leading-tight">Central do MEI</h3>
                <p className="text-[10px] text-slate-500 mt-1">Guia DAS e Histórico</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm hover:bg-surface-50 active:scale-95 transition-all cursor-pointer" onClick={() => navigate('/eu/portfolio')}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
              <div className="w-12 h-12 bg-brand-blue-50 text-brand-blue-600 rounded-full flex items-center justify-center relative">
                <Star size={24} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">2</div>
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-sm leading-tight">Portfólio & Avaliações</h3>
                <p className="text-[10px] text-slate-500 mt-1">Fotos e feedbacks</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cartão de Visitas Virtual */}
        <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-surface-900 to-surface-800 text-white mb-6">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-display font-bold text-lg">Seu Mini Site</h3>
                <p className="text-surface-300 text-sm">{miniSiteUrl || 'Configure seu link'}</p>
              </div>
              <button
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl backdrop-blur-sm transition-colors"
                onClick={() => navigate('/eu/minisite')}
              >
                <Settings size={20} className="text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={handleCopyLink}
                disabled={!miniSiteUrl}
              >
                {copiado ? <CheckCircle2 size={16} className="mr-2 text-brand-green-400" /> : <Copy size={16} className="mr-2" />}
                {copiado ? 'Copiado!' : 'Copiar Link'}
              </Button>
              <Button className="bg-white text-surface-900 hover:bg-surface-100" onClick={() => navigate(`/minisite/${profissional?.slug || ''}`)} disabled={!profissional?.slug}>
                <Share2 size={16} className="mr-2" /> Ver Site
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato / PIX */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-display font-bold text-surface-900">Dados Comerciais</h3>
            <button className="text-sm font-medium text-brand-blue-600" onClick={() => navigate('/eu/dados-comerciais')}>Editar</button>
          </div>
          
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-4 border-b border-surface-100 cursor-pointer hover:bg-surface-50" onClick={() => navigate('/eu/dados-comerciais')}>
                <div className="w-10 h-10 bg-brand-blue-50 text-brand-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <Smartphone size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">WhatsApp Profissional</p>
                  <p className="font-medium text-surface-900">{profissional?.phone || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border-b border-surface-100 cursor-pointer hover:bg-surface-50" onClick={() => navigate('/eu/dados-comerciais')}>
                <div className="w-10 h-10 bg-brand-green-50 text-brand-green-600 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">Chave PIX Principal</p>
                  <p className="font-medium text-surface-900">{(profissional as any)?.pix_key || 'Não configurado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-50" onClick={() => navigate('/eu/dados-comerciais')}>
                <div className="w-10 h-10 bg-surface-100 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">Cidade / Região</p>
                  <p className="font-medium text-surface-900">{profissional?.city || 'Não configurada'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ferramentas */}
        <div className="space-y-3 pt-2">
          <h3 className="font-display font-bold text-surface-900 px-1">Ferramentas e Vendas</h3>
          <Card className="border-none shadow-sm">
            <CardContent className="p-2 grid grid-cols-2 gap-2">
              <Button variant="ghost" className="w-full justify-start h-12 text-surface-700 bg-surface-50" onClick={() => navigate('/eu/mensagens')}>
                <Smartphone size={18} className="mr-3 text-brand-blue-500" /> Mensagens Automáticas
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 text-surface-700 bg-surface-50" onClick={() => navigate('/eu/tabela-precos')}>
                <FileText size={18} className="mr-3 text-brand-blue-500" /> Tabela de Preços
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 text-surface-700 bg-surface-50" onClick={() => navigate('/eu/calculadora')}>
                <QrCode size={18} className="mr-3 text-brand-blue-500" /> Calculadora de Preço
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Conta e Suporte */}
        <div className="space-y-3 pt-2">
          <h3 className="font-display font-bold text-surface-900 px-1">Conta e Suporte</h3>
          <Card className="border-none shadow-sm">
            <CardContent className="p-2">
              <Button variant="ghost" className="w-full justify-start h-12 text-surface-700" onClick={() => navigate('/eu/plano')}>
                <Star size={18} className="mr-3 text-amber-500" /> Meu Plano (Assinatura)
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 text-surface-700" onClick={() => navigate('/eu/indicar')}>
                <Share2 size={18} className="mr-3 text-brand-green-500" /> Indicar Amigo (Ganhe Desconto)
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut size={18} className="mr-3" /> Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}