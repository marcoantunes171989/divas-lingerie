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
    <aside className="flex w-[300px] shrink-0 flex-col gap-2 overflow-y-auto rounded-2xl border border-[var(--pdv-border)] bg-white p-3 shadow-sm xl:w-[340px] xl:gap-2.5 xl:p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-[var(--pdv-graphite)]">Resumo da Venda</h2>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--pdv-gray-text)]">
          <CalendarClock className="h-3.5 w-3.5" />
          {now.toLocaleDateString("pt-BR")}{" "}
          {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <button
        type="button"
        onClick={onSelecionarCliente}
        className="flex items-center gap-2 rounded-xl bg-[var(--pdv-rose-light)] px-3 py-2 text-left text-xs font-semibold text-[var(--pdv-rose)] xl:py-2.5 xl:text-sm"
      >
        <User className="h-4 w-4 shrink-0" />
        <span className="truncate">{clienteNome ?? "Cliente não identificado"}</span>
      </button>

      <button
        type="button"
        onClick={onSelecionarVendedor}
        className="flex items-center gap-2 rounded-xl border border-[var(--pdv-border)] bg-white px-3 py-2 text-left text-xs font-medium text-[var(--pdv-graphite)] xl:py-2.5 xl:text-sm"
      >
        <UserRound className="h-4 w-4 shrink-0 text-[var(--pdv-gray-text)]" />
        <span className="min-w-0 flex-1 truncate">
          Vendedor: {vendedorNome ?? "não selecionado"}
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-[var(--pdv-gray-text)]" />
      </button>

      <div className="space-y-1 border-t border-[var(--pdv-border)] pt-2 text-xs xl:text-sm">
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

      <div className="flex items-center justify-between rounded-2xl bg-[var(--pdv-rose-light)] px-4 py-2.5 xl:py-3">
        <span className="font-display text-xs font-bold uppercase tracking-wide text-[var(--pdv-rose)] xl:text-sm">
          Total
        </span>
        <span className="font-display text-2xl font-extrabold text-[var(--pdv-rose)] xl:text-3xl">
          {brl(total)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 xl:gap-2">
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
        className="h-11 w-full gap-2 rounded-2xl bg-[var(--pdv-rose-dark)] text-sm font-bold uppercase tracking-wide text-white hover:bg-[var(--pdv-rose)] xl:h-14 xl:text-base"
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
        className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[var(--pdv-border)] text-xs font-semibold text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-gray-light)] disabled:pointer-events-none disabled:opacity-40 xl:h-11 xl:text-sm"
      >
        <XCircle className="h-4 w-4" /> Cancelar venda
        <span className="rounded-md bg-[var(--pdv-gray-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--pdv-gray-text)]">
          {shortcutConfig.cancelSale}
        </span>
      </button>
    </aside>
  );
}
