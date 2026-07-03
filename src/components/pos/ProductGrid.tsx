import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import type { ProdutoPDV } from "./types";

interface ProductGridProps {
  produtos: ProdutoPDV[];
  getDisponivel: (produto: ProdutoPDV) => number;
  onAdd: (produto: ProdutoPDV) => void;
  searchTerm: string;
  onClearSearch: () => void;
  onCadastrarProduto?: () => void;
}

export function ProductGrid({
  produtos,
  getDisponivel,
  onAdd,
  searchTerm,
  onClearSearch,
  onCadastrarProduto,
}: ProductGridProps) {
  if (produtos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--pdv-border)] bg-white/60 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pdv-rose-light)] text-[var(--pdv-rose-dark)]">
          <PackageSearch className="h-7 w-7" />
        </div>
        <p className="font-display text-base font-bold text-[var(--pdv-graphite)]">
          {searchTerm ? "Nenhum produto encontrado" : "Comece uma nova venda"}
        </p>
        <p className="max-w-xs text-sm text-[var(--pdv-gray-text)]">
          {searchTerm
            ? "Verifique o código, nome ou cadastre o produto antes de vender."
            : "Busque um produto por código, EAN, nome, cor ou tamanho para iniciar a venda."}
        </p>
        {searchTerm && (
          <div className="mt-2 flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onClearSearch}>
              Limpar busca
            </Button>
            {onCadastrarProduto && (
              <Button
                className="rounded-xl bg-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-dark)]"
                onClick={onCadastrarProduto}
              >
                Cadastrar novo produto
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {produtos.map((produto) => (
        <ProductCard
          key={produto.id}
          produto={produto}
          disponivel={getDisponivel(produto)}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}
