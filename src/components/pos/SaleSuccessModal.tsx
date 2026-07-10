import { CheckCircle2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl } from "@/lib/format";
import { ReceiptPreview } from "./ReceiptPreview";
import { ReceiptActions } from "./ReceiptActions";
import type { ReciboVendaData } from "@/lib/recibo-venda";

export interface LastSaleSummary {
  numero: string;
  total: number;
  formaPagamento: string;
  clienteNome: string;
  operadorNome: string;
  vendedorNome: string;
  status: string;
  dataHora: Date;
}

interface SaleSuccessModalProps {
  open: boolean;
  onClose: () => void;
  sale: LastSaleSummary | null;
  receiptData: ReciboVendaData | null;
  whatsappNumber: string;
  onWhatsappNumberChange: (value: string) => void;
  whatsappFromCadastro?: boolean;
  onNovaVenda: () => void;
  onImprimir: () => void;
  onWhatsapp: () => void;
  onPDF: () => void;
  onVerDetalhes?: () => void;
  isSendingWhatsapp?: boolean;
  isGeneratingPDF?: boolean;
}

export function SaleSuccessModal({
  open,
  onClose,
  sale,
  receiptData,
  whatsappNumber,
  onWhatsappNumberChange,
  whatsappFromCadastro,
  onNovaVenda,
  onImprimir,
  onWhatsapp,
  onPDF,
  onVerDetalhes,
  isSendingWhatsapp,
  isGeneratingPDF,
}: SaleSuccessModalProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border-none bg-[var(--pdv-rose-bg)] p-0">
        <DialogTitle className="sr-only">Venda finalizada com sucesso</DialogTitle>
        <div className="grid max-h-[85vh] grid-cols-1 gap-0 overflow-y-auto md:grid-cols-2">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pdv-success)]/15 text-[var(--pdv-success)]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-lg font-extrabold text-[var(--pdv-graphite)]">
                  Venda finalizada com sucesso
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-[var(--pdv-gray-text)]">
                  Total
                </p>
                <p className="font-display text-2xl font-black text-[var(--pdv-rose-dark)]">
                  {brl(sale.total)}
                </p>
              </div>
              <SummaryCard label="Venda nº" value={sale.numero} />
              <SummaryCard label="Pagamento" value={sale.formaPagamento} />
              <SummaryCard label="Cliente" value={sale.clienteNome} />
              <SummaryCard label="Operador" value={sale.operadorNome} />
              <SummaryCard label="Vendedor" value={sale.vendedorNome || "não selecionado"} />
              <SummaryCard label="Status" value={sale.status} />
              <SummaryCard
                label="Data/hora"
                value={sale.dataHora.toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="sale-success-whatsapp"
                  className="text-[11px] font-semibold uppercase text-[var(--pdv-gray-text)]"
                >
                  WhatsApp do cliente
                </Label>
                {whatsappFromCadastro && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pdv-success)]">
                    <CheckCircle className="h-3 w-3" /> Do cadastro
                  </span>
                )}
              </div>
              <Input
                id="sale-success-whatsapp"
                value={whatsappNumber}
                onChange={(e) => onWhatsappNumberChange(e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-11 rounded-xl"
              />
            </div>

            <ReceiptActions
              onNovaVenda={onNovaVenda}
              onImprimir={onImprimir}
              onWhatsapp={onWhatsapp}
              onPDF={onPDF}
              onVerDetalhes={onVerDetalhes}
              isSendingWhatsapp={isSendingWhatsapp}
              isGeneratingPDF={isGeneratingPDF}
              whatsappDisabled={whatsappNumber.replace(/\D/g, "").length < 10}
            />
          </div>

          <div className="flex items-start justify-center bg-slate-100 p-6">
            {receiptData && <ReceiptPreview data={receiptData} className="shadow-xl" />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase text-[var(--pdv-gray-text)]">{label}</p>
      <p className="truncate text-sm font-bold text-[var(--pdv-graphite)]">{value}</p>
    </div>
  );
}
