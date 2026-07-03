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
      className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl border border-[var(--pdv-border)] bg-white text-xs font-semibold text-[var(--pdv-graphite)] transition-colors hover:border-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-bg)] disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="h-5 w-5 text-[var(--pdv-rose)]" />
      {label}
    </button>
  );
}
