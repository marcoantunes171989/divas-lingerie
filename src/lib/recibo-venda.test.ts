import { describe, it, expect, vi, beforeEach } from "vitest";
import { gerarReciboVendaPDF, ReciboVendaData } from "./recibo-venda";

// Capturar as chamadas de texto
const mockText = vi.fn();

vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        text: mockText,
        line: vi.fn(),
        setFont: vi.fn().mockReturnThis(),
        setFontSize: vi.fn().mockReturnThis(),
        setDrawColor: vi.fn().mockReturnThis(),
        setLineDashPattern: vi.fn().mockReturnThis(),
        output: vi.fn(() => new Blob(["pdf-content"], { type: "application/pdf" })),
        splitTextToSize: vi.fn((text) => [text]),
        lastAutoTable: { finalY: 100 },
      };
    }),
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

// Mock do URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:url");

describe("Gerador de Recibo PDF", () => {
  const mockData: ReciboVendaData = {
    cliente: "JOÃO SILVA",
    cupomFiscal: "123456",
    itens: [{ descricao: "PRODUTO TESTE", quantidade: 2, valor: 50, total: 100 }],
    subtotal: 100,
    desconto: 10,
    total: 90,
    pagamentos: [
      { forma: "DINHEIRO", valor: 60 },
      { forma: "PIX", valor: 40 },
    ],
    totalPago: 100,
    troco: 10,
    vendedor: "VENDEDOR 1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve gerar o cabeçalho da loja e o tipo de cupom", async () => {
    const { blob } = await gerarReciboVendaPDF(mockData);

    expect(blob).toBeInstanceOf(Blob);
    expect(mockText).toHaveBeenCalledWith(
      "DIVAS LINGERIE",
      expect.any(Number),
      expect.any(Number),
      { align: "center" },
    );
    expect(mockText).toHaveBeenCalledWith(
      "*** CUPOM NAO FISCAL ***",
      expect.any(Number),
      expect.any(Number),
      { align: "center" },
    );
  });

  it("deve incluir o número do cupom fiscal e o cliente", async () => {
    await gerarReciboVendaPDF(mockData);

    expect(mockText).toHaveBeenCalledWith("N 123456", expect.any(Number), expect.any(Number), {
      align: "right",
    });
    expect(mockText).toHaveBeenCalledWith("JOÃO SILVA", expect.any(Number), expect.any(Number));
  });

  it("deve formatar totais, troco e TODAS as formas de pagamento", async () => {
    await gerarReciboVendaPDF(mockData);

    // Totais
    expect(mockText).toHaveBeenCalledWith("SUBTOTAL", expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith("TOTAL", expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith("TROCO", expect.any(Number), expect.any(Number));

    // Várias formas de pagamento no mesmo cupom
    expect(mockText).toHaveBeenCalledWith("DINHEIRO", expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith("PIX", expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith("TOTAL PAGO", expect.any(Number), expect.any(Number));
  });
});
