import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './components/auth/AuthProvider';
import { AuthGuard } from './components/auth/AuthGuard';
import { AdminGuard } from './components/auth/AdminGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import Admin from './pages/admin/Admin';
import AdminLogin from './pages/admin/AdminLogin';
import Hoje from './pages/Hoje';
import Notificacoes from './pages/Notificacoes';
import Onboarding from './pages/onboarding/Onboarding';
import ClientesList from './pages/clientes/ClientesList';
import ClienteProfile from './pages/clientes/ClienteProfile';
import NovoOrcamento from './pages/orcamentos/NovoOrcamento';
import ConfigurarOrcamento from './pages/orcamentos/ConfigurarOrcamento';
import PreviewOrcamento from './pages/orcamentos/PreviewOrcamento';
import PublicOrcamento from './pages/orcamentos/PublicOrcamento';
import AgendarServico from './pages/servicos/AgendarServico';
import ExecucaoServico from './pages/servicos/ExecucaoServico';
import ConclusaoServico from './pages/servicos/ConclusaoServico';
import DashboardDinheiro from './pages/dinheiro/DashboardDinheiro';
import GerarPix from './pages/dinheiro/GerarPix';
import EnviarCobranca from './pages/dinheiro/EnviarCobranca';
import RelatorioPublico from './pages/servicos/RelatorioPublico';
import PublicAvaliacao from './pages/avaliacoes/PublicAvaliacao';
import MiniSitePublico from './pages/minisite/MiniSitePublico';
import PerfilEu from './pages/eu/PerfilEu';
import CentralMei from './pages/eu/CentralMei';
import GestaoMiniSite from './pages/eu/GestaoMiniSite';
import GestaoPortfolio from './pages/eu/GestaoPortfolio';
import DadosComerciais from './pages/eu/DadosComerciais';
import MensagensAutomaticas from './pages/eu/MensagensAutomaticas';
import TabelaPrecos from './pages/eu/TabelaPrecos';
import CalculadoraPreco from './pages/eu/CalculadoraPreco';
import MeuPlano from './pages/eu/MeuPlano';
import IndicarAmigo from './pages/eu/IndicarAmigo';
import ConfiguracoesGerais from './pages/eu/ConfiguracoesGerais';
import SuporteAjuda from './pages/eu/SuporteAjuda';

import AgendaCompleta from './pages/servicos/AgendaCompleta';
import NovoServicoRapido from './pages/servicos/NovoServicoRapido';
import NovoCliente from './pages/clientes/NovoCliente';
import ImportarContatos from './pages/clientes/ImportarContatos';

import NovaDespesa from './pages/dinheiro/NovaDespesa';
import TransacoesList from './pages/dinheiro/TransacoesList';
import DetalheTransacao from './pages/dinheiro/DetalheTransacao';
import BaixaManual from './pages/dinheiro/BaixaManual';
import RelatorioMensal from './pages/dinheiro/RelatorioMensal';
import InsightsFinanceiros from './pages/dinheiro/InsightsFinanceiros';
import CentralCobrancas from './pages/dinheiro/CentralCobrancas';
import DetalheServico from './pages/servicos/DetalheServico';
import GaleriaServico from './pages/servicos/GaleriaServico';
import ReciboDigital from './pages/dinheiro/ReciboDigital';

export default function App() {
  return (
    <ErrorBoundary>
    <ToastProvider>
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas — sem auth */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Navigate to="/onboarding" replace />} />
          <Route path="/orcamento/aprovar/:id" element={<PublicOrcamento />} />
          <Route path="/relatorio/:id" element={<RelatorioPublico />} />
          <Route path="/avaliar/:token" element={<PublicAvaliacao />} />
          <Route path="/minisite/:slug" element={<MiniSitePublico />} />
          <Route path="/dinheiro/recibo/:id" element={<ReciboDigital />} />

          {/* Rotas autenticadas — fullscreen */}
          <Route path="/notificacoes" element={<AuthGuard><Notificacoes /></AuthGuard>} />
          <Route path="/orcamento/novo/:clienteId" element={<AuthGuard><NovoOrcamento /></AuthGuard>} />
          <Route path="/orcamento/configurar/:id" element={<AuthGuard><ConfigurarOrcamento /></AuthGuard>} />
          <Route path="/orcamento/preview/:id" element={<AuthGuard><PreviewOrcamento /></AuthGuard>} />
          <Route path="/orcamento/enviado" element={<AuthGuard><div className="p-4 flex flex-col items-center justify-center min-h-screen text-center"><h1 className="text-2xl font-bold text-brand-green-600 mb-4">Enviado com sucesso!</h1><a href="/hoje" className="text-brand-blue-600 underline">Voltar para Home</a></div></AuthGuard>} />

          <Route path="/clientes/novo" element={<AuthGuard><NovoCliente /></AuthGuard>} />
          <Route path="/clientes/importar" element={<AuthGuard><ImportarContatos /></AuthGuard>} />
          <Route path="/agenda" element={<AuthGuard><AgendaCompleta /></AuthGuard>} />

          <Route path="/servico/agendar/:orcamentoId" element={<AuthGuard><AgendarServico /></AuthGuard>} />
          <Route path="/servico/rapido" element={<AuthGuard><NovoServicoRapido /></AuthGuard>} />
          <Route path="/servico/execucao/:id" element={<AuthGuard><ExecucaoServico /></AuthGuard>} />
          <Route path="/servico/conclusao/:id" element={<AuthGuard><ConclusaoServico /></AuthGuard>} />
          <Route path="/servico/:id/fotos" element={<AuthGuard><GaleriaServico /></AuthGuard>} />
          <Route path="/servico/:id" element={<AuthGuard><DetalheServico /></AuthGuard>} />

          <Route path="/dinheiro/receber/:id" element={<AuthGuard><GerarPix /></AuthGuard>} />
          <Route path="/dinheiro/cobranca/:id" element={<AuthGuard><EnviarCobranca /></AuthGuard>} />
          <Route path="/dinheiro/baixa/:id" element={<AuthGuard><BaixaManual /></AuthGuard>} />
          <Route path="/dinheiro/despesa/nova" element={<AuthGuard><NovaDespesa /></AuthGuard>} />
          <Route path="/dinheiro/transacoes" element={<AuthGuard><TransacoesList /></AuthGuard>} />
          <Route path="/dinheiro/transacao/:id" element={<AuthGuard><DetalheTransacao /></AuthGuard>} />
          <Route path="/dinheiro/relatorio" element={<AuthGuard><RelatorioMensal /></AuthGuard>} />
          <Route path="/dinheiro/insights" element={<AuthGuard><InsightsFinanceiros /></AuthGuard>} />
          <Route path="/dinheiro/cobrancas" element={<AuthGuard><CentralCobrancas /></AuthGuard>} />

          <Route path="/eu/mei" element={<AuthGuard><CentralMei /></AuthGuard>} />
          <Route path="/eu/minisite" element={<AuthGuard><GestaoMiniSite /></AuthGuard>} />

          {/* Rotas autenticadas com Layout (barra de navegação) */}
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/" element={<Navigate to="/hoje" replace />} />
            <Route path="/hoje" element={<Hoje />} />
            <Route path="/clientes" element={<ClientesList />} />
            <Route path="/clientes/:id" element={<ClienteProfile />} />
            <Route path="/dinheiro" element={<DashboardDinheiro />} />
            <Route path="/eu" element={<PerfilEu />} />
            <Route path="/eu/portfolio" element={<GestaoPortfolio />} />
            <Route path="/eu/dados" element={<DadosComerciais />} />
            <Route path="/eu/mensagens" element={<MensagensAutomaticas />} />
            <Route path="/eu/precos" element={<TabelaPrecos />} />
            <Route path="/eu/calculadora" element={<CalculadoraPreco />} />
            <Route path="/eu/plano" element={<MeuPlano />} />
            <Route path="/eu/indicar" element={<IndicarAmigo />} />
            <Route path="/eu/configuracoes" element={<ConfiguracoesGerais />} />
            <Route path="/eu/suporte" element={<SuporteAjuda />} />
          </Route>

          {/* Rotas de Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />

          {/* Rota catch-all */}
          <Route path="*" element={<Navigate to="/hoje" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
    </ToastProvider>
    </ErrorBoundary>
  );
}