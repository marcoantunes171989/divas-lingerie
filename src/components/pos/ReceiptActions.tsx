import { Download, Eye, MessageCircle, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptActionsProps {
  onNovaVenda: () => void;
  onImprimir: () => void;
  onWhatsapp: () => void;
  onPDF: () => void;
  onVerDetalhes?: () => void;
  isSendingWhatsapp?: boolean;
  isGeneratingPDF?: boolean;
  whatsappDisabled?: boolean;
}

export function ReceiptActions({
  onNovaVenda,
  onImprimir,
  onWhatsapp,
  onPDF,
  onVerDetalhes,
  isSendingWhatsapp,
  isGeneratingPDF,
  whatsappDisabled,
}: ReceiptActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onNovaVenda}
        className="h-12 gap-2 rounded-xl bg-[var(--pdv-rose)] font-bold uppercase text-white hover:bg-[var(--pdv-rose-dark)]"
      >
        <Sparkles className="h-4 w-4" /> Nova venda
      </Button>
      <Button
        onClick={onImprimir}
        className="h-12 gap-2 rounded-xl bg-[var(--pdv-graphite)] font-bold uppercase text-white hover:bg-[var(--pdv-graphite)]/90"
      >
        <Printer className="h-4 w-4" /> Imprimir cupom
      </Button>
      <Button
        onClick={onWhatsapp}
        disabled={isSendingWhatsapp || whatsappDisabled}
        className="h-12 gap-2 rounded-xl bg-[var(--pdv-success)] font-bold uppercase text-white hover:bg-[var(--pdv-success)]/90 disabled:opacity-40"
      >
        <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
      </Button>
      <Button
        variant="outline"
        onClick={onPDF}
        disabled={isGeneratingPDF}
        className="h-12 gap-2 rounded-xl border-[var(--pdv-border)] font-bold uppercase"
      >
        <Download className="h-4 w-4" /> Baixar PDF
      </Button>
      {onVerDetalhes && (
        <Button
          variant="ghost"
          onClick={onVerDetalhes}
          className="h-10 gap-2 rounded-xl text-xs font-semibold text-[var(--pdv-gray-text)]"
        >
          <Eye className="h-3.5 w-3.5" /> Ver detalhes da venda
        </Button>
      )}
    </div>
  );
}
