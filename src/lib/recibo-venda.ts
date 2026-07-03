import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { brl } from "@/lib/format";

export interface ReciboItem {
  descricao: string;
  codigo?: string;
  quantidade: number;
  valor: number;
  total: number;
}

export interface ReciboPagamento {
  forma: string;
  valor: number;
}

export interface ReciboVendaData {
  cliente: string;
  itens: ReciboItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos: ReciboPagamento[];
  totalPago: number;
  troco: number;
  data?: Date;
  vendedor?: string;
  cupomFiscal?: string;
  observacao?: string | null;
  previsaoPagamento?: string | null; // "YYYY-MM-DD" ou ISO
  operador?: string;
  terminal?: string;
  enderecoLoja?: string;
  cnpjLoja?: string;
  whatsappLoja?: string;
  statusVenda?: string;
}

// ─── HTML compartilhado entre preview, PDF e PNG ─────────────────────────────

// Formata "YYYY-MM-DD" (ou ISO) em "DD/MM/YYYY"
function fmtDataPt(s?: string | null): string {
  if (!s) return "";
  const [y, m, d] = s.split("T")[0].split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
}

export function buildReceiptInnerHTML(data: ReciboVendaData): string {
  const dataStr = (data.data ?? new Date()).toLocaleString("pt-BR");
  const previsaoStr = fmtDataPt(data.previsaoPagamento);

  const row = (label: string, value: string, bold = false) =>
    `<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:${bold ? "bold" : "normal"};margin:2px 0;">
       <span>${label}</span><span>${value}</span>
     </div>`;

  const dashedLine = `<div style="border-top:1px dashed #aaa;margin:5px 0;"></div>`;
  const solidLine = `<div style="border-top:1px solid #000;margin:5px 0;"></div>`;

  const itensHTML = data.itens
    .map(
      (it) => `
    <div style="display:flex;font-size:10px;margin:2px 0;align-items:flex-start;">
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;">${it.descricao.toUpperCase()}</span>
      <span style="width:22px;text-align:center;">${it.quantidade}</span>
      <span style="width:58px;text-align:right;">${brl(it.valor)}</span>
      <span style="width:58px;text-align:right;">${brl(it.total)}</span>
    </div>`,
    )
    .join("");

  const pagamentosHTML = data.pagamentos
    .map((p) => row(p.forma.toUpperCase(), brl(p.valor)))
    .join("");

  const descontoHTML = data.desconto > 0 ? row("DESCONTO", `- ${brl(data.desconto)}`) : "";

  const trocoHTML = data.troco > 0 ? row("TROCO", brl(data.troco), true) : "";

  return `
    <div style="text-align:center;margin-bottom:12px;">
      <div style="font-size:17px;font-weight:900;letter-spacing:2px;line-height:1.2;">DIVAS LINGERIE</div>
      <div style="font-size:9px;color:#777;margin-top:3px;">Moda Íntima Premium</div>
      ${data.enderecoLoja ? `<div style="font-size:9px;color:#777;">${data.enderecoLoja}</div>` : ""}
      ${data.cnpjLoja ? `<div style="font-size:9px;color:#777;">CNPJ: ${data.cnpjLoja}</div>` : ""}
      ${data.whatsappLoja ? `<div style="font-size:9px;color:#777;">WhatsApp: ${data.whatsappLoja}</div>` : ""}
      <div style="font-size:9px;color:#777;">contato@divaslingerie.com.br</div>
    </div>

    ${dashedLine}
    <div style="text-align:center;font-weight:bold;font-size:11px;margin:5px 0;letter-spacing:1px;">*** CUPOM NÃO FISCAL ***</div>
    ${dashedLine}

    <div style="display:flex;justify-content:space-between;font-size:10px;margin:4px 0;">
      <span>${dataStr}</span>
      <span>Nº ${data.cupomFiscal || "------"}</span>
    </div>
    ${data.terminal ? row("TERMINAL", data.terminal) : ""}
    ${data.operador ? row("OPERADOR", data.operador.toUpperCase()) : ""}
    ${data.vendedor ? row("VENDEDOR", data.vendedor.toUpperCase()) : ""}
    <div style="font-size:10px;margin:3px 0 4px;">
      <strong>CLIENTE:</strong> ${data.cliente || "CONSUMIDOR FINAL"}
    </div>
    ${
      previsaoStr
        ? `<div style="font-size:10px;margin:0 0 4px;"><strong>PREVISÃO DE PAGAMENTO:</strong> ${previsaoStr}</div>`
        : ""
    }
    ${data.statusVenda ? row("STATUS", data.statusVenda.toUpperCase(), true) : ""}

    ${dashedLine}

    <div style="display:flex;font-weight:bold;font-size:10px;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:4px;">
      <span style="flex:1;">ITEM</span>
      <span style="width:22px;text-align:center;">Q</span>
      <span style="width:58px;text-align:right;">UN</span>
      <span style="width:58px;text-align:right;">TOTAL</span>
    </div>

    ${itensHTML}

    ${solidLine}

    ${row("SUBTOTAL", brl(data.subtotal))}
    ${descontoHTML}
    <div style="display:flex;justify-content:space-between;font-weight:900;font-size:14px;margin:4px 0;">
      <span>TOTAL</span><span>${brl(data.total)}</span>
    </div>

    ${dashedLine}

    <div style="font-weight:bold;font-size:10px;margin-bottom:3px;">FORMA DE PAGAMENTO</div>
    ${pagamentosHTML}
    ${row("TOTAL PAGO", brl(data.totalPago))}
    ${trocoHTML}

    ${dashedLine}

    ${
      data.observacao
        ? `<div style="font-size:10px;margin:2px 0;"><strong>OBS:</strong> ${data.observacao}</div>${dashedLine}`
        : ""
    }

    <div style="text-align:center;font-size:9px;margin-top:8px;line-height:1.7;color:#444;font-style:italic;">
      ✦ Obrigada pela preferência! ✦<br>
      Volte Sempre!<br>
      <span style="font-weight:bold;font-style:normal;color:#000;font-size:10px;">Divas Lingerie</span>
    </div>
    <div style="text-align:center;font-size:8px;margin-top:6px;color:#777;">
      Trocas somente com este comprovante.<br>
      Cupom não fiscal — venda interna gerencial.
    </div>
  `;
}

// ─── Renderiza o HTML em canvas e retorna o elemento DOM ─────────────────────

async function renderReceiptToCanvas(data: ReciboVendaData, scale = 3): Promise<HTMLCanvasElement> {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:absolute;left:-9999px;top:0;background:#fff;";

  const receipt = document.createElement("div");
  receipt.style.cssText = `
    width: 280px;
    padding: 16px 14px 20px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    color: #000;
    background: #fff;
  `;
  receipt.innerHTML = buildReceiptInnerHTML(data);

  wrapper.appendChild(receipt);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(receipt, {
      backgroundColor: "#ffffff",
      scale,
      logging: false,
      useCORS: true,
    });
    return canvas;
  } finally {
    document.body.removeChild(wrapper);
  }
}

// ─── PDF via jsPDF puro (sem html2canvas) ────────────────────────────────────

export async function gerarReciboVendaPDF(
  data: ReciboVendaData,
): Promise<{ blob: Blob; url: string }> {
  const W = 80; // largura página mm
  const L = 4; // margem esquerda
  const R = W - 4; // margem direita
  const MID = W / 2;

  // Estima a altura: ~8mm cabeçalho + 4mm por item + ~30mm restante
  const estimH =
    80 +
    data.itens.length * 5 +
    data.pagamentos.length * 4 +
    (data.previsaoPagamento ? 5 : 0) +
    (data.observacao ? 8 : 0) +
    (data.enderecoLoja ? 4 : 0) +
    (data.cnpjLoja ? 4 : 0) +
    (data.whatsappLoja ? 4 : 0) +
    (data.terminal ? 4 : 0) +
    (data.operador ? 4 : 0) +
    (data.statusVenda ? 4 : 0) +
    8;
  const pdf = new jsPDF({ unit: "mm", format: [W, estimH] });

  let y = 7;
  const lh = 3.8; // line height padrão

  const dashedLine = () => {
    pdf.setLineDashPattern([1.2, 1.2], 0);
    pdf.setDrawColor(150);
    pdf.line(L, y, R, y);
    pdf.setDrawColor(0);
    pdf.setLineDashPattern([], 0);
    y += 3;
  };

  const solidLine = () => {
    pdf.setLineDashPattern([], 0);
    pdf.line(L, y, R, y);
    y += 3;
  };

  const row = (label: string, value: string, bold = false) => {
    pdf.setFont("courier", bold ? "bold" : "normal");
    pdf.setFontSize(8);
    pdf.text(label, L, y);
    pdf.text(value, R, y, { align: "right" });
    y += lh;
  };

  // ── Cabeçalho ────────────────────────────────────────────────────────────
  pdf.setFont("courier", "bold");
  pdf.setFontSize(15);
  pdf.text("DIVAS LINGERIE", MID, y, { align: "center" });
  y += 6;

  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.text("Moda Intima Premium", MID, y, { align: "center" });
  y += lh;
  if (data.enderecoLoja) {
    pdf.text(data.enderecoLoja, MID, y, { align: "center" });
    y += lh;
  }
  if (data.cnpjLoja) {
    pdf.text(`CNPJ: ${data.cnpjLoja}`, MID, y, { align: "center" });
    y += lh;
  }
  if (data.whatsappLoja) {
    pdf.text(`WhatsApp: ${data.whatsappLoja}`, MID, y, { align: "center" });
    y += lh;
  }
  pdf.text("contato@divaslingerie.com.br", MID, y, { align: "center" });
  y += 4;

  dashedLine();

  pdf.setFont("courier", "bold");
  pdf.setFontSize(9);
  pdf.text("*** CUPOM NAO FISCAL ***", MID, y, { align: "center" });
  y += 4;

  dashedLine();

  // ── Data e número ─────────────────────────────────────────────────────────
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  const dataStr = (data.data ?? new Date()).toLocaleString("pt-BR");
  pdf.text(dataStr, L, y);
  pdf.text(`N ${data.cupomFiscal || "------"}`, R, y, { align: "right" });
  y += lh + 0.5;

  if (data.terminal) row("TERMINAL", data.terminal);
  if (data.operador) row("OPERADOR", data.operador.toUpperCase());
  if (data.vendedor) row("VENDEDOR", data.vendedor.toUpperCase());

  pdf.setFont("courier", "bold");
  pdf.setFontSize(8);
  pdf.text("CLIENTE:", L, y);
  pdf.setFont("courier", "normal");
  const clienteTrunc = (data.cliente || "CONSUMIDOR FINAL").substring(0, 28);
  pdf.text(clienteTrunc, L + 16, y);
  y += 4;

  const previsaoStr = fmtDataPt(data.previsaoPagamento);
  if (previsaoStr) {
    pdf.setFont("courier", "bold");
    pdf.text("PREV. PAGTO:", L, y);
    pdf.setFont("courier", "normal");
    pdf.text(previsaoStr, L + 24, y);
    y += 4;
  }

  if (data.statusVenda) {
    row("STATUS", data.statusVenda.toUpperCase(), true);
  }

  dashedLine();

  // ── Cabeçalho de itens ────────────────────────────────────────────────────
  pdf.setFont("courier", "bold");
  pdf.setFontSize(8);
  pdf.text("ITEM", L, y);
  pdf.text("Q", L + 44, y, { align: "center" });
  pdf.text("UN", L + 58, y, { align: "right" });
  pdf.text("TOTAL", R, y, { align: "right" });
  y += 1;
  solidLine();

  // ── Itens ─────────────────────────────────────────────────────────────────
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  data.itens.forEach((it) => {
    const desc = it.descricao.toUpperCase().substring(0, 22);
    pdf.text(desc, L, y);
    pdf.text(String(it.quantidade), L + 44, y, { align: "center" });
    pdf.text(brl(it.valor), L + 58, y, { align: "right" });
    pdf.text(brl(it.total), R, y, { align: "right" });
    y += lh;
  });

  solidLine();

  // ── Totais ────────────────────────────────────────────────────────────────
  row("SUBTOTAL", brl(data.subtotal));
  if (data.desconto > 0) row("DESCONTO", `- ${brl(data.desconto)}`);

  pdf.setFont("courier", "bold");
  pdf.setFontSize(13);
  pdf.text("TOTAL", L, y);
  pdf.text(brl(data.total), R, y, { align: "right" });
  y += 6;

  dashedLine();

  // ── Pagamentos ────────────────────────────────────────────────────────────
  pdf.setFont("courier", "bold");
  pdf.setFontSize(8);
  pdf.text("FORMA DE PAGAMENTO", L, y);
  y += lh + 0.5;

  pdf.setFont("courier", "normal");
  data.pagamentos.forEach((p) => row(p.forma.toUpperCase(), brl(p.valor)));
  row("TOTAL PAGO", brl(data.totalPago));
  if (data.troco > 0) row("TROCO", brl(data.troco), true);

  dashedLine();

  // ── Observação ────────────────────────────────────────────────────────────
  if (data.observacao) {
    pdf.setFont("courier", "bold");
    pdf.setFontSize(8);
    pdf.text("OBS:", L, y);
    pdf.setFont("courier", "normal");
    const obsLinhas = pdf.splitTextToSize(data.observacao, R - L - 12);
    pdf.text(obsLinhas, L + 12, y);
    y += lh * (Array.isArray(obsLinhas) ? obsLinhas.length : 1) + 1;
    dashedLine();
  }

  // ── Rodapé ────────────────────────────────────────────────────────────────
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.text("Obrigada pela preferencia!", MID, y, { align: "center" });
  y += lh;
  pdf.text("Volte Sempre!", MID, y, { align: "center" });
  y += lh;
  pdf.setFont("courier", "bold");
  pdf.text("Divas Lingerie", MID, y, { align: "center" });
  y += 6;

  pdf.setFont("courier", "normal");
  pdf.setFontSize(7);
  pdf.text("Trocas somente com este comprovante.", MID, y, { align: "center" });
  y += 3.5;
  pdf.text("Cupom nao fiscal - venda interna gerencial.", MID, y, { align: "center" });
  y += 5;

  const blob = pdf.output("blob");
  return { blob, url: URL.createObjectURL(blob) };
}

// ─── PNG (idêntico ao preview visual) ────────────────────────────────────────

export async function gerarReciboVendaPNG(
  data: ReciboVendaData,
): Promise<{ blob: Blob; url: string }> {
  const canvas = await renderReceiptToCanvas(data, 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve({ blob, url: URL.createObjectURL(blob) });
      else reject(new Error("Falha ao gerar PNG"));
    }, "image/png");
  });
}

// ─── Impressão direta (janela de impressão do navegador) ─────────────────────

const RECEIPT_PRINT_STYLE = `
  width: 280px;
  padding: 16px 14px 20px;
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
  font-size: 11px;
  color: #000;
  background: #fff;
`;

export function printRecibo(data: ReciboVendaData) {
  const printCss = `
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 80mm; padding: 4mm; background: #fff; }
    .receipt { ${RECEIPT_PRINT_STYLE.replace(/\n/g, " ")} width: 100%; }
  `;

  const printWin = window.open("", "_blank", "width=420,height=750");
  if (!printWin) return;
  printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Cupom – Divas Lingerie</title>
  <style>${printCss}</style>
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
}
