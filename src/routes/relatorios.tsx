import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { brl, dateBR } from "@/lib/format";
import { COMPANY_NAME } from "@/lib/constants";
import { SafejsPDF } from "@/lib/pdf-utils";
import "jspdf-autotable";
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  Package,
  History,
  Loader2,
  Table as TableIcon,
  Search,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CalendarDays,
  Ban,
  Printer,
  Send,
  ChevronDown,
} from "lucide-react";
import { gerarReciboVendaPDF, type ReciboVendaData } from "@/lib/recibo-venda";
import { ChartSkeleton } from "@/components/ChartSkeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: `Relatórios — ${COMPANY_NAME}` },
      { name: "description", content: "Análise detalhada de vendas e lucratividade." },
    ],
  }),
  component: RelatoriosPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function paymentColor(forma: string) {
  const f = (forma || "").toLowerCase();
  if (f === "dinheiro") return "bg-emerald-100 text-emerald-700";
  if (f.includes("crédito") || f.includes("credito")) return "bg-blue-100 text-blue-700";
  if (f.includes("débito") || f.includes("debito")) return "bg-purple-100 text-purple-700";
  if (f === "pix") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

function PaymentIcon({ forma, className }: { forma: string; className?: string }) {
  const f = (forma || "").toLowerCase();
  if (f === "dinheiro") return <Banknote className={className} />;
  if (
    f.includes("cartao") ||
    f.includes("cartão") ||
    f.includes("crédito") ||
    f.includes("credito") ||
    f.includes("débito") ||
    f.includes("debito")
  )
    return <CreditCard className={className} />;
  if (f === "pix") return <QrCode className={className} />;
  return null;
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-bold",
        positive ? "text-emerald-600" : "text-rose-500",
      )}
    >
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// Reconstrói o recibo (cupom fiscal) a partir da venda, buscando as formas de pagamento reais
async function gerarPdfDaVenda(venda: any) {
  const itens = ((venda.tab_itens_venda || []) as any[])
    .filter((i: any) => i.itv_status === "ativo")
    .map((i: any) => ({
      descricao: i.tab_produtos?.pro_descricao || "Produto",
      codigo: i.tab_produtos?.pro_codigo,
      quantidade: i.itv_quantidade,
      valor: i.itv_valor_unitario ?? i.itv_valor_total / Math.max(1, i.itv_quantidade),
      total: i.itv_valor_total,
    }));
  const subtotal = itens.reduce((s: number, i: any) => s + i.total, 0);
  const { data: pags } = await (supabase as any)
    .from("tab_vendas_pagamentos")
    .select("vpa_forma_pagamento, vpa_valor")
    .eq("vpa_venda_id", venda.id);
  const pagamentos =
    pags && pags.length > 0
      ? (pags as any[]).map((p) => ({
          forma: p.vpa_forma_pagamento || "DINHEIRO",
          valor: Number(p.vpa_valor) || 0,
        }))
      : [
          {
            forma: venda.ven_forma_pagamento || "DINHEIRO",
            valor: venda.ven_valor_total ?? subtotal,
          },
        ];
  const reciboData: ReciboVendaData = {
    cliente: venda.tab_clientes?.cli_nome || "Consumidor Final",
    itens,
    subtotal,
    desconto: Math.max(0, subtotal - (venda.ven_valor_total ?? subtotal)),
    total: venda.ven_valor_total ?? subtotal,
    pagamentos,
    totalPago: pagamentos.reduce((s: number, p: any) => s + p.valor, 0),
    troco: 0,
    data: new Date(venda.created_at),
    cupomFiscal: venda.ven_cupom_fiscal,
    observacao: venda.ven_observacao,
    previsaoPagamento: venda.ven_previsao_pagamento,
  };
  return gerarReciboVendaPDF(reciboData);
}

function VendaCard({
  venda,
  onCancel,
}: {
  venda: any;
  onCancel: (venda: any, motivo: string) => Promise<void>;
}) {
  const hora = new Date(venda.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const cliente = venda.tab_clientes?.cli_nome || "Consumidor Final";
  const itens: any[] = venda.tab_itens_venda || [];
  const isCancelled = venda.ven_status === "cancelada";
  const hasDesc = Number(venda.ven_desconto || 0) > 0;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sending, setSending] = useState(false);

  const confirmarCancelamento = async () => {
    setCancelling(true);
    try {
      await onCancel(venda, motivo);
      setCancelOpen(false);
      setMotivo("");
    } finally {
      setCancelling(false);
    }
  };

  const reimprimirCupom = async () => {
    setPrinting(true);
    try {
      const { url } = await gerarPdfDaVenda(venda);
      const win = window.open(url, "_blank");
      // Dispara a impressão automaticamente quando o PDF carregar (se o navegador permitir)
      if (win) win.onload = () => win.print();
    } catch (e: any) {
      toast.error("Erro ao gerar o cupom", { description: e?.message || String(e) });
    } finally {
      setPrinting(false);
    }
  };

  const enviarWhatsApp = async () => {
    setSending(true);
    try {
      const { blob } = await gerarPdfDaVenda(venda);
      const file = new File([blob], `Divas-Cupom-${venda.ven_cupom_fiscal || "venda"}.pdf`, {
        type: "application/pdf",
      });
      const msg =
        `Olá, ${cliente}! 🌸\n\nSegue o cupom da sua compra na Divas Lingerie.\n` +
        `Cupom Nº ${venda.ven_cupom_fiscal || "—"}\nTotal: ${brl(venda.ven_valor_total)}\n\n` +
        `Obrigada pela preferência! 💕`;
      const digits = (venda.tab_clientes?.cli_telefone || "").replace(/\D/g, "");
      const phone = digits ? (digits.startsWith("55") ? digits : `55${digits}`) : "";
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Cupom Divas Lingerie", text: msg });
      } else {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } catch (e: any) {
      toast.error("Erro ao enviar para o WhatsApp", { description: e?.message || String(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      className={cn(
        "rounded-2xl border-none shadow-sm overflow-hidden transition-shadow hover:shadow-md",
        isCancelled && "opacity-55",
      )}
    >
      {/* Cabeçalho compacto — clique para abrir o cupom fiscal */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-black text-primary/50 tracking-[0.15em] uppercase">
              Nº {venda.ven_cupom_fiscal || "——"}
            </span>
            {isCancelled && (
              <Badge variant="destructive" className="text-[9px] h-4 px-1.5 rounded-full">
                Cancelada
              </Badge>
            )}
          </div>
          <p className="font-black text-slate-900 text-sm leading-tight truncate">{cliente}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">{hora}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                paymentColor(venda.ven_forma_pagamento),
              )}
            >
              <PaymentIcon forma={venda.ven_forma_pagamento} className="h-2.5 w-2.5" />
              {venda.ven_forma_pagamento}
            </span>
            <span className="text-[10px] text-muted-foreground">
              · {itens.length} {itens.length === 1 ? "item" : "itens"}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
            Total
          </p>
          <p
            className={cn(
              "text-xl font-black",
              isCancelled ? "text-muted-foreground line-through" : "text-primary",
            )}
          >
            {brl(venda.ven_valor_total)}
          </p>
          {hasDesc && (
            <p className="text-[10px] text-rose-500 font-bold mt-0.5">
              -{brl(venda.ven_desconto)} desc
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-300 shrink-0 self-center transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Itens do cupom — só ao abrir */}
      {expanded && itens.length > 0 && (
        <div className="border-t border-dashed border-slate-100 px-4 py-3 bg-slate-50/50 space-y-1.5">
          {itens.map((item: any) => (
            <div
              key={item.id}
              className={cn(
                "flex justify-between items-center text-[11px]",
                item.itv_status === "cancelado" && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "font-medium text-slate-700",
                  item.itv_status === "cancelado" && "line-through",
                )}
              >
                {item.itv_quantidade}× {item.tab_produtos?.pro_descricao || "Produto"}
              </span>
              <span className="font-bold text-slate-900">{brl(item.itv_valor_total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Previsão de pagamento e observação — só ao abrir */}
      {expanded && (venda.ven_previsao_pagamento || venda.ven_observacao) && (
        <div className="border-t border-dashed border-slate-100 px-4 py-2.5 bg-slate-50/50 space-y-1 text-[11px]">
          {venda.ven_previsao_pagamento && (
            <div className="flex gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                Prev. pagamento:
              </span>
              <span className="font-bold text-slate-800">
                {dateBR(venda.ven_previsao_pagamento)}
              </span>
            </div>
          )}
          {venda.ven_observacao && (
            <div className="flex gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                Obs:
              </span>
              <span className="text-slate-700">{venda.ven_observacao}</span>
            </div>
          )}
        </div>
      )}

      {/* Ações — só ao abrir */}
      {expanded && (
        <div className="border-t border-slate-100 px-3 py-2 flex flex-wrap items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={reimprimirCupom}
            disabled={printing}
          >
            {printing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
            Reimprimir cupom
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
            onClick={enviarWhatsApp}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            WhatsApp
          </Button>
          {!isCancelled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
              onClick={() => setCancelOpen(true)}
            >
              <Ban className="h-3.5 w-3.5" /> Cancelar venda
            </Button>
          )}
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={(o) => !cancelling && setCancelOpen(o)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Ban className="h-5 w-5 text-destructive" /> Cancelar venda
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm">
              Cancelar o cupom <strong>Nº {venda.ven_cupom_fiscal || "——"}</strong> de{" "}
              <strong>{brl(venda.ven_valor_total)}</strong>? Os itens voltam ao estoque
              (estorno) e a venda é registrada como cancelada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Motivo (opcional)
            </label>
            <Input
              placeholder="Ex: desistência do cliente"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:flex-1 rounded-xl font-bold"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:flex-1 rounded-xl font-bold gap-2"
              onClick={confirmarCancelamento}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function RelatoriosPage() {
  const queryClient = useQueryClient();
  const [periodo, setPeriodo] = useState("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"graficos" | "vendas">("graficos");
  const [buscaVenda, setBuscaVenda] = useState("");
  const [page, setPage] = useState(0);
  const [allVendas, setAllVendas] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: resumoVendas = [],
    isLoading: loadingResumo,
    error: errorResumo,
  } = useQuery({
    queryKey: ["relatorio-vendas-resumo", periodo, startDate, endDate],
    queryFn: async ({ signal }) => {
      let query = supabase.from("view_resumo_vendas_diario").select("*");
      if (periodo === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("data_referencia", d.toISOString().split("T")[0]);
      } else if (periodo === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte("data_referencia", d.toISOString().split("T")[0]);
      } else if (periodo === "custom" && startDate && endDate) {
        query = query.gte("data_referencia", startDate).lte("data_referencia", endDate);
      }
      const { data, error } = await query
        .order("data_referencia", { ascending: true })
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
  });

  const { data: resumoAnterior = [] } = useQuery({
    queryKey: ["relatorio-vendas-resumo-anterior", periodo, startDate, endDate],
    queryFn: async () => {
      let start: string, end: string;
      if (periodo === "7d") {
        const d1 = new Date();
        d1.setDate(d1.getDate() - 14);
        const d2 = new Date();
        d2.setDate(d2.getDate() - 7);
        start = d1.toISOString().split("T")[0];
        end = d2.toISOString().split("T")[0];
      } else if (periodo === "30d") {
        const d1 = new Date();
        d1.setDate(d1.getDate() - 60);
        const d2 = new Date();
        d2.setDate(d2.getDate() - 30);
        start = d1.toISOString().split("T")[0];
        end = d2.toISOString().split("T")[0];
      } else if (periodo === "custom" && startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diff = e.getTime() - s.getTime();
        const s2 = new Date(s.getTime() - diff - 86400000);
        const e2 = new Date(s.getTime() - 86400000);
        start = s2.toISOString().split("T")[0];
        end = e2.toISOString().split("T")[0];
      } else {
        return [];
      }
      const { data, error } = await supabase
        .from("view_resumo_vendas_diario")
        .select("*")
        .gte("data_referencia", start)
        .lte("data_referencia", end);
      if (error) throw error;
      return data;
    },
  });

  const { data: topProdutos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ["relatorio-top-produtos"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("view_top_produtos")
        .select("*")
        .limit(6)
        .abortSignal(signal);
      if (error) throw error;
      return data;
    },
  });

  const { data: formasPagamentoRaw = [], isLoading: loadingFormas } = useQuery({
    queryKey: ["relatorio-formas-pagamento", periodo, startDate, endDate],
    queryFn: async () => {
      let query = (supabase as any)
        .from("tab_vendas")
        .select("ven_forma_pagamento, ven_valor_total")
        .neq("ven_status", "cancelada");
      if (periodo === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("created_at", d.toISOString());
      } else if (periodo === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte("created_at", d.toISOString());
      } else if (periodo === "custom" && startDate && endDate) {
        query = query
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message || JSON.stringify(error));
      return (data as any[]) || [];
    },
  });

  const {
    data: newVendas = [],
    isLoading: loadingVendas,
    isFetching: fetchingVendas,
  } = useQuery({
    queryKey: ["relatorio-vendas-detalhado", periodo, startDate, endDate, page],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from("tab_vendas")
        .select(
          "*, tab_clientes!ven_cliente_id(cli_nome, cli_telefone), tab_itens_venda!itv_venda_id(*, tab_produtos(pro_descricao, pro_codigo))",
        )
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (periodo === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("created_at", d.toISOString());
      } else if (periodo === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte("created_at", d.toISOString());
      } else if (periodo === "custom" && startDate && endDate) {
        query = query
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`);
      }
      const { data, error } = await query.abortSignal(signal);
      if (error) throw error;
      return data;
    },
  });

  // ── Pagination ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setAllVendas([]);
    setPage(0);
    setHasMore(true);
  }, [periodo, startDate, endDate]);

  useEffect(() => {
    if (newVendas.length > 0) {
      setAllVendas((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        return [...prev, ...newVendas.filter((v) => !existingIds.has(v.id))];
      });
      if (newVendas.length < pageSize) setHasMore(false);
    } else if (!loadingVendas) {
      setHasMore(false);
    }
  }, [newVendas, loadingVendas]);

  // ── Cancelamento de venda (com estorno de estoque) ──────────────────────────
  const handleCancelVenda = async (venda: any, motivo: string) => {
    const { error } = await supabase.rpc("cancelar_venda" as any, {
      p_venda_id: venda.id,
      p_motivo: motivo || null,
      p_cupom_fiscal: venda.ven_cupom_fiscal || null,
    });
    if (error) {
      toast.error("Erro ao cancelar venda", { description: error.message });
      return;
    }
    toast.success("Venda cancelada e estoque estornado.");
    // Atualiza a lista local imediatamente
    setAllVendas((prev) =>
      prev.map((v) =>
        v.id === venda.id
          ? {
              ...v,
              ven_status: "cancelada",
              tab_itens_venda: (v.tab_itens_venda || []).map((i: any) => ({
                ...i,
                itv_status: "cancelado",
              })),
            }
          : v,
      ),
    );
    // Recalcula gráficos, dashboard e estoque
    queryClient.invalidateQueries();
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalVendas = resumoVendas.reduce((s, v) => s + Number(v.volume_vendas || 0), 0);
    const totalLucro = resumoVendas.reduce((s, v) => s + Number(v.lucro_total || 0), 0);
    const totalItens = resumoVendas.reduce((s, v) => s + Number(v.total_vendas || 0), 0);
    const margemMedia = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0;
    const ticketMedio = totalItens > 0 ? totalVendas / totalItens : 0;

    const anteriorVendas = resumoAnterior.reduce((s, v) => s + Number(v.volume_vendas || 0), 0);
    const anteriorLucro = resumoAnterior.reduce((s, v) => s + Number(v.lucro_total || 0), 0);
    const anteriorItens = resumoAnterior.reduce((s, v) => s + Number(v.total_vendas || 0), 0);
    const anteriorTicket = anteriorItens > 0 ? anteriorVendas / anteriorItens : 0;

    const calcVar = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

    return {
      totalVendas,
      totalLucro,
      totalItens,
      margemMedia,
      ticketMedio,
      variacaoVendas: calcVar(totalVendas, anteriorVendas),
      variacaoLucro: calcVar(totalLucro, anteriorLucro),
      variacaoItens: calcVar(totalItens, anteriorItens),
      variacaoTicket: calcVar(ticketMedio, anteriorTicket),
    };
  }, [resumoVendas, resumoAnterior]);

  const chartData = useMemo(
    () =>
      resumoVendas.map((v) => {
        const parts = dateBR(v.data_referencia || "").split("/");
        return {
          data: parts.length >= 2 ? `${parts[0]}/${parts[1]}` : "—",
          vendas: Number(v.volume_vendas || 0),
          lucro: Number(v.lucro_total || 0),
        };
      }),
    [resumoVendas],
  );

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { forma: string; volume: number; count: number }>();
    formasPagamentoRaw.forEach((v: any) => {
      const forma = v.ven_forma_pagamento || "Outros";
      if (!map.has(forma)) map.set(forma, { forma, volume: 0, count: 0 });
      const g = map.get(forma)!;
      g.volume += Number(v.ven_valor_total || 0);
      g.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.volume - a.volume);
  }, [formasPagamentoRaw]);

  const filteredVendas = useMemo(() => {
    if (!buscaVenda) return allVendas;
    const term = buscaVenda.toLowerCase();
    return allVendas.filter(
      (v) =>
        v.ven_cupom_fiscal?.toLowerCase().includes(term) ||
        v.tab_clientes?.cli_nome?.toLowerCase().includes(term) ||
        v.ven_forma_pagamento?.toLowerCase().includes(term),
    );
  }, [allVendas, buscaVenda]);

  const vendasPorData = useMemo(() => {
    const groups = new Map<string, { label: string; vendas: any[]; total: number }>();
    filteredVendas.forEach((v) => {
      const key = new Date(v.created_at).toLocaleDateString("pt-BR");
      if (!groups.has(key)) groups.set(key, { label: key, vendas: [], total: 0 });
      const g = groups.get(key)!;
      g.vendas.push(v);
      if (v.ven_status !== "cancelada") g.total += Number(v.ven_valor_total || 0);
    });
    return Array.from(groups.values());
  }, [filteredVendas]);

  // ── Exports ────────────────────────────────────────────────────────────────

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const headers = ["Data", "Qtd Pedidos", "Volume Vendas", "Lucro Total"];
      const rows = resumoVendas.map((v) => [
        v.data_referencia,
        v.total_vendas,
        v.volume_vendas,
        v.lucro_total,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `relatorio_${periodo}_${Date.now()}.csv`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("CSV exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const doc = new SafejsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const periodLabel =
        periodo === "7d"
          ? "Últimos 7 dias"
          : periodo === "30d"
            ? "Últimos 30 dias"
            : `De ${dateBR(startDate)} até ${dateBR(endDate)}`;

      doc.setFontSize(22);
      doc.setTextColor(219, 39, 119);
      doc.text(COMPANY_NAME, pw / 2, 20, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(51, 51, 51);
      doc.text("Relatório de Desempenho", pw / 2, 28, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Período: ${periodLabel}`, pw / 2, 35, { align: "center" });

      doc.setDrawColor(240, 240, 240);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(14, 42, 182, 22, 3, 3, "FD");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Faturamento", 20, 50);
      doc.text("Lucro", 80, 50);
      doc.text("Pedidos", 140, 50);
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(brl(stats.totalVendas), 20, 58);
      doc.text(brl(stats.totalLucro), 80, 58);
      doc.text(String(stats.totalItens), 140, 58);

      (doc as any).autoTable({
        startY: 72,
        head: [["Data", "Pedidos", "Volume", "Lucro"]],
        body: resumoVendas.map((v) => [
          dateBR(v.data_referencia || ""),
          v.total_vendas ?? 0,
          brl(v.volume_vendas || 0),
          brl(v.lucro_total || 0),
        ]),
        theme: "striped",
        headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
      });

      doc.save(`relatorio_${periodo}_${Date.now()}.pdf`);
      toast.success("Relatório PDF gerado!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = loadingResumo || loadingProdutos;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Relatórios de Desempenho"
          description="Acompanhe o crescimento e a lucratividade do seu negócio."
        />
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={isExporting || isLoading}
            className="rounded-2xl h-10 text-[10px] font-black uppercase tracking-widest border-none bg-card shadow-sm hover:bg-slate-50"
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            CSV
          </Button>
          <Button
            size="sm"
            onClick={exportPDF}
            disabled={isExporting || isLoading}
            className="rounded-2xl h-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            {isExporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Period filter + Tab toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center bg-muted rounded-2xl p-1 gap-1 shadow-inner">
          {[
            { value: "7d", label: "7 dias" },
            { value: "30d", label: "30 dias" },
            { value: "custom", label: "Personalizado" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                periodo === p.value
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodo === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto h-10 rounded-2xl border-none bg-card shadow-sm text-xs font-bold"
            />
            <span className="text-[10px] font-black text-muted-foreground">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto h-10 rounded-2xl border-none bg-card shadow-sm text-xs font-bold"
            />
          </div>
        )}

        <div className="sm:ml-auto flex items-center bg-muted rounded-2xl p-1 gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab("graficos")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              activeTab === "graficos"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BarChart3 className="h-3 w-3" /> Análise
          </button>
          <button
            onClick={() => setActiveTab("vendas")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              activeTab === "vendas"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <TableIcon className="h-3 w-3" /> Extrato
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                Faturamento
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-black text-primary leading-none mb-2">
                {brl(stats.totalVendas)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-primary/50 font-medium">Total no período</p>
              {!isLoading && <DeltaBadge value={stats.variacaoVendas} />}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70">
                Lucro Estimado
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-black text-emerald-700 leading-none mb-2">
                {brl(stats.totalLucro)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-emerald-600/50 font-medium">
                Margem {stats.margemMedia.toFixed(1)}%
              </p>
              {!isLoading && <DeltaBadge value={stats.variacaoLucro} />}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Pedidos
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <ShoppingBag className="h-3.5 w-3.5 text-slate-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <p className="text-2xl font-black text-slate-900 leading-none mb-2">
                {stats.totalItens}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-medium">Vendas realizadas</p>
              {!isLoading && <DeltaBadge value={stats.variacaoItens} />}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700/70">
                Ticket Médio
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <History className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-black text-blue-700 leading-none mb-2">
                {brl(stats.ticketMedio)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-blue-600/50 font-medium">Média por venda</p>
              {!isLoading && <DeltaBadge value={stats.variacaoTicket} />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Tab */}
      {activeTab === "graficos" && (
        <div className="space-y-6">
          {/* Trend chart */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
                <BarChart3 className="h-4 w-4 text-primary" /> Tendência de Vendas vs Lucro
              </CardTitle>
              <CardDescription className="text-[10px]">
                Evolução financeira diária no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {errorResumo ? (
                <ErrorState
                  title="Erro nos dados"
                  description="Não foi possível carregar os dados financeiros."
                  onRetry={() =>
                    queryClient.invalidateQueries({ queryKey: ["relatorio-vendas-resumo"] })
                  }
                />
              ) : isLoading ? (
                <ChartSkeleton height={300} />
              ) : chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <EmptyState
                    title="Sem movimentação"
                    description="Não houve vendas no período selecionado."
                    icon={History}
                    action={
                      periodo !== "7d"
                        ? {
                            label: "Ver últimos 7 dias",
                            onClick: () => {
                              setPeriodo("7d");
                              setStartDate("");
                              setEndDate("");
                            },
                          }
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(219,39,119)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="rgb(219,39,119)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgb(22,163,74)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="rgb(22,163,74)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis
                        dataKey="data"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                        }
                        width={52}
                      />
                      <ChartTooltip
                        formatter={(v) => [brl(Number(v)), ""]}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 40px -8px rgba(0,0,0,0.15)",
                          fontSize: 11,
                        }}
                      />
                      <Legend
                        formatter={(v) => (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {v}
                          </span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="vendas"
                        stroke="rgb(219,39,119)"
                        strokeWidth={2.5}
                        fill="url(#gradVendas)"
                        dot={{ r: 3, fill: "rgb(219,39,119)" }}
                        activeDot={{ r: 5 }}
                        name="Vendas"
                      />
                      <Area
                        type="monotone"
                        dataKey="lucro"
                        stroke="rgb(22,163,74)"
                        strokeWidth={2.5}
                        fill="url(#gradLucro)"
                        dot={{ r: 3, fill: "rgb(22,163,74)" }}
                        activeDot={{ r: 5 }}
                        name="Lucro"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Produtos + Formas de Pagamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
                  <Package className="h-4 w-4 text-primary" /> Top Produtos
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Mais vendidos por receita acumulada
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {loadingProdutos ? (
                  <ChartSkeleton height={240} showLegend={false} />
                ) : topProdutos.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground text-xs italic">
                    Sem dados suficientes
                  </div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topProdutos}
                        layout="vertical"
                        margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="descricao"
                          type="category"
                          width={130}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 600 }}
                          tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
                        />
                        <ChartTooltip
                          cursor={{ fill: "rgba(219,39,119,0.04)" }}
                          formatter={(v) => [brl(Number(v)), "Receita"]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 40px -8px rgba(0,0,0,0.15)",
                            fontSize: 11,
                          }}
                        />
                        <Bar
                          dataKey="receita_total"
                          fill="rgb(219,39,119)"
                          radius={[0, 6, 6, 0]}
                          name="Receita"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 pt-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700">
                  <CreditCard className="h-4 w-4 text-primary" /> Formas de Pagamento
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Distribuição por volume financeiro no período
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {loadingFormas ? (
                  <div className="h-[240px] flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                  </div>
                ) : paymentBreakdown.length === 0 ? (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground text-xs italic">
                    Sem dados no período
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    {paymentBreakdown.map((p) => {
                      const totalVolume = paymentBreakdown.reduce((s, x) => s + x.volume, 0);
                      const pct = totalVolume > 0 ? (p.volume / totalVolume) * 100 : 0;
                      return (
                        <div key={p.forma}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full",
                                paymentColor(p.forma),
                              )}
                            >
                              <PaymentIcon forma={p.forma} className="h-2.5 w-2.5" />
                              {p.forma}
                            </span>
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900">
                                {brl(p.volume)}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                {p.count} venda{p.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Extrato Tab */}
      {activeTab === "vendas" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
              <Input
                placeholder="Buscar cupom, cliente, forma de pagamento..."
                className="pl-10 h-11 rounded-2xl bg-card border-none shadow-sm text-xs font-medium"
                value={buscaVenda}
                onChange={(e) => setBuscaVenda(e.target.value)}
              />
            </div>
            <div className="shrink-0 px-4 py-2.5 bg-primary/5 rounded-2xl flex items-center gap-2">
              <span className="text-sm font-black text-primary">{filteredVendas.length}</span>
              <span className="text-[10px] text-muted-foreground font-medium">registros</span>
            </div>
          </div>

          {loadingVendas && allVendas.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            </div>
          ) : filteredVendas.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground italic text-xs">
              Nenhuma venda encontrada.
            </div>
          ) : (
            <div className="space-y-8">
              {vendasPorData.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-primary/50" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        — {group.vendas.length} venda{group.vendas.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-sm font-black text-primary">{brl(group.total)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.vendas.map((venda: any) => (
                      <VendaCard key={venda.id} venda={venda} onCancel={handleCancelVenda} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && !buscaVenda && (
            <Button
              variant="ghost"
              className="w-full h-12 rounded-2xl text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5"
              onClick={() => setPage((p) => p + 1)}
              disabled={fetchingVendas}
            >
              {fetchingVendas ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Carregar mais registros"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
