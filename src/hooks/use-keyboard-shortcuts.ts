import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onBuscarProduto?: () => void;
  onConsultarPreco?: () => void;
  onSelecionarCliente?: () => void;
  onDesconto?: () => void;
  onPagamento?: () => void;
  onCancelarItem?: () => void;
  onCancelarVenda?: () => void;
  onFinalizarVenda?: () => void;
  onEscape?: () => void;
}

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
};

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handlers.onEscape?.();
        return;
      }

      if (isTypingTarget(e.target)) return;

      switch (e.key) {
        case "F2":
          e.preventDefault();
          handlers.onBuscarProduto?.();
          break;
        case "F3":
          e.preventDefault();
          handlers.onConsultarPreco?.();
          break;
        case "F4":
          e.preventDefault();
          handlers.onSelecionarCliente?.();
          break;
        case "F5":
          e.preventDefault();
          handlers.onDesconto?.();
          break;
        case "F6":
          e.preventDefault();
          handlers.onPagamento?.();
          break;
        case "F8":
          e.preventDefault();
          handlers.onCancelarItem?.();
          break;
        case "F9":
          e.preventDefault();
          handlers.onCancelarVenda?.();
          break;
        case "F10":
          e.preventDefault();
          handlers.onFinalizarVenda?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, enabled]);
}
