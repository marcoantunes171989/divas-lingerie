import { UserRound, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VendedorPDV } from "./types";

interface SellerSelectorModalProps {
  open: boolean;
  onClose: () => void;
  vendedores: VendedorPDV[];
  onSelect: (id: string | null) => void;
}

export function SellerSelectorModal({
  open,
  onClose,
  vendedores,
  onSelect,
}: SellerSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Selecionar vendedor</DialogTitle>
          <DialogDescription>Quem está atendendo esta venda?</DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--pdv-border)] px-3 py-2.5 text-sm font-semibold text-[var(--pdv-gray-text)] hover:border-[var(--pdv-rose)] hover:text-[var(--pdv-rose-dark)]"
        >
          <X className="h-4 w-4" /> Nenhum vendedor
        </button>

        <ScrollArea className="max-h-72">
          <div className="flex flex-col gap-1">
            {vendedores.map((vendedor) => (
              <button
                key={vendedor.id}
                type="button"
                onClick={() => {
                  onSelect(vendedor.id);
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[var(--pdv-rose-bg)]"
              >
                <UserRound className="h-4 w-4 text-[var(--pdv-rose)]" />
                <span className="font-medium text-[var(--pdv-graphite)]">{vendedor.usu_nome}</span>
              </button>
            ))}
            {vendedores.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-[var(--pdv-gray-text)]">
                Nenhum usuário cadastrado.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
