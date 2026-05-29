import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Loader2, XCircle, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/motivos-cancelamento")({
  component: MotivosCancelamentoPage,
});

type Motivo = {
  id: string;
  mot_codigo: number;
  mot_descricao: string;
  mot_ativo: boolean;
  created_at: string;
};

const DICAS = [
  "Motivos claros ajudam a identificar padrões de cancelamento.",
  "Use descrições objetivas para facilitar o uso no PDV.",
  "Analise os motivos mais frequentes para melhorar seus processos.",
];

function MotivosCancelamentoPage() {
  const dica = useMemo(() => DICAS[Math.floor(Math.random() * DICAS.length)], []);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Motivo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ mot_descricao: "" });

  const fetchMotivos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tab_motivos_cancelamento")
        .select("*")
        .order("mot_codigo");
      if (error) throw error;
      setMotivos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar motivos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMotivos(); }, []);

  useEffect(() => {
    setFormData({ mot_descricao: selected?.mot_descricao || "" });
  }, [selected]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mot_descricao.trim()) {
      toast.error("A descrição é obrigatória.");
      return;
    }
    try {
      setSubmitting(true);
      if (selected) {
        const { error } = await supabase
          .from("tab_motivos_cancelamento")
          .update({ mot_descricao: formData.mot_descricao.trim(), updated_at: new Date().toISOString() })
          .eq("id", selected.id);
        if (error) throw error;
        toast.success("Motivo atualizado!");
      } else {
        const { error } = await supabase
          .from("tab_motivos_cancelamento")
          .insert([{ mot_descricao: formData.mot_descricao.trim() }]);
        if (error) throw error;
        toast.success("Motivo cadastrado!");
      }
      setIsDialogOpen(false);
      fetchMotivos();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from("tab_motivos_cancelamento")
        .delete()
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Motivo excluído!");
      setIsDeleteDialogOpen(false);
      fetchMotivos();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = motivos.filter(m =>
    m.mot_descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.mot_codigo).includes(searchTerm)
  );

  const formatCodigo = (n: number) => `MC${String(n).padStart(3, "0")}`;

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Motivos de Cancelamento</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm italic">
            <XCircle className="w-4 h-4 text-primary" /> {dica}
          </p>
        </div>
        <Button
          onClick={() => { setSelected(null); setIsDialogOpen(true); }}
          className="rounded-2xl shadow-lg shadow-primary/20 h-12 px-6 bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Motivo
        </Button>
      </div>

      <Card className="border-none bg-white shadow-xl shadow-slate-200/50 rounded-3xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Pesquise por descrição ou código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg bg-slate-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-32">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-slate-400">
                    Nenhum motivo encontrado.
                  </TableCell>
                </TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full font-mono text-xs px-3">
                      <Hash className="w-3 h-3 mr-1" />{formatCodigo(m.mot_codigo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">{m.mot_descricao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-9 w-9"
                        onClick={() => { setSelected(m); setIsDialogOpen(true); }}
                      >
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-9 w-9 hover:bg-red-50"
                        onClick={() => { setSelected(m); setIsDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg w-[95vw] p-0 border-none shadow-2xl">
          <form onSubmit={handleSave}>
            <div className="bg-slate-900 p-6 text-white rounded-t-3xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">
                      {selected ? "Editar Motivo" : "Novo Motivo"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {selected ? `Código: ${formatCodigo(selected.mot_codigo)}` : "O código será gerado automaticamente"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mot_descricao" className="font-bold">Descrição *</Label>
                <Textarea
                  id="mot_descricao"
                  placeholder="Ex: Produto com defeito, Cliente desistiu, Troca de produto..."
                  value={formData.mot_descricao}
                  onChange={e => setFormData({ mot_descricao: e.target.value })}
                  className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50 border-t flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl h-12 px-6 border-slate-200 text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl h-12 px-8 bg-slate-900 hover:bg-slate-800"
              >
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir o motivo <span className="font-bold text-slate-900">"{selected?.mot_descricao}"</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="rounded-xl h-12 border-slate-200 text-slate-600">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="rounded-xl h-12 bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
