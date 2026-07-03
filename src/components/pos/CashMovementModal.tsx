import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CashMovementModalProps {
  open: boolean;
  onClose: () => void;
  tipo: "sangria" | "suprimento";
  loading?: boolean;
  onConfirm: (valor: number, motivo: string) => void;
}

export function CashMovementModal({
  open,
  onClose,
  tipo,
  loading,
  onConfirm,
}: CashMovementModalProps) {
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open) {
      setValor("");
      setMotivo("");
    }
  }, [open]);

  const isSangria = tipo === "sangria";
  const numero = Number(valor.replace(",", ".")) || 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold">
            {isSangria ? (
              <ArrowDownCircle className="h-5 w-5 text-[var(--pdv-danger)]" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 text-[var(--pdv-success)]" />
            )}
            {isSangria ? "Sangria de caixa" : "Suprimento de caixa"}
          </DialogTitle>
          <DialogDescription>
            {isSangria
              ? "Retirada de dinheiro do caixa (ex.: depósito, troco excedente)."
              : "Entrada de dinheiro no caixa (ex.: reforço de troco)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="mov-valor">Valor (R$)</Label>
          <Input
            id="mov-valor"
            type="number"
            min={0}
            step="0.01"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="h-12 rounded-xl text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mov-motivo">Motivo</Label>
          <Textarea
            id="mov-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="rounded-xl"
            rows={2}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading || numero <= 0}
            className="rounded-xl bg-[var(--pdv-rose)] hover:bg-[var(--pdv-rose-dark)]"
            onClick={() => onConfirm(numero, motivo)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
