import type { Database } from "@/integrations/supabase/types";

export type ProdutoRow = Database["public"]["Tables"]["tab_produtos"]["Row"];

export interface ProdutoPDV extends ProdutoRow {
  tab_categorias?: { id: string; cat_nome: string } | null;
  tab_tamanhos?: { id: string; tam_nome: string } | null;
  tab_cores?: { id: string; cor_nome: string } | null;
}

export interface ItemVenda {
  id: string;
  produto_id: string;
  descricao: string;
  codigo: string;
  valor: number;
  quantidade: number;
  total: number;
  added_at: number;
  cancelado?: boolean;
  motivo_cancelamento?: string;
  desconto?: number;
  acrescimo?: number;
  estoqueNoMomento?: number | null;
}

export interface PagamentoItem {
  id: string;
  forma: string;
  valor: number;
}

export interface FinalizadoraRow {
  id: string;
  fin_descricao: string;
  fin_permite_troco: boolean;
  fin_icone?: string | null;
}

export interface ClientePDV {
  id: string;
  cli_nome: string;
  cli_telefone?: string | null;
}

export interface VendedorPDV {
  id: string;
  usu_nome: string;
}

export interface CaixaAtual {
  id: string;
  cai_terminal: string;
  cai_operador_id: string | null;
  cai_valor_abertura: number;
  cai_data_abertura: string;
}
