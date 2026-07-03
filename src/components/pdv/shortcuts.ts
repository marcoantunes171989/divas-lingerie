import {
  Ban,
  CreditCard,
  Hash,
  Search,
  Tag,
  User,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const shortcutConfig = {
  allFunctions: "F1",
  searchProduct: "F2",
  priceCheck: "F3",
  customer: "F4",
  discount: "F5",
  payment: "F6",
  changeQuantity: "F7",
  cancelItem: "F8",
  cancelSale: "F9",
  finishSale: "F10",
  close: "Escape",
} as const;

export interface ShortcutDef {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const allFunctionsShortcuts: ShortcutDef[] = [
  { key: shortcutConfig.searchProduct, label: "Buscar produto", icon: Search },
  { key: shortcutConfig.priceCheck, label: "Consultar preço", icon: Tag },
  { key: shortcutConfig.customer, label: "Cliente", icon: User },
  { key: shortcutConfig.discount, label: "Desconto", icon: Hash },
  { key: shortcutConfig.payment, label: "Pagamento", icon: CreditCard },
  { key: shortcutConfig.changeQuantity, label: "Alterar quantidade", icon: Hash },
  { key: shortcutConfig.cancelItem, label: "Cancelar item", icon: Ban },
  { key: shortcutConfig.cancelSale, label: "Cancelar venda", icon: XCircle },
  { key: shortcutConfig.finishSale, label: "Finalizar venda", icon: CreditCard },
  { key: "ESC", label: "Fechar", icon: X },
];

export const bottomBarShortcuts: ShortcutDef[] = [
  { key: shortcutConfig.searchProduct, label: "Buscar produto", icon: Search },
  { key: shortcutConfig.priceCheck, label: "Consultar preço", icon: Tag },
  { key: shortcutConfig.customer, label: "Cliente", icon: User },
  { key: shortcutConfig.discount, label: "Desconto", icon: Hash },
  { key: shortcutConfig.payment, label: "Pagamento", icon: CreditCard },
  { key: shortcutConfig.cancelItem, label: "Cancelar item", icon: Ban },
  { key: shortcutConfig.cancelSale, label: "Cancelar venda", icon: XCircle },
  { key: shortcutConfig.finishSale, label: "Finalizar venda", icon: CreditCard },
  { key: "ESC", label: "Fechar modal", icon: X },
];
