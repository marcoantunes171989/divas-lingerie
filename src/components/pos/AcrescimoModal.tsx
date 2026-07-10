import { useEffect, useState } from "react";
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
import { brl, formatCurrencyInput, parseCurrencyToNumber } from "@/lib/format";

interface AcrescimoModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  valorReferencia: number;
  valorAtual: number;
  onApply: (valor: number) => void;
}

export function AcrescimoModal({
  open,
  onClose,
  title = "Aplicar acréscimo",
  valorReferencia,
  valorAtual,
  onApply,
}: AcrescimoModalProps) {
  const [valor, setValor] = useState(() => formatCurrencyInput(Math.round((valorAtual || 0) * 100)));

  useEffect(() => {
    if (open) setValor(formatCurrencyInput(Math.round((valorAtual || 0) * 100)));
  }, [open, valorAtual]);

  const numero = parseCurrencyToNumber(valor);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{title}</DialogTitle>
          <DialogDescription>Valor de referência: {brl(valorReferencia)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="acrescimo-valor">Acréscimo (R$)</Label>
          <Input
            id="acrescimo-valor"
            type="text"
            inputMode="decimal"
            autoFocus
            value={valor}
            onChange={(e) => setValor(formatCurrencyInput(e.target.value))}
            className="h-12 rounded-xl text-lg"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl bg-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-dark)]"
            onClick={() => {
              onApply(numero);
              onClose();
            }}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
