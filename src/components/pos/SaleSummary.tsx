import { Banknote, CreditCard, QrCode, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";

interface SaleSummaryProps {
  quantidadeItens: number;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  disabled: boolean;
  onFinalizar: () => void;
  onPagamentoRapido: (forma: "PIX" | "DINHEIRO" | "CARTAO") => void;
  onCancelarVenda: () => void;
}

export function SaleSummary({
  quantidadeItens,
  subtotal,
  desconto,
  acrescimo,
  total,
  disabled,
  onFinalizar,
  onPagamentoRapido,
  onCancelarVenda,
}: SaleSummaryProps) {
  return (
    <div className="border-t border-[var(--pdv-border)] bg-white p-4">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-[var(--pdv-gray-text)]">
          <span>Qtd. itens</span>
          <span>{quantidadeItens}</span>
        </div>
        <div className="flex justify-between text-[var(--pdv-gray-text)]">
          <span>Subtotal</span>
          <span>{brl(subtotal)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-[var(--pdv-danger)]">
            <span>Desconto</span>
            <span>- {brl(desconto)}</span>
          </div>
        )}
        {acrescimo > 0 && (
          <div className="flex justify-between text-[var(--pdv-success)]">
            <span>Acréscimo</span>
            <span>+ {brl(acrescimo)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between rounded-2xl bg-[var(--pdv-rose-bg)] px-4 py-3">
        <span className="font-display text-xs font-bold uppercase tracking-wide text-[var(--pdv-rose-dark)]">
          Total
        </span>
        <span className="font-display text-3xl font-black text-[var(--pdv-rose-dark)]">
          {brl(total)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => onPagamentoRapido("PIX")}
          className="h-11 flex-col gap-0.5 rounded-xl text-[11px]"
        >
          <QrCode className="h-4 w-4" />
          PIX
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => onPagamentoRapido("DINHEIRO")}
          className="h-11 flex-col gap-0.5 rounded-xl text-[11px]"
        >
          <Banknote className="h-4 w-4" />
          Dinheiro
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => onPagamentoRapido("CARTAO")}
          className="h-11 flex-col gap-0.5 rounded-xl text-[11px]"
        >
          <CreditCard className="h-4 w-4" />
          Cartão
        </Button>
      </div>

      <Button
        disabled={disabled}
        onClick={onFinalizar}
        className="mt-3 h-14 w-full rounded-2xl bg-[var(--pdv-rose)] text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-[var(--pdv-rose)]/30 hover:bg-[var(--pdv-rose-dark)]"
      >
        Finalizar Venda
      </Button>

      <button
        type="button"
        disabled={disabled}
        onClick={onCancelarVenda}
        className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--pdv-gray-text)] hover:text-[var(--pdv-danger)] disabled:opacity-40"
      >
        <XCircle className="h-3.5 w-3.5" /> Cancelar venda
      </button>
    </div>
  );
}
