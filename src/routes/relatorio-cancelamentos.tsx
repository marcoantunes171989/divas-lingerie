import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  XCircle,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/relatorio-cancelamentos")({
  component: RelatorioCancelamentosPage,
});

type EstoqueItem = {
  produto_id: string;
  descricao: string;
  estoque_no_cancelamento: number;
  quantidade_cancelada: number;
  valor_unitario?: number | null;
  valor_cancelado?: number | null;
};

type Cancelamento = {
  id: string;
  can_venda_id: string | null;
  can_cupom_fiscal: string | null;
  can_motivo: string | null;
  can_valor_cancelado: number;
  can_estoque_snapshot: EstoqueItem[];
  created_at: string;
  tab_vendas: {
    ven_status: string;
    ven_forma_pagamento: string | null;
    created_at: string;
  } | null;
};

function RelatorioCancelamentosPage() {
  const [cancelamentos, setCancelamentos] = useState<Cancelamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCancelamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tab_cancelamentos")
        .select("*, tab_vendas(ven_status, ven_forma_pagamento, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCancelamentos((data || []) as any);
    } catch (err: any) {
      toast.error("Erro ao carregar cancelamentos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelamentos();
  }, []);

  const filtered = cancelamentos.filter(
    (c) =>
      (c.can_motivo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.can_cupom_fiscal || "").includes(searchTerm) ||
      (c.can_venda_id || "").includes(searchTerm),
  );

  const totalCancelado = filtered.reduce((s, c) => s + (c.can_valor_cancelado || 0), 0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Relatório de Cancelamentos
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm italic">
            <XCircle className="w-4 h-4 text-red-400" /> Histórico completo de vendas canceladas
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-lg rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total de Cancelamentos</p>
              <p className="text-2xl font-black text-slate-900">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Valor Total Cancelado</p>
              <p className="text-2xl font-black text-red-600">{brl(totalCancelado)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card className="border-none bg-white shadow-xl rounded-3xl p-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Pesquise por motivo ou ID da venda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg bg-slate-50 border-none rounded-2xl"
          />
        </div>
      </Card>

      {/* Tabela */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Cupom Fiscal</TableHead>
                <TableHead>Data Cancelamento</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor Cancelado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhum cancelamento registrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <>
                    <TableRow
                      key={c.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <TableCell>
                        {expandedId === c.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {c.can_cupom_fiscal ? (
                          <Badge variant="outline" className="font-mono rounded-full">
                            Nº {c.can_cupom_fiscal}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 italic text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </TableCell>
                      <TableCell>
                        {c.can_motivo ? (
                          <span className="text-slate-700">{c.can_motivo}</span>
                        ) : (
                          <span className="text-slate-300 italic text-xs">Sem motivo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.tab_vendas?.ven_forma_pagamento ? (
                          <Badge variant="secondary" className="capitalize rounded-full">
                            {c.tab_vendas.ven_forma_pagamento}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 whitespace-nowrap">
                        {brl(c.can_valor_cancelado)}
                      </TableCell>
                    </TableRow>

                    {/* Linha expandida: snapshot de estoque */}
                    {expandedId === c.id && (
                      <TableRow key={`${c.id}-detail`} className="bg-slate-50/80">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                              <Package className="w-3 h-3" /> Estoque no momento do cancelamento
                            </p>
                            {!c.can_estoque_snapshot || c.can_estoque_snapshot.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">
                                Sem dados de estoque registrados.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {c.can_estoque_snapshot.map((item, idx) => {
                                  const estoqueAntes = item.estoque_no_cancelamento;
                                  const estoqueDepois = estoqueAntes + item.quantidade_cancelada;
                                  const valorCancelado =
                                    item.valor_cancelado ??
                                    (item.valor_unitario != null
                                      ? item.valor_unitario * item.quantidade_cancelada
                                      : null);
                                  return (
                                    <div
                                      key={idx}
                                      className="bg-white rounded-xl p-3 border border-slate-100 text-xs"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-bold text-slate-800 truncate flex-1">
                                          {item.descricao}
                                        </p>
                                        {valorCancelado != null && (
                                          <div className="text-right shrink-0">
                                            <p className="font-black text-red-500 leading-none">
                                              {brl(valorCancelado)}
                                            </p>
                                            {item.valor_unitario != null && (
                                              <p className="text-[9px] text-slate-400 mt-0.5">
                                                {item.quantidade_cancelada}× {brl(item.valor_unitario)}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-lg bg-slate-50 py-1.5">
                                          <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                            Antes
                                          </p>
                                          <p className="font-black text-slate-700">
                                            {estoqueAntes}
                                          </p>
                                        </div>
                                        <div className="rounded-lg bg-red-50 py-1.5">
                                          <p className="text-[9px] uppercase tracking-wide text-red-400">
                                            Cancelada
                                          </p>
                                          <p className="font-black text-red-500">
                                            +{item.quantidade_cancelada}
                                          </p>
                                        </div>
                                        <div className="rounded-lg bg-emerald-50 py-1.5">
                                          <p className="text-[9px] uppercase tracking-wide text-emerald-500">
                                            Depois
                                          </p>
                                          <p className="font-black text-emerald-600">
                                            {estoqueDepois}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
