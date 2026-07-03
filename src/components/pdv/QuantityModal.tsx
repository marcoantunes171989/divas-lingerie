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

interface QuantityModalProps {
  open: boolean;
  onClose: () => void;
  descricao: string;
  quantidadeAtual: number;
  estoqueDisponivel: number;
  onApply: (quantidade: number) => void;
}

export function QuantityModal({
  open,
  onClose,
  descricao,
  quantidadeAtual,
  estoqueDisponivel,
  onApply,
}: QuantityModalProps) {
  const [valor, setValor] = useState(String(quantidadeAtual));

  useEffect(() => {
    if (open) setValor(String(quantidadeAtual));
  }, [open, quantidadeAtual]);

  const numero = Math.max(0, Number(valor.replace(",", ".")) || 0);
  const excede = numero > estoqueDisponivel;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Alterar quantidade</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="quantidade-valor">Quantidade</Label>
          <Input
            id="quantidade-valor"
            type="number"
            min={0}
            step="1"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="h-12 rounded-xl text-lg"
          />
          {excede && (
            <p className="text-xs font-medium text-[var(--pdv-danger)]">
              Estoque disponível: {estoqueDisponivel}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={excede || numero <= 0}
            className="rounded-xl bg-[var(--pdv-rose-dark)] hover:bg-[var(--pdv-rose)]"
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
