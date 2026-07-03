import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortcutChipProps {
  shortcutKey: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "row" | "pill";
  className?: string;
}

export function ShortcutChip({
  shortcutKey,
  label,
  icon: Icon,
  onClick,
  variant = "row",
  className,
}: ShortcutChipProps) {
  const Comp = onClick ? "button" : "div";

  if (variant === "pill") {
    return (
      <Comp
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl border border-[var(--pdv-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--pdv-gray-text)] transition-colors",
          onClick && "hover:border-[var(--pdv-rose)] hover:text-[var(--pdv-rose)]",
          className,
        )}
      >
        <kbd className="rounded-md border border-[var(--pdv-border)] bg-[var(--pdv-gray-light)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--pdv-graphite)]">
          {shortcutKey}
        </kbd>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{label}</span>
      </Comp>
    );
  }

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-[var(--pdv-graphite)] transition-colors",
        onClick && "hover:border-[var(--pdv-border)] hover:bg-[var(--pdv-rose-bg)]",
        className,
      )}
    >
      <kbd className="flex h-6 min-w-[28px] shrink-0 items-center justify-center rounded-md bg-[var(--pdv-rose-light)] px-1.5 font-mono text-[10px] font-bold text-[var(--pdv-rose)]">
        {shortcutKey}
      </kbd>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--pdv-gray-text)]" />}
      <span className="truncate">{label}</span>
    </Comp>
  );
}
