import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  categorias: { id: string; nome: string }[];
  categoriaAtiva: string | null;
  onSelectCategoria: (id: string | null) => void;
}

export function ProductFilters({
  categorias,
  categoriaAtiva,
  onSelectCategoria,
}: ProductFiltersProps) {
  const chips = [
    { id: null as string | null, nome: "Todos" },
    ...categorias.map((c) => ({ id: c.id, nome: c.nome })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = categoriaAtiva === chip.id;
        return (
          <button
            key={chip.id ?? "todos"}
            type="button"
            onClick={() => onSelectCategoria(chip.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-[var(--pdv-rose)] bg-[var(--pdv-rose)] text-white shadow-sm"
                : "border-[var(--pdv-border)] bg-white text-[var(--pdv-gray-text)] hover:border-[var(--pdv-rose)]/50 hover:text-[var(--pdv-rose-dark)]",
            )}
          >
            {chip.nome}
          </button>
        );
      })}
    </div>
  );
}
