import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  ShoppingBag,
  Eye,
  Receipt,
  AlertCircle,
  Filter,
  Target,
  UserPlus,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  PackageX,
} from "lucide-react";
import { brl } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm")({
  component: CRMPage,
});

type Periodo = "tudo" | "hoje" | "7dias" | "mes" | "custom";
type StatusVenda = "todas" | "concluida" | "cancelada";
type AbaCRM = "vendas" | "produtos" | "clientes";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "tudo", label: "Todas" },
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "mes", label: "Mês atual" },
  { value: "custom", label: "Personalizado" },
];

const PAGE_SIZES = [10, 25, 50, 100];

function CRMPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AbaCRM>("vendas");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [selectedVenda, setSelectedVenda] = useState<any>(null);

  const [periodo, setPeriodo] = useState<Periodo>("tudo");
  const [dataInicioCustom, setDataInicioCustom] = useState("");
  const [dataFimCustom, setDataFimCustom] = useState("");

  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const [filtroClienteId, setFiltroClienteId] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroValorMin, setFiltroValorMin] = useState("");
  const [filtroValorMax, setFiltroValorMax] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusVenda>("concluida");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [isNovoLeadOpen, setIsNovoLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ nome: "", telefone: "", cidade: "", observacao: "" });
  const [isSavingLead, setIsSavingLead] = useState(false);

  const {
    data: clientesAnalytics = [],
    isLoading: isLoadingCRM,
    error: crmError,
  } = useQuery({
    queryKey: ["crm-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("view_crm_analytics").select("*");
      if (error) throw error;
      return data;
    },
  });

  const {
    data: vendasTodas = [],
    isLoading: isLoadingVendas,
    error: vendasError,
  } = useQuery({
    queryKey: ["vendas-crm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tab_vendas")
        .select(
          "*, tab_clientes!fk_vendas_cliente(cli_nome, cli_telefone, cli_cidade), tab_itens_venda!fk_itens_venda(*, tab_produtos!fk_itens_produto(pro_descricao, pro_codigo))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const periodoRange = useMemo(() => {
    const now = new Date();
    const inicioDia = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    switch (periodo) {
      case "hoje":
        return { desde: inicioDia(now) };
      case "7dias": {
        const d = inicioDia(now);
        d.setDate(d.getDate() - 6);
        return { desde: d };
      }
      case "mes":
        return { desde: new Date(now.getFullYear(), now.getMonth(), 1) };
      case "custom":
        return {
          desde: dataInicioCustom ? new Date(`${dataInicioCustom}T00:00:00`) : undefined,
          ate: dataFimCustom ? new Date(`${dataFimCustom}T23:59:59`) : undefined,
        };
      default:
        return {};
    }
  }, [periodo, dataInicioCustom, dataFimCustom]);

  const produtosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    vendasTodas.forEach((v: any) =>
      (v.tab_itens_venda || []).forEach((it: any) => {
        if (it.tab_produtos?.pro_descricao) set.add(it.tab_produtos.pro_descricao);
      }),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [vendasTodas]);

  const vendasFiltradas = useMemo(() => {
    const termo = debouncedSearch.trim().toLowerCase();
    return vendasTodas.filter((v: any) => {
      if (filtroStatus !== "todas" && v.ven_status !== filtroStatus) return false;

      const dataVenda = new Date(v.created_at);
      if (periodoRange.desde && dataVenda < periodoRange.desde) return false;
      if (periodoRange.ate && dataVenda > periodoRange.ate) return false;

      if (filtroClienteId && v.ven_cliente_id !== filtroClienteId) return false;

      const valor = Number(v.ven_valor_total) || 0;
      if (filtroValorMin && valor < Number(filtroValorMin)) return false;
      if (filtroValorMax && valor > Number(filtroValorMax)) return false;

      const itens = v.tab_itens_venda || [];
      if (filtroProduto && !itens.some((it: any) => it.tab_produtos?.pro_descricao === filtroProduto))
        return false;

      if (termo) {
        const campos = [
          v.tab_clientes?.cli_nome,
          v.tab_clientes?.cli_telefone,
          v.tab_clientes?.cli_cidade,
          v.ven_status,
          brl(valor),
          dataVenda.toLocaleDateString("pt-BR"),
          ...itens.map((it: any) => it.tab_produtos?.pro_descricao),
          ...itens.map((it: any) => it.tab_produtos?.pro_codigo),
        ];
        const bate = campos.some((c) => (c ?? "").toString().trim().toLowerCase().includes(termo));
        if (!bate) return false;
      }
      return true;
    });
  }, [
    vendasTodas,
    debouncedSearch,
    filtroStatus,
    periodoRange,
    filtroClienteId,
    filtroValorMin,
    filtroValorMax,
    filtroProduto,
  ]);

  const faturamento = useMemo(
    () => vendasFiltradas.reduce((acc: number, v: any) => acc + (Number(v.ven_valor_total) || 0), 0),
    [vendasFiltradas],
  );
  const totalVendasCount = vendasFiltradas.length;
  const ticketMedioGeral = totalVendasCount > 0 ? faturamento / totalVendasCount : 0;
  const clientesAtivos = useMemo(
    () => new Set(vendasFiltradas.map((v: any) => v.ven_cliente_id).filter(Boolean)).size,
    [vendasFiltradas],
  );

  const produtosRanking = useMemo(() => {
    const map = new Map<string, { descricao: string; codigo: string; quantidade: number; valor: number }>();
    vendasFiltradas.forEach((venda: any) => {
      (venda.tab_itens_venda || []).forEach((item: any) => {
        const key = item.tab_produtos?.pro_codigo || item.tab_produtos?.pro_descricao || item.id;
        const atual = map.get(key) || {
          descricao: item.tab_produtos?.pro_descricao || "Desconhecido",
          codigo: item.tab_produtos?.pro_codigo || "",
          quantidade: 0,
          valor: 0,
        };
        atual.quantidade += item.itv_quantidade || 0;
        atual.valor += Number(item.itv_valor_total) || 0;
        map.set(key, atual);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasFiltradas]);

  const clientesRanking = useMemo(() => {
    const map = new Map<
      string,
      { id: string; nome: string; cidade: string; totalGasto: number; pedidos: number }
    >();
    vendasFiltradas.forEach((v: any) => {
      const id = v.ven_cliente_id;
      if (!id) return;
      const atual = map.get(id) || {
        id,
        nome: v.tab_clientes?.cli_nome || "Consumidor",
        cidade: v.tab_clientes?.cli_cidade || "",
        totalGasto: 0,
        pedidos: 0,
      };
      atual.totalGasto += Number(v.ven_valor_total) || 0;
      atual.pedidos += 1;
      map.set(id, atual);
    });
    return Array.from(map.values()).sort((a, b) => b.totalGasto - a.totalGasto);
  }, [vendasFiltradas]);

  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    debouncedSearch,
    filtroStatus,
    filtroClienteId,
    filtroProduto,
    filtroValorMin,
    filtroValorMax,
    periodo,
    dataInicioCustom,
    dataFimCustom,
    pageSize,
  ]);

  const dadosAtivos: any[] =
    activeTab === "vendas" ? vendasFiltradas : activeTab === "produtos" ? produtosRanking : clientesRanking;
  const totalRegistros = dadosAtivos.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / pageSize));
  const paginaAtual = Math.min(page, totalPaginas);
  const dadosPaginados = dadosAtivos.slice((paginaAtual - 1) * pageSize, paginaAtual * pageSize);

  const limparFiltros = () => {
    setFiltroClienteId("");
    setFiltroProduto("");
    setFiltroValorMin("");
    setFiltroValorMax("");
    setFiltroStatus("concluida");
  };

  const handleSalvarLead = async () => {
    if (!leadForm.nome.trim()) {
      toast.error("Informe o nome do lead.");
      return;
    }
    setIsSavingLead(true);
    try {
      const { error } = await supabase.from("tab_clientes").insert({
        cli_nome: leadForm.nome.trim(),
        cli_telefone: leadForm.telefone.trim() || null,
        cli_cidade: leadForm.cidade.trim() || null,
        cli_observacao: leadForm.observacao.trim() || null,
      } as any);
      if (error) throw error;
      toast.success("Lead cadastrado com sucesso!");
      setLeadForm({ nome: "", telefone: "", cidade: "", observacao: "" });
      setIsNovoLeadOpen(false);
      queryClient.invalidateQueries({ queryKey: ["crm-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["clientes-pdv"] });
    } catch (e: any) {
      toast.error("Erro ao salvar lead", { description: e?.message });
    } finally {
      setIsSavingLead(false);
    }
  };

  const isLoading = isLoadingCRM || isLoadingVendas;

  if (crmError || vendasError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Erro ao carregar dados</h2>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border shadow-sm">
        <PageHeader
          title="CRM Intelligence"
          description="Gestão de performance e análise de clientes."
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl h-11 px-6 border-slate-200"
            onClick={() => setIsFiltrosOpen(true)}
          >
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <Button
            className="rounded-2xl bg-slate-900 hover:bg-slate-800 h-11 px-6 shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02]"
            onClick={() => setIsNovoLeadOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Novo Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Clientes Ativos",
            value: clientesAtivos,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            title: "Faturamento",
            value: brl(faturamento),
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            title: "Ticket Médio",
            value: brl(ticketMedioGeral),
            icon: Target,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            title: "Vendas Concluídas",
            value: totalVendasCount,
            icon: ShoppingBag,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-3xl border-none shadow-sm bg-white overflow-hidden p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-xl font-black text-slate-900">
                  {isLoading ? <Skeleton className="h-7 w-20" /> : stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, telefone, cidade, produto, código, valor, data ou status..."
            className="h-11 pl-11 rounded-2xl border-slate-200 bg-slate-50/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriodo(p.value)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors",
                periodo === p.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              {p.label}
            </button>
          ))}
          {periodo === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <Input
                type="date"
                value={dataInicioCustom}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                className="h-9 w-[150px] rounded-xl text-xs"
              />
              <span className="text-xs text-slate-400">até</span>
              <Input
                type="date"
                value={dataFimCustom}
                onChange={(e) => setDataFimCustom(e.target.value)}
                className="h-9 w-[150px] rounded-xl text-xs"
              />
            </div>
          )}
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AbaCRM)} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-12 w-full max-w-md">
            <TabsTrigger
              value="vendas"
              className="rounded-xl flex-1 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Vendas
            </TabsTrigger>
            <TabsTrigger
              value="produtos"
              className="rounded-xl flex-1 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Produtos
            </TabsTrigger>
            <TabsTrigger
              value="clientes"
              className="rounded-xl flex-1 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Clientes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="vendas">
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="font-bold text-slate-500 h-12 pl-6">CLIENTE</TableHead>
                  <TableHead className="font-bold text-slate-500 h-12">DATA</TableHead>
                  <TableHead className="font-bold text-slate-500 h-12">STATUS</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 h-12">VALOR</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 h-12 pr-6">
                    AÇÕES
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-50">
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : dadosPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState texto="Nenhuma venda encontrada para os filtros aplicados." />
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosPaginados.map((venda: any) => (
                    <TableRow
                      key={venda.id}
                      className="hover:bg-slate-50/50 transition-colors border-slate-50 group"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-700">
                            {venda.tab_clientes?.cli_nome || "CONSUMIDOR"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">
                        {new Date(venda.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-none rounded-lg font-bold",
                            venda.ven_status === "cancelada"
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-600",
                          )}
                        >
                          {venda.ven_status === "cancelada" ? "Cancelada" : "Concluída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900">
                        {brl(venda.ven_valor_total)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                          onClick={() => setSelectedVenda(venda)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          {!isLoading && dadosPaginados.length === 0 ? (
            <EmptyState texto="Nenhum produto encontrado para os filtros aplicados." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isLoading ? Array.from({ length: 3 }) : dadosPaginados).map((prod: any, i: number) => (
                <Card
                  key={prod?.codigo || i}
                  className="p-6 rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all group"
                >
                  {isLoading || !prod ? (
                    <Skeleton className="h-20 w-full rounded-xl" />
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <Badge
                          variant="outline"
                          className="border-slate-100 text-slate-400 font-bold rounded-lg"
                        >
                          TOP {(paginaAtual - 1) * pageSize + i + 1}
                        </Badge>
                        <p className="font-black text-slate-900">{brl(prod.valor)}</p>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1 group-hover:text-slate-900">
                        {prod.descricao}
                      </h4>
                      <p className="text-sm text-slate-400 font-medium">
                        {prod.quantidade} unidades vendidas
                      </p>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clientes">
          {!isLoading && dadosPaginados.length === 0 ? (
            <EmptyState texto="Nenhum cliente encontrado para os filtros aplicados." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dadosPaginados.map((c: any) => (
                <Card
                  key={c.id}
                  className="p-6 rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 leading-none mb-1 truncate">
                        {c.nome}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {c.cidade || "Cidade não informada"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Gasto</p>
                      <p className="font-black text-slate-900">{brl(c.totalGasto)}</p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 border-none rounded-lg">
                      {c.pedidos} pedido(s)
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="rounded-3xl border-none shadow-sm bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-400">
          {totalRegistros} registro(s) encontrado(s)
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-9 w-[100px] rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}/pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            disabled={paginaAtual <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold text-slate-600 min-w-[80px] text-center">
            Pág. {paginaAtual} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            disabled={paginaAtual >= totalPaginas}
            onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Painel de filtros avançados */}
      <Sheet open={isFiltrosOpen} onOpenChange={setIsFiltrosOpen}>
        <SheetContent className="rounded-l-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Refine a análise de vendas, produtos e clientes.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Status da venda</Label>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as StatusVenda)}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Cliente</Label>
              <Select
                value={filtroClienteId || "_todos"}
                onValueChange={(v) => setFiltroClienteId(v === "_todos" ? "" : v)}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_todos">Todos os clientes</SelectItem>
                  {clientesAnalytics.map((c: any) => (
                    <SelectItem key={c.cliente_id} value={c.cliente_id}>
                      {c.cli_nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Produto</Label>
              <Select
                value={filtroProduto || "_todos"}
                onValueChange={(v) => setFiltroProduto(v === "_todos" ? "" : v)}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_todos">Todos os produtos</SelectItem>
                  {produtosDisponiveis.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-400">Valor mín.</Label>
                <Input
                  type="number"
                  min={0}
                  value={filtroValorMin}
                  onChange={(e) => setFiltroValorMin(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-400">Valor máx.</Label>
                <Input
                  type="number"
                  min={0}
                  value={filtroValorMax}
                  onChange={(e) => setFiltroValorMax(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-11 rounded-xl mt-2"
              onClick={limparFiltros}
            >
              Limpar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Novo Lead */}
      <Dialog open={isNovoLeadOpen} onOpenChange={setIsNovoLeadOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black text-slate-900">Novo Lead</DialogTitle>
            <DialogDescription>Cadastro rápido de cliente/lead.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Nome *</Label>
              <Input
                value={leadForm.nome}
                onChange={(e) => setLeadForm((f) => ({ ...f, nome: e.target.value }))}
                className="h-11 rounded-xl"
                placeholder="Nome do lead"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Telefone</Label>
              <Input
                value={leadForm.telefone}
                onChange={(e) => setLeadForm((f) => ({ ...f, telefone: e.target.value }))}
                className="h-11 rounded-xl"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Cidade</Label>
              <Input
                value={leadForm.cidade}
                onChange={(e) => setLeadForm((f) => ({ ...f, cidade: e.target.value }))}
                className="h-11 rounded-xl"
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-400">Observação</Label>
              <Textarea
                value={leadForm.observacao}
                onChange={(e) => setLeadForm((f) => ({ ...f, observacao: e.target.value }))}
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsNovoLeadOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isSavingLead}
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
              onClick={handleSalvarLead}
            >
              {isSavingLead ? "Salvando..." : "Salvar lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
              <Receipt className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">
              Detalhes da Venda
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Referência: #{selectedVenda?.id.split("-")[0].toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedVenda && (
            <div className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Cliente
                  </p>
                  <p className="font-bold text-slate-900 truncate">
                    {selectedVenda.tab_clientes?.cli_nome || "CONSUMIDOR"}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Data
                  </p>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedVenda.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Itens
                </p>
                <ScrollArea className="max-h-[200px] rounded-2xl border border-slate-50 bg-slate-50/50 p-2">
                  <div className="space-y-1">
                    {selectedVenda.tab_itens_venda?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white rounded-xl flex justify-between items-center shadow-sm"
                      >
                        <div className="min-w-0 flex-1 mr-4">
                          <p className="font-bold text-xs text-slate-700 truncate uppercase">
                            {item.tab_produtos?.pro_descricao}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.itv_quantidade}x {brl(item.itv_valor_unitario)}
                          </p>
                        </div>
                        <p className="font-black text-xs text-slate-900">
                          {brl(item.itv_valor_total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="p-6 bg-slate-900 rounded-3xl text-white flex justify-between items-center shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.01]">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    Valor Total
                  </p>
                  <p className="text-3xl font-black">{brl(selectedVenda.ven_valor_total)}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border-slate-200 font-bold"
                onClick={() => setSelectedVenda(null)}
              >
                Fechar Detalhes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-400">
      <PackageX className="h-10 w-10 opacity-30" />
      <p className="text-sm font-semibold">{texto}</p>
    </div>
  );
}
