import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wrench } from 'lucide-react';

const SolicitacaoLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Se já estiver autenticado, vai direto para solicitação
  useEffect(() => {
    const isRequestUser = localStorage.getItem('request_user_authenticated');
    if (isRequestUser === 'true') {
      navigate('/solicitacao');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Login fixo: usuário "solicitacao@gmail.com" e senha "12345678"
      if (credentials.username === 'solicitacao@gmail.com' && credentials.password === '12345678') {
        localStorage.setItem('request_user_authenticated', 'true');
        toast({
          title: "Login realizado com sucesso",
          description: "Redirecionando para solicitação de manutenção...",
        });
        navigate('/solicitacao');
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Usuário ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">MaintenanceOS</CardTitle>
          <CardDescription className="text-base">
            Acesso para Solicitação de Manutenção
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (E-mail)</Label>
              <Input
                id="username"
                type="email"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({...prev, username: e.target.value}))}
                placeholder="Digite o e-mail (solicitacao@gmail.com)"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
                placeholder="Digite a senha (12345678)"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolicitacaoLogin;
