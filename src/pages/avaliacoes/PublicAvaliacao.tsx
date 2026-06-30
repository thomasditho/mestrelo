import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function PublicAvaliacao() {
  const { token } = useParams();
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [depoimento, setDepoimento] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/avaliacoes/token/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.avaliacao) setNotFound(true);
        else setAvaliacao({
          ...d.avaliacao,
          profissionalNome: d.profissional?.name || d.profissional?.nome || 'Profissional',
          servicoTitulo: d.servico?.titulo || '',
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleEnviar = async () => {
    if (!token || rating === 0) return;
    setSalvando(true);
    try {
      await fetch(`/api/avaliacoes/token/${token}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota: rating, depoimento }),
      });
      setEnviado(true);
    } finally { setSalvando(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Link inválido</h1>
      <p className="text-slate-500 text-sm">Este link de avaliação não é válido ou já foi utilizado.</p>
    </div>
  );

  if (enviado) {
    return (
      <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center font-sans">
        <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-brand-green-600" />
        </div>
        <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Obrigado!</h1>
        <p className="text-brand-green-700 font-medium mb-8">
          Sua avaliação ajuda {avaliacao?.profissionalNome || 'o profissional'} a continuar prestando um excelente serviço.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 pb-safe font-sans flex flex-col">
      <div className="bg-brand-blue-600 pt-8 pb-12 px-6 rounded-b-[2rem] text-white shadow-sm text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-blue-600 font-display font-bold text-2xl shadow-md mx-auto mb-4">
          {(avaliacao?.profissionalNome || 'P').charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-display font-bold">Avalie o Serviço</h1>
        <p className="text-brand-blue-100 text-sm mt-1">
          {avaliacao?.profissionalNome} {avaliacao?.servicoTitulo ? `· ${avaliacao.servicoTitulo}` : ''}
        </p>
      </div>

      <div className="px-4 -mt-6 flex-1 flex flex-col">
        <Card className="shadow-lg border-none overflow-hidden mb-6">
          <CardContent className="p-6 space-y-6 text-center">
            <div>
              <p className="text-slate-600 font-medium text-sm mb-4">Sua nota para o serviço:</p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform active:scale-125 focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      size={42}
                      className={`${
                        star <= (hover || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      } transition-colors duration-150`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-left pt-2">
              <label className="text-sm font-bold text-surface-900">
                Escreva seu depoimento (opcional):
              </label>
              <textarea
                rows={4}
                placeholder="Conte o que achou da qualidade do serviço, pontualidade e atendimento..."
                className="w-full p-4 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white placeholder:text-slate-400"
                value={depoimento}
                onChange={(e) => setDepoimento(e.target.value)}
              />
            </div>

            <Button
              onClick={handleEnviar}
              disabled={salvando || rating === 0}
              className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base"
            >
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {salvando ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}