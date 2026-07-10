import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { UserRound, Plus, Pencil, Search, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/vendedores")({
  component: VendedoresPage,
});

type Vendedor = {
  id: string;
  vdr_nome: string;
  vdr_telefone: string | null;
  vdr_ativo: boolean;
};

function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Vendedor | null>(null);
  const [formData, setFormData] = useState({ vdr_nome: "", vdr_telefone: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchVendedores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tab_vendedores" as any)
      .select("*")
      .order("vdr_nome");
    if (error) toast.error("Erro ao carregar vendedores: " + error.message);
    setVendedores((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const openAddDialog = () => {
    setSelected(null);
    setFormData({ vdr_nome: "", vdr_telefone: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (v: Vendedor) => {
    setSelected(v);
    setFormData({ vdr_nome: v.vdr_nome, vdr_telefone: v.vdr_telefone || "" });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vdr_nome.trim()) {
      toast.error("O nome do vendedor é obrigatório");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        vdr_nome: formData.vdr_nome.trim(),
        vdr_telefone: formData.vdr_telefone.trim() || null,
      };
      if (selected) {
        const { error } = await supabase
          .from("tab_vendedores" as any)
          .update(payload)
          .eq("id", selected.id);
        if (error) throw error;
        toast.success("Vendedor atualizado");
      } else {
        const { error } = await supabase.from("tab_vendedores" as any).insert(payload);
        if (error) throw error;
        toast.success("Vendedor cadastrado");
      }
      setIsDialogOpen(false);
      fetchVendedores();
    } catch (error: any) {
      toast.error("Erro ao salvar vendedor: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAtivo = async (v: Vendedor) => {
    const { error } = await supabase
      .from("tab_vendedores" as any)
      .update({ vdr_ativo: !v.vdr_ativo })
      .eq("id", v.id);
    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
      return;
    }
    toast.success(v.vdr_ativo ? "Vendedor inativado" : "Vendedor ativado");
    fetchVendedores();
  };

  const filtrados = vendedores.filter((v) =>
    v.vdr_nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Vendedores"
          description="Cadastro de vendedores para seleção obrigatória na venda."
        />
        <Button
          onClick={openAddDialog}
          className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 h-11 sm:h-10"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Vendedor
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
              <TableHead className="font-bold">Telefone</TableHead>
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
                    <UserRound className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium italic">
                      {searchTerm ? "Nenhum vendedor encontrado." : "Sem vendedores cadastrados."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((v) => (
                <TableRow key={v.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold">{v.vdr_nome}</TableCell>
                  <TableCell className="text-muted-foreground">{v.vdr_telefone || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        v.vdr_ativo
                          ? "bg-green-50 text-green-600 border-none"
                          : "bg-slate-100 text-slate-500 border-none"
                      }
                    >
                      {v.vdr_ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Switch checked={v.vdr_ativo} onCheckedChange={() => toggleAtivo(v)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => openEditDialog(v)}
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
                {selected ? "Editar Vendedor" : "Novo Vendedor"}
              </DialogTitle>
              <DialogDescription>Nome e telefone (opcional) do vendedor.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="vdr_nome">Nome *</Label>
                <Input
                  id="vdr_nome"
                  autoFocus
                  value={formData.vdr_nome}
                  onChange={(e) => setFormData({ ...formData, vdr_nome: e.target.value })}
                  className="rounded-xl h-11"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vdr_telefone">Telefone (opcional)</Label>
                <Input
                  id="vdr_telefone"
                  value={formData.vdr_telefone}
                  onChange={(e) => setFormData({ ...formData, vdr_telefone: e.target.value })}
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
