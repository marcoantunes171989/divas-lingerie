import { Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OperadorPDV } from "./types";

interface OperadorSelectorModalProps {
  open: boolean;
  onClose: () => void;
  operadores: OperadorPDV[];
  onSelect: (id: string) => void;
}

export function OperadorSelectorModal({
  open,
  onClose,
  operadores,
  onSelect,
}: OperadorSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Selecionar operador
          </DialogTitle>
          <DialogDescription>Quem está operando este terminal?</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-72">
          <div className="flex flex-col gap-1">
            {operadores.map((operador) => (
              <button
                key={operador.id}
                type="button"
                onClick={() => {
                  onSelect(operador.id);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[var(--pdv-rose-bg)]"
              >
                <Monitor className="h-4 w-4 text-[var(--pdv-rose)]" />
                <span className="font-medium text-[var(--pdv-graphite)]">{operador.ope_nome}</span>
              </button>
            ))}
            {operadores.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-[var(--pdv-gray-text)]">
                Nenhum operador ativo cadastrado.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
