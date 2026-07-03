import { buildReceiptInnerHTML, type ReciboVendaData } from "@/lib/recibo-venda";

interface ReceiptPreviewProps {
  data: ReciboVendaData;
  className?: string;
}

export function ReceiptPreview({ data, className }: ReceiptPreviewProps) {
  return (
    <div
      className={`mx-auto rounded-sm border border-dashed border-[var(--pdv-border)] bg-white font-receipt shadow-sm ${className ?? ""}`}
      style={{ width: 280, padding: "16px 14px 20px", fontSize: 11, color: "#000" }}
      dangerouslySetInnerHTML={{ __html: buildReceiptInnerHTML(data) }}
    />
  );
}
