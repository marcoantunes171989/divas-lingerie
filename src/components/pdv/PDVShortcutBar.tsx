import { ShortcutChip } from "./ShortcutChip";
import { bottomBarShortcuts } from "./shortcuts";

export function PDVShortcutBar() {
  return (
    <div className="mt-3 flex shrink-0 items-center gap-2 overflow-x-auto rounded-2xl border border-[var(--pdv-border)] bg-white px-3 py-2 shadow-sm [scrollbar-width:thin]">
      {bottomBarShortcuts.map((s) => (
        <ShortcutChip
          key={s.key}
          shortcutKey={s.key}
          label={s.label}
          icon={s.icon}
          variant="pill"
        />
      ))}
    </div>
  );
}
