import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle2, DollarSign, Star, Calendar } from 'lucide-react';

export default function Notificacoes() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-surface-900">
          Notificações
        </h1>
      </header>

      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-brand-blue-50 rounded-full flex items-center justify-center mb-6">
          <Bell size={36} className="text-brand-blue-300" />
        </div>
        <h2 className="font-display font-bold text-lg text-surface-900 mb-2">Tudo em dia!</h2>
        <p className="text-sm text-slate-500 max-w-[260px] leading-relaxed">
          Você receberá notificações sobre orçamentos aprovados, cobranças vencidas e avaliações de clientes aqui.
        </p>
        <div className="mt-8 space-y-3 w-full max-w-xs text-left">
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-surface-100 opacity-40">
            <div className="w-8 h-8 bg-brand-green-50 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} className="text-brand-green-500" />
            </div>
            <p className="text-xs text-slate-600">Orçamento aprovado por cliente</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-surface-100 opacity-40">
            <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
              <DollarSign size={16} className="text-amber-500" />
            </div>
            <p className="text-xs text-slate-600">Pagamento em atraso</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-surface-100 opacity-40">
            <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center shrink-0">
              <Star size={16} className="text-purple-500" />
            </div>
            <p className="text-xs text-slate-600">Nova avaliação recebida</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-surface-100 opacity-40">
            <div className="w-8 h-8 bg-brand-blue-50 rounded-full flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-brand-blue-500" />
            </div>
            <p className="text-xs text-slate-600">Serviço agendado com sucesso</p>
          </div>
        </div>
      </div>
    </div>
  );
}