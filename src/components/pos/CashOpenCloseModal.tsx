import { useEffect, useState } from "react";
import { Lock, Loader2, Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CashOpenCloseModalProps {
  open: boolean;
  onClose: () => void;
  mode: "abrir" | "fechar";
  loading?: boolean;
  onConfirm: (valor: number) => void;
}

export function CashOpenCloseModal({
  open,
  onClose,
  mode,
  loading,
  onConfirm,
}: CashOpenCloseModalProps) {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (open) setValor("");
  }, [open]);

  const abrir = mode === "abrir";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold">
            {abrir ? (
              <Unlock className="h-5 w-5 text-[var(--pdv-success)]" />
            ) : (
              <Lock className="h-5 w-5 text-[var(--pdv-danger)]" />
            )}
            {abrir ? "Abrir caixa" : "Fechar caixa"}
          </DialogTitle>
          <DialogDescription>
            {abrir
              ? "Informe o valor inicial em dinheiro para começar as vendas."
              : "Informe o valor final em caixa para conferência."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cash-valor">
            {abrir ? "Valor de abertura" : "Valor de fechamento"} (R$)
          </Label>
          <Input
            id="cash-valor"
            type="number"
            min={0}
            step="0.01"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="h-12 rounded-xl text-lg"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading}
            className={
              abrir
                ? "rounded-xl bg-[var(--pdv-success)] hover:bg-[var(--pdv-success)]/90"
                : "rounded-xl bg-[var(--pdv-danger)] hover:bg-[var(--pdv-danger)]/90"
            }
            onClick={() => onConfirm(Number(valor.replace(",", ".")) || 0)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : abrir ? (
              "Abrir caixa"
            ) : (
              "Fechar caixa"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
