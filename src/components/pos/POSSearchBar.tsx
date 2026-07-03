import { forwardRef } from "react";
import { Camera, Percent, Repeat2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface POSSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  onDesconto: () => void;
  onTrocaDevolucao?: () => void;
}

export const POSSearchBar = forwardRef<HTMLInputElement, POSSearchBarProps>(function POSSearchBar(
  { value, onChange, onScan, onDesconto, onTrocaDevolucao },
  ref,
) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--pdv-rose)]" />
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar produto por código, EAN, nome, categoria, cor, tamanho ou valor..."
          className="h-14 rounded-2xl border-[var(--pdv-border)] bg-white pl-12 pr-10 text-base shadow-sm focus-visible:ring-[var(--pdv-rose)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--pdv-gray-text)] hover:text-[var(--pdv-graphite)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onScan}
          className="h-14 flex-1 gap-2 rounded-2xl border-[var(--pdv-border)] px-4 sm:flex-none"
        >
          <Camera className="h-5 w-5 text-[var(--pdv-rose)]" />
          <span className="hidden sm:inline">Ler código</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDesconto}
          className="h-14 flex-1 gap-2 rounded-2xl border-[var(--pdv-border)] px-4 sm:flex-none"
        >
          <Percent className="h-5 w-5 text-[var(--pdv-rose)]" />
          <span className="hidden sm:inline">Desconto</span>
        </Button>
        {onTrocaDevolucao && (
          <Button
            type="button"
            variant="outline"
            onClick={onTrocaDevolucao}
            className="h-14 flex-1 gap-2 rounded-2xl border-[var(--pdv-border)] px-4 sm:flex-none"
          >
            <Repeat2 className="h-5 w-5 text-[var(--pdv-rose)]" />
            <span className="hidden sm:inline">Troca/Devolução</span>
          </Button>
        )}
      </div>
    </div>
  );
});
