import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, User, Users, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { useAuth } from '../../hooks/useAuth';

export default function ClientesList() {
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNovoClienteOpen, setIsNovoClienteOpen] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const profissionalId = profissional?.id || '';

  const loadClientes = (profId: string) => {
    if (!profId) return;
    setLoading(true);
    fetch(`/api/clientes?profissionalId=${profId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setClientes(data.clientes); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (profissional?.id) loadClientes(profissional.id);
    else if (profissional !== undefined) setLoading(false);
  }, [profissional?.id]);

  // Quick helper to seed demo clients so the user has immediate data
  const handleSeedClients = async () => {
    if (!profissionalId) return;
    setLoading(true);
    const mockToSeed = [
      { nome: 'Dona Maria', endereco: 'Rua das Flores, 123', telefone: '(11) 99999-1111', notas: 'Prefere receber visitas após as 14h' },
      { nome: 'Carlos Silva', endereco: 'Av. Paulista, 1000 - Apto 42', telefone: '(11) 98888-2222', notas: 'Infiltração no teto do banheiro' },
      { nome: 'Padaria do Zé', endereco: 'Rua da Consolação, 500', telefone: '(11) 97777-3333', notas: 'Reforma do balcão de frios' }
    ];

    try {
      for (const item of mockToSeed) {
        await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profissionalId,
            nome: item.nome,
            telefone: item.telefone,
            endereco: item.endereco,
            notas: item.notas
          })
        });
      }
      loadClientes(profissionalId);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.endereco || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-surface-900">Clientes</h1>
        <Button size="sm" onClick={() => setIsNovoClienteOpen(true)}>
          <Plus size={16} className="mr-1" /> Novo
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou endereço..." 
          className="w-full h-12 pl-10 pr-4 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:bg-white transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue-500" />
            <span className="text-xs font-semibold">Carregando clientes...</span>
          </div>
        ) : (
          <>
            {filteredClientes.map(cliente => (
              <Card 
                key={cliente.id} 
                className="active:scale-[0.98] transition-transform cursor-pointer shadow-sm border-surface-200 hover:border-brand-blue-300"
                onClick={() => navigate(`/clientes/${cliente.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-blue-50 text-brand-blue-600 rounded-full flex items-center justify-center font-display font-bold shrink-0">
                    {cliente.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-900 truncate">{cliente.nome}</h3>
                    <p className="text-sm text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {cliente.endereco || 'Sem endereço cadastrado'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredClientes.length === 0 && (
              <div className="text-center py-16 px-4 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-brand-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm rotate-3">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center -rotate-6 shadow-sm">
                    <Users size={32} className="text-brand-blue-500" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-surface-900 mb-2">
                  Nenhum cliente por aqui
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-[240px] mx-auto">
                  Sua lista de clientes está vazia ou não encontramos resultados para sua busca.
                </p>
                <div className="flex flex-col gap-2 max-w-xs mx-auto">
                  <Button className="w-full" onClick={() => setIsNovoClienteOpen(true)}>
                    Adicionar Primeiro Cliente
                  </Button>
                  <Button variant="outline" className="w-full text-brand-blue-600 border-brand-blue-200" onClick={handleSeedClients}>
                    Gerar Clientes de Demonstração
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Novo Cliente Bottom Sheet (Actions) */}
      <BottomSheet 
        isOpen={isNovoClienteOpen} 
        onClose={() => setIsNovoClienteOpen(false)} 
        title="Adicionar Cliente"
      >
        <div className="space-y-3 pt-2">
          <Button 
            variant="outline" 
            className="w-full h-14 justify-start text-base bg-white border-surface-200 hover:bg-surface-50"
            onClick={() => {
              setIsNovoClienteOpen(false);
              navigate('/clientes/importar');
            }}
          >
            <Users size={20} className="mr-3 text-brand-blue-500" /> Importar da Agenda
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-14 justify-start text-base bg-white border-surface-200 hover:bg-surface-50"
            onClick={() => {
              setIsNovoClienteOpen(false);
              navigate('/clientes/novo');
            }}
          >
            <UserPlus size={20} className="mr-3 text-brand-green-500" /> Cadastrar Manualmente
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
