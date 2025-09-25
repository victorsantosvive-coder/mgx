import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search, Edit, Trash2, AlertTriangle, Minus, Plus as PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Part {
  id: string;
  code: string;
  name: string;
  description?: string;
  supplier?: string;
  stock_quantity: number;
  minimum_stock: number;
  equipment_id?: string;
  created_at: string;
  updated_at: string;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
}

export default function Pecas() {
  const [showNewPartDialog, setShowNewPartDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [partForm, setPartForm] = useState({
    code: "",
    name: "",
    description: "",
    supplier: "",
    stock_quantity: 0,
    minimum_stock: 0,
    equipment_id: ""
  });

  // Load parts and equipments from Supabase
  useEffect(() => {
    loadParts();
    loadEquipments();

    // Set up real-time subscription for parts
    const partsChannel = supabase
      .channel('parts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parts'
        },
        () => {
          loadParts(); // Reload when parts change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(partsChannel);
    };
  }, []);

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar peças",
        variant: "destructive",
      });
    }
  };

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, code, name')
        .order('name');
      
      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Error loading equipments:', error);
    }
  };

  const handleCreatePart = async () => {
    if (!partForm.code || !partForm.name) {
      toast({
        title: "Erro",
        description: "Código e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const partData = {
        code: partForm.code,
        name: partForm.name,
        description: partForm.description || null,
        supplier: partForm.supplier || null,
        stock_quantity: partForm.stock_quantity,
        minimum_stock: partForm.minimum_stock,
        equipment_id: partForm.equipment_id === "none" ? null : partForm.equipment_id || null,
      };

      const { error } = await supabase
        .from('parts')
        .insert(partData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peça cadastrada com sucesso!",
      });

      setShowNewPartDialog(false);
      setPartForm({
        code: "",
        name: "",
        description: "",
        supplier: "",
        stock_quantity: 0,
        minimum_stock: 0,
        equipment_id: ""
      });
      
      // Reload parts
      loadParts();
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar peça",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peça excluída com sucesso!",
      });

      loadParts();
    } catch (error) {
      console.error('Error deleting part:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir peça",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStock = async (partId: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: "Erro",
        description: "Quantidade não pode ser negativa",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('parts')
        .update({ stock_quantity: newQuantity })
        .eq('id', partId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Estoque atualizado com sucesso!",
      });

      loadParts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar estoque",
        variant: "destructive",
      });
    }
  };

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLowStockParts = () => parts.filter(part => part.stock_quantity <= part.minimum_stock);

  const getStockStatus = (part: Part) => {
    if (part.stock_quantity === 0) return { label: "Sem Estoque", variant: "destructive" as const };
    if (part.stock_quantity <= part.minimum_stock) return { label: "Estoque Baixo", variant: "secondary" as const };
    return { label: "Em Estoque", variant: "default" as const };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Peças</h1>
            <p className="text-muted-foreground">
              Gerencie o estoque de peças de reposição
            </p>
          </div>
          
          <Dialog open={showNewPartDialog} onOpenChange={setShowNewPartDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Peça</DialogTitle>
                <DialogDescription>
                  Preencha os dados da peça de reposição
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: PC-001"
                      value={partForm.code}
                      onChange={(e) => setPartForm({...partForm, code: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Filtro de Ar"
                      value={partForm.name}
                      onChange={(e) => setPartForm({...partForm, name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Input
                      id="supplier"
                      placeholder="Ex: Fornecedor ABC"
                      value={partForm.supplier}
                      onChange={(e) => setPartForm({...partForm, supplier: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipamento</Label>
                    <Select value={partForm.equipment_id} onValueChange={(value) => setPartForm({...partForm, equipment_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {equipments.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} ({eq.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={partForm.stock_quantity}
                      onChange={(e) => setPartForm({...partForm, stock_quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minimum_stock">Estoque Mínimo</Label>
                    <Input
                      id="minimum_stock"
                      type="number"
                      min="0"
                      value={partForm.minimum_stock}
                      onChange={(e) => setPartForm({...partForm, minimum_stock: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição detalhada da peça..."
                    value={partForm.description}
                    onChange={(e) => setPartForm({...partForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-4">
                   <Button variant="outline" onClick={() => setShowNewPartDialog(false)}>
                     Cancelar
                   </Button>
                   <Button onClick={handleCreatePart} disabled={loading}>
                     {loading ? "Cadastrando..." : "Cadastrar"}
                   </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alert for low stock */}
        {getLowStockParts().length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardContent className="flex items-center gap-2 pt-6">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700 dark:text-orange-300">
                {getLowStockParts().length} peça(s) com estoque baixo ou zerado
              </span>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar peças por nome, código ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Parts List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParts.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Nenhuma peça encontrada" : "Nenhuma peça cadastrada"}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Comece cadastrando uma nova peça
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredParts.map((part) => {
              const stockStatus = getStockStatus(part);
              return (
                <Card key={part.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{part.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePart(part.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      <Badge variant="outline" className="w-fit">
                        {part.code}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estoque:</span>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateStock(part.id, part.stock_quantity - 1)}
                            disabled={part.stock_quantity <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm min-w-[60px] text-center">{part.stock_quantity} unidades</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateStock(part.id, part.stock_quantity + 1)}
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mínimo:</span>
                        <span className="text-sm">{part.minimum_stock} unidades</span>
                      </div>
                      
                      {part.supplier && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Fornecedor:</span>
                          <span className="text-sm">{part.supplier}</span>
                        </div>
                      )}
                      
                      {part.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {part.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}