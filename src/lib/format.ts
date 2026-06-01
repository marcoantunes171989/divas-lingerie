export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
