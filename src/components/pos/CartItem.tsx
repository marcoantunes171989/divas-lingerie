import { Minus, Plus, Tag, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ItemVenda } from "./types";

interface CartItemProps {
  item: ItemVenda;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onDesconto: () => void;
}

export function CartItem({ item, onIncrement, onDecrement, onRemove, onDesconto }: CartItemProps) {
  if (item.cancelado) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--pdv-border)] bg-slate-50 p-3 opacity-60">
        <p className="text-xs font-semibold line-through text-[var(--pdv-gray-text)]">
          {item.descricao}
        </p>
        <p className="text-[11px] text-[var(--pdv-gray-text)]">Item cancelado</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--pdv-border)] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--pdv-graphite)]">
            {item.descricao}
          </p>
          <p className="text-[11px] text-[var(--pdv-gray-text)]">Código: {item.codigo}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full p-1.5 text-[var(--pdv-gray-text)] hover:bg-red-50 hover:text-[var(--pdv-danger)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-full border border-[var(--pdv-border)] bg-[var(--pdv-rose-bg)] p-0.5">
          <button
            type="button"
            onClick={onDecrement}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--pdv-rose-dark)] hover:bg-white"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-bold text-[var(--pdv-graphite)]">
            {item.quantidade}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--pdv-rose-dark)] hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-right">
          <p className="text-[11px] text-[var(--pdv-gray-text)]">{brl(item.valor)} un.</p>
          <p
            className={cn(
              "text-sm font-bold text-[var(--pdv-graphite)]",
              (item.desconto ?? 0) > 0 && "text-[var(--pdv-rose-dark)]",
            )}
          >
            {brl(item.total - (item.desconto ?? 0))}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDesconto}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--pdv-rose)] hover:text-[var(--pdv-rose-dark)]"
      >
        <Tag className="h-3 w-3" />
        {(item.desconto ?? 0) > 0 ? `Desconto: ${brl(item.desconto ?? 0)}` : "Aplicar desconto"}
      </button>
    </div>
  );
}
