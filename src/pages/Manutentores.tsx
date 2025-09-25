import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Search, Edit, Trash2, CheckCircle, XCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Maintainer {
  id: string;
  name: string;
  role?: string;
  contact?: string;
  certifications?: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Manutentores() {
  const [showNewMaintainerDialog, setShowNewMaintainerDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintainers, setMaintainers] = useState<Maintainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [maintainerForm, setMaintainerForm] = useState({
    name: "",
    role: "",
    contact: "",
    certifications: "",
    active: true
  });

  // Load maintainers from Supabase
  useEffect(() => {
    loadMaintainers();

    // Set up real-time subscription for maintainers
    const maintainersChannel = supabase
      .channel('maintainers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintainers'
        },
        () => {
          loadMaintainers(); // Reload when maintainers change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(maintainersChannel);
    };
  }, []);

  const loadMaintainers = async () => {
    try {
      const { data, error } = await supabase
        .from('maintainers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMaintainers(data || []);
    } catch (error) {
      console.error('Error loading maintainers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar manutentores",
        variant: "destructive",
      });
    }
  };

  const handleCreateMaintainer = async () => {
    if (!maintainerForm.name) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const certificationsList = maintainerForm.certifications
        .split(',')
        .map(cert => cert.trim())
        .filter(cert => cert.length > 0);

      const maintainerData = {
        name: maintainerForm.name,
        role: maintainerForm.role || null,
        contact: maintainerForm.contact || null,
        certifications: certificationsList.length > 0 ? certificationsList : null,
        active: maintainerForm.active,
      };

      const { error } = await supabase
        .from('maintainers')
        .insert(maintainerData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Manautentor cadastrado com sucesso!",
      });

      setShowNewMaintainerDialog(false);
      setMaintainerForm({
        name: "",
        role: "",
        contact: "",
        certifications: "",
        active: true
      });
      
      // Reload maintainers
      loadMaintainers();
    } catch (error) {
      console.error('Error creating maintainer:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar manautentor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaintainer = async (maintainerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este manautentor?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintainers')
        .delete()
        .eq('id', maintainerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Manautentor excluído com sucesso!",
      });

      loadMaintainers();
    } catch (error) {
      console.error('Error deleting maintainer:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir manautentor",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (maintainerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('maintainers')
        .update({ active: !currentStatus })
        .eq('id', maintainerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Manautentor ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });

      loadMaintainers();
    } catch (error) {
      console.error('Error toggling maintainer status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do manautentor",
        variant: "destructive",
      });
    }
  };

  const filteredMaintainers = maintainers.filter(maintainer =>
    maintainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maintainer.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maintainer.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMaintainers = maintainers.filter(m => m.active);
  const inactiveMaintainers = maintainers.filter(m => !m.active);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manutentores</h1>
            <p className="text-muted-foreground">
              Gerencie a equipe de manutenção
            </p>
          </div>
          
          <Dialog open={showNewMaintainerDialog} onOpenChange={setShowNewMaintainerDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Manautentor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Manautentor</DialogTitle>
                <DialogDescription>
                  Preencha os dados do manautentor
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João Silva"
                      value={maintainerForm.name}
                      onChange={(e) => setMaintainerForm({...maintainerForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Input
                      id="role"
                      placeholder="Ex: Técnico Elétrico"
                      value={maintainerForm.role}
                      onChange={(e) => setMaintainerForm({...maintainerForm, role: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input
                    id="contact"
                    placeholder="Ex: (11) 99999-9999 ou joao@empresa.com"
                    value={maintainerForm.contact}
                    onChange={(e) => setMaintainerForm({...maintainerForm, contact: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="certifications">Certificações</Label>
                  <Input
                    id="certifications"
                    placeholder="Ex: NR-10, NR-33, Soldador (separadas por vírgula)"
                    value={maintainerForm.certifications}
                    onChange={(e) => setMaintainerForm({...maintainerForm, certifications: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe múltiplas certificações por vírgula
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={maintainerForm.active}
                    onCheckedChange={(checked) => setMaintainerForm({...maintainerForm, active: checked})}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                
                <div className="flex gap-4">
                   <Button variant="outline" onClick={() => setShowNewMaintainerDialog(false)}>
                     Cancelar
                   </Button>
                   <Button onClick={handleCreateMaintainer} disabled={loading}>
                     {loading ? "Cadastrando..." : "Cadastrar"}
                   </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintainers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeMaintainers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveMaintainers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar manutentores por nome, função ou contato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Maintainers List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaintainers.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum manautentor encontrado" : "Nenhum manautentor cadastrado"}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Comece cadastrando um novo manautentor
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredMaintainers.map((maintainer) => (
              <Card key={maintainer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{maintainer.name}</CardTitle>
                      {maintainer.active ? (
                        <Badge variant="default" className="text-xs">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleStatus(maintainer.id, maintainer.active)}
                        title={maintainer.active ? "Desativar" : "Ativar"}
                      >
                        {maintainer.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteMaintainer(maintainer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {maintainer.role && (
                    <CardDescription>
                      <Badge variant="outline" className="w-fit">
                        {maintainer.role}
                      </Badge>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintainer.contact && (
                      <div>
                        <span className="text-sm font-medium">Contato:</span>
                        <p className="text-sm text-muted-foreground">{maintainer.contact}</p>
                      </div>
                    )}
                    
                    {maintainer.certifications && maintainer.certifications.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Certificações:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {maintainer.certifications.map((cert, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Cadastrado em: {new Date(maintainer.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}