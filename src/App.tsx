import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import OrdemServico from "./pages/OrdemServico";
import Equipamentos from "./pages/Equipamentos";
import Pecas from "./pages/Pecas";
import Manutentores from "./pages/Manutentores";
import NotFound from "./pages/NotFound";
import Solicitacao from "./pages/Solicitacao";
import SolicitacaoLogin from "./pages/SolicitacaoLogin";
import SolicitacoesCompras from "./pages/SolicitacoesCompras";
import { AuthGuard } from "./components/AuthGuard";
import { SolicitacaoGuard } from "./components/SolicitacaoGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/solicitacao-login" element={<SolicitacaoLogin />} />
          <Route path="/solicitacao" element={<SolicitacaoGuard><Solicitacao /></SolicitacaoGuard>} />
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/ordens-servico" element={<AuthGuard><OrdemServico /></AuthGuard>} />
          <Route path="/equipamentos" element={<AuthGuard><Equipamentos /></AuthGuard>} />
          <Route path="/pecas" element={<AuthGuard><Pecas /></AuthGuard>} />
          <Route path="/manutentores" element={<AuthGuard><Manutentores /></AuthGuard>} />
          <Route path="/solicitacoes-compras" element={<AuthGuard><SolicitacoesCompras /></AuthGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
