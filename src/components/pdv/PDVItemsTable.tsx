import {
  Hash,
  MoreVertical,
  PlusCircle,
  RotateCcw,
  ShoppingCart,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brl, estoqueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ItemVenda } from "@/components/pos/types";

interface PDVItemsTableProps {
  items: ItemVenda[];
  selectedItemId: string | null;
  onSelectRow: (id: string) => void;
  onAlterarQuantidade: (id: string) => void;
  onDesconto: (id: string) => void;
  onAcrescimo: (id: string) => void;
  onCancelar: (id: string) => void;
  onRestaurar: (id: string) => void;
  onLimparTodos: () => void;
}

const COLUMNS = [
  "Item",
  "Código",
  "Descrição",
  "UN",
  "Qtd",
  "Unitário",
  "Desc.",
  "Acrésc.",
  "Total",
  "Ações",
];

export function PDVItemsTable({
  items,
  selectedItemId,
  onSelectRow,
  onAlterarQuantidade,
  onDesconto,
  onAcrescimo,
  onCancelar,
  onRestaurar,
  onLimparTodos,
}: PDVItemsTableProps) {
  const itensAtivos = items.filter((i) => !i.cancelado);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[var(--pdv-border)] bg-white shadow-sm">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--pdv-gray-light)]">
            <tr>
              {COLUMNS.map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "border-b border-[var(--pdv-border)] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--pdv-gray-text)]",
                    i >= 4 && i <= 8 ? "text-right" : "text-left",
                    col === "Ações" && "text-center",
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-20">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pdv-rose-light)] text-[var(--pdv-rose)]">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--pdv-graphite)]">
                      Nenhum item adicionado à venda
                    </p>
                    <p className="text-xs text-[var(--pdv-gray-text)]">
                      Busque ou leia o código de barras para iniciar.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const selected = item.id === selectedItemId && !item.cancelado;
                return (
                  <tr
                    key={item.id}
                    onClick={() => !item.cancelado && onSelectRow(item.id)}
                    className={cn(
                      "cursor-pointer border-b border-[var(--pdv-border)] transition-colors last:border-b-0",
                      selected
                        ? "border-l-4 border-l-[var(--pdv-rose)] bg-[var(--pdv-rose-light)]"
                        : "border-l-4 border-l-transparent hover:bg-[var(--pdv-gray-light)]",
                      item.cancelado && "opacity-50",
                    )}
                  >
                    <td
                      className={cn("px-3 py-2.5 font-medium", selected && "text-[var(--pdv-rose)]")}
                    >
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[var(--pdv-gray-text)]">
                      {item.codigo}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 font-semibold",
                        selected ? "text-[var(--pdv-rose)]" : "text-[var(--pdv-graphite)]",
                        item.cancelado && "line-through",
                      )}
                      title={estoqueLabel(item.estoqueNoMomento)}
                    >
                      {item.descricao}
                      {item.cancelado && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-[var(--pdv-danger)]">
                          Cancelado
                        </span>
                      )}
                      {!item.cancelado &&
                        item.estoqueNoMomento !== null &&
                        item.estoqueNoMomento !== undefined &&
                        item.estoqueNoMomento <= 0 && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-[var(--pdv-danger)]">
                            Estoque zerado
                          </span>
                        )}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--pdv-gray-text)]">UN</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {item.quantidade.toFixed(3)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{brl(item.valor)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--pdv-rose)]">
                      {brl(item.desconto || 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--pdv-graphite)]">
                      {brl(item.acrescimo || 0)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2.5 text-right font-bold tabular-nums",
                        selected ? "text-[var(--pdv-rose)]" : "text-[var(--pdv-graphite)]",
                      )}
                    >
                      {brl(item.total - (item.desconto || 0) + (item.acrescimo || 0))}
                    </td>
                    <td className="px-2 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-gray-light)]"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                          {!item.cancelado ? (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => onAlterarQuantidade(item.id)}
                              >
                                <Hash className="h-4 w-4" /> Alterar quantidade
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => onDesconto(item.id)}
                              >
                                <Tag className="h-4 w-4" /> Aplicar desconto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2"
                                onClick={() => onAcrescimo(item.id)}
                              >
                                <PlusCircle className="h-4 w-4" /> Aplicar acréscimo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-[var(--pdv-danger)] focus:text-[var(--pdv-danger)]"
                                onClick={() => onCancelar(item.id)}
                              >
                                <XCircle className="h-4 w-4" /> Cancelar item
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              className="cursor-pointer gap-2"
                              onClick={() => onRestaurar(item.id)}
                            >
                              <RotateCcw className="h-4 w-4" /> Restaurar item
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[var(--pdv-border)] px-3 py-2.5">
        <span className="text-xs font-semibold text-[var(--pdv-gray-text)]">
          {itensAtivos.length} {itensAtivos.length === 1 ? "item" : "itens"}
        </span>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onLimparTodos}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--pdv-danger)] hover:underline disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Limpar todos os itens
        </button>
      </div>
    </div>
  );
}
