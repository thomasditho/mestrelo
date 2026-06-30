import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle2, Users, Smartphone, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';

interface Contato {
  id: string;
  nome: string;
  telefone: string;
}

export default function ImportarContatos() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiSupported, setApiSupported] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      // Verificar suporte à Contacts API (disponível apenas em Chrome Android)
      if (!('contacts' in navigator) || !('ContactsManager' in window)) {
        setApiSupported(false);
        setLoading(false);
        return;
      }
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const results = await (navigator as any).contacts.select(props, opts);
        const mapped: Contato[] = results.flatMap((c: any, i: number) =>
          (c.tel || ['']).map((tel: string) => ({
            id: `c${i}_${tel}`,
            nome: (c.name || [''])[0] || 'Sem nome',
            telefone: tel || '',
          }))
        ).filter((c: Contato) => c.telefone);
        setContatos(mapped);
      } catch (e) {
        // Usuário cancelou ou erro
        setContatos([]);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  const filteredContatos = contatos.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone.includes(searchTerm)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (!profissional?.id) {
      alert('Profissional não identificado. Faça login novamente.');
      return;
    }
    setIsImporting(true);
    const selectedContacts = contatos.filter(c => selectedIds.includes(c.id));
    try {
      for (const contact of selectedContacts) {
        await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            profissionalId: profissional.id,
            nome: contact.nome,
            telefone: contact.telefone,
            endereco: '',
            notas: 'Importado da agenda de contatos',
          }),
        });
      }
      setImported(true);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar os contatos.');
    } finally {
      setIsImporting(false);
    }
  };

  if (imported) {
    return (
      <div className="min-h-screen bg-brand-green-50 flex flex-col justify-center p-6 animate-in fade-in zoom-in-95 duration-500 text-center font-sans">
        <div className="w-24 h-24 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 size={48} className="text-brand-green-600" />
        </div>
        <h1 className="text-3xl font-display font-bold text-brand-green-900 mb-2">Contatos Importados!</h1>
        <p className="text-brand-green-700 font-medium mb-8">
          {selectedIds.length} contato{selectedIds.length !== 1 ? 's' : ''} adicionado{selectedIds.length !== 1 ? 's' : ''} à sua lista de clientes.
        </p>
        <Button className="w-full" size="lg" onClick={() => navigate('/clientes')}>
          Ir para Clientes
        </Button>
      </div>
    );
  }

  if (!apiSupported) {
    return (
      <div className="bg-surface-50 min-h-screen pb-safe">
        <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 shadow-sm flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Importar da Agenda</h1>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <Smartphone size={36} className="text-amber-400" />
          </div>
          <h2 className="font-display font-bold text-lg text-surface-900 mb-2">Disponível no celular</h2>
          <p className="text-sm text-slate-500 max-w-[260px] leading-relaxed mb-8">
            A importação da agenda funciona no Chrome para Android. No computador ou Safari, adicione os clientes manualmente.
          </p>
          <Button onClick={() => navigate('/clientes/novo')} className="w-full max-w-xs">
            <UserPlus size={18} className="mr-2" /> Adicionar Manualmente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-50 min-h-screen pb-safe">
      <header className="bg-white border-b border-surface-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-bold text-lg text-surface-900">Importar da Agenda</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar na sua agenda..."
            className="w-full h-12 pl-10 pr-4 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white transition-all text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Smartphone size={48} className="mb-4 animate-pulse" />
            <p className="font-medium">Acessando contatos do celular...</p>
          </div>
        ) : contatos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
              <Users size={28} className="text-slate-400" />
            </div>
            <p className="font-bold text-surface-900 mb-1">Nenhum contato carregado</p>
            <p className="text-sm text-slate-500 mb-6">Selecione a agenda ao ser solicitado, ou adicione manualmente.</p>
            <Button variant="outline" onClick={() => navigate('/clientes/novo')}>
              <UserPlus size={16} className="mr-2" /> Adicionar Manualmente
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {filteredContatos.length} contatos
              </span>
              <button
                className="text-sm text-brand-blue-600 font-bold"
                onClick={() => {
                  if (selectedIds.length === filteredContatos.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(filteredContatos.map(c => c.id));
                  }
                }}
              >
                {selectedIds.length === filteredContatos.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="space-y-2">
              {filteredContatos.map(c => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <Card 
                    key={c.id} 
                    className={`border-none shadow-sm cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-brand-blue-500 bg-brand-blue-50/30' : 'bg-white'
                    }`}
                    onClick={() => toggleSelect(c.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-surface-900">{c.nome}</h4>
                        <p className="text-xs text-slate-500 mt-1">{c.telefone}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-brand-blue-600 bg-brand-blue-600 text-white' : 'border-surface-300 bg-white'
                      }`}>
                        {isSelected && <span className="text-xs font-bold">✓</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-surface-200 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <Button 
            className="w-full h-14 shadow-md text-base font-bold flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white" 
            disabled={isImporting}
            onClick={handleImport}
          >
            {isImporting ? 'Importando...' : `Importar ${selectedIds.length} Contato${selectedIds.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}