export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mascara de centavos: trata os digitos digitados como centavos (ex.: "6998" -> R$ 69,98)
export const formatCurrencyInput = (raw: string | number): string => {
  const digits = String(raw).replace(/\D/g, "");
  const cents = digits ? parseInt(digits, 10) : 0;
  return brl(cents / 100);
};

export const parseCurrencyToNumber = (raw: string): number => {
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) / 100 : 0;
};

// Normaliza texto para busca: ignora acentos, caixa e espacos nas pontas
export const normalizeSearch = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const dateBR = (s: string) => {
  if (!s) return "";
  // Aceita tanto "YYYY-MM-DD" quanto timestamp ISO "YYYY-MM-DDTHH:mm:ss±hh:mm"
  const datePart = s.split("T")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
};

export const formatPhone = (phone: string) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};
