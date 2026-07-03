import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Lock, ShoppingBag, Sparkles, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CaixaAtual } from "./types";

interface POSHeaderProps {
  operadorNome: string;
  terminal: string;
  caixa: CaixaAtual | null;
  onNovaVenda: () => void;
  onConsultarPreco: () => void;
  onSangria: () => void;
  onSuprimento: () => void;
  onFecharCaixa: () => void;
}

export function POSHeader({
  operadorNome,
  terminal,
  caixa,
  onNovaVenda,
  onConsultarPreco,
  onSangria,
  onSuprimento,
  onFecharCaixa,
}: POSHeaderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const caixaAberto = !!caixa;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--pdv-border)] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pdv-rose)] text-white shadow">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-lg font-extrabold leading-tight text-[var(--pdv-graphite)]">
            PDV Vendas
          </h1>
          <p className="text-xs text-[var(--pdv-gray-text)]">
            Venda rápida, balcão e automação comercial
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--pdv-gray-text)]">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
            caixaAberto
              ? "bg-emerald-50 text-[var(--pdv-success)]"
              : "bg-red-50 text-[var(--pdv-danger)]",
          )}
        >
          {caixaAberto ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          Caixa {caixaAberto ? "Aberto" : "Fechado"}
        </span>
        <span>
          Operador: <strong className="text-[var(--pdv-graphite)]">{operadorNome}</strong>
        </span>
        <span>
          Terminal: <strong className="text-[var(--pdv-graphite)]">{terminal}</strong>
        </span>
        <span>
          {now.toLocaleDateString("pt-BR")}{" "}
          {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onNovaVenda}
          className="h-10 gap-2 rounded-xl bg-[var(--pdv-rose)] text-white hover:bg-[var(--pdv-rose-dark)]"
        >
          <Sparkles className="h-4 w-4" /> Nova venda
        </Button>
        <Button variant="outline" onClick={onConsultarPreco} className="h-10 rounded-xl">
          Consultar preço
        </Button>
        <Button
          variant="outline"
          onClick={onSangria}
          disabled={!caixaAberto}
          className="h-10 gap-2 rounded-xl"
        >
          <ArrowDownCircle className="h-4 w-4 text-[var(--pdv-danger)]" /> Sangria
        </Button>
        <Button
          variant="outline"
          onClick={onSuprimento}
          disabled={!caixaAberto}
          className="h-10 gap-2 rounded-xl"
        >
          <ArrowUpCircle className="h-4 w-4 text-[var(--pdv-success)]" /> Suprimento
        </Button>
        <Button
          variant="outline"
          onClick={onFecharCaixa}
          disabled={!caixaAberto}
          className="h-10 gap-2 rounded-xl border-[var(--pdv-danger)]/40 text-[var(--pdv-danger)] hover:bg-red-50"
        >
          <Lock className="h-4 w-4" /> Fechar Caixa
        </Button>
      </div>
    </div>
  );
}
