import { forwardRef } from "react";
import { Barcode, LayoutGrid, Percent, PlusCircle, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import type { ProdutoPDV } from "@/components/pos/types";

interface PDVActionBarProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  suggestions: ProdutoPDV[];
  onSelectSuggestion: (produto: ProdutoPDV) => void;
  onScan: () => void;
  onSelecionarCliente: () => void;
  onDesconto: () => void;
  onAcrescimo: () => void;
  onToggleFunctions: () => void;
}

export const PDVActionBar = forwardRef<HTMLInputElement, PDVActionBarProps>(function PDVActionBar(
  {
    value,
    onChange,
    onEnter,
    suggestions,
    onSelectSuggestion,
    onScan,
    onSelecionarCliente,
    onDesconto,
    onAcrescimo,
    onToggleFunctions,
  },
  ref,
) {
  const showSuggestions = value.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative shrink-0 rounded-2xl border border-[var(--pdv-border)] bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--pdv-rose)]" />
          <Input
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEnter();
            }}
            placeholder="Buscar produto por código, EAN ou nome"
            className="h-12 w-full rounded-xl border-[var(--pdv-border)] bg-white pl-11 text-sm focus-visible:ring-[var(--pdv-rose)]"
          />

          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--pdv-border)] bg-white shadow-lg">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectSuggestion(p)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm hover:bg-[var(--pdv-rose-bg)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-mono text-[11px] text-[var(--pdv-gray-text)]">
                      {p.pro_codigo}
                    </span>{" "}
                    <span className="font-medium text-[var(--pdv-graphite)]">
                      {p.pro_descricao}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-[var(--pdv-rose-dark)]">
                    {brl(Number(p.pro_valor_venda))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onScan}
            className="h-11 gap-1.5 rounded-xl"
          >
            <Barcode className="h-4 w-4 text-[var(--pdv-rose)]" /> Ler código
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSelecionarCliente}
            className="h-11 gap-1.5 rounded-xl"
          >
            <User className="h-4 w-4 text-[var(--pdv-rose)]" /> Selecionar cliente
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDesconto}
            className="h-11 gap-1.5 rounded-xl"
          >
            <Percent className="h-4 w-4 text-[var(--pdv-rose)]" /> Aplicar desconto
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onAcrescimo}
            className="h-11 gap-1.5 rounded-xl"
          >
            <PlusCircle className="h-4 w-4 text-[var(--pdv-rose)]" /> Aplicar acréscimo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onToggleFunctions}
            className="h-11 gap-1.5 rounded-xl"
          >
            <LayoutGrid className="h-4 w-4 text-[var(--pdv-rose)]" /> Todas as funções
          </Button>
        </div>
      </div>
    </div>
  );
});
