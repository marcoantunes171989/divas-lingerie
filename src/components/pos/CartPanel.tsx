import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, UserPlus, UserRound, Trash2 } from "lucide-react";
import { CartItem } from "./CartItem";
import type { ItemVenda } from "./types";

interface CartPanelProps {
  items: ItemVenda[];
  clienteNome: string | null;
  onSelecionarCliente: () => void;
  vendedorNome: string | null;
  onSelecionarVendedor: () => void;
  onLimparVenda: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onDescontoItem: (id: string) => void;
}

export function CartPanel({
  items,
  clienteNome,
  onSelecionarCliente,
  vendedorNome,
  onSelecionarVendedor,
  onLimparVenda,
  onIncrement,
  onDecrement,
  onRemove,
  onDescontoItem,
}: CartPanelProps) {
  const itensAtivos = items.filter((i) => !i.cancelado);
  const now = new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--pdv-border)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-[var(--pdv-graphite)]">
            Venda atual
          </h2>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onLimparVenda}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--pdv-danger)] hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--pdv-gray-text)]">
          {now.toLocaleDateString("pt-BR")} às{" "}
          {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSelecionarCliente}
            className="flex items-center gap-2 rounded-xl border border-[var(--pdv-border)] bg-[var(--pdv-rose-bg)] px-3 py-2 text-left text-xs font-semibold text-[var(--pdv-graphite)] hover:border-[var(--pdv-rose)]"
          >
            <User className="h-4 w-4 shrink-0 text-[var(--pdv-rose)]" />
            <span className="truncate">{clienteNome ?? "Cliente não identificado"}</span>
          </button>
          <button
            type="button"
            onClick={onSelecionarVendedor}
            className="flex items-center gap-2 rounded-xl border border-[var(--pdv-border)] px-3 py-2 text-left text-xs font-semibold text-[var(--pdv-graphite)] hover:border-[var(--pdv-rose)]"
          >
            <UserRound className="h-4 w-4 shrink-0 text-[var(--pdv-rose)]" />
            <span className="truncate">{vendedorNome ?? "Adicionar vendedor"}</span>
            <UserPlus className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--pdv-gray-text)]" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pdv-rose-light)] text-[var(--pdv-rose-dark)]">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[var(--pdv-graphite)]">
              Nenhum item adicionado à venda
            </p>
            <p className="max-w-[220px] text-xs text-[var(--pdv-gray-text)]">
              Busque ou leia o código de barras para iniciar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrement={() => onIncrement(item.id)}
                onDecrement={() => onDecrement(item.id)}
                onRemove={() => onRemove(item.id)}
                onDesconto={() => onDescontoItem(item.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {itensAtivos.length > 0 && (
        <div className="border-t border-[var(--pdv-border)] px-4 py-2 text-[11px] text-[var(--pdv-gray-text)]">
          {itensAtivos.reduce((acc, i) => acc + i.quantidade, 0)} peça(s) em {itensAtivos.length}{" "}
          item(ns)
        </div>
      )}
    </div>
  );
}
