import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserCog, Plus, Pencil, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/operadores-pdv")({
  component: OperadoresPdvPage,
});

type Operador = {
  id: string;
  ope_nome: string;
  ope_login: string | null;
  ope_ativo: boolean;
};

function OperadoresPdvPage() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Operador | null>(null);
  const [formData, setFormData] = useState({ ope_nome: "", ope_login: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchOperadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tab_operadores_pdv" as any)
      .select("*")
      .order("ope_nome");
    if (error) toast.error("Erro ao carregar operadores: " + error.message);
    setOperadores((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOperadores();
  }, []);

  const openAddDialog = () => {
    setSelected(null);
    setFormData({ ope_nome: "", ope_login: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (op: Operador) => {
    setSelected(op);
    setFormData({ ope_nome: op.ope_nome, ope_login: op.ope_login || "" });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ope_nome.trim()) {
      toast.error("O nome do operador é obrigatório");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ope_nome: formData.ope_nome.trim(),
        ope_login: formData.ope_login.trim() || null,
      };
      if (selected) {
        const { error } = await supabase
          .from("tab_operadores_pdv" as any)
          .update(payload)
          .eq("id", selected.id);
        if (error) throw error;
        toast.success("Operador atualizado");
      } else {
        const { error } = await supabase.from("tab_operadores_pdv" as any).insert(payload);
        if (error) throw error;
        toast.success("Operador cadastrado");
      }
      setIsDialogOpen(false);
      fetchOperadores();
    } catch (error: any) {
      toast.error("Erro ao salvar operador: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAtivo = async (op: Operador) => {
    const { error } = await supabase
      .from("tab_operadores_pdv" as any)
      .update({ ope_ativo: !op.ope_ativo })
      .eq("id", op.id);
    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
      return;
    }
    toast.success(op.ope_ativo ? "Operador inativado" : "Operador ativado");
    fetchOperadores();
  };

  const filtrados = operadores.filter((o) =>
    o.ope_nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Operadores PDV"
          description="Cadastro de operadores para seleção obrigatória na venda."
        />
        <Button
          onClick={openAddDialog}
          className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 h-11 sm:h-10"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Operador
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-card p-1 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-none bg-transparent focus-visible:ring-0 rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-2xl border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Nome</TableHead>
              <TableHead className="font-bold">Login/Usuário</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-40">
                    <UserCog className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium italic">
                      {searchTerm ? "Nenhum operador encontrado." : "Sem operadores cadastrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((op) => (
                <TableRow key={op.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold">{op.ope_nome}</TableCell>
                  <TableCell className="text-muted-foreground">{op.ope_login || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        op.ope_ativo
                          ? "bg-green-50 text-green-600 border-none"
                          : "bg-slate-100 text-slate-500 border-none"
                      }
                    >
                      {op.ope_ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Switch checked={op.ope_ativo} onCheckedChange={() => toggleAtivo(op)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => openEditDialog(op)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selected ? "Editar Operador" : "Novo Operador"}
              </DialogTitle>
              <DialogDescription>Nome e login/usuário do operador de PDV.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ope_nome">Nome *</Label>
                <Input
                  id="ope_nome"
                  autoFocus
                  value={formData.ope_nome}
                  onChange={(e) => setFormData({ ...formData, ope_nome: e.target.value })}
                  className="rounded-xl h-11"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ope_login">Login/Usuário</Label>
                <Input
                  id="ope_login"
                  value={formData.ope_login}
                  onChange={(e) => setFormData({ ...formData, ope_login: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-full font-bold"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full px-8 font-bold">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selected ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
