import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, ShieldCheck, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function RelatorioPublico() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/relatorio/servico/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) setNotFound(true);
        else setData(d);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <Loader2 size={32} className="animate-spin text-brand-blue-600" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-surface-900 mb-2">Relatório não encontrado</h1>
      <p className="text-slate-500 text-sm">Este link pode ter expirado ou o serviço foi removido.</p>
    </div>
  );

  const { servico, profissional, cliente } = data;
  const materiais: any[] = (() => {
    try { return JSON.parse(servico.materiais || '[]'); } catch { return []; }
  })();
  const fotosAntes: string[] = (() => {
    try { return JSON.parse(servico.fotos_antes || '[]'); } catch { return []; }
  })();
  const fotosDepois: string[] = (() => {
    try { return JSON.parse(servico.fotos_depois || '[]'); } catch { return []; }
  })();
  const todasFotos = [
    ...fotosAntes.map(url => ({ url, label: 'Antes', tag: 'bg-slate-600' })),
    ...fotosDepois.map(url => ({ url, label: 'Depois', tag: 'bg-brand-green-500' })),
  ];
  const nomeProf = profissional?.name || 'Profissional';
  const inicial = nomeProf.charAt(0).toUpperCase();
  const dataConclusao = servico.updated_at || servico.created_at;
  const dataFormatada = dataConclusao
    ? new Date(dataConclusao).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const garantiaDias = servico.garantia_dias || 0;
  let dataGarantia = '';
  if (garantiaDias && dataConclusao) {
    const d = new Date(dataConclusao);
    d.setDate(d.getDate() + garantiaDias);
    dataGarantia = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-surface-100 pb-safe font-sans">
      <div className="bg-brand-blue-600 pt-8 pb-12 px-6 rounded-b-[2rem] text-white shadow-sm text-center">
        {profissional?.photoUrl ? (
          <img
            src={profissional.photoUrl}
            alt={nomeProf}
            className="w-16 h-16 rounded-2xl object-cover shadow-md mx-auto mb-4"
          />
        ) : (
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-blue-600 font-display font-bold text-2xl shadow-md mx-auto mb-4">
            {inicial}
          </div>
        )}
        <h1 className="text-xl font-display font-bold">{nomeProf}</h1>
        {profissional?.specialty && <p className="text-brand-blue-200 text-xs mt-0.5">{profissional.specialty}</p>}
        <p className="text-brand-blue-100 text-sm mt-1">Relatório de Serviço Concluído</p>
      </div>

      <div className="px-4 -mt-6">
        <Card className="shadow-lg border-none overflow-hidden mb-6">
          <div className="w-full h-1 bg-brand-green-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-brand-green-600 mb-6 bg-brand-green-50 p-2 rounded-lg justify-center border border-brand-green-100">
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">Serviço finalizado com sucesso</span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-surface-900 mb-1">Serviço Executado:</h3>
                <p className="text-sm text-slate-600">{servico.titulo || '—'}</p>
              </div>
              {servico.descricao && (
                <div>
                  <h3 className="text-sm font-bold text-surface-900 mb-1">Descrição:</h3>
                  <p className="text-sm text-slate-600">{servico.descricao}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-surface-900 mb-1">Cliente:</h3>
                <p className="text-sm text-slate-600">{cliente?.nome || '—'}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-surface-900 mb-1">Data de Conclusão:</h3>
                <p className="text-sm text-slate-600">{dataFormatada}</p>
              </div>

              {garantiaDias > 0 && (
                <div className="bg-brand-blue-50/50 border border-brand-blue-100 rounded-xl p-4 flex gap-3 mt-4">
                  <ShieldCheck className="text-brand-blue-600 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-brand-blue-900 text-sm">Garantia Ativa</h4>
                    <p className="text-xs text-brand-blue-700 mt-1">
                      Este serviço possui garantia de {garantiaDias} dias, válida até {dataGarantia}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {materiais.length > 0 && (
              <div className="mb-6 border-t pt-4">
                <h3 className="text-sm font-bold text-surface-900 mb-2">Materiais Utilizados:</h3>
                <div className="space-y-1.5">
                  {materiais.map((mat: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm bg-surface-50 border p-2.5 rounded-lg">
                      <span className="text-slate-600 font-medium">{mat.descricao}</span>
                      <span className="font-semibold text-surface-900">{mat.qtd || 1}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todasFotos.length > 0 && (
              <div className="mb-6 border-t pt-4">
                <h3 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-1.5">
                  <Camera size={18} className="text-slate-400" /> Registro Fotográfico:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {todasFotos.map((foto, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border">
                      <img src={foto.url} alt={`Foto ${foto.label}`} className="w-full h-full object-cover" />
                      <span className={`absolute bottom-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-md ${foto.tag}`}>
                        {foto.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={() => alert('Download do Relatório PDF iniciado!')}
              className="w-full h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-base mt-4"
            >
              <Download size={18} /> Baixar Relatório PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    