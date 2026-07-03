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
import { brl } from "@/lib/format";

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  valorReferencia: number;
  valorAtual: number;
  onApply: (valor: number) => void;
}

export function DiscountModal({
  open,
  onClose,
  title = "Aplicar desconto",
  valorReferencia,
  valorAtual,
  onApply,
}: DiscountModalProps) {
  const [valor, setValor] = useState(String(valorAtual || ""));

  useEffect(() => {
    if (open) setValor(valorAtual ? String(valorAtual) : "");
  }, [open, valorAtual]);

  const numero = Math.max(0, Number(valor.replace(",", ".")) || 0);
  const excede = numero > valorReferencia;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{title}</DialogTitle>
          <DialogDescription>Valor de referência: {brl(valorReferencia)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="desconto-valor">Desconto (R$)</Label>
          <Input
            id="desconto-valor"
            type="number"
            min={0}
            step="0.01"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="h-12 rounded-xl text-lg"
          />
          {excede && (
            <p className="text-xs font-medium text-[var(--pdv-danger)]">
              O desconto não pode ser maior que {brl(valorReferencia)}.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={excede}
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
