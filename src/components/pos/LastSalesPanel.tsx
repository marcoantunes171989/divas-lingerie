import { Clock, MessageCircle, Printer, RotateCcw, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface VendaResumo {
  id: string;
  numero: string;
  clienteNome: string;
  valor: number;
  formaPagamento: string;
  horario: string;
  status: string;
}

interface LastSalesPanelProps {
  vendas: VendaResumo[];
  onReimprimir: (venda: VendaResumo) => void;
  onReenviarWhatsapp: (venda: VendaResumo) => void;
  onCancelar: (venda: VendaResumo) => void;
  onDevolucao?: (venda: VendaResumo) => void;
}

export function LastSalesPanel({
  vendas,
  onReimprimir,
  onReenviarWhatsapp,
  onCancelar,
  onDevolucao,
}: LastSalesPanelProps) {
  if (vendas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--pdv-border)] bg-white/60 p-6 text-center text-sm text-[var(--pdv-gray-text)]">
        Nenhuma venda registrada ainda hoje.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--pdv-border)] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--pdv-border)] px-4 py-3">
        <Clock className="h-4 w-4 text-[var(--pdv-rose)]" />
        <h3 className="font-display text-sm font-bold text-[var(--pdv-graphite)]">
          Últimas vendas
        </h3>
      </div>
      <ScrollArea className="max-h-64">
        <div className="divide-y divide-[var(--pdv-border)]">
          {vendas.map((venda) => {
            const cancelada = venda.status === "cancelada";
            return (
              <div key={venda.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--pdv-graphite)]">
                      #{venda.numero} · {venda.clienteNome}
                    </p>
                    {cancelada && (
                      <Badge
                        variant="outline"
                        className="border-[var(--pdv-danger)] text-[var(--pdv-danger)]"
                      >
                        Cancelada
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--pdv-gray-text)]">
                    {venda.horario} · {venda.formaPagamento}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={cn(
                      "mr-1 text-sm font-bold",
                      cancelada
                        ? "text-[var(--pdv-gray-text)] line-through"
                        : "text-[var(--pdv-graphite)]",
                    )}
                  >
                    {brl(venda.valor)}
                  </span>
                  <button
                    type="button"
                    title="Reimprimir cupom"
                    onClick={() => onReimprimir(venda)}
                    className="rounded-full p-1.5 text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-rose-bg)] hover:text-[var(--pdv-rose-dark)]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Reenviar por WhatsApp"
                    onClick={() => onReenviarWhatsapp(venda)}
                    className="rounded-full p-1.5 text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-rose-bg)] hover:text-[var(--pdv-success)]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                  {onDevolucao && (
                    <button
                      type="button"
                      title="Gerar devolução"
                      onClick={() => onDevolucao(venda)}
                      className="rounded-full p-1.5 text-[var(--pdv-gray-text)] hover:bg-[var(--pdv-rose-bg)] hover:text-[var(--pdv-warning)]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!cancelada && (
                    <button
                      type="button"
                      title="Cancelar venda"
                      onClick={() => onCancelar(venda)}
                      className="rounded-full p-1.5 text-[var(--pdv-gray-text)] hover:bg-red-50 hover:text-[var(--pdv-danger)]"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
