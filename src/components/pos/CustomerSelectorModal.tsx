import { Search, UserX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPhone } from "@/lib/format";
import type { ClientePDV } from "./types";

interface CustomerSelectorModalProps {
  open: boolean;
  onClose: () => void;
  clientes: ClientePDV[];
  onSelect: (id: string | null) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CustomerSelectorModal({
  open,
  onClose,
  clientes,
  onSelect,
  searchTerm,
  onSearchChange,
}: CustomerSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Selecionar cliente</DialogTitle>
          <DialogDescription>
            Busque pelo nome ou selecione consumidor não identificado.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pdv-gray-text)]" />
          <Input
            autoFocus
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nome do cliente..."
            className="rounded-xl pl-9"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--pdv-border)] px-3 py-2.5 text-sm font-semibold text-[var(--pdv-gray-text)] hover:border-[var(--pdv-rose)] hover:text-[var(--pdv-rose-dark)]"
        >
          <UserX className="h-4 w-4" /> Cliente não identificado
        </button>

        <ScrollArea className="max-h-72">
          <div className="flex flex-col gap-1">
            {clientes.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => {
                  onSelect(cliente.id);
                  onClose();
                }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[var(--pdv-rose-bg)]"
              >
                <span className="font-medium text-[var(--pdv-graphite)]">{cliente.cli_nome}</span>
                {cliente.cli_telefone && (
                  <span className="text-xs text-[var(--pdv-gray-text)]">
                    {formatPhone(cliente.cli_telefone)}
                  </span>
                )}
              </button>
            ))}
            {clientes.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-[var(--pdv-gray-text)]">
                Nenhum cliente encontrado.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
