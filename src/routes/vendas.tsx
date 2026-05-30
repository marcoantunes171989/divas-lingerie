import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { z } from "zod";

const vendasSearchSchema = z.object({
  consignacao_id: z.string().optional(),
});

const DICAS_VENDAS = [
  "Ofereça um acessório complementar para aumentar o valor total da venda.",
  "Confirme sempre a forma de pagamento antes de finalizar para evitar estornos.",
  "Vendas no PIX liberam o capital de giro mais rápido para o seu negócio.",
  "Use o leitor de código de barras para agilizar o atendimento em dias de pico.",
  "Sempre ofereça a sacola de presente; a apresentação valoriza o seu produto.",
  "Vendas casadas (conjuntos) são ótimas para girar o estoque de peças paradas.",
  "Mantenha o troco organizado para não atrasar o fechamento das operações."
];
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  Trash2, 
  ShoppingCart, 
  User, 
  Plus, 
  Minus,
  Barcode,
  ArrowRight,
  Receipt,
  ShoppingBag,
  Tag,
  CreditCard,
  Banknote,
  QrCode,
  Camera,
  X,
  ChevronRight,
  CheckCircle2,
  Download,
  Share2,
  Zap
} from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";
import { AlertCircle, Loader2 as LoaderIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { brl } from "@/lib/format";
import { gerarReciboVendaPDF, gerarReciboVendaPNG, type ReciboVendaData } from "@/lib/recibo-venda";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CupomFiscalPreview } from "@/components/CupomFiscalPreview";

export const shouldShowCancelCoupon = (cupomFiscal: string, items: { cancelado?: boolean }[]) => {
  return !!cupomFiscal && items.some(i => !i.cancelado);
};

export const getCancelDialogTitle = (items: { cancelado?: boolean }[]) => {
  const hasItems = items.length > 0;
  const allCancelled = hasItems && items.every(i => i.cancelado);
  return allCancelled ? "CANCELAR CUPOM?" : "CANCELAR VENDA?";
};

export const calculateChange = (total: number, pagamentos: { forma: string, valor: number }[], finalizadoras: any[]) => {
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  if (totalPago <= total) return 0;
  
  // O troco é apenas a diferença, mas logicamente associado a formas que permitem troco
  return totalPago - total;
};

export const validatePagamentoValor = (
  id: string, 
  novoValor: number, 
  total: number, 
  pagamentos: { id: string, forma: string, valor: number }[], 
  finalizadoras: any[]
) => {
  const pagamento = pagamentos.find(p => p.id === id);
  if (!pagamento) return { valid: false, reason: "Pagamento não encontrado" };

  const fin = finalizadoras.find(f => f.fin_descricao.toLowerCase() === pagamento.forma.toLowerCase());
  const permiteTroco = fin?.fin_permite_troco ?? (pagamento.forma.toLowerCase() === 'dinheiro');

  if (!permiteTroco && novoValor > total) {
    return { valid: false, reason: "Valor excede o total (esta forma não permite troco)" };
  }

  if (!permiteTroco) {
    const outrosPagamentos = pagamentos.filter(op => op.id !== id).reduce((acc, op) => acc + op.valor, 0);
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


interface ItemVenda {
  id: string;
  produto_id: string;
  descricao: string;
  codigo: string;
  valor: number;
  quantidade: number;
  total: number;
  added_at: number;
  cancelado?: boolean;
  motivo_cancelamento?: string;
}

export function PDVPage() {
  const dicaAleatoria = useMemo(() => {
    return DICAS_VENDAS[Math.floor(Math.random() * DICAS_VENDAS.length)];
  }, []);

  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = useSearch({ from: "/vendas" });
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<ItemVenda[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>("default");
  const [isFinishing, setIsFinishing] = useState(false);
  const [desconto, setDesconto] = useState<number>(0);
  const [pagamentos, setPagamentos] = useState<{ id: string, forma: string, valor: number }[]>([]);
  const [valorPagoManual, setValorPagoManual] = useState<string>("0,00");
  const [currentConsignacaoId, setCurrentConsignacaoId] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [hasConfirmedClient, setHasConfirmedClient] = useState(false);
  const [isProcessingFinish, setIsProcessingFinish] = useState(false);
  const isProcessingRef = useRef(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cupomFiscal, setCupomFiscal] = useState<string>("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [motivosCancelamento, setMotivosCancelamento] = useState<{ id: string; mot_codigo: number; mot_descricao: string }[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [isVendaFinalizadaOpen, setIsVendaFinalizadaOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [isCupomPreviewOpen, setIsCupomPreviewOpen] = useState(false);
  const [whatsappFromCadastro, setWhatsappFromCadastro] = useState(false);
  const [isReenviarModalOpen, setIsReenviarModalOpen] = useState(false);
  const [selectedReenviarVendas, setSelectedReenviarVendas] = useState<any[]>([]);
  const [reenviarWhatsapp, setReenviarWhatsapp] = useState("");
  const [isEnviandoReenvio, setIsEnviandoReenvio] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    showMotivo?: boolean;
    onConfirm: (motivo?: string) => void;
  }>({
    open: false,
    title: "",
    description: "",
    showMotivo: false,
    onConfirm: () => {},
  });

  // Abre a tela de Vendas em modo tela cheia (equivalente ao F11 do Windows).
  // O usuário sai com ESC (comportamento nativo do navegador) ou ao trocar de página.
  useEffect(() => {
    const el = document.documentElement;
    (async () => {
      try {
        if (el.requestFullscreen && !document.fullscreenElement) {
          await el.requestFullscreen();
        }
      } catch {
        /* o navegador pode bloquear sem gesto direto do usuário — ignora silenciosamente */
      }
    })();
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (receiptUrl && lastSaleData) {
      const regenerate = async () => {
        const loadingToast = toast.loading("Alterando formato...");
        try {
          const { blob, url } = exportFormat === 'pdf' 
            ? await gerarReciboVendaPDF(lastSaleData)
            : await gerarReciboVendaPNG(lastSaleData);
            
          const extension = exportFormat === 'pdf' ? 'pdf' : 'png';
          const contentType = exportFormat === 'pdf' ? 'application/pdf' : 'image/png';
          const fileName = `recibo-${lastSaleData.cupomFiscal}-${Date.now()}.${extension}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('recibos-vendas')
            .upload(fileName, blob, {
              contentType,
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('recibos-vendas')
              .getPublicUrl(fileName);
            setReceiptUrl(publicUrl);
          } else {
            setReceiptUrl(url);
          }
          toast.success(`Formato alterado para ${extension.toUpperCase()}`, { id: loadingToast });
        } catch (error) {
          console.error("Erro ao alterar formato:", error);
          toast.error("Erro ao alterar formato", { id: loadingToast });
        }
      };
      regenerate();
    }
  }, [exportFormat]);

  useEffect(() => {
    if (isFinishing && !cupomFiscal) {
      supabase.rpc('proximo_cupom_fiscal' as any).then(({ data, error }) => {
        if (!error && data) {
          setCupomFiscal(String(data).padStart(6, '0'));
        } else {
          setCupomFiscal(Math.floor(100000 + Math.random() * 900000).toString());
        }
      });
    }
  }, [isFinishing, cupomFiscal]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const valorPagoRef = useRef<HTMLInputElement>(null);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const parseMoeda = (valor: string) => {
    const cleanValue = valor.replace(/\D/g, '');
    return Number(cleanValue) / 100;
  };

  const formatPhoneBR = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const buildWhatsappUrl = (phone: string, message: string) => {
    const digits = phone.replace(/\D/g, '');
    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsAppShare = async () => {
    if (!whatsappNumber || !lastSaleData) return;
    setIsSendingWhatsapp(true);

    const clienteNome = lastSaleData.cliente || 'cliente';
    const cupom = lastSaleData.cupomFiscal || '';
    const totalStr = (lastSaleData.total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fileName = `Divas-Lingerie-Cupom-${cupom}.pdf`;

    try {
      // Gera PDF atualizado do cupom profissional
      const { blob: pdfBlob } = await gerarReciboVendaPDF(lastSaleData);
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Tenta Web Share API (compartilha o arquivo direto no celular)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Cupom Divas Lingerie – Nº ${cupom}`,
          text: `Olá, ${clienteNome}! 🌸 Segue seu cupom da Divas Lingerie. Total: ${totalStr}`,
        });
        toast.success('Cupom compartilhado!');
        return;
      }

      // Fallback desktop: abre wa.me com link do Storage
      const linkFallback = receiptUrl ?? '';
      const message =
        `Olá, ${clienteNome}! 🌸\n\n` +
        `Obrigada pela sua compra na *Divas Lingerie*!\n\n` +
        `📄 *Cupom Nº ${cupom}*\n` +
        `💰 *Total:* ${totalStr}\n\n` +
        (linkFallback ? `Acesse seu cupom:\n${linkFallback}\n\n` : '') +
        `Volte sempre! 💕`;
      window.open(buildWhatsappUrl(whatsappNumber, message), '_blank');
      toast.success('WhatsApp aberto!', { description: 'Confirme o envio no WhatsApp.' });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Erro ao compartilhar', { description: err?.message });
      }
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  // Queries
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
      const { data, error } = await supabase.from("tab_produtos").select("*").order("pro_descricao"); 
      if (error) throw error;
      return data || []; 
    },
  });

  const { data: clientesData = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["clientes-pdv"],
    queryFn: async () => { 
      const { data, error } = await supabase.from("tab_clientes").select("id, cli_nome, cli_telefone").order("cli_nome"); 
      if (error) throw error;
      return data || []; 
    },
  });

  const { data: vendasDoDia = [], isLoading: isLoadingVendasDia, error: errorVendasDia } = useQuery({
    queryKey: ["vendas-dia-reenvio", isReenviarModalOpen],
    queryFn: async () => {
      // Ultimas 24h — select * para evitar erro de coluna desconhecida
      const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await (supabase as any)
        .from("tab_vendas")
        .select("*")
        .gte("created_at", desde)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message || JSON.stringify(error));
      return (data as any[]) || [];
    },
    enabled: isReenviarModalOpen,
    staleTime: 0,
  });

  useEffect(() => {
    supabase
      .from("tab_motivos_cancelamento")
      .select("id, mot_codigo, mot_descricao")
      .eq("mot_ativo", true)
      .order("mot_codigo")
      .then(({ data }) => { if (data) setMotivosCancelamento(data); });
  }, []);

  // Carregar consignação se houver ID na URL
  useEffect(() => {
    if (searchParams.consignacao_id && produtos.length > 0) {
      const loadConsignacao = async () => {
        const { data, error } = await supabase
          .from("tab_consignacao")
          .select(`
            *,
            tab_produtos (*)
          `)
          .eq("id", searchParams.consignacao_id)
          .single();

        if (error) {
          toast.error("Erro ao carregar consignação");
          return;
        }

        if (data && data.con_status === 'em_posse') {
          const produto = (data as any).tab_produtos;
          const valor = Number(produto.pro_valor_venda) || 0;
          
          setItems([{ 
            id: Math.random().toString(36).substr(2, 9), 
            produto_id: data.con_produto_id, 
            descricao: produto.pro_descricao, 
            codigo: produto.pro_codigo, 
            valor, 
            quantidade: data.con_quantidade, 
            total: valor * data.con_quantidade, 
            added_at: Date.now() 
          }]);
          
          setSelectedClienteId(data.con_cliente_id);
          setCurrentConsignacaoId(data.id);
          setHasConfirmedClient(true);
          setIsFinishing(true); // Abre a tela de pagamento
          toast.success("Itens da consignação carregados!");
          
          // Limpar a URL para não carregar de novo se atualizar
          navigate({ search: { consignacao_id: undefined } as any, replace: true });
        }
      };
      loadConsignacao();
    }
  }, [searchParams.consignacao_id, produtos, navigate]);


  const filteredProducts = useMemo(() => {
    if (!searchTerm) return []; // Mostra lista em branco se não houver pesquisa
    const search = searchTerm.toLowerCase();
    return produtos.filter(p => 
      p.pro_descricao?.toLowerCase().includes(search) || 
      p.pro_codigo?.toLowerCase().includes(search) ||
      p.pro_codigo_barras?.toLowerCase() === search
    ).slice(0, 50);
  }, [produtos, searchTerm]);

  const addItem = (produto: any) => {
    const estoqueDisponivel = Number(produto.pro_estoque_atual) || 0;
    const itemAtivo = items.find(i => i.produto_id === produto.id && !i.cancelado);
    const qtdAtualNoCarrinho = itemAtivo?.quantidade || 0;

    if (qtdAtualNoCarrinho + 1 > estoqueDisponivel) {
      toast.error(`Estoque insuficiente`, { description: `"${produto.pro_descricao}" — disponível: ${estoqueDisponivel}` });
      return;
    }

    const valor = Number(produto.pro_valor_venda) || 0;
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.produto_id === produto.id && !i.cancelado);
      if (existingIndex !== -1) {
        const updatedItems = [...prev];
        const item = updatedItems[existingIndex];
        const newQty = item.quantidade + 1;
        updatedItems[existingIndex] = { ...item, quantidade: newQty, total: newQty * item.valor };
        return updatedItems;
      }
      return [{
        id: Math.random().toString(36).substr(2, 9),
        produto_id: produto.id,
        descricao: produto.pro_descricao,
        codigo: produto.pro_codigo,
        valor,
        quantidade: 1,
        total: valor,
        added_at: Date.now()
      }, ...prev];
    });
    
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item || item.cancelado) return prev;

      if (item.quantidade === 1 && delta === -1) {
        setConfirmDialog({
          open: true,
          title: "CANCELAR ITEM?",
          description: `Deseja cancelar ${item.descricao} da venda?`,
          showMotivo: true,
          onConfirm: (motivo) => {
            setItems(current => current.map(i => i.id === id ? { ...i, cancelado: true, total: 0, motivo_cancelamento: motivo } : i));
            toast.error("Item cancelado");
          }
        });
        return prev;
      }

      const produto = produtos.find(p => p.id === item.produto_id);
      const estoqueDisponivel = Number(produto?.pro_estoque_atual) || 0;
      const novaQtd = item.quantidade + delta;
      
      if (novaQtd > estoqueDisponivel) {
        toast.error(`Estoque insuficiente`, { description: `Disponível: ${estoqueDisponivel}` });
        return prev;
      }
      
      return prev.map(i => i.id === id ? { ...i, quantidade: novaQtd, total: novaQtd * i.valor } : i);
    });
  };

  const removeItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.cancelado) return;

    setConfirmDialog({
      open: true,
      title: "CANCELAR ITEM?",
      description: `Deseja cancelar ${item.descricao} da venda?`,
      showMotivo: true,
      onConfirm: (motivo) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, cancelado: true, motivo_cancelamento: motivo } : i));
        toast.error(`Item cancelado`, {
          description: `${item.descricao} foi cancelado na venda.`,
          duration: 3000,
        });
      }
    });
  };

  const subtotal = items.reduce((acc, item) => acc + (item.cancelado ? 0 : item.total), 0);
  
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [items]);

  const total = Math.max(0, subtotal - desconto);
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const valorFaltante = total - totalPago;

  const pagamentosQuePermitemTroco = pagamentos.filter(p => {
    const fin = finalizadorasAtivas.find(f => f.fin_descricao.toLowerCase() === p.forma.toLowerCase());
    return fin?.fin_permite_troco ?? (p.forma.toLowerCase() === 'dinheiro');
  });

  const totalPagoPermiteTroco = pagamentosQuePermitemTroco.reduce((acc, p) => acc + p.valor, 0);
  const outrosPagamentos = pagamentos.filter(p => !pagamentosQuePermitemTroco.includes(p)).reduce((acc, p) => acc + p.valor, 0);
  
  // O troco só é calculado se o total pago superar o total da venda.
  const trocoCalculado = calculateChange(total, pagamentos, finalizadorasAtivas);

  const handleFinishVenda = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessingFinish(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");
      
      const activeItems = items.filter(i => !i.cancelado);

      if (activeItems.length === 0) {
        toast.error("Carrinho sem itens ativos");
        isProcessingRef.current = false;
        setIsProcessingFinish(false);
        return;
      }

      if (valorFaltante > 0.01) {
        toast.error("Valor insuficiente", { description: `Falta receber ${brl(valorFaltante)}` });
        isProcessingRef.current = false;
        setIsProcessingFinish(false);
        return;
      }

      // Verificar estoque disponível antes de prosseguir
      const produtoIds = activeItems.map(i => i.produto_id);
      const { data: estoques } = await supabase
        .from("tab_produtos")
        .select("id, pro_descricao, pro_codigo, pro_estoque_atual")
        .in("id", produtoIds);

      const semEstoque = activeItems.filter(item => {
        const produto = estoques?.find((p: any) => p.id === item.produto_id);
        return produto !== undefined && (produto.pro_estoque_atual ?? 0) < item.quantidade;
      });

      if (semEstoque.length > 0) {
        const detalhes = semEstoque.map(item => {
          const produto = estoques?.find((p: any) => p.id === item.produto_id);
          const disponivel = produto?.pro_estoque_atual ?? 0;
          return `${item.descricao || produto?.pro_codigo || "Produto"}: disponível ${disponivel}, solicitado ${item.quantidade}`;
        }).join(" | ");
        toast.error("Estoque insuficiente", { description: detalhes });
        isProcessingRef.current = false;
        setIsProcessingFinish(false);
        return;
      }

      const rpcItens = activeItems.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor,
        valor_total: item.total,
        observacao: item.motivo_cancelamento || null
      }));
      console.log('[VENDA] RPC chamada. Itens:', JSON.stringify(rpcItens));

      const { data: vendaId, error: rpcError } = await supabase.rpc('registrar_venda_completa' as any, {
        p_cliente_id: selectedClienteId === "default" ? null : selectedClienteId,
        p_usuario_id: null,
        p_valor_total: total,
        p_desconto: desconto,
        p_forma_pagamento: pagamentos[0]?.forma || 'DINHEIRO',
        p_itens: rpcItens,
        p_pagamentos: pagamentos.map(p => {
          const fin = finalizadorasAtivas.find(f => f.fin_descricao.toLowerCase() === p.forma.toLowerCase());
          return {
            forma: p.forma,
            valor: p.valor,
            finalizadora_id: fin?.id,
            permite_troco: fin?.fin_permite_troco ?? true
          };
        })
      });

      if (rpcError) throw rpcError;

      // Se veio de uma consignação, marcar como vendida e salvar a referência da venda
      if (currentConsignacaoId) {
        await supabase
          .from("tab_consignacao")
          .update({
            con_status: 'vendido',
            con_venda_id: vendaId as string
          } as any)
          .eq("id", currentConsignacaoId);
        setCurrentConsignacaoId(null);
      }

      toast.success("Venda finalizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["produtos-pdv"] });

      // Build sale data and open dialog immediately (PDF generation is secondary)
      const cliente = clientesData.find((c: any) => c.id === selectedClienteId);
      const clienteNome = cliente?.cli_nome || "Consumidor";
      if (cliente?.cli_telefone) {
        setWhatsappNumber(formatPhoneBR(cliente.cli_telefone));
        setWhatsappFromCadastro(true);
      } else {
        setWhatsappNumber("");
        setWhatsappFromCadastro(false);
      }
      const temDinheiro = pagamentos.some(p => p.forma.toLowerCase() === "dinheiro");
      const excedente = Math.max(0, totalPago - total);

      const saleData = {
        vendaId: vendaId as string,
        cliente: clienteNome,
        itens: items.filter(it => !it.cancelado).map(it => ({ descricao: it.descricao, codigo: it.codigo, quantidade: it.quantidade, valor: it.valor, total: it.total })),
        subtotal,
        desconto,
        total,
        pagamentos: pagamentos.map(p => ({ forma: p.forma, valor: p.valor })),
        totalPago,
        troco: temDinheiro ? excedente : 0,
        data: new Date(),
        cupomFiscal: cupomFiscal
      };

      // Salva os dados da venda e fecha o checkout dialog primeiro
      setLastSaleData(saleData);
      setReceiptUrl(null);
      setReceiptBlob(null);

      // Fecha checkout + carrinho, limpa carrinho
      setIsFinishing(false);
      setIsCartOpen(false);
      setItems([]);
      setDesconto(0);
      setPagamentos([]);
      setValorPagoManual("0,00");
      setSelectedClienteId("default");
      setCupomFiscal("");

      // Abre o dialog de sucesso APÓS o checkout fechar (evita conflito de overlay)
      setTimeout(() => setIsVendaFinalizadaOpen(true), 300);

      // Gera PDF em segundo plano (não bloqueia abertura do dialog)
      try {
        const { blob, url } = await gerarReciboVendaPDF(saleData);
        setReceiptBlob(blob);
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

  const handleReenviarWhatsApp = async () => {
    if (selectedReenviarVendas.length === 0 || !reenviarWhatsapp) return;
    setIsEnviandoReenvio(true);
    try {
      // Gera PDF para cada venda selecionada em paralelo
      const files = await Promise.all(
        selectedReenviarVendas.map(async (venda) => {
          const { data: vf } = await (supabase as any)
            .from("tab_vendas")
            .select("*, tab_itens_venda!itv_venda_id(*, tab_produtos(pro_descricao, pro_codigo))")
            .eq("id", venda.id)
            .single();

          const clienteObj = clientesData.find((c: any) => c.id === venda.ven_cliente_id);
          const itens = ((vf?.tab_itens_venda || []) as any[])
            .filter((i: any) => i.itv_status === "ativo")
            .map((i: any) => ({
              descricao: i.tab_produtos?.pro_descricao || "Produto",
              codigo: i.tab_produtos?.pro_codigo,
              quantidade: i.itv_quantidade,
              valor: i.itv_valor_unitario ?? (i.itv_valor_total / Math.max(1, i.itv_quantidade)),
              total: i.itv_valor_total,
            }));
          const subtotal = itens.reduce((s: number, i: any) => s + i.total, 0);
          const reciboData: ReciboVendaData = {
            cliente: clienteObj?.cli_nome || "Consumidor Final",
            itens,
            subtotal,
            desconto: Math.max(0, subtotal - (venda.ven_valor_total ?? subtotal)),
            total: venda.ven_valor_total ?? subtotal,
            pagamentos: [{ forma: venda.ven_forma_pagamento || "DINHEIRO", valor: venda.ven_valor_total ?? subtotal }],
            totalPago: venda.ven_valor_total ?? subtotal,
            troco: 0,
            data: new Date(venda.created_at),
            cupomFiscal: venda.ven_cupom_fiscal,
          };
          const { blob } = await gerarReciboVendaPDF(reciboData);
          return new File([blob], `Divas-Cupom-${venda.ven_cupom_fiscal || venda.id.slice(0, 8)}.pdf`, { type: "application/pdf" });
        })
      );

      const cupons = selectedReenviarVendas.map(v => v.ven_cupom_fiscal || v.id.slice(0, 8)).join(", ");
      const totalGeral = brl(selectedReenviarVendas.reduce((s, v) => s + (v.ven_valor_total || 0), 0));
      const clienteNome = clientesData.find((c: any) => c.id === selectedReenviarVendas[0]?.ven_cliente_id)?.cli_nome || "cliente";
      const message =
        `Olá, ${clienteNome}! 🌸\n\n` +
        (files.length === 1
          ? `Segue o cupom da sua compra na Divas Lingerie.\nCupom Nº ${cupons}\nTotal: ${totalGeral}`
          : `Seguem os ${files.length} cupons das suas compras na Divas Lingerie.\nCupons: ${cupons}\nTotal: ${totalGeral}`) +
        `\n\nObrigada pela preferência! 💕`;

      const digits = reenviarWhatsapp.replace(/\D/g, "");
      const phone = digits.startsWith("55") ? digits : `55${digits}`;

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: `Cupons Divas Lingerie`, text: message });
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

  const handleResendReceipt = async () => {
    if (!lastSaleData) {
      toast.error("Nenhuma venda recente para reenviar");
      return;
    }
    
    setIsResending(true);
    const loadingToast = toast.loading("Gerando link para reenvio...");
    
    try {
      const { blob, url } = exportFormat === 'pdf'
        ? await gerarReciboVendaPDF(lastSaleData)
        : await gerarReciboVendaPNG(lastSaleData);
      
      const extension = exportFormat === 'pdf' ? 'pdf' : 'png';
      const contentType = exportFormat === 'pdf' ? 'application/pdf' : 'image/png';
      const fileName = `recibo-reenvio-${lastSaleData.cupomFiscal}-${Date.now()}.${extension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recibos-vendas')
        .upload(fileName, blob, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recibos-vendas')
        .getPublicUrl(fileName);
        
      setReceiptUrl(publicUrl);
      toast.dismiss(loadingToast);
    } catch (error: any) {
      console.error("Erro ao reenviar:", error);
      toast.error("Falha ao reenviar recibo");
      toast.dismiss(loadingToast);
    } finally {
      setIsResending(false);
    }
  };

  const addPagamento = (forma: string) => {
    const vRestante = Math.max(0, total - totalPago);
    if (vRestante <= 0) { 
      toast.info("Venda já totalmente paga."); 
      return; 
    }
    
    const novo = { id: Math.random().toString(36).substr(2, 9), forma, valor: vRestante };
    setPagamentos([...pagamentos, novo]);
  };

  const updatePagamentoValor = (id: string, novoValorStr: string) => {
    const valorNum = parseMoeda(novoValorStr);
    
    setPagamentos(prev => prev.map(p => {
      if (p.id !== id) return p;

      const validation = validatePagamentoValor(id, valorNum, total, prev, finalizadorasAtivas);
      
      if (!validation.valid) {
        toast.error("Valor inválido", { description: validation.reason });
        return p;
      }

      return { ...p, valor: valorNum };
    }));
  };

  if (isLoadingFinalizadoras || isLoadingProdutos || isLoadingClientes) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center space-y-4 z-[100]">
        <LoaderIcon className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando PDV...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 flex flex-col">
      {/* Header with Search */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-black tracking-tighter text-xl">VENDAS<span className="text-primary">PRO</span></h1>
          </div>
          <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">v2.5</Badge>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none group-focus-within:text-primary transition-colors" />
          <Input 
            ref={searchInputRef} 
            className="h-14 pl-12 pr-28 rounded-2xl bg-white/10 border-none text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-primary/50 text-lg uppercase" 
            placeholder="Buscar produto ou código de barras..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value.toUpperCase())} 
            onKeyDown={e => {
              if (e.key === 'Enter' && searchTerm) {
                const search = searchTerm.toUpperCase();
                const exact = produtos.find(p => p.pro_codigo_barras === search || p.pro_codigo?.toUpperCase() === search);
                if (exact) {
                  addItem(exact);
                  setSearchTerm("");
                }
              }
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                title="Limpar pesquisa"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-primary transition-colors"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Product Catalog */}
      <main className="flex-1 px-4 py-6">
        <div className="mb-6 px-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary fill-current" /> Dica de Venda: <span className="text-slate-200 normal-case font-medium italic">{dicaAleatoria}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const itemNoCarrinho = items.find(i => i.produto_id === p.id && !i.cancelado);
            return (
              <Card 
                key={p.id} 
                className={cn(
                  "p-3 rounded-[1.5rem] border-none shadow-sm flex flex-col justify-between gap-3 transition-all active:scale-[0.98]",
                  itemNoCarrinho ? "bg-primary/5 ring-2 ring-primary/20" : "bg-white"
                )}
                onClick={() => !itemNoCarrinho && addItem(p)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">REF: {p.pro_codigo || '---'}</span>
                    <h3 className={cn(
                      "font-bold leading-tight truncate uppercase text-xs",
                      itemNoCarrinho?.cancelado ? "line-through text-red-400" : "text-slate-900"
                    )}>
                      {p.pro_descricao}
                    </h3>
                    {itemNoCarrinho?.cancelado && (
                      <span className="text-[8px] font-black text-red-500 uppercase">CANCELADO</span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[9px] border-emerald-100 font-bold">
                        {p.pro_estoque_atual} EM ESTOQUE
                      </Badge>
                    </div>
                  </div>
                  {itemNoCarrinho && (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg",
                      itemNoCarrinho.cancelado ? "bg-red-400" : "bg-primary shadow-primary/30"
                    )}>
                      {itemNoCarrinho.cancelado ? <X className="w-4 h-4" /> : <span className="text-xs font-black">{itemNoCarrinho.quantidade}</span>}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Preço</span>
                    <span className={cn(
                      "text-lg font-black tabular-nums",
                      itemNoCarrinho?.cancelado ? "line-through text-red-300" : "text-slate-900"
                    )}>
                      {brl(Number(p.pro_valor_venda))}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {itemNoCarrinho && !itemNoCarrinho.cancelado && (
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="rounded-xl h-10 w-10 shadow-sm border border-slate-100"
                        onClick={() => updateQuantity(itemNoCarrinho.id, -1)}
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </Button>
                    )}
                    {!itemNoCarrinho?.cancelado && (
                      <Button 
                        size="icon" 
                        variant={itemNoCarrinho ? "default" : "secondary"} 
                        className="rounded-xl h-10 w-10 shadow-md"
                        onClick={() => addItem(p)}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    )}
                    {itemNoCarrinho?.cancelado && (
                      <Button 
                        size="sm"
                        variant="ghost"
                        className="text-[9px] font-black uppercase text-primary hover:bg-primary/5"
                        onClick={() => {
                          setItems(prev => prev.map(i => i.id === itemNoCarrinho.id ? { ...i, cancelado: false, total: i.quantidade * i.valor } : i));
                          toast.success("Item restaurado");
                        }}
                      >
                        Restaurar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
            <Search className="w-12 h-12 mb-4" />
            <p className="font-bold">Nenhum produto encontrado</p>
            <p className="text-sm">Tente buscar por outro termo ou código</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar — fica no fluxo da área de vendas, sem sobrepor o menu lateral */}
      <div className="sticky bottom-0 mt-auto p-4 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex flex-col gap-2">
        <div className="max-w-md mx-auto w-full">
          <Button
            variant="secondary"
            className="w-full h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-sm"
            onClick={() => { setIsReenviarModalOpen(true); setSelectedReenviarVendas([]); setReenviarWhatsapp(""); }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Reenviar Recibo (WhatsApp)
          </Button>
        </div>
        
        {items.length > 0 && (
          <div className="max-w-md mx-auto flex items-center gap-3 w-full animate-in slide-in-from-bottom-full duration-500">
            <Button 
              variant="outline" 
              className="h-16 px-4 rounded-3xl border-2 border-slate-100 bg-white text-red-500 hover:bg-red-50 flex flex-col items-center justify-center gap-1 transition-all"
              onClick={() => {
                const totalItens = items.filter(i => !i.cancelado).length;
                const valorTotal = brl(total);
                setConfirmDialog({
                  open: true,
                  title: getCancelDialogTitle(items),
                  description: items.length > 0 && items.every(i => i.cancelado) 
                    ? `Deseja cancelar o cupom fiscal?\nResumo: ${totalItens} itens cancelados`
                    : `Deseja cancelar toda a venda?\nResumo: ${totalItens} itens - Total: ${valorTotal}`,
                  showMotivo: true,
                  onConfirm: (motivo) => {
                    setItems([]);
                    setCupomFiscal("");
                    setCurrentConsignacaoId(null);
                    toast.error("Venda cancelada integralmente");
                  }
                });
              }}
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">CANCELAR</span>
            </Button>

            <div 
              className="flex-1 bg-slate-900 text-white rounded-3xl h-16 flex items-center justify-between px-6 cursor-pointer shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
              onClick={() => setIsCartOpen(true)}
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">{items.length} {items.length === 1 ? 'ITEM' : 'ITENS'}</span>
                <span className="text-xl font-black tabular-nums">{brl(total)}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary px-4 py-2 rounded-2xl shadow-lg shadow-primary/20">
                <span className="text-xs font-black uppercase tracking-widest">PAGAR</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-[3rem] p-0 overflow-hidden bg-slate-50 border-none">
          <div className="flex flex-col h-full">
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">Carrinho</h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} itens selecionados</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsCartOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {sortedItems.map((item) => (
                  <Card key={item.id} className="p-4 rounded-[2rem] border-none shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{item.codigo}</span>
                        <h3 className={cn(
                          "font-bold text-sm leading-tight uppercase",
                          item.cancelado ? "line-through text-red-400" : "text-slate-900"
                        )}>
                          {item.descricao}
                        </h3>
                        {item.cancelado && (
                          <span className="text-[9px] font-black text-red-500 uppercase">ITEM CANCELADO</span>
                        )}
                      </div>
                      {!item.cancelado ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-400 hover:text-red-600 -mt-2 -mr-2 flex items-center gap-1 font-bold text-[10px]"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" /> CANCELAR
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80 -mt-2 -mr-2 flex items-center gap-1 font-bold text-[10px]"
                          onClick={() => {
                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, cancelado: false, total: i.quantidade * i.valor } : i));
                            toast.success("Item restaurado");
                          }}
                        >
                          RESTAURAR
                        </Button>
                      )}
                    </div>
                    
                    <div className={cn("flex items-center justify-between", item.cancelado && "opacity-40 grayscale")}>
                      <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-600 active:scale-90 transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-black text-slate-900">{item.quantidade}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-600 active:scale-90 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{brl(item.valor)}/UN</span>
                        <span className="text-xl font-black text-slate-900 tabular-nums">{brl(item.total)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold tabular-nums">{brl(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Total da Venda</span>
                  <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">{brl(total)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  className="w-full h-16 rounded-3xl font-black uppercase tracking-widest bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                  onClick={() => setIsFinishing(true)}
                >
                  FINALIZAR VENDA <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={isFinishing} onOpenChange={setIsFinishing}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] p-0 overflow-hidden bg-slate-50 border-none rounded-[2.5rem] h-[90vh] sm:h-auto max-h-[95vh] flex flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white shrink-0">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/10 rounded-full h-8 w-8"
                    onClick={() => {
                      setConfirmDialog({
                        open: true,
                        title: "SAIR DA FINALIZAÇÃO?",
                        description: "Deseja voltar para o carrinho? Seus pagamentos adicionados serão mantidos.",
                        onConfirm: () => setIsFinishing(false)
                      });
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Finalizar</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary tracking-tighter tabular-nums leading-none">{brl(total)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                <User className="w-5 h-5 text-white/40" />
                <div className="flex-1">
                  <select 
                    className="w-full bg-transparent text-white font-black uppercase text-xs focus:outline-none appearance-none cursor-pointer" 
                    value={selectedClienteId} 
                    onChange={(e) => setSelectedClienteId(e.target.value)}
                  >
                    <option value="default" className="text-slate-900">CONSUMIDOR FINAL</option>
                    {clientesData.map((c: any) => (
                      <option key={c.id} value={c.id} className="text-slate-900">{c.cli_nome.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <ChevronRight className="w-3 h-3 text-white/20" />
              </div>
            </div>

            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Receipt className="w-3 h-3" /> Cupom Fiscal
                    </h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-600">Nº {cupomFiscal || "---"}</span>
                    <div className="flex gap-2">
                      {shouldShowCancelCoupon(cupomFiscal, items) ? (
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "CANCELAR CUPOM?",
                              description: `Deseja cancelar o cupom fiscal Nº ${cupomFiscal}?\nTodos os itens serão cancelados e o estoque restaurado.`,
                              showMotivo: true,
                              onConfirm: async (motivo) => {
                                const cupomAtual = cupomFiscal;

                                // Caso 1: venda já finalizada no banco → chama RPC
                                if (lastSaleData?.vendaId && lastSaleData?.cupomFiscal === cupomAtual) {
                                  await supabase.rpc('cancelar_venda' as any, {
                                    p_venda_id: lastSaleData.vendaId,
                                    p_motivo: motivo || null,
                                    p_cupom_fiscal: cupomAtual
                                  });
                                } else {
                                  // Caso 2: venda NÃO finalizada → salva direto na tabela
                                  const itensAtivos = items.filter(i => !i.cancelado);
                                  const snapshot = itensAtivos.map(i => {
                                    const prod = (produtos as any[]).find((p: any) => p.id === i.produto_id);
                                    return {
                                      produto_id: i.produto_id,
                                      descricao: i.descricao,
                                      estoque_no_cancelamento: prod?.pro_estoque_atual ?? 0,
                                      quantidade_cancelada: i.quantidade
                                    };
                                  });
                                  const valorTotal = itensAtivos.reduce((s, i) => s + i.total, 0);
                                  await supabase.from('tab_cancelamentos' as any).insert({
                                    can_cupom_fiscal: cupomAtual,
                                    can_tipo: 'venda_completa',
                                    can_motivo: motivo || null,
                                    can_estoque_snapshot: snapshot,
                                    can_valor_cancelado: valorTotal
                                  });
                                }

                                // Fecha painel e reseta carrinho
                                setItems([]);
                                setIsFinishing(false);
                                setIsCartOpen(false);
                                setDesconto(0);
                                setPagamentos([]);
                                setSelectedClienteId("default");
                                setCupomFiscal("");
                                queryClient.invalidateQueries({ queryKey: ["produtos-pdv"] });
                                toast.info(`Cupom Nº ${cupomAtual} cancelado e estoque restaurado`);
                              }
                            });
                          }}
                          className="text-[9px] font-black text-red-500 uppercase hover:underline"
                        >
                          Cancelar Cupom
                        </button>
                      ) : (
                        <button 
                          onClick={() => setCupomFiscal(Math.floor(100000 + Math.random() * 900000).toString())}
                          className="text-[9px] font-black text-primary uppercase"
                        >
                          Gerar Novo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <CreditCard className="w-3 h-3" /> Pagamento
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {finalizadorasAtivas.map((f) => (
                      <Button
                        key={f.id}
                        variant="outline"
                        className={cn(
                          "h-16 rounded-2xl flex flex-col gap-1 border transition-all active:scale-95 group p-1",
                          pagamentos.some(p => p.forma === f.fin_descricao) 
                            ? "bg-primary border-primary text-white shadow-md shadow-primary/10" 
                            : "bg-white border-slate-100 text-slate-600"
                        )}
                        onClick={() => addPagamento(f.fin_descricao)}
                      >
                        <span className="text-[9px] font-black uppercase tracking-tight text-center leading-tight">{f.fin_descricao}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {pagamentos.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Valores Recebidos</h3>
                    <div className="space-y-3">
                      {pagamentos.map((p, idx) => {
                        const fin = finalizadorasAtivas.find(f => f.fin_descricao.toLowerCase() === p.forma.toLowerCase());
                        const permiteTroco = fin?.fin_permite_troco ?? (p.forma.toLowerCase() === 'dinheiro');

                        return (
                          <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center",
                                  permiteTroco ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                )}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest">{p.forma}</span>
                              </div>
                              <button 
                                onClick={() => setPagamentos(pagamentos.filter((_, i) => i !== idx))} 
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                              <Input
                                className="h-11 pl-9 font-black text-slate-900 tabular-nums focus-visible:ring-primary/20 rounded-xl bg-slate-50 border-none"
                                value={formatarMoeda(p.valor)}
                                onChange={(e) => updatePagamentoValor(p.id, e.target.value)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-5 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                  <p className={cn("text-sm font-black uppercase tracking-tighter", valorFaltante <= 0.01 ? "text-emerald-500" : "text-amber-500")}>
                    {valorFaltante > 0.01 ? `FALTA ${brl(valorFaltante)}` : "PAGO"}
                  </p>
                </div>
                {trocoCalculado > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Troco</p>
                    <p className="text-xl font-black text-emerald-500 tracking-tighter tabular-nums leading-none">{brl(trocoCalculado)}</p>
                  </div>
                )}
              </div>
              
              <Button 
                disabled={valorFaltante > 0.01 || isProcessingFinish}
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.1em] bg-slate-900 text-white shadow-lg shadow-slate-900/20 disabled:opacity-50 text-xs"
                onClick={handleFinishVenda}
              >
                {isProcessingFinish ? <LoaderIcon className="w-5 h-5 animate-spin" /> : (
                  <>CONCLUIR <Receipt className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(code) => {
          const exact = produtos.find(p => p.pro_codigo_barras === code || p.pro_codigo === code);
          if (exact) {
            addItem(exact);
            setIsScannerOpen(false);
          } else {
            toast.error("Produto não encontrado", { description: `Código: ${code}` });
          }
        }} 
      />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => {
        setConfirmDialog(prev => ({ ...prev, open }));
        if (!open) setMotivoCancelamento("");
      }}>
        <DialogContent className="sm:max-w-[350px] rounded-[2rem] p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="w-full">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{confirmDialog.title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">{confirmDialog.description}</p>
              
              {confirmDialog.showMotivo && (
                <div className="mt-4 text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Motivo *</Label>
                  <Select value={motivoCancelamento} onValueChange={setMotivoCancelamento}>
                    <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 text-xs h-10">
                      <SelectValue placeholder="Selecione o motivo..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {motivosCancelamento.length === 0 ? (
                        <SelectItem value="_sem_motivos" disabled>
                          Nenhum motivo cadastrado
                        </SelectItem>
                      ) : (
                        motivosCancelamento.map(m => (
                          <SelectItem key={m.id} value={m.mot_descricao}>
                            <span className="font-mono text-slate-400 mr-2 text-[10px]">
                              MC{String(m.mot_codigo).padStart(3, "0")}
                            </span>
                            {m.mot_descricao}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3 mt-6 sm:justify-center">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl font-bold uppercase text-xs h-12"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            >
              Não
            </Button>
            <Button 
              className="flex-1 rounded-xl font-bold uppercase text-xs h-12 bg-slate-900"
              disabled={confirmDialog.showMotivo && !motivoCancelamento.trim()}
              onClick={() => {
                const currentMotivo = motivoCancelamento;
                setConfirmDialog(prev => ({ ...prev, open: false }));
                setMotivoCancelamento("");
                confirmDialog.onConfirm(currentMotivo);
              }}
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CupomFiscalPreview
        open={isCupomPreviewOpen}
        onClose={() => setIsCupomPreviewOpen(false)}
        data={lastSaleData}
        onDownloadPDF={receiptUrl ? () => {
          const link = document.createElement('a');
          link.href = receiptUrl;
          link.download = `cupom-${lastSaleData?.cupomFiscal || Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } : undefined}
      />

      <Dialog open={isVendaFinalizadaOpen} onOpenChange={(open) => { if (!open) { setIsVendaFinalizadaOpen(false); setReceiptUrl(null); } }}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-6 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">VENDA FINALIZADA!</h3>
              <p className="text-sm text-slate-500 mt-2">O cupom fiscal foi gerado com sucesso.</p>
            </div>
            
            <div className="w-full">
              <div className="grid grid-cols-1 gap-3 w-full">
                <Button
                  className="w-full h-12 rounded-xl font-bold uppercase text-xs bg-primary text-white flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  onClick={() => setIsCupomPreviewOpen(true)}
                >
                  <Receipt className="w-4 h-4" />
                  Visualizar / Imprimir
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold uppercase text-xs border-slate-200 text-slate-600 flex items-center justify-center gap-2"
                  onClick={async () => {
                    try {
                      let url = receiptUrl;
                      if (!url && lastSaleData) {
                        const result = await gerarReciboVendaPDF(lastSaleData);
                        setReceiptBlob(result.blob);
                        setReceiptUrl(result.url);
                        url = result.url;
                      }
                      if (!url) return;
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `cupom-${lastSaleData?.cupomFiscal || Date.now()}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (e) {
                      toast.error("Erro ao gerar PDF para download");
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </Button>
              </div>
            </div>
              
              {/* WhatsApp */}
              <div className="w-full pt-3 border-t border-slate-100 space-y-2">
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center justify-between ml-1 mb-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      WhatsApp do Cliente
                    </label>
                    {whatsappFromCadastro && (
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Cadastro
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🇧🇷</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="(00) 00000-0000"
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(formatPhoneBR(e.target.value));
                        setWhatsappFromCadastro(false);
                      }}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-mono tracking-wider"
                    />
                  </div>
                  {!whatsappNumber && (
                    <p className="text-[9px] text-slate-400 ml-1">
                      Cliente sem WhatsApp cadastrado — digite o número manualmente.
                    </p>
                  )}
                </div>

                <Button
                  className="w-full h-12 rounded-xl font-bold uppercase text-xs bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center gap-2 disabled:opacity-40 shadow-md shadow-emerald-500/20"
                  disabled={isSendingWhatsapp || !whatsappNumber || whatsappNumber.replace(/\D/g, '').length < 10}
                  onClick={handleWhatsAppShare}
                >
                  {isSendingWhatsapp ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Enviar PDF via WhatsApp
                    </>
                  )}
                </Button>
              </div>

              <Button 
                variant="ghost" 
                className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-4"
                onClick={() => {
                  setIsVendaFinalizadaOpen(false);
                  setReceiptUrl(null);
                  setReceiptBlob(null);
                  setItems([]);
                  setSearchTerm("");
                  setWhatsappNumber("");
                  setWhatsappFromCadastro(false);
                }}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Modal — Reenviar Recibo do Dia */}
      <Dialog open={isReenviarModalOpen} onOpenChange={(o) => { if (!o) { setIsReenviarModalOpen(false); setSelectedReenviarVendas([]); setReenviarWhatsapp(""); } }}>
        <DialogContent className="sm:max-w-[420px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-sm font-black uppercase tracking-widest text-white leading-none">
                Vendas do Dia
              </DialogTitle>
              <p className="text-[10px] text-white/40 mt-0.5">
                {selectedReenviarVendas.length > 0
                  ? `${selectedReenviarVendas.length} cupom(ns) selecionado(s)`
                  : "Toque para selecionar — pode escolher vários"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-8 w-8" onClick={() => setIsReenviarModalOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Lista de vendas */}
          <div className="bg-slate-100 max-h-[50vh] overflow-y-auto p-3 space-y-2">
            {isLoadingVendasDia ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <LoaderIcon className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold uppercase tracking-widest">Carregando...</span>
              </div>
            ) : errorVendasDia ? (
              <div className="flex flex-col items-center justify-center py-10 text-red-400 gap-2 px-4 text-center">
                <Receipt className="w-8 h-8 opacity-30" />
                <p className="text-sm font-bold">Erro ao carregar vendas</p>
                <p className="text-[10px] text-red-300 break-all">{(errorVendasDia as any)?.message || String(errorVendasDia)}</p>
              </div>
            ) : vendasDoDia.filter((v: any) => v.ven_status !== "cancelada").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Receipt className="w-8 h-8 opacity-30" />
                <p className="text-sm font-bold">Nenhuma venda nas últimas 24h</p>
              </div>
            ) : (
              vendasDoDia.filter((v: any) => v.ven_status !== "cancelada").map((venda: any) => {
                const isSelected = selectedReenviarVendas.some(s => s.id === venda.id);
                const hora = new Date(venda.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                const clienteObj = clientesData.find((c: any) => c.id === venda.ven_cliente_id);
                const clienteNome = clienteObj?.cli_nome || "Consumidor Final";
                const clienteTel  = clienteObj?.cli_telefone || "";
                return (
                  <button
                    key={venda.id}
                    onClick={() => {
                      setSelectedReenviarVendas(prev => {
                        const already = prev.some(s => s.id === venda.id);
                        const next = already ? prev.filter(s => s.id !== venda.id) : [...prev, venda];
                        // Pré-preenche WhatsApp com telefone do cliente do primeiro selecionado
                        if (next.length > 0 && !reenviarWhatsapp) {
                          const primeiroCliente = clientesData.find((c: any) => c.id === next[0].ven_cliente_id);
                          if (primeiroCliente?.cli_telefone) setReenviarWhatsapp(formatPhoneBR(primeiroCliente.cli_telefone));
                        }
                        if (next.length === 0) setReenviarWhatsapp("");
                        return next;
                      });
                    }}
                    className={`w-full text-left rounded-2xl p-3.5 transition-all border-2 bg-white ${
                      isSelected ? "border-primary shadow-md shadow-primary/10 bg-primary/5" : "border-transparent hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox visual */}
                      <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-primary border-primary" : "border-slate-300"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                            Nº {venda.ven_cupom_fiscal || "---"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{hora}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{clienteNome}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                          {venda.ven_forma_pagamento || "—"}
                        </p>
                      </div>
                      <span className="text-base font-black text-slate-900 shrink-0">{brl(venda.ven_valor_total)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Seção WhatsApp — aparece quando há seleção */}
          {selectedReenviarVendas.length > 0 && (
            <div className="bg-white px-4 pt-3 pb-4 border-t border-slate-100 space-y-3">
              {selectedReenviarVendas.length > 1 && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">{selectedReenviarVendas.length} cupons selecionados</span>
                  <span className="font-black text-slate-800">{brl(selectedReenviarVendas.reduce((s, v) => s + (v.ven_valor_total || 0), 0))}</span>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  WhatsApp do Cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">🇧🇷</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
                    value={reenviarWhatsapp}
                    onChange={(e) => setReenviarWhatsapp(formatPhoneBR(e.target.value))}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-mono tracking-wider"
                  />
                </div>
              </div>
              <Button
                className="w-full h-12 rounded-xl font-black uppercase text-xs bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-40"
                disabled={isEnviandoReenvio || !reenviarWhatsapp || reenviarWhatsapp.replace(/\D/g, "").length < 10}
                onClick={handleReenviarWhatsApp}
              >
                {isEnviandoReenvio ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {selectedReenviarVendas.length > 1 ? `Enviar ${selectedReenviarVendas.length} PDFs via WhatsApp` : "Enviar PDF via WhatsApp"}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    );
}
