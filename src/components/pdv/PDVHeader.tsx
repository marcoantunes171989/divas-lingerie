import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Plus,
  Search,
  ShoppingBag,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CaixaAtual } from "@/components/pos/types";

interface PDVHeaderProps {
  operadorNome: string | null;
  onSelecionarOperador: () => void;
  terminal: string;
  caixa: CaixaAtual | null;
  onNovaVenda: () => void;
  onConsultarPreco: () => void;
  onSangria: () => void;
  onSuprimento: () => void;
  onFecharCaixa: () => void;
}

export function PDVHeader({
  operadorNome,
  onSelecionarOperador,
  terminal,
  caixa,
  onNovaVenda,
  onConsultarPreco,
  onSangria,
  onSuprimento,
  onFecharCaixa,
}: PDVHeaderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const caixaAberto = !!caixa;
  const dataHoraStr = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--pdv-border)] bg-white px-4 py-2.5 shadow-sm xl:gap-4 xl:px-5 xl:py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pdv-rose-dark)] text-white shadow">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold leading-tight text-[var(--pdv-graphite)]">
            PDV Vendas
          </h1>
          <p className="text-xs text-[var(--pdv-gray-text)]">
            Venda rápida, balcão e automação comercial
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1.5 sm:items-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
            caixaAberto
              ? "bg-[var(--pdv-success-bg)] text-[var(--pdv-success)]"
              : "bg-red-50 text-[var(--pdv-danger)]",
          )}
        >
          {caixaAberto ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          Caixa {caixaAberto ? "Aberto" : "Fechado"}
        </span>
        <span className="text-[11px] text-[var(--pdv-gray-text)]">{dataHoraStr}</span>
      </div>

      <div className="flex flex-col gap-0.5 text-xs text-[var(--pdv-gray-text)]">
        <button
          type="button"
          onClick={onSelecionarOperador}
          className="text-left hover:underline"
        >
          Operador:{" "}
          <strong
            className={cn(
              "font-semibold",
              operadorNome ? "text-[var(--pdv-graphite)]" : "text-[var(--pdv-danger)]",
            )}
          >
            {operadorNome ?? "não selecionado"}
          </strong>
        </button>
        <span>
          Terminal: <strong className="font-semibold text-[var(--pdv-graphite)]">{terminal}</strong>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onNovaVenda}
          className="h-10 gap-1.5 rounded-xl bg-[var(--pdv-rose-dark)] text-white hover:bg-[var(--pdv-rose)]"
        >
          <Plus className="h-4 w-4" /> Nova venda
        </Button>
        <Button variant="outline" onClick={onConsultarPreco} className="h-10 gap-1.5 rounded-xl">
          <Search className="h-4 w-4" /> Consultar preço
        </Button>
        <Button
          variant="outline"
          onClick={onSangria}
          disabled={!caixaAberto}
          className="h-10 gap-1.5 rounded-xl"
        >
          <ArrowDownCircle className="h-4 w-4 text-[var(--pdv-danger)]" /> Sangria
        </Button>
        <Button
          variant="outline"
          onClick={onSuprimento}
          disabled={!caixaAberto}
          className="h-10 gap-1.5 rounded-xl"
        >
          <ArrowUpCircle className="h-4 w-4 text-[var(--pdv-success)]" /> Suprimento
        </Button>
        <Button
          variant="outline"
          onClick={onFecharCaixa}
          disabled={!caixaAberto}
          className="h-10 gap-1.5 rounded-xl border-[var(--pdv-danger)]/40 text-[var(--pdv-danger)] hover:bg-red-50"
        >
          <Lock className="h-4 w-4" /> Fechar Caixa
        </Button>
      </div>
    </header>
  );
}
