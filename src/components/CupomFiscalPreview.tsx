import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
import { buildReceiptInnerHTML, type ReciboVendaData } from "@/lib/recibo-venda";

interface Props {
  open: boolean;
  onClose: () => void;
  data: ReciboVendaData | null;
  onDownloadPDF?: () => void;
}

const RECEIPT_STYLE = `
  width: 280px;
  padding: 16px 14px 20px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  color: #000;
  background: #fff;
`;

const PRINT_CSS = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 80mm; padding: 4mm; background: #fff; }
  .receipt { ${RECEIPT_STYLE.replace(/\n/g, " ")} width: 100%; }
`;

export function CupomFiscalPreview({ open, onClose, data, onDownloadPDF }: Props) {
  const handlePrint = () => {
    if (!data) return;
    const printWin = window.open("", "_blank", "width=420,height=750");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Cupom – Divas Lingerie</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="receipt">${buildReceiptInnerHTML(data)}</div>
</body>
</html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };

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
          <div
            className="bg-white shadow-xl mx-auto rounded-sm"
            style={{
              width: "280px",
              padding: "16px 14px 20px",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "11px",
              color: "#000",
            }}
            dangerouslySetInnerHTML={{ __html: buildReceiptInnerHTML(data) }}
          />
        </div>

        {/* Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
          <Button
            className="w-full h-12 rounded-xl font-black uppercase text-xs bg-primary text-white shadow-lg shadow-primary/20"
            onClick={handlePrint}
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
