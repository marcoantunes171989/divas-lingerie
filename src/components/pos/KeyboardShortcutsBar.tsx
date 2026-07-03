const SHORTCUTS: [string, string][] = [
  ["F2", "Buscar produto"],
  ["F3", "Consultar preço"],
  ["F4", "Selecionar cliente"],
  ["F5", "Aplicar desconto"],
  ["F6", "Pagamento"],
  ["F8", "Cancelar item"],
  ["F9", "Cancelar venda"],
  ["F10", "Finalizar venda"],
  ["ESC", "Fechar modal"],
];

export function KeyboardShortcutsBar() {
  return (
    <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[var(--pdv-border)] bg-white/70 px-4 py-2 text-[11px] text-[var(--pdv-gray-text)] lg:flex">
      {SHORTCUTS.map(([key, label]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <kbd className="rounded-md border border-[var(--pdv-border)] bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--pdv-graphite)]">
            {key}
          </kbd>
          {label}
        </span>
      ))}
    </div>
  );
}
