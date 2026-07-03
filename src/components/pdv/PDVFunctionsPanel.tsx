import { Settings2, X } from "lucide-react";
import { ShortcutChip } from "./ShortcutChip";
import { allFunctionsShortcuts } from "./shortcuts";

interface PDVFunctionsPanelProps {
  open: boolean;
  onClose: () => void;
  onShortcutClick: (key: string) => void;
}

export function PDVFunctionsPanel({ open, onClose, onShortcutClick }: PDVFunctionsPanelProps) {
  if (!open) return null;

  return (
    <aside className="flex w-[230px] shrink-0 flex-col gap-3 rounded-2xl border border-[var(--pdv-border)] bg-white p-4 shadow-sm lg:w-[250px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[var(--pdv-rose)]" />
          <h2 className="font-display text-sm font-bold text-[var(--pdv-graphite)]">
            Todas as Funções
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-gray-light)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <span className="inline-flex w-fit items-center rounded-full bg-[var(--pdv-rose-light)] px-2.5 py-1 text-[10px] font-semibold text-[var(--pdv-rose)]">
        Atalhos configuráveis
      </span>

      <div className="flex flex-col gap-0.5">
        {allFunctionsShortcuts.map((s) => (
          <ShortcutChip
            key={s.key}
            shortcutKey={s.key}
            label={s.label}
            icon={s.icon}
            onClick={() => onShortcutClick(s.key)}
          />
        ))}
      </div>

      <div className="mt-auto rounded-xl bg-[var(--pdv-rose-light)] p-3 text-xs leading-relaxed text-[var(--pdv-rose)]">
        Personalize os atalhos nas configurações do PDV e otimize sua operação.
      </div>
    </aside>
  );
}
