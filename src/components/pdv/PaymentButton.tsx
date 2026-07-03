import type { LucideIcon } from "lucide-react";

interface PaymentButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

export function PaymentButton({ label, icon: Icon, onClick, disabled }: PaymentButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-[var(--pdv-border)] bg-white text-[11px] font-semibold text-[var(--pdv-graphite)] transition-colors hover:border-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-bg)] disabled:pointer-events-none disabled:opacity-40 xl:h-16 xl:gap-1 xl:text-xs"
    >
      <Icon className="h-4 w-4 text-[var(--pdv-rose)] xl:h-5 xl:w-5" />
      {label}
    </button>
  );
}
