import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl, dateBR } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  Undo2,
  PackageX,
  CalendarDays,
  History,
  Building2,
  Download,
  FileText,
} from "lucide-react";
import { SafejsPDF } from "@/lib/pdf-utils";
import autoTable from "jspdf-autotable";
import { COMPANY_NAME } from "@/lib/constants";

export const Route = createFileRoute("/devolucao-fornecedor")({
  component: DevolucaoFornecedorPage,
});

type Produto = {
  id: string;
  pro_codigo: string;
  pro_descricao: string;
  pro_estoque_atual: number | null;
  pro_valor_venda: number | null;
};

type Devolucao = {
  id: string;
  dev_data: string;
  dev_motivo: string | null;
  dev_valor_total: number;
  dev_snapshot: any[];
  created_at: string;
  tab_fornecedores: { for_razao_social: string } | null;
};

function hoje() {
  return new Date().toISOString().split("T")[0];
}

function DevolucaoFornecedorPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; for_razao_social: string }[]>([]);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(hoje());
  const [submitting, setSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchTudo = async () => {
    setLoading(true);
    const [prod, forn, dev] = await Promise.all([
      supabase
        .from("tab_produtos")
        .select("id, pro_codigo, pro_descricao, pro_estoque_atual, pro_valor_venda")
        .gt("pro_estoque_atual", 0)
        .order("pro_descricao"),
      supabase.from("tab_fornecedores").select("id, for_razao_social").order("for_razao_social"),
      (supabase as any)
        .from("tab_devolucoes")
        .select("*, tab_fornecedores(for_razao_social)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setProdutos((prod.data as any) || []);
    setFornecedores((forn.data as any) || []);
    setDevolucoes((dev.data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTudo();
  }, []);

  const filtrados = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return produtos;
    return produtos.filter(
      (p) => p.pro_descricao?.toLowerCase().includes(s) || p.pro_codigo?.toLowerCase().includes(s),
    );
  }, [produtos, search]);

  const toggle = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (filtrados.every((p) => selecionados.has(p.id))) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(filtrados.map((p) => p.id)));
    }
  };

  const totalSelecionado = useMemo(
    () =>
      produtos
        .filter((p) => selecionados.has(p.id))
        .reduce((s, p) => s + (p.pro_estoque_atual || 0) * (p.pro_valor_venda || 0), 0),
    [produtos, selecionados],
  );

  const gerarDevolucao = async () => {
    if (selecionados.size === 0) {
      toast.error("Selecione ao menos um produto para devolver.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("registrar_devolucao_fornecedor" as any, {
        p_produto_ids: Array.from(selecionados),
        p_motivo: motivo.trim() || null,
        p_data: data || hoje(),
        p_fornecedor_id: fornecedorId || null,
      });
      if (error) throw error;
      toast.success(`Devolução registrada — estoque dos ${selecionados.size} produto(s) zerado.`);
      setSelecionados(new Set());
      setMotivo("");
      setFornecedorId("");
      setData(hoje());
      fetchTudo();
    } catch (e: any) {
      toast.error("Erro ao gerar devolução", { description: e?.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const todosMarcados = filtrados.length > 0 && filtrados.every((p) => selecionados.has(p.id));

  // ── Relatório gerencial de devoluções ─────────────────────────────────────

  const fetchDevolucoesCompletas = async (): Promise<Devolucao[]> => {
    const { data: rows, error } = await (supabase as any)
      .from("tab_devolucoes")
      .select("*, tab_fornecedores(for_razao_social)")
      .order("dev_data", { ascending: false });
    if (error) throw error;
    return (rows as Devolucao[]) || [];
  };

  const flattenDevolucoes = (lista: Devolucao[]) =>
    lista.flatMap((d) =>
      (d.dev_snapshot || []).map((item: any) => ({
        data: d.dev_data,
        fornecedor: d.tab_fornecedores?.for_razao_social || "—",
        motivo: d.dev_motivo || "—",
        codigo: item.codigo || "",
        descricao: item.descricao || "",
        quantidade: Number(item.quantidade) || 0,
        valorUnitario: Number(item.valor_unitario) || 0,
        valorTotal: Number(item.valor_total) || 0,
      })),
    );

  const csvEscape = (value: string | number) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const exportarRelatorioCSV = async () => {
    setIsExporting(true);
    try {
      const linhas = flattenDevolucoes(await fetchDevolucoesCompletas());
      if (linhas.length === 0) {
        toast.error("Nenhuma devolução registrada para exportar.");
        return;
      }
      const headers = [
        "Data",
        "Fornecedor",
        "Motivo",
        "Código",
        "Produto",
        "Quantidade",
        "Valor Unitário",
        "Valor Total",
      ];
      const rows = linhas.map((l) => [
        dateBR(l.data),
        l.fornecedor,
        l.motivo,
        l.codigo,
        l.descricao,
        l.quantidade,
        l.valorUnitario.toFixed(2),
        l.valorTotal.toFixed(2),
      ]);
      const totalQuantidade = linhas.reduce((s, l) => s + l.quantidade, 0);
      const totalGeral = linhas.reduce((s, l) => s + l.valorTotal, 0);
      const csv = [
        headers.map(csvEscape).join(","),
        ...rows.map((r) => r.map(csvEscape).join(",")),
        ["", "", "", "", "TOTAL GERAL", totalQuantidade, "", totalGeral.toFixed(2)]
          .map(csvEscape)
          .join(","),
      ].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `devolucoes_fornecedor_${Date.now()}.csv`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Relatório CSV exportado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar CSV", { description: e?.message || String(e) });
    } finally {
      setIsExporting(false);
    }
  };

  const exportarRelatorioPDF = async () => {
    setIsExporting(true);
    try {
      const linhas = flattenDevolucoes(await fetchDevolucoesCompletas());
      if (linhas.length === 0) {
        toast.error("Nenhuma devolução registrada para exportar.");
        return;
      }
      const totalQuantidade = linhas.reduce((s, l) => s + l.quantidade, 0);
      const totalGeral = linhas.reduce((s, l) => s + l.valorTotal, 0);
      const doc = new SafejsPDF();
      const pw = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.setTextColor(219, 39, 119);
      doc.text(COMPANY_NAME, pw / 2, 16, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text("Relatório de Devolução ao Fornecedor", pw / 2, 24, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, pw / 2, 30, { align: "center" });

      autoTable(doc, {
        startY: 38,
        head: [["Data", "Fornecedor", "Produto", "Código", "Qtd", "Valor Unit.", "Valor Total"]],
        body: linhas.map((l) => [
          dateBR(l.data),
          l.fornecedor,
          l.descricao,
          l.codigo,
          l.quantidade,
          brl(l.valorUnitario),
          brl(l.valorTotal),
        ]),
        foot: [["", "", "TOTAL GERAL", "", String(totalQuantidade), "", brl(totalGeral)]],
        theme: "striped",
        headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255] },
        footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8 },
        columnStyles: {
          4: { halign: "right" },
          5: { halign: "right" },
          6: { halign: "right" },
        },
      });

      doc.save(`devolucoes_fornecedor_${Date.now()}.pdf`);
      toast.success("Relatório PDF gerado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF", { description: e?.message || String(e) });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Devolução ao Fornecedor"
        description="Selecione os produtos em estoque para devolver. O estoque selecionado será zerado."
      />

      {/* Formulário da devolução */}
      <Card className="border-none bg-white shadow-xl rounded-3xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Fornecedor (opcional)
            </label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.for_razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Data da devolução
            </label>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Motivo
            </label>
            <Input
              placeholder="Ex: produto com defeito"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-900">{selecionados.size}</strong> produto(s)
            selecionado(s)
            {selecionados.size > 0 && (
              <>
                {" "}
                · Total: <strong className="text-primary">{brl(totalSelecionado)}</strong>
              </>
            )}
          </p>
          <Button
            onClick={gerarDevolucao}
            disabled={submitting || selecionados.size === 0}
            className="rounded-xl h-11 px-6 bg-slate-900 hover:bg-slate-800 gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Undo2 className="w-4 h-4" />
            )}
            Gerar Devolução
          </Button>
        </div>
      </Card>

      {/* Checklist de produtos com estoque > 0 */}
      <Card className="border-none bg-white shadow-xl rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Pesquise por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 bg-slate-50 border-none rounded-2xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <PackageX className="w-10 h-10 opacity-30" />
            <p className="font-bold">Nenhum produto com estoque disponível.</p>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={toggleTodos}
              className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50"
            >
              <Checkbox checked={todosMarcados} className="pointer-events-none" />
              Selecionar todos ({filtrados.length})
            </button>
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-50">
              {filtrados.map((p) => {
                const checked = selecionados.has(p.id);
                const valorTotal = (p.pro_estoque_atual || 0) * (p.pro_valor_venda || 0);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      checked ? "bg-primary/5" : "hover:bg-slate-50"
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{p.pro_descricao}</p>
                      <p className="text-[11px] text-slate-400">REF {p.pro_codigo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-700">{p.pro_estoque_atual} un</p>
                      <p className="text-[11px] text-slate-400">{brl(valorTotal)}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Histórico de devoluções */}
      {devolucoes.length > 0 && (
        <Card className="border-none bg-white shadow-xl rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Devoluções recentes
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportarRelatorioCSV}
                disabled={isExporting}
                className="rounded-xl h-9 text-[11px] font-black uppercase tracking-wider gap-1.5"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportarRelatorioPDF}
                disabled={isExporting}
                className="rounded-xl h-9 text-[11px] font-black uppercase tracking-wider gap-1.5"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                PDF
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {devolucoes.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    {dateBR(d.dev_data)}
                    {d.tab_fornecedores?.for_razao_social
                      ? ` · ${d.tab_fornecedores.for_razao_social}`
                      : ""}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {d.dev_snapshot?.length || 0} produto(s)
                    {d.dev_motivo ? ` · ${d.dev_motivo}` : ""}
                  </p>
                </div>
                <span className="text-sm font-black text-rose-500 shrink-0">
                  {brl(d.dev_valor_total)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
