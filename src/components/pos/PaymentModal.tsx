import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FinalizadoraRow, PagamentoItem } from "./types";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  clienteNome: string;
  finalizadoras: FinalizadoraRow[];
  pagamentos: PagamentoItem[];
  onTogglePagamento: (forma: string) => void;
  onUpdatePagamentoValor: (id: string, valor: number) => void;
  totalPago: number;
  troco: number;
  valorFaltante: number;
  observacao: string;
  onObservacaoChange: (v: string) => void;
  isFinishing: boolean;
  onConfirm: () => void;
}

export function PaymentModal({
  open,
  onClose,
  total,
  clienteNome,
  finalizadoras,
  pagamentos,
  onTogglePagamento,
  onUpdatePagamentoValor,
  totalPago,
  troco,
  valorFaltante,
  observacao,
  onObservacaoChange,
  isFinishing,
  onConfirm,
}: PaymentModalProps) {
  const podeConfirmar = pagamentos.length > 0 && valorFaltante <= 0.01;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isFinishing && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Finalizar pagamento</DialogTitle>
          <DialogDescription>Cliente: {clienteNome}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-2xl bg-[var(--pdv-rose-bg)] px-4 py-3">
          <span className="text-xs font-bold uppercase text-[var(--pdv-rose-dark)]">
            Total da venda
          </span>
          <span className="font-display text-2xl font-black text-[var(--pdv-rose-dark)]">
            {brl(total)}
          </span>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase text-[var(--pdv-gray-text)]">
            Forma de pagamento
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {finalizadoras.map((fin) => {
              const ativo = pagamentos.some(
                (p) => p.forma.toLowerCase() === fin.fin_descricao.toLowerCase(),
              );
              return (
                <button
                  key={fin.id}
                  type="button"
                  onClick={() => onTogglePagamento(fin.fin_descricao)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                    ativo
                      ? "border-[var(--pdv-rose)] bg-[var(--pdv-rose)] text-white"
                      : "border-[var(--pdv-border)] bg-white text-[var(--pdv-graphite)] hover:border-[var(--pdv-rose)]/50",
                  )}
                >
                  {fin.fin_descricao}
                </button>
              );
            })}
          </div>
        </div>

        {pagamentos.length > 0 && (
          <div className="space-y-2">
            {pagamentos.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs font-semibold text-[var(--pdv-gray-text)]">
                  {p.forma}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={p.valor || ""}
                  onChange={(e) => onUpdatePagamentoValor(p.id, Number(e.target.value) || 0)}
                  className="h-10 rounded-xl"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between gap-4 rounded-xl border border-[var(--pdv-border)] px-4 py-3 text-sm">
          <div>
            <p className="text-[11px] text-[var(--pdv-gray-text)]">Valor recebido</p>
            <p className="font-bold text-[var(--pdv-graphite)]">{brl(totalPago)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--pdv-gray-text)]">
              {valorFaltante > 0.01 ? "Falta" : "Troco"}
            </p>
            <p
              className={cn(
                "font-bold",
                valorFaltante > 0.01 ? "text-[var(--pdv-danger)]" : "text-[var(--pdv-success)]",
              )}
            >
              {brl(valorFaltante > 0.01 ? valorFaltante : troco)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdv-observacao">Observação (opcional)</Label>
          <Textarea
            id="pdv-observacao"
            value={observacao}
            onChange={(e) => onObservacaoChange(e.target.value)}
            className="rounded-xl"
            rows={2}
          />
        </div>

        <Button
          disabled={!podeConfirmar || isFinishing}
          onClick={onConfirm}
          className="h-14 w-full rounded-2xl bg-[var(--pdv-rose)] text-base font-bold uppercase text-white hover:bg-[var(--pdv-rose-dark)]"
        >
          {isFinishing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar pagamento"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
