import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DuplicateProductModalProps {
  open: boolean;
  produtoDescricao?: string;
  onSomarQuantidade: () => void;
  onIncluirSeparado: () => void;
  onCancel: () => void;
}

export function DuplicateProductModal({
  open,
  produtoDescricao,
  onSomarQuantidade,
  onIncluirSeparado,
  onCancel,
}: DuplicateProductModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Produto já incluído</DialogTitle>
          <DialogDescription>
            {produtoDescricao ? `"${produtoDescricao}"` : "Este produto"} já está na venda. Deseja
            somar a quantidade no item existente ou lançar como novo item separado?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="h-11 w-full rounded-xl bg-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-dark)]"
            onClick={onSomarQuantidade}
          >
            Somar quantidade
          </Button>
          <Button variant="outline" className="h-11 w-full rounded-xl" onClick={onIncluirSeparado}>
            Incluir separado
          </Button>
          <Button variant="ghost" className="h-11 w-full rounded-xl" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
