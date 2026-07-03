import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProdutoPDV } from "./types";

interface ProductCardProps {
  produto: ProdutoPDV;
  disponivel: number;
  onAdd: (produto: ProdutoPDV) => void;
  onDetails?: (produto: ProdutoPDV) => void;
}

export function ProductCard({ produto, disponivel, onAdd, onDetails }: ProductCardProps) {
  const semEstoque = disponivel <= 0;
  const estoqueBaixo = !semEstoque && disponivel <= (produto.pro_estoque_minimo || 3);
  const emPromocao = false;

  return (
    <div
      role="button"
      onClick={() => !semEstoque && onAdd(produto)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all",
        "border-[var(--pdv-border)] hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--pdv-rose)]/40",
        semEstoque && "cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-sm",
      )}
    >
      <div
        className="relative flex h-28 items-center justify-center bg-[var(--pdv-rose-bg)] text-3xl font-display font-bold text-[var(--pdv-rose)]/40"
        onClick={(e) => {
          if (onDetails) {
            e.stopPropagation();
            onDetails(produto);
          }
        }}
      >
        {produto.pro_descricao?.charAt(0).toUpperCase() ?? "?"}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {emPromocao && (
            <Badge className="bg-[var(--pdv-warning)] text-white border-none shadow">
              Promoção
            </Badge>
          )}
          {estoqueBaixo && (
            <Badge className="bg-[var(--pdv-danger)] text-white border-none shadow">
              Estoque baixo
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-[var(--pdv-graphite)]">
          {produto.pro_descricao}
        </p>
        <p className="text-[11px] text-[var(--pdv-gray-text)]">Código: {produto.pro_codigo}</p>
        <p className="text-[11px] text-[var(--pdv-gray-text)]">
          {produto.tab_cores?.cor_nome && <>Cor: {produto.tab_cores.cor_nome} </>}
          {produto.tab_tamanhos?.tam_nome && <>| Tam: {produto.tab_tamanhos.tam_nome}</>}
        </p>
        <p className="text-[11px] text-[var(--pdv-gray-text)]">Estoque: {disponivel} un.</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-base font-bold text-[var(--pdv-rose-dark)]">
            {brl(Number(produto.pro_valor_venda))}
          </span>
          <button
            type="button"
            disabled={semEstoque}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(produto);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pdv-rose)] text-white shadow transition-transform hover:scale-110 disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
