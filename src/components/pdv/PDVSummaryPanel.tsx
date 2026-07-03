import {
  Banknote,
  CalendarClock,
  CreditCard,
  Pencil,
  QrCode,
  User,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { PaymentButton } from "./PaymentButton";
import { shortcutConfig } from "./shortcuts";

interface PDVSummaryPanelProps {
  clienteNome: string | null;
  onSelecionarCliente: () => void;
  vendedorNome: string | null;
  onSelecionarVendedor: () => void;
  quantidadeItens: number;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  disabled: boolean;
  onPagamentoRapido: (forma: "PIX" | "DINHEIRO" | "CARTAO" | "OUTROS") => void;
  onFinalizar: () => void;
  onCancelarVenda: () => void;
}

export function PDVSummaryPanel({
  clienteNome,
  onSelecionarCliente,
  vendedorNome,
  onSelecionarVendedor,
  quantidadeItens,
  subtotal,
  desconto,
  acrescimo,
  total,
  disabled,
  onPagamentoRapido,
  onFinalizar,
  onCancelarVenda,
}: PDVSummaryPanelProps) {
  const now = new Date();

  return (
    <aside className="flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-[var(--pdv-border)] bg-white p-4 shadow-sm">
      <h2 className="font-display text-sm font-bold text-[var(--pdv-graphite)]">Resumo da Venda</h2>

      <div className="flex items-center gap-2 text-xs text-[var(--pdv-gray-text)]">
        <CalendarClock className="h-4 w-4" />
        {now.toLocaleDateString("pt-BR")}{" "}
        {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      <button
        type="button"
        onClick={onSelecionarCliente}
        className="flex items-center gap-2 rounded-xl bg-[var(--pdv-rose-light)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--pdv-rose)]"
      >
        <User className="h-4 w-4 shrink-0" />
        <span className="truncate">{clienteNome ?? "Cliente não identificado"}</span>
      </button>

      <button
        type="button"
        onClick={onSelecionarVendedor}
        className="flex items-center gap-2 rounded-xl border border-[var(--pdv-border)] bg-white px-3 py-2.5 text-left text-sm font-medium text-[var(--pdv-graphite)]"
      >
        <UserRound className="h-4 w-4 shrink-0 text-[var(--pdv-gray-text)]" />
        <span className="min-w-0 flex-1 truncate">
          Vendedor: {vendedorNome ?? "não selecionado"}
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-[var(--pdv-gray-text)]" />
      </button>

      <div className="space-y-2 border-t border-[var(--pdv-border)] pt-3 text-sm">
        <div className="flex justify-between text-[var(--pdv-gray-text)]">
          <span>Quantidade total de itens</span>
          <span className="font-semibold text-[var(--pdv-graphite)]">{quantidadeItens}</span>
        </div>
        <div className="flex justify-between text-[var(--pdv-gray-text)]">
          <span>Subtotal</span>
          <span className="font-semibold text-[var(--pdv-graphite)]">{brl(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--pdv-gray-text)]">
          <span>Descontos</span>
          <span className="font-semibold text-[var(--pdv-rose)]">- {brl(desconto)}</span>
        </div>
        <div className="flex justify-between text-[var(--pdv-gray-text)]">
          <span>Acréscimos</span>
          <span className="font-semibold text-[var(--pdv-graphite)]">{brl(acrescimo)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-[var(--pdv-rose-light)] px-4 py-4">
        <span className="font-display text-sm font-bold uppercase tracking-wide text-[var(--pdv-rose)]">
          Total
        </span>
        <span className="font-display text-3xl font-extrabold text-[var(--pdv-rose)]">
          {brl(total)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <PaymentButton
          label="PIX"
          icon={QrCode}
          disabled={disabled}
          onClick={() => onPagamentoRapido("PIX")}
        />
        <PaymentButton
          label="Dinheiro"
          icon={Banknote}
          disabled={disabled}
          onClick={() => onPagamentoRapido("DINHEIRO")}
        />
        <PaymentButton
          label="Cartão"
          icon={CreditCard}
          disabled={disabled}
          onClick={() => onPagamentoRapido("CARTAO")}
        />
        <PaymentButton
          label="Convênio / Outros"
          icon={Wallet}
          disabled={disabled}
          onClick={() => onPagamentoRapido("OUTROS")}
        />
      </div>

      <Button
        disabled={disabled}
        onClick={onFinalizar}
        className="h-14 w-full gap-2 rounded-2xl bg-[var(--pdv-rose-dark)] text-base font-bold uppercase tracking-wide text-white hover:bg-[var(--pdv-rose)]"
      >
        Finalizar Venda
        <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
          {shortcutConfig.finishSale}
        </span>
      </Button>

      <button
        type="button"
        disabled={disabled}
        onClick={onCancelarVenda}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--pdv-border)] text-sm font-semibold text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-gray-light)] disabled:pointer-events-none disabled:opacity-40"
      >
        <XCircle className="h-4 w-4" /> Cancelar venda
        <span className="rounded-md bg-[var(--pdv-gray-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--pdv-gray-text)]">
          {shortcutConfig.cancelSale}
        </span>
      </button>
    </aside>
  );
}
