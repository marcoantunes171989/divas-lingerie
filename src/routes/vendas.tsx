import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { z } from "zod";

const vendasSearchSchema = z.object({
  consignacao_id: z.string().optional(),
});

import { toast } from "sonner";
import { Loader2 as LoaderIcon, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { brl } from "@/lib/format";
import {
  gerarReciboVendaPDF,
  gerarReciboVendaPNG,
  printRecibo,
  type ReciboVendaData,
} from "@/lib/recibo-venda";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useAuth } from "@/lib/auth";
import { COMPANY_ADDRESS, COMPANY_CNPJ, COMPANY_NAME, COMPANY_PHONE } from "@/lib/constants";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

import { POSHeader } from "@/components/pos/POSHeader";
import { POSSearchBar } from "@/components/pos/POSSearchBar";
import { ProductFilters } from "@/components/pos/ProductFilters";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartPanel } from "@/components/pos/CartPanel";
import { SaleSummary } from "@/components/pos/SaleSummary";
import { CustomerSelectorModal } from "@/components/pos/CustomerSelectorModal";
import { SellerSelectorModal } from "@/components/pos/SellerSelectorModal";
import { DiscountModal } from "@/components/pos/DiscountModal";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { SaleSuccessModal, type LastSaleSummary } from "@/components/pos/SaleSuccessModal";
import { CashOpenCloseModal } from "@/components/pos/CashOpenCloseModal";
import { CashMovementModal } from "@/components/pos/CashMovementModal";
import { LastSalesPanel, type VendaResumo } from "@/components/pos/LastSalesPanel";
import { KeyboardShortcutsBar } from "@/components/pos/KeyboardShortcutsBar";
import type { ItemVenda, ProdutoPDV } from "@/components/pos/types";

export const shouldShowCancelCoupon = (cupomFiscal: string, items: { cancelado?: boolean }[]) => {
  return !!cupomFiscal && items.some((i) => !i.cancelado);
};

// Limite de cupons que podem ser reenviados de uma vez
export const MAX_CUPONS_REENVIO = 3;

// Opções do combo de período para o reenvio de recibos
export const PERIODOS_REENVIO = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana atual" },
  { value: "mes_atual", label: "Mês atual" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "tudo", label: "Tudo" },
] as const;

// Converte o período escolhido em um intervalo de datas (ISO). `ate` é exclusivo.
export const getPeriodoRange = (periodo: string): { desde?: string; ate?: string } => {
  const now = new Date();
  const inicioDia = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  switch (periodo) {
    case "hoje":
      return { desde: inicioDia(now).toISOString() };
    case "semana": {
      const d = inicioDia(now);
      const diaSemana = (d.getDay() + 6) % 7; // 0 = segunda-feira
      d.setDate(d.getDate() - diaSemana);
      return { desde: d.toISOString() };
    }
    case "mes_atual":
      return { desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
    case "mes_anterior":
      return {
        desde: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        ate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      };
    case "tudo":
    default:
      return {};
  }
};

export const getCancelDialogTitle = (items: { cancelado?: boolean }[]) => {
  const hasItems = items.length > 0;
  const allCancelled = hasItems && items.every((i) => i.cancelado);
  return allCancelled ? "CANCELAR CUPOM?" : "CANCELAR VENDA?";
};

export const calculateChange = (
  total: number,
  pagamentos: { forma: string; valor: number }[],
  finalizadoras: any[],
) => {
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  if (totalPago <= total) return 0;

  // O troco é apenas a diferença, mas logicamente associado a formas que permitem troco
  return totalPago - total;
};

export const validatePagamentoValor = (
  id: string,
  novoValor: number,
  total: number,
  pagamentos: { id: string; forma: string; valor: number }[],
  finalizadoras: any[],
) => {
  const pagamento = pagamentos.find((p) => p.id === id);
  if (!pagamento) return { valid: false, reason: "Pagamento não encontrado" };

  const fin = finalizadoras.find(
    (f) => f.fin_descricao.toLowerCase() === pagamento.forma.toLowerCase(),
  );
  const permiteTroco = fin?.fin_permite_troco ?? pagamento.forma.toLowerCase() === "dinheiro";

  if (!permiteTroco && novoValor > total) {
    return { valid: false, reason: "Valor excede o total (esta forma não permite troco)" };
  }

  if (!permiteTroco) {
    const outrosPagamentos = pagamentos
      .filter((op) => op.id !== id)
      .reduce((acc, op) => acc + op.valor, 0);
    if (outrosPagamentos + novoValor > total + 0.01) {
      return { valid: false, reason: "A soma excede o total (esta forma não permite troco)" };
    }
  }

  return { valid: true };
};

export const Route = createFileRoute("/vendas")({
  validateSearch: (search) => vendasSearchSchema.parse(search),
  component: PDVPage,
});

const TERMINAL = "01";

const formatPhoneBR = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const buildWhatsappUrl = (phone: string, message: string) => {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
};

export function PDVPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = useSearch({ from: "/vendas" });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const operadorNome = useMemo(
    () => user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operador",
    [user],
  );

  // ── Carrinho / venda em andamento ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [items, setItems] = useState<ItemVenda[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [selectedVendedorId, setSelectedVendedorId] = useState<string | null>(null);
  const [observacaoVenda, setObservacaoVenda] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [pagamentos, setPagamentos] = useState<{ id: string; forma: string; valor: number }[]>([]);
  const [currentConsignacaoId, setCurrentConsignacaoId] = useState<string | null>(null);
  const [cupomFiscal, setCupomFiscal] = useState("");
  const [isProcessingFinish, setIsProcessingFinish] = useState(false);
  const isProcessingRef = useRef(false);

  // ── Modais ──────────────────────────────────────────────────────────────────
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [discountTarget, setDiscountTarget] = useState<{ itemId: string | null } | null>(null);
  const [isPriceCheckOpen, setIsPriceCheckOpen] = useState(false);
  const [priceCheckTerm, setPriceCheckTerm] = useState("");
  const [cashModal, setCashModal] = useState<{ mode: "abrir" | "fechar" } | null>(null);
  const [cashMovementModal, setCashMovementModal] = useState<{
    tipo: "sangria" | "suprimento";
  } | null>(null);
  const [isCashActionLoading, setIsCashActionLoading] = useState(false);

  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [motivosCancelamento, setMotivosCancelamento] = useState<
    { id: string; mot_codigo: number; mot_descricao: string }[]
  >([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    showMotivo?: boolean;
    onConfirm: (motivo?: string) => void;
  }>({ open: false, title: "", description: "", showMotivo: false, onConfirm: () => {} });

  // ── Pós-venda ────────────────────────────────────────────────────────────────
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [lastSaleData, setLastSaleData] = useState<ReciboVendaData | null>(null);
  const [lastSaleSummary, setLastSaleSummary] = useState<LastSaleSummary | null>(null);
  const [isVendaFinalizadaOpen, setIsVendaFinalizadaOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappFromCadastro, setWhatsappFromCadastro] = useState(false);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: finalizadorasAtivas = [], isLoading: isLoadingFinalizadoras } = useQuery({
    queryKey: ["finalizadoras-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_finalizadoras")
        .select("*")
        .eq("fin_ativa", true)
        .order("fin_ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: produtos = [], isLoading: isLoadingProdutos } = useQuery({
    queryKey: ["produtos-pdv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_produtos")
        .select(
          "*, tab_categorias(id, cat_nome), tab_tamanhos(id, tam_nome), tab_cores(id, cor_nome)",
        )
        .order("pro_descricao");
      if (error) throw error;
      return (data || []) as unknown as ProdutoPDV[];
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-pdv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_categorias")
        .select("id, cat_nome")
        .order("cat_nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: consignadoData = [] } = useQuery({
    queryKey: ["consignado-em-posse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_consignacao")
        .select("con_produto_id, con_quantidade")
        .eq("con_status", "em_posse");
      if (error) throw error;
      return data || [];
    },
  });

  const consignadoPorProduto = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of consignadoData as any[]) {
      m[c.con_produto_id] = (m[c.con_produto_id] || 0) + Number(c.con_quantidade || 0);
    }
    return m;
  }, [consignadoData]);

  const getDisponivel = useCallback(
    (produto: ProdutoPDV) =>
      Math.max(
        0,
        (Number(produto?.pro_estoque_atual) || 0) - (consignadoPorProduto[produto?.id] || 0),
      ),
    [consignadoPorProduto],
  );

  const { data: clientesData = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["clientes-pdv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_clientes")
        .select("id, cli_nome, cli_telefone")
        .order("cli_nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vendedoresData = [] } = useQuery({
    queryKey: ["vendedores-pdv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_usuarios")
        .select("id, usu_nome")
        .order("usu_nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: caixaAtual = null, isLoading: isLoadingCaixa } = useQuery({
    queryKey: ["caixa-atual", TERMINAL],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_caixa")
        .select("*")
        .eq("cai_terminal", TERMINAL)
        .eq("cai_status", "aberto")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: vendasRecentesRaw = [] } = useQuery({
    queryKey: ["vendas-recentes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tab_vendas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const vendasRecentes: VendaResumo[] = useMemo(
    () =>
      vendasRecentesRaw.map((v: any) => ({
        id: v.id,
        numero: v.ven_cupom_fiscal || v.id.slice(0, 8),
        clienteNome:
          clientesData.find((c: any) => c.id === v.ven_cliente_id)?.cli_nome || "Consumidor Final",
        valor: Number(v.ven_valor_total) || 0,
        formaPagamento: v.ven_forma_pagamento || "—",
        horario: new Date(v.created_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: v.ven_status,
      })),
    [vendasRecentesRaw, clientesData],
  );

  // Reenvio de recibo em lote (por período)
  const [isReenviarModalOpen, setIsReenviarModalOpen] = useState(false);
  const [selectedReenviarVendas, setSelectedReenviarVendas] = useState<any[]>([]);
  const [reenviarWhatsapp, setReenviarWhatsapp] = useState("");
  const [isEnviandoReenvio, setIsEnviandoReenvio] = useState(false);
  const [reenviarPeriodo, setReenviarPeriodo] = useState("");
  const [reenviarBuscaCliente, setReenviarBuscaCliente] = useState("");

  const {
    data: vendasDoPeriodo = [],
    isLoading: isLoadingVendasPeriodo,
    error: errorVendasPeriodo,
  } = useQuery({
    queryKey: ["vendas-reenvio", isReenviarModalOpen, reenviarPeriodo],
    queryFn: async () => {
      const { desde, ate } = getPeriodoRange(reenviarPeriodo);
      let query = (supabase as any)
        .from("tab_vendas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (desde) query = query.gte("created_at", desde);
      if (ate) query = query.lt("created_at", ate);
      const { data, error } = await query;
      if (error) throw new Error(error.message || JSON.stringify(error));
      return (data as any[]) || [];
    },
    enabled: isReenviarModalOpen && !!reenviarPeriodo,
    staleTime: 0,
  });

  const vendasReenvioFiltradas = useMemo(() => {
    const s = reenviarBuscaCliente.trim().toLowerCase();
    return (vendasDoPeriodo as any[])
      .filter((v: any) => v.ven_status !== "cancelada")
      .filter((v: any) => {
        if (!s) return true;
        const nome = (
          clientesData.find((c: any) => c.id === v.ven_cliente_id)?.cli_nome || "Consumidor Final"
        ).toLowerCase();
        return nome.includes(s) || String(v.ven_cupom_fiscal || "").includes(s);
      });
  }, [vendasDoPeriodo, clientesData, reenviarBuscaCliente]);

  useState(() => {
    supabase
      .from("tab_motivos_cancelamento")
      .select("id, mot_codigo, mot_descricao")
      .eq("mot_ativo", true)
      .order("mot_codigo")
      .then(({ data }) => {
        if (data) setMotivosCancelamento(data);
      });
  });

  // ── Produtos filtrados ────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return produtos
      .filter((p) => {
        if (!s) return true;
        const preco = Number(p.pro_valor_venda || 0);
        const campos = [
          p.pro_descricao,
          p.pro_codigo,
          p.pro_codigo_barras,
          p.tab_categorias?.cat_nome,
          p.tab_tamanhos?.tam_nome,
          p.tab_cores?.cor_nome,
          String(p.pro_estoque_atual ?? ""),
          preco.toFixed(2),
          preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
        ];
        return campos.some((c) => (c || "").toString().toLowerCase().includes(s));
      })
      .filter((p) => !categoriaAtiva || p.pro_categoria_id === categoriaAtiva)
      .filter((p) => getDisponivel(p) > 0)
      .sort((a, b) =>
        (a.pro_descricao || "").localeCompare(b.pro_descricao || "", "pt-BR", {
          sensitivity: "base",
        }),
      )
      .slice(0, 50);
  }, [produtos, searchTerm, categoriaAtiva, getDisponivel]);

  // ── Carrinho ──────────────────────────────────────────────────────────────────
  const addItem = useCallback(
    (produto: ProdutoPDV) => {
      const estoqueDisponivel = getDisponivel(produto);
      const itemAtivo = items.find((i) => i.produto_id === produto.id && !i.cancelado);
      const qtdAtualNoCarrinho = itemAtivo?.quantidade || 0;

      if (qtdAtualNoCarrinho + 1 > estoqueDisponivel) {
        toast.error("Estoque insuficiente", {
          description: `"${produto.pro_descricao}" — disponível: ${estoqueDisponivel}`,
        });
        return;
      }

      const valor = Number(produto.pro_valor_venda) || 0;
      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.produto_id === produto.id && !i.cancelado);
        if (existingIndex !== -1) {
          const updated = [...prev];
          const item = updated[existingIndex];
          const newQty = item.quantidade + 1;
          updated[existingIndex] = { ...item, quantidade: newQty, total: newQty * item.valor };
          return updated;
        }
        return [
          {
            id: Math.random().toString(36).substring(2, 11),
            produto_id: produto.id,
            descricao: produto.pro_descricao,
            codigo: produto.pro_codigo,
            valor,
            quantidade: 1,
            total: valor,
            added_at: Date.now(),
          },
          ...prev,
        ];
      });
    },
    [items, getDisponivel],
  );

  const cancelItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.cancelado) return;
      setConfirmDialog({
        open: true,
        title: "CANCELAR ITEM?",
        description: `Deseja cancelar ${item.descricao} da venda?`,
        showMotivo: true,
        onConfirm: (motivo) => {
          setItems((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, cancelado: true, motivo_cancelamento: motivo } : i,
            ),
          );
          toast.error("Item cancelado");
        },
      });
    },
    [items],
  );

  const updateQuantity = useCallback(
    (id: string, delta: number) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (!item || item.cancelado) return prev;

        if (item.quantidade === 1 && delta === -1) {
          cancelItem(id);
          return prev;
        }

        const produto = produtos.find((p) => p.id === item.produto_id);
        const estoqueDisponivel = produto ? getDisponivel(produto) : 0;
        const novaQtd = item.quantidade + delta;

        if (novaQtd > estoqueDisponivel) {
          toast.error("Estoque insuficiente", { description: `Disponível: ${estoqueDisponivel}` });
          return prev;
        }

        return prev.map((i) =>
          i.id === id ? { ...i, quantidade: novaQtd, total: novaQtd * i.valor } : i,
        );
      });
    },
    [produtos, getDisponivel, cancelItem],
  );

  const applyItemDiscount = (id: string, valor: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, desconto: valor } : i)));
  };

  const subtotal = items.reduce(
    (acc, item) => acc + (item.cancelado ? 0 : item.total - (item.desconto || 0)),
    0,
  );
  const total = Math.max(0, subtotal - desconto);
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const valorFaltante = total - totalPago;
  const trocoCalculado = calculateChange(total, pagamentos, finalizadorasAtivas);

  const clienteSelecionadoNome = useMemo(() => {
    if (!selectedClienteId) return null;
    if (selectedClienteId === "default") return "Consumidor não identificado";
    return clientesData.find((c: any) => c.id === selectedClienteId)?.cli_nome ?? null;
  }, [selectedClienteId, clientesData]);

  const vendedorSelecionadoNome = useMemo(
    () => vendedoresData.find((v: any) => v.id === selectedVendedorId)?.usu_nome ?? null,
    [vendedoresData, selectedVendedorId],
  );

  const clientesFiltrados = useMemo(() => {
    const s = clienteSearchTerm.trim().toLowerCase();
    if (!s) return clientesData;
    return clientesData.filter((c: any) => c.cli_nome.toLowerCase().includes(s));
  }, [clientesData, clienteSearchTerm]);

  // ── Pagamento ────────────────────────────────────────────────────────────────
  const addPagamento = (forma: string) => {
    const jaSelecionada = pagamentos.some((p) => p.forma === forma);
    if (jaSelecionada) {
      setPagamentos((prev) => prev.filter((p) => p.forma !== forma));
      return;
    }
    const vRestante = Math.max(0, total - totalPago);
    if (vRestante <= 0) {
      toast.info("Venda já totalmente paga.");
      return;
    }
    setPagamentos((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 11), forma, valor: vRestante },
    ]);
  };

  const updatePagamentoValor = (id: string, novoValor: number) => {
    setPagamentos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const validation = validatePagamentoValor(id, novoValor, total, prev, finalizadorasAtivas);
        if (!validation.valid) {
          toast.error("Valor inválido", { description: validation.reason });
          return p;
        }
        return { ...p, valor: novoValor };
      }),
    );
  };

  const abrirPagamentoRapido = (forma: "PIX" | "DINHEIRO" | "CARTAO") => {
    if (!caixaAtual) {
      toast.error("Abra o caixa antes de iniciar uma venda.");
      return;
    }
    if (items.filter((i) => !i.cancelado).length === 0) {
      toast.error("Adicione itens à venda.");
      return;
    }
    const mapa: Record<string, string> = { PIX: "PIX", DINHEIRO: "DINHEIRO", CARTAO: "CARTÃO" };
    const finalizadora = finalizadorasAtivas.find(
      (f) => f.fin_descricao.toUpperCase() === mapa[forma],
    );
    setIsPaymentModalOpen(true);
    if (finalizadora && pagamentos.length === 0) {
      addPagamento(finalizadora.fin_descricao);
    }
  };

  // ── Finalizar venda ──────────────────────────────────────────────────────────
  const resetVenda = () => {
    setItems([]);
    setDesconto(0);
    setPagamentos([]);
    setSelectedClienteId("");
    setSelectedVendedorId(null);
    setObservacaoVenda("");
    setCupomFiscal("");
    setCurrentConsignacaoId(null);
  };

  const handleFinishVenda = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessingFinish(true);

    try {
      const activeItems = items.filter((i) => !i.cancelado);

      if (activeItems.length === 0) {
        toast.error("Carrinho sem itens ativos");
        return;
      }
      if (!caixaAtual) {
        toast.error("Abra o caixa antes de finalizar a venda.");
        return;
      }
      if (!selectedClienteId) {
        toast.error("Selecione o cliente para finalizar a venda.");
        return;
      }
      if (valorFaltante > 0.01) {
        toast.error("Valor insuficiente", { description: `Falta receber ${brl(valorFaltante)}` });
        return;
      }

      const produtoIds = activeItems.map((i) => i.produto_id);
      const { data: estoques } = await supabase
        .from("tab_produtos")
        .select("id, pro_descricao, pro_codigo, pro_estoque_atual")
        .in("id", produtoIds);

      const semEstoque = activeItems.filter((item) => {
        const produto = estoques?.find((p: any) => p.id === item.produto_id);
        return produto !== undefined && (produto.pro_estoque_atual ?? 0) < item.quantidade;
      });

      if (semEstoque.length > 0) {
        const detalhes = semEstoque
          .map((item) => {
            const produto = estoques?.find((p: any) => p.id === item.produto_id);
            return `${item.descricao}: disponível ${produto?.pro_estoque_atual ?? 0}, solicitado ${item.quantidade}`;
          })
          .join(" | ");
        toast.error("Estoque insuficiente", { description: detalhes });
        return;
      }

      const rpcItens = activeItems.map((item) => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor,
        valor_total: item.total - (item.desconto || 0),
      }));

      const formasDistintas = Array.from(new Set(pagamentos.map((p) => p.forma)));
      const formaPagamentoHeader = formasDistintas.join(" + ") || "DINHEIRO";

      const cupomGerado =
        cupomFiscal ||
        (await supabase
          .rpc("proximo_cupom_fiscal" as any)
          .then(({ data, error }) =>
            !error && data
              ? String(data).padStart(6, "0")
              : Math.floor(100000 + Math.random() * 900000).toString(),
          ));

      const { data: vendaId, error: rpcError } = await supabase.rpc(
        "registrar_venda_completa" as any,
        {
          p_cliente_id: selectedClienteId === "default" ? null : selectedClienteId,
          p_usuario_id: user?.id ?? null,
          p_valor_total: total,
          p_desconto: desconto,
          p_forma_pagamento: formaPagamentoHeader,
          p_itens: rpcItens,
          p_pagamentos: pagamentos.map((p) => {
            const fin = finalizadorasAtivas.find(
              (f) => f.fin_descricao.toLowerCase() === p.forma.toLowerCase(),
            );
            return { forma: p.forma, valor: p.valor, finalizadora_id: fin?.id };
          }),
          p_vendedor_id: selectedVendedorId,
          p_caixa_id: caixaAtual.id,
        },
      );

      if (rpcError) throw rpcError;

      if (vendaId && cupomGerado) {
        try {
          await supabase.rpc("definir_cupom_fiscal" as any, {
            p_venda_id: vendaId as string,
            p_cupom_fiscal: String(cupomGerado),
          });
        } catch (e) {
          console.warn("[VENDA] Falha ao salvar cupom fiscal na venda", e);
        }
      }

      if (vendaId && observacaoVenda.trim()) {
        try {
          await supabase.rpc("definir_dados_venda" as any, {
            p_venda_id: vendaId as string,
            p_observacao: observacaoVenda.trim() || null,
            p_previsao_pagamento: null,
          });
        } catch (e) {
          console.warn("[VENDA] Falha ao salvar observação na venda", e);
        }
      }

      if (currentConsignacaoId) {
        await supabase
          .from("tab_consignacao")
          .update({ con_status: "vendido", con_venda_id: vendaId as string } as any)
          .eq("id", currentConsignacaoId);
      }

      toast.success("Venda finalizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["produtos-pdv"] });
      queryClient.invalidateQueries({ queryKey: ["vendas-recentes"] });

      const cliente = clientesData.find((c: any) => c.id === selectedClienteId);
      const clienteNome = cliente?.cli_nome || "Consumidor";
      if (cliente?.cli_telefone) {
        setWhatsappNumber(formatPhoneBR(cliente.cli_telefone));
        setWhatsappFromCadastro(true);
      } else {
        setWhatsappNumber("");
        setWhatsappFromCadastro(false);
      }

      const temDinheiro = pagamentos.some((p) => p.forma.toLowerCase() === "dinheiro");
      const excedente = Math.max(0, totalPago - total);

      const saleData: ReciboVendaData = {
        cliente: clienteNome,
        itens: activeItems.map((it) => ({
          descricao: it.descricao,
          codigo: it.codigo,
          quantidade: it.quantidade,
          valor: it.valor,
          total: it.total - (it.desconto || 0),
        })),
        subtotal,
        desconto,
        total,
        pagamentos: pagamentos.map((p) => ({ forma: p.forma, valor: p.valor })),
        totalPago,
        troco: temDinheiro ? excedente : 0,
        data: new Date(),
        cupomFiscal: String(cupomGerado),
        observacao: observacaoVenda.trim() || null,
        operador: operadorNome,
        vendedor: vendedorSelecionadoNome ?? undefined,
        terminal: TERMINAL,
        enderecoLoja: COMPANY_ADDRESS || undefined,
        cnpjLoja: COMPANY_CNPJ || undefined,
        whatsappLoja: COMPANY_PHONE || undefined,
        statusVenda: "Concluída",
      };

      setLastSaleData(saleData);
      setLastSaleSummary({
        numero: String(cupomGerado),
        total,
        formaPagamento: formaPagamentoHeader,
        clienteNome,
        operadorNome,
        dataHora: new Date(),
      });
      setReceiptUrl(null);

      setIsPaymentModalOpen(false);
      resetVenda();
      setSearchTerm("");

      setTimeout(() => setIsVendaFinalizadaOpen(true), 250);

      try {
        const { url } = await gerarReciboVendaPDF(saleData);
        setReceiptUrl(url);
      } catch (e) {
        console.error("Falha ao pré-gerar recibo PDF", e);
      }
    } catch (error: any) {
      let msg = error.message ?? "Erro desconhecido";
      if (msg.includes("check_estoque_nao_negativo") || msg.includes("check constraint")) {
        msg = "Produto sem estoque suficiente. Verifique o estoque no cadastro de produtos.";
      }
      toast.error("Erro ao finalizar", { description: msg });
    } finally {
      isProcessingRef.current = false;
      setIsProcessingFinish(false);
    }
  };

  // ── Cancelamento de venda em andamento ──────────────────────────────────────
  const handleCancelarVenda = () => {
    if (items.length === 0) return;

    setConfirmDialog({
      open: true,
      title: getCancelDialogTitle(items),
      description: `Deseja cancelar toda a venda?\nResumo: ${items.filter((i) => !i.cancelado).length} itens - Total: ${brl(total)}`,
      showMotivo: true,
      onConfirm: async (motivo) => {
        // Se um cupom já havia sido emitido (checkout aberto), registra auditoria
        if (cupomFiscal) {
          try {
            const itensAtivos = items.filter((i) => !i.cancelado);
            const snapshot = itensAtivos.map((i) => {
              const prod = produtos.find((p) => p.id === i.produto_id);
              return {
                produto_id: i.produto_id,
                descricao: i.descricao,
                estoque_no_cancelamento: prod?.pro_estoque_atual ?? 0,
                quantidade_cancelada: i.quantidade,
              };
            });
            await supabase.from("tab_cancelamentos" as any).insert({
              can_cupom_fiscal: cupomFiscal,
              can_tipo: "venda_completa",
              can_motivo: motivo || null,
              can_estoque_snapshot: snapshot,
              can_valor_cancelado: itensAtivos.reduce((s, i) => s + i.total, 0),
            });
          } catch (e) {
            console.warn("[VENDA] Falha ao registrar auditoria de cancelamento", e);
          }
        }
        resetVenda();
        setIsPaymentModalOpen(false);
        toast.error("Venda cancelada");
      },
    });
  };

  // ── Cupom individual (reimpressão / reenvio de uma venda do histórico) ──────
  const fetchReciboFromVenda = async (vendaId: string): Promise<ReciboVendaData> => {
    const { data: vf } = await (supabase as any)
      .from("tab_vendas")
      .select("*, tab_itens_venda!itv_venda_id(*, tab_produtos(pro_descricao, pro_codigo))")
      .eq("id", vendaId)
      .single();

    const clienteObj = clientesData.find((c: any) => c.id === vf.ven_cliente_id);
    const itens = ((vf?.tab_itens_venda || []) as any[])
      .filter((i: any) => i.itv_status === "ativo")
      .map((i: any) => ({
        descricao: i.tab_produtos?.pro_descricao || "Produto",
        codigo: i.tab_produtos?.pro_codigo,
        quantidade: i.itv_quantidade,
        valor: i.itv_valor_unitario ?? i.itv_valor_total / Math.max(1, i.itv_quantidade),
        total: i.itv_valor_total,
      }));
    const subtotalRecibo = itens.reduce((s: number, i: any) => s + i.total, 0);

    const { data: pags } = await (supabase as any)
      .from("tab_vendas_pagamentos")
      .select("vpa_forma_pagamento, vpa_valor")
      .eq("vpa_venda_id", vendaId);
    const pagamentosRecibo =
      pags && pags.length > 0
        ? (pags as any[]).map((p) => ({
            forma: p.vpa_forma_pagamento || "DINHEIRO",
            valor: Number(p.vpa_valor) || 0,
          }))
        : [
            {
              forma: vf.ven_forma_pagamento || "DINHEIRO",
              valor: vf.ven_valor_total ?? subtotalRecibo,
            },
          ];

    return {
      cliente: clienteObj?.cli_nome || "Consumidor Final",
      itens,
      subtotal: subtotalRecibo,
      desconto: Math.max(0, subtotalRecibo - (vf.ven_valor_total ?? subtotalRecibo)),
      total: vf.ven_valor_total ?? subtotalRecibo,
      pagamentos: pagamentosRecibo,
      totalPago: pagamentosRecibo.reduce((s, p) => s + p.valor, 0),
      troco: 0,
      data: new Date(vf.created_at),
      cupomFiscal: vf.ven_cupom_fiscal,
      observacao: vf.ven_observacao,
      terminal: TERMINAL,
      statusVenda: vf.ven_status === "cancelada" ? "Cancelada" : "Concluída",
    };
  };

  const handleReimprimirVenda = async (venda: VendaResumo) => {
    try {
      const recibo = await fetchReciboFromVenda(venda.id);
      printRecibo(recibo);
    } catch {
      toast.error("Erro ao gerar cupom para reimpressão");
    }
  };

  const handleReenviarVendaIndividual = async (venda: VendaResumo) => {
    try {
      const recibo = await fetchReciboFromVenda(venda.id);
      const { blob } = await gerarReciboVendaPDF(recibo);
      const clienteObj = clientesData.find((c: any) => c.cli_nome === recibo.cliente);
      const telefone = clienteObj?.cli_telefone ? formatPhoneBR(clienteObj.cli_telefone) : "";
      const file = new File([blob], `Divas-Cupom-${venda.numero}.pdf`, { type: "application/pdf" });
      const totalStr = brl(recibo.total);
      const message = `Olá! Segue o comprovante da sua compra na Divas Lingerie.\n\nVenda: Nº ${venda.numero}\nTotal: ${totalStr}\n\nObrigada pela preferência!\nDivas Lingerie`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Cupom Nº ${venda.numero}`, text: message });
        return;
      }
      if (!telefone) {
        toast.error("Cliente sem WhatsApp cadastrado");
        return;
      }
      window.open(buildWhatsappUrl(telefone, message), "_blank");
    } catch {
      toast.error("Erro ao reenviar cupom");
    }
  };

  const handleCancelarVendaHistorico = (venda: VendaResumo) => {
    setConfirmDialog({
      open: true,
      title: "CANCELAR VENDA?",
      description: `Deseja cancelar a venda Nº ${venda.numero}? O estoque será restaurado.`,
      showMotivo: true,
      onConfirm: async (motivo) => {
        try {
          const { error } = await supabase.rpc("cancelar_venda" as any, {
            p_venda_id: venda.id,
            p_motivo: motivo || null,
            p_cupom_fiscal: venda.numero,
          });
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ["produtos-pdv"] });
          queryClient.invalidateQueries({ queryKey: ["vendas-recentes"] });
          toast.success(`Venda Nº ${venda.numero} cancelada e estoque restaurado`);
        } catch (e: any) {
          toast.error("Erro ao cancelar venda", { description: e?.message || String(e) });
        }
      },
    });
  };

  // ── WhatsApp / PDF (venda recém-finalizada) ─────────────────────────────────
  const handleWhatsAppShare = async () => {
    if (!whatsappNumber || !lastSaleData) return;
    setIsSendingWhatsapp(true);
    const clienteNome = lastSaleData.cliente || "cliente";
    const cupom = lastSaleData.cupomFiscal || "";
    const totalStr = brl(lastSaleData.total ?? 0);
    const fileName = `Divas-Lingerie-Cupom-${cupom}.pdf`;

    try {
      const { blob: pdfBlob } = await gerarReciboVendaPDF(lastSaleData);
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Cupom Divas Lingerie – Nº ${cupom}`,
          text: `Olá, ${clienteNome}! Segue seu cupom da Divas Lingerie. Total: ${totalStr}`,
        });
        toast.success("Cupom compartilhado!");
        return;
      }

      const message =
        `Olá, ${clienteNome}!\n\nObrigada pela sua compra na Divas Lingerie!\n\n` +
        `Cupom Nº ${cupom}\nTotal: ${totalStr}\n\n` +
        (receiptUrl ? `Acesse seu cupom:\n${receiptUrl}\n\n` : "") +
        `Volte sempre!`;
      window.open(buildWhatsappUrl(whatsappNumber, message), "_blank");
      toast.success("WhatsApp aberto!", { description: "Confirme o envio no WhatsApp." });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Erro ao compartilhar", { description: err?.message });
      }
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!lastSaleData) return;
    setIsGeneratingPDF(true);
    try {
      let url = receiptUrl;
      if (!url) {
        const result = await gerarReciboVendaPDF(lastSaleData);
        url = result.url;
        setReceiptUrl(url);
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = `cupom-${lastSaleData.cupomFiscal || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Erro ao gerar PDF para download");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Reenvio em lote (por período) ───────────────────────────────────────────
  const handleReenviarWhatsAppLote = async () => {
    if (selectedReenviarVendas.length === 0 || !reenviarWhatsapp) return;
    setIsEnviandoReenvio(true);
    try {
      const files = await Promise.all(
        selectedReenviarVendas.map(async (venda) => {
          const recibo = await fetchReciboFromVenda(venda.id);
          const { blob } = await gerarReciboVendaPDF(recibo);
          return new File(
            [blob],
            `Divas-Cupom-${venda.ven_cupom_fiscal || venda.id.slice(0, 8)}.pdf`,
            {
              type: "application/pdf",
            },
          );
        }),
      );

      const cupons = selectedReenviarVendas
        .map((v) => v.ven_cupom_fiscal || v.id.slice(0, 8))
        .join(", ");
      const totalGeral = brl(
        selectedReenviarVendas.reduce((s, v) => s + (v.ven_valor_total || 0), 0),
      );
      const clienteNome =
        clientesData.find((c: any) => c.id === selectedReenviarVendas[0]?.ven_cliente_id)
          ?.cli_nome || "cliente";
      const message =
        `Olá, ${clienteNome}!\n\n` +
        (files.length === 1
          ? `Segue o cupom da sua compra na Divas Lingerie.\nCupom Nº ${cupons}\nTotal: ${totalGeral}`
          : `Seguem os ${files.length} cupons das suas compras na Divas Lingerie.\nCupons: ${cupons}\nTotal: ${totalGeral}`) +
        `\n\nObrigada pela preferência!`;

      const digits = reenviarWhatsapp.replace(/\D/g, "");
      const phone = digits.startsWith("55") ? digits : `55${digits}`;

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: "Cupons Divas Lingerie", text: message });
      } else {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
      }

      setIsReenviarModalOpen(false);
      setSelectedReenviarVendas([]);
      setReenviarWhatsapp("");
    } catch {
      toast.error("Erro ao enviar via WhatsApp");
    } finally {
      setIsEnviandoReenvio(false);
    }
  };

  // ── Caixa ────────────────────────────────────────────────────────────────────
  const handleAbrirCaixa = async (valor: number) => {
    setIsCashActionLoading(true);
    try {
      const { error } = await supabase.rpc("abrir_caixa" as any, {
        p_operador_id: user?.id ?? null,
        p_valor_abertura: valor,
        p_terminal: TERMINAL,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["caixa-atual", TERMINAL] });
      toast.success("Caixa aberto");
      setCashModal(null);
    } catch (e: any) {
      toast.error("Erro ao abrir caixa", { description: e?.message });
    } finally {
      setIsCashActionLoading(false);
    }
  };

  const handleFecharCaixa = async (valor: number) => {
    if (!caixaAtual) return;
    setIsCashActionLoading(true);
    try {
      const { error } = await supabase.rpc("fechar_caixa" as any, {
        p_caixa_id: caixaAtual.id,
        p_valor_fechamento: valor,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["caixa-atual", TERMINAL] });
      toast.success("Caixa fechado");
      setCashModal(null);
    } catch (e: any) {
      toast.error("Erro ao fechar caixa", { description: e?.message });
    } finally {
      setIsCashActionLoading(false);
    }
  };

  const handleMovimentacaoCaixa = async (valor: number, motivo: string) => {
    if (!caixaAtual || !cashMovementModal) return;
    setIsCashActionLoading(true);
    try {
      const { error } = await supabase.rpc("registrar_movimentacao_caixa" as any, {
        p_caixa_id: caixaAtual.id,
        p_tipo: cashMovementModal.tipo,
        p_valor: valor,
        p_motivo: motivo || null,
        p_operador_id: user?.id ?? null,
      });
      if (error) throw error;
      toast.success(
        cashMovementModal.tipo === "sangria" ? "Sangria registrada" : "Suprimento registrado",
      );
      setCashMovementModal(null);
    } catch (e: any) {
      toast.error("Erro ao registrar movimentação", { description: e?.message });
    } finally {
      setIsCashActionLoading(false);
    }
  };

  // ── Atalhos de teclado ───────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onBuscarProduto: () => searchInputRef.current?.focus(),
    onConsultarPreco: () => setIsPriceCheckOpen(true),
    onSelecionarCliente: () => setIsCustomerModalOpen(true),
    onDesconto: () => setDiscountTarget({ itemId: null }),
    onPagamento: () => {
      if (caixaAtual && items.filter((i) => !i.cancelado).length > 0) setIsPaymentModalOpen(true);
    },
    onCancelarVenda: handleCancelarVenda,
    onFinalizarVenda: () => {
      if (caixaAtual && items.filter((i) => !i.cancelado).length > 0) setIsPaymentModalOpen(true);
    },
    onEscape: () => {
      setIsPaymentModalOpen(false);
      setIsCustomerModalOpen(false);
      setIsSellerModalOpen(false);
      setIsScannerOpen(false);
      setIsPriceCheckOpen(false);
      setDiscountTarget(null);
    },
  });

  if (isLoadingFinalizadoras || isLoadingProdutos || isLoadingClientes || isLoadingCaixa) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[var(--pdv-rose-bg)]">
        <LoaderIcon className="h-10 w-10 animate-spin text-[var(--pdv-rose)]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--pdv-gray-text)]">
          Carregando PDV...
        </p>
      </div>
    );
  }

  const activeItemsCount = items.filter((i) => !i.cancelado).length;
  const discountReferenceValue =
    discountTarget?.itemId != null
      ? (items.find((i) => i.id === discountTarget.itemId)?.total ?? 0)
      : subtotal;
  const discountCurrentValue =
    discountTarget?.itemId != null
      ? (items.find((i) => i.id === discountTarget.itemId)?.desconto ?? 0)
      : desconto;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 flex h-[calc(100svh-4rem)] flex-col gap-3 overflow-hidden bg-[var(--pdv-rose-bg)] p-3 sm:p-4">
      <POSHeader
        operadorNome={operadorNome}
        terminal={TERMINAL}
        caixa={caixaAtual as any}
        onNovaVenda={() => {
          resetVenda();
          setSearchTerm("");
          searchInputRef.current?.focus();
        }}
        onConsultarPreco={() => setIsPriceCheckOpen(true)}
        onSangria={() => setCashMovementModal({ tipo: "sangria" })}
        onSuprimento={() => setCashMovementModal({ tipo: "suprimento" })}
        onFecharCaixa={() => setCashModal({ mode: "fechar" })}
      />

      {!caixaAtual && (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--pdv-danger)]/30 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-[var(--pdv-danger)]">
            Caixa fechado — abra o caixa para iniciar as vendas.
          </p>
          <Button
            onClick={() => setCashModal({ mode: "abrir" })}
            className="h-9 rounded-xl bg-[var(--pdv-danger)] text-white hover:bg-[var(--pdv-danger)]/90"
          >
            Abrir caixa
          </Button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_380px]">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pdv-border)] bg-white p-3 shadow-sm">
            <POSSearchBar
              ref={searchInputRef}
              value={searchTerm}
              onChange={setSearchTerm}
              onScan={() => setIsScannerOpen(true)}
              onDesconto={() => setDiscountTarget({ itemId: null })}
            />
            <ProductFilters
              categorias={categorias.map((c: any) => ({ id: c.id, nome: c.cat_nome }))}
              categoriaAtiva={categoriaAtiva}
              onSelectCategoria={setCategoriaAtiva}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <ProductGrid
              produtos={filteredProducts}
              getDisponivel={getDisponivel}
              onAdd={addItem}
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm("")}
              onCadastrarProduto={() => navigate({ to: "/produtos" })}
            />
            <LastSalesPanel
              vendas={vendasRecentes}
              onReimprimir={handleReimprimirVenda}
              onReenviarWhatsapp={handleReenviarVendaIndividual}
              onCancelar={handleCancelarVendaHistorico}
            />
            <KeyboardShortcutsBar />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--pdv-border)] bg-white shadow-sm">
          <CartPanel
            items={items}
            clienteNome={clienteSelecionadoNome}
            onSelecionarCliente={() => setIsCustomerModalOpen(true)}
            vendedorNome={vendedorSelecionadoNome}
            onSelecionarVendedor={() => setIsSellerModalOpen(true)}
            onLimparVenda={handleCancelarVenda}
            onIncrement={(id) => updateQuantity(id, 1)}
            onDecrement={(id) => updateQuantity(id, -1)}
            onRemove={cancelItem}
            onDescontoItem={(id) => setDiscountTarget({ itemId: id })}
          />
          <SaleSummary
            quantidadeItens={activeItemsCount}
            subtotal={subtotal}
            desconto={desconto}
            acrescimo={0}
            total={total}
            disabled={!caixaAtual || activeItemsCount === 0}
            onFinalizar={() => setIsPaymentModalOpen(true)}
            onPagamentoRapido={abrirPagamentoRapido}
            onCancelarVenda={handleCancelarVenda}
          />
        </div>
      </div>

      {/* Scanner de código de barras */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          const exact = produtos.find((p) => p.pro_codigo_barras === code || p.pro_codigo === code);
          if (exact) {
            addItem(exact);
            setIsScannerOpen(false);
          } else {
            toast.error("Produto não encontrado", { description: `Código: ${code}` });
          }
        }}
      />

      <CustomerSelectorModal
        open={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        clientes={clientesFiltrados as any}
        onSelect={(id) => setSelectedClienteId(id ?? "default")}
        searchTerm={clienteSearchTerm}
        onSearchChange={setClienteSearchTerm}
      />

      <SellerSelectorModal
        open={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        vendedores={vendedoresData as any}
        onSelect={setSelectedVendedorId}
      />

      <DiscountModal
        open={!!discountTarget}
        onClose={() => setDiscountTarget(null)}
        title={discountTarget?.itemId != null ? "Desconto no item" : "Desconto na venda"}
        valorReferencia={discountReferenceValue}
        valorAtual={discountCurrentValue}
        onApply={(valor) => {
          if (discountTarget?.itemId != null) applyItemDiscount(discountTarget.itemId, valor);
          else setDesconto(valor);
        }}
      />

      <PaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        clienteNome={clienteSelecionadoNome ?? "Não selecionado"}
        finalizadoras={finalizadorasAtivas as any}
        pagamentos={pagamentos}
        onTogglePagamento={addPagamento}
        onUpdatePagamentoValor={updatePagamentoValor}
        totalPago={totalPago}
        troco={trocoCalculado}
        valorFaltante={valorFaltante}
        observacao={observacaoVenda}
        onObservacaoChange={setObservacaoVenda}
        isFinishing={isProcessingFinish}
        onConfirm={handleFinishVenda}
      />

      <SaleSuccessModal
        open={isVendaFinalizadaOpen}
        onClose={() => setIsVendaFinalizadaOpen(false)}
        sale={lastSaleSummary}
        receiptData={lastSaleData}
        whatsappNumber={whatsappNumber}
        onWhatsappNumberChange={(v) => {
          setWhatsappNumber(formatPhoneBR(v));
          setWhatsappFromCadastro(false);
        }}
        whatsappFromCadastro={whatsappFromCadastro}
        onNovaVenda={() => {
          setIsVendaFinalizadaOpen(false);
          searchInputRef.current?.focus();
        }}
        onImprimir={() => lastSaleData && printRecibo(lastSaleData)}
        onWhatsapp={handleWhatsAppShare}
        onPDF={handleDownloadPDF}
        isSendingWhatsapp={isSendingWhatsapp}
        isGeneratingPDF={isGeneratingPDF}
      />

      <CashOpenCloseModal
        open={!!cashModal}
        onClose={() => setCashModal(null)}
        mode={cashModal?.mode ?? "abrir"}
        loading={isCashActionLoading}
        onConfirm={(valor) =>
          cashModal?.mode === "abrir" ? handleAbrirCaixa(valor) : handleFecharCaixa(valor)
        }
      />

      <CashMovementModal
        open={!!cashMovementModal}
        onClose={() => setCashMovementModal(null)}
        tipo={cashMovementModal?.tipo ?? "sangria"}
        loading={isCashActionLoading}
        onConfirm={handleMovimentacaoCaixa}
      />

      {/* Consulta de preço (somente leitura, não adiciona ao carrinho) */}
      <Dialog open={isPriceCheckOpen} onOpenChange={setIsPriceCheckOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Consultar preço</DialogTitle>
            <DialogDescription>
              Busque um produto para ver o preço sem adicionar à venda.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pdv-gray-text)]" />
            <Input
              autoFocus
              value={priceCheckTerm}
              onChange={(e) => setPriceCheckTerm(e.target.value)}
              placeholder="Nome ou código..."
              className="rounded-xl pl-9"
            />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {produtos
              .filter((p) => {
                const s = priceCheckTerm.trim().toLowerCase();
                if (!s) return false;
                return (
                  (p.pro_descricao || "").toLowerCase().includes(s) ||
                  (p.pro_codigo || "").toLowerCase().includes(s)
                );
              })
              .slice(0, 20)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[var(--pdv-rose-bg)]"
                >
                  <span className="truncate text-sm font-medium text-[var(--pdv-graphite)]">
                    {p.pro_descricao}
                  </span>
                  <span className="shrink-0 font-display text-sm font-bold text-[var(--pdv-rose-dark)]">
                    {brl(Number(p.pro_valor_venda))}
                  </span>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo genérico de confirmação (cancelamento com motivo) */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          setConfirmDialog((prev) => ({ ...prev, open }));
          if (!open) setMotivoCancelamento("");
        }}
      >
        <DialogContent className="sm:max-w-[350px] rounded-3xl p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-display text-lg font-bold text-[var(--pdv-graphite)]">
              {confirmDialog.title}
            </h3>
            <p className="whitespace-pre-wrap text-sm text-[var(--pdv-gray-text)]">
              {confirmDialog.description}
            </p>

            {confirmDialog.showMotivo && (
              <div className="w-full text-left">
                <Label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--pdv-gray-text)]">
                  Motivo *
                </Label>
                <Select value={motivoCancelamento} onValueChange={setMotivoCancelamento}>
                  <SelectTrigger className="h-10 rounded-xl text-xs">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosCancelamento.length === 0 ? (
                      <SelectItem value="_sem_motivos" disabled>
                        Nenhum motivo cadastrado
                      </SelectItem>
                    ) : (
                      motivosCancelamento.map((m) => (
                        <SelectItem key={m.id} value={m.mot_descricao}>
                          {m.mot_descricao}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6 flex flex-row gap-3 sm:justify-center">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            >
              Não
            </Button>
            <Button
              className="h-12 flex-1 rounded-xl bg-[var(--pdv-danger)] hover:bg-[var(--pdv-danger)]/90"
              disabled={confirmDialog.showMotivo && !motivoCancelamento.trim()}
              onClick={() => {
                const currentMotivo = motivoCancelamento;
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                setMotivoCancelamento("");
                confirmDialog.onConfirm(currentMotivo);
              }}
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reenvio de recibo em lote, por período */}
      <Dialog
        open={isReenviarModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsReenviarModalOpen(false);
            setSelectedReenviarVendas([]);
            setReenviarWhatsapp("");
            setReenviarPeriodo("");
            setReenviarBuscaCliente("");
          }
        }}
      >
        <DialogContent className="overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[420px]">
          <div className="bg-[var(--pdv-graphite)] px-5 py-4 text-white">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest">
              Reenviar Recibo
            </DialogTitle>
            <p className="mt-0.5 text-[11px] text-white/50">
              {!reenviarPeriodo
                ? "Escolha o período das vendas"
                : selectedReenviarVendas.length > 0
                  ? `${selectedReenviarVendas.length}/${MAX_CUPONS_REENVIO} cupom(ns) selecionado(s)`
                  : `Selecione até ${MAX_CUPONS_REENVIO} cupons`}
            </p>
          </div>

          <div className="border-b border-[var(--pdv-border)] bg-white px-4 pb-3 pt-4">
            <Label className="mb-1.5 block text-xs font-semibold uppercase text-[var(--pdv-gray-text)]">
              Período
            </Label>
            <Select
              value={reenviarPeriodo}
              onValueChange={(v) => {
                setReenviarPeriodo(v);
                setSelectedReenviarVendas([]);
                setReenviarWhatsapp("");
                setReenviarBuscaCliente("");
              }}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Selecione o período..." />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS_REENVIO.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reenviarPeriodo && (
              <Input
                value={reenviarBuscaCliente}
                onChange={(e) => setReenviarBuscaCliente(e.target.value)}
                placeholder="Buscar por cliente ou cupom..."
                className="mt-3 h-10 rounded-xl"
              />
            )}
          </div>

          {!reenviarPeriodo ? (
            <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 py-10 text-[var(--pdv-gray-text)]">
              <p className="text-sm font-bold">Escolha um período acima</p>
            </div>
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto bg-slate-50 p-3">
              {isLoadingVendasPeriodo ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[var(--pdv-gray-text)]">
                  <LoaderIcon className="h-5 w-5 animate-spin" />
                </div>
              ) : errorVendasPeriodo ? (
                <p className="py-10 text-center text-sm text-[var(--pdv-danger)]">
                  Erro ao carregar vendas
                </p>
              ) : vendasReenvioFiltradas.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--pdv-gray-text)]">
                  Nenhuma venda no período
                </p>
              ) : (
                vendasReenvioFiltradas.map((venda: any) => {
                  const isSelected = selectedReenviarVendas.some((s) => s.id === venda.id);
                  const hora = new Date(venda.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const clienteObj = clientesData.find((c: any) => c.id === venda.ven_cliente_id);
                  return (
                    <button
                      key={venda.id}
                      onClick={() => {
                        setSelectedReenviarVendas((prev) => {
                          const already = prev.some((s) => s.id === venda.id);
                          if (!already && prev.length >= MAX_CUPONS_REENVIO) {
                            toast.error(
                              `Você pode selecionar até ${MAX_CUPONS_REENVIO} cupons por reenvio.`,
                            );
                            return prev;
                          }
                          const next = already
                            ? prev.filter((s) => s.id !== venda.id)
                            : [...prev, venda];
                          if (next.length > 0 && !reenviarWhatsapp) {
                            const primeiroCliente = clientesData.find(
                              (c: any) => c.id === next[0].ven_cliente_id,
                            );
                            if (primeiroCliente?.cli_telefone)
                              setReenviarWhatsapp(formatPhoneBR(primeiroCliente.cli_telefone));
                          }
                          if (next.length === 0) setReenviarWhatsapp("");
                          return next;
                        });
                      }}
                      className={`w-full rounded-2xl border-2 bg-white p-3.5 text-left transition-all ${
                        isSelected
                          ? "border-[var(--pdv-rose)] bg-[var(--pdv-rose-bg)]"
                          : "border-transparent hover:border-[var(--pdv-border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--pdv-rose-dark)]">
                            Nº {venda.ven_cupom_fiscal || "---"} · {hora}
                          </p>
                          <p className="truncate text-sm font-semibold text-[var(--pdv-graphite)]">
                            {clienteObj?.cli_nome || "Consumidor Final"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-[var(--pdv-graphite)]">
                          {brl(venda.ven_valor_total)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {selectedReenviarVendas.length > 0 && (
            <div className="space-y-3 border-t border-[var(--pdv-border)] bg-white px-4 pb-4 pt-3">
              <Input
                value={reenviarWhatsapp}
                onChange={(e) => setReenviarWhatsapp(formatPhoneBR(e.target.value))}
                placeholder="(00) 00000-0000"
                className="h-11 rounded-xl"
              />
              <Button
                className="h-12 w-full rounded-xl bg-[var(--pdv-success)] font-bold uppercase text-white hover:bg-[var(--pdv-success)]/90 disabled:opacity-40"
                disabled={isEnviandoReenvio || reenviarWhatsapp.replace(/\D/g, "").length < 10}
                onClick={handleReenviarWhatsAppLote}
              >
                {isEnviandoReenvio ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : selectedReenviarVendas.length > 1 ? (
                  `Enviar ${selectedReenviarVendas.length} PDFs via WhatsApp`
                ) : (
                  "Enviar PDF via WhatsApp"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
