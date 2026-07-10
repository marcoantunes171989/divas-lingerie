import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RestoreVendaModalProps {
  open: boolean;
  onContinuar: () => void;
  onDescartar: () => void;
}

export function RestoreVendaModal({ open, onContinuar, onDescartar }: RestoreVendaModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm rounded-3xl" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Venda em aberto</DialogTitle>
          <DialogDescription>Existe uma venda em aberto. Deseja continuar?</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="h-11 w-full rounded-xl bg-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-dark)]"
            onClick={onContinuar}
          >
            Continuar venda
          </Button>
          <Button variant="outline" className="h-11 w-full rounded-xl" onClick={onDescartar}>
            Descartar venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
