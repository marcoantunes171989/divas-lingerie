import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import { printRecibo, type ReciboVendaData } from "@/lib/recibo-venda";
import { ReceiptPreview } from "@/components/pos/ReceiptPreview";

interface Props {
  open: boolean;
  onClose: () => void;
  data: ReciboVendaData | null;
  onDownloadPDF?: () => void;
}

export function CupomFiscalPreview({ open, onClose, data, onDownloadPDF }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xs p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-white leading-none">
              Cupom Fiscal
            </DialogTitle>
            <p className="text-[10px] text-white/40 mt-0.5">Nº {data.cupomFiscal}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Receipt — usa o mesmo HTML gerado pelo PDF/PNG */}
        <div className="bg-slate-100 p-5 overflow-y-auto max-h-[60vh]">
          <ReceiptPreview data={data} className="shadow-xl" />
        </div>

        {/* Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
          <Button
            className="w-full h-12 rounded-xl font-black uppercase text-xs bg-primary text-white shadow-lg shadow-primary/20"
            onClick={() => printRecibo(data)}
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir Cupom
          </Button>
          {onDownloadPDF && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold uppercase text-xs border-slate-200 text-slate-600"
              onClick={onDownloadPDF}
            >
              <Download className="w-4 h-4 mr-2" /> Baixar PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
