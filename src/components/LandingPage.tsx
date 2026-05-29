import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { COMPANY_NAME, WHATSAPP_NUMERO } from "@/lib/constants";

// ── Ícones inline (sem biblioteca externa) ─────────────────────────────
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// ── Dados de produtos ─────────────────────────────────────────────────
type Produto = {
  id: number;
  titulo: string;
  cat: string;
  badge: string;
  desc: string;
  descLonga: string;
  preco: number;
  precoAntigo?: number;
  tamanhos: string[];
  detalhes: string[];
  imagem: string;
};

const NOVIDADES: Produto[] = [
  {
    id: 1, titulo: "Conjunto Rendas Florais", cat: "Conjuntos", badge: "Lançamento",
    desc: "Renda floral delicada com detalhes em laço de cetim.",
    descLonga: "Conjunto de sutiã e calcinha em renda floral importada, com forro suave e detalhes em laço de cetim. Modelagem que valoriza as curvas com elegância e conforto durante todo o dia.",
    preco: 189.9, precoAntigo: 249.9, tamanhos: ["P", "M", "G", "GG"],
    detalhes: ["Renda floral importada", "Forro em microfibra", "Laços de cetim", "Bojo removível"],
    imagem: "https://images.unsplash.com/photo-1575186083127-03641b958f61?w=900&h=900&fit=crop&q=80",
  },
  {
    id: 2, titulo: "Body Veludo Bordô", cat: "Bodies", badge: "Destaque",
    desc: "Veludo com decote em V profundo e fechamento em pressão.",
    descLonga: "Body em veludo bordô com toque aveludado e caimento impecável. Decote em V profundo e fechamento inferior em botões de pressão para máximo conforto e praticidade.",
    preco: 159.9, tamanhos: ["P", "M", "G"],
    detalhes: ["Veludo premium", "Decote em V", "Fechamento em pressão", "Alças reguláveis"],
    imagem: "https://images.unsplash.com/photo-1642945680515-faada4c0ca7b?w=900&h=900&fit=crop&q=80",
  },
  {
    id: 3, titulo: "Camisola Seda Natural", cat: "Camisolas", badge: "Exclusivo",
    desc: "Seda pura com acabamento em renda italiana, caimento midi.",
    descLonga: "Camisola em seda natural com acabamento em renda italiana e comprimento midi. Toque fresco e caimento fluido, perfeita para noites especiais ou momentos de relaxamento.",
    preco: 229.9, tamanhos: ["P", "M", "G"],
    detalhes: ["100% seda natural", "Renda italiana", "Comprimento midi", "Alças finas reguláveis"],
    imagem: "https://images.unsplash.com/photo-1767972463565-5a9387059b01?w=900&h=900&fit=crop&q=80",
  },
  {
    id: 4, titulo: "Conjunto Strass", cat: "Conjuntos", badge: "Exclusivo",
    desc: "Aplicações de strass artesanal para ocasiões especiais.",
    descLonga: "Conjunto sofisticado com aplicações de strass feitas à mão, peça única para ocasiões especiais. Brilho refinado e modelagem que esculpe a silhueta com glamour.",
    preco: 279.9, precoAntigo: 329.9, tamanhos: ["P", "M", "G"],
    detalhes: ["Strass aplicado à mão", "Edição limitada", "Tule e renda", "Acabamento premium"],
    imagem: "https://images.unsplash.com/photo-1625023489823-c9c1e36d6f2b?w=900&h=900&fit=crop&q=80",
  },
  {
    id: 5, titulo: "Sutiã Push-Up Clássico", cat: "Sutiãs", badge: "Mais vendido",
    desc: "Modelagem push-up com espuma anatômica e conforto total.",
    descLonga: "Sutiã push-up com espuma anatômica que valoriza o colo naturalmente. Aros revestidos, alças reguláveis e tecido respirável para conforto o dia inteiro.",
    preco: 89.9, tamanhos: ["P", "M", "G", "GG"],
    detalhes: ["Espuma push-up anatômica", "Aros revestidos", "Tecido respirável", "Fecho de 3 ganchos"],
    imagem: "https://images.unsplash.com/photo-1583900985737-6d0495555783?w=900&h=900&fit=crop&q=80",
  },
  {
    id: 6, titulo: "Calcinha Renda Francesa", cat: "Calcinhas", badge: "Lançamento",
    desc: "Renda francesa importada com fita de cetim na cintura.",
    descLonga: "Calcinha em renda francesa importada com fita de cetim na cintura e acabamento delicado. Caimento confortável que veste como uma segunda pele.",
    preco: 49.9, tamanhos: ["P", "M", "G", "GG"],
    detalhes: ["Renda francesa importada", "Fita de cetim", "Forro de algodão", "Caimento confortável"],
    imagem: "https://images.unsplash.com/photo-1585250047310-592b1805a8aa?w=900&h=900&fit=crop&q=80",
  },
];

const COLECAO = [
  { nome: "Primavera Sensual", itens: "18 peças", imagem: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=560&fit=crop&q=80" },
  { nome: "Noite de Veludo", itens: "12 peças", imagem: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=560&fit=crop&q=80" },
  { nome: "Renda & Cetim", itens: "24 peças", imagem: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=600&h=560&fit=crop&q=80" },
  { nome: "Básicos Sofisticados", itens: "30 peças", imagem: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=600&h=560&fit=crop&q=80" },
];

const TAMANHOS = [
  { label: "PP", desc: "Busto 76–80 · Cintura 60–64" },
  { label: "P", desc: "Busto 80–84 · Cintura 64–68" },
  { label: "M", desc: "Busto 84–88 · Cintura 68–72" },
  { label: "G", desc: "Busto 88–94 · Cintura 72–78" },
  { label: "GG", desc: "Busto 94–102 · Cintura 78–86" },
  { label: "XGG", desc: "Busto 102–112 · Cintura 86–96" },
];

const LOOKBOOK = [
  { titulo: "Inverno Íntimo", sub: "Editorial 2026", imagem: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=680&fit=crop&q=80" },
  { titulo: "Noite & Desejo", sub: "Coleção Noturna", imagem: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=680&fit=crop&q=80" },
  { titulo: "Seda & Rendas", sub: "Look Premium", imagem: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600&h=680&fit=crop&q=80" },
  { titulo: "Veludo Bordô", sub: "Edição Limitada", imagem: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=680&fit=crop&q=80" },
];

const BENEFICIOS = [
  { label: "Envio grátis", sub: "Compras acima de R$ 199" },
  { label: "Qualidade premium", sub: "Materiais selecionados" },
  { label: "Troca fácil", sub: "30 dias sem complicação" },
];

const NAV = [
  { label: "Novidades", id: "novidades" },
  { label: "Coleção", id: "colecao" },
  { label: "Tamanhos", id: "tamanhos" },
  { label: "Lookbook", id: "lookbook" },
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── Componente principal ───────────────────────────────────────────────
export function LandingPage() {
  const [produto, setProduto] = useState<Produto | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("reveal-in")),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1);
        }
        [data-reveal].reveal-in { opacity: 1; transform: none; }
        [data-delay="1"] { transition-delay: .06s; }
        [data-delay="2"] { transition-delay: .12s; }
        [data-delay="3"] { transition-delay: .18s; }
        [data-delay="4"] { transition-delay: .24s; }
      `}</style>

      {/* ══ HEADER ══ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <img src="/logo.png" alt={COMPANY_NAME} className="h-9 w-auto object-contain" />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary">
                {label}
              </button>
            ))}
          </nav>
          <Link to="/login" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-primary hover:text-primary" aria-label="Acessar sistema">
            <UserIcon className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28">
        <span data-reveal className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary">
          Outono · Inverno 2026
        </span>
        <h1 data-reveal data-delay="1" className="mx-auto max-w-3xl font-serif text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
          Você merece <span className="italic text-primary">sentir-se única</span>
        </h1>
        <p data-reveal data-delay="2" className="mx-auto mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
          Peças exclusivas que unem luxo, conforto e sensualidade — criadas para a mulher que sabe o que merece.
        </p>
        <div data-reveal data-delay="3" className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => scrollTo("novidades")} className="rounded-full bg-primary px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.03]">
            Ver novidades
          </button>
          <Link to="/login" className="rounded-full border border-border px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary hover:text-primary">
            Acessar sistema
          </Link>
        </div>
      </section>

      {/* ══ BENEFÍCIOS ══ */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-5 py-10 text-center sm:grid-cols-3 sm:px-8">
          {BENEFICIOS.map((b, i) => (
            <div key={b.label} data-reveal data-delay={String(i + 1)}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{b.label}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{b.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ NOVIDADES ══ */}
      <section id="novidades" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <SectionLabel eyebrow="Recém chegadas" titulo="Novidades da" italico="Coleção" desc="As últimas peças que chegaram para renovar seu guarda-roupa íntimo." />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {NOVIDADES.map((item, i) => (
            <article
              key={item.id}
              data-reveal
              data-delay={String((i % 3) + 1)}
              onClick={() => setProduto(item)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="relative aspect-[5/4] overflow-hidden bg-muted">
                <img src={item.imagem} alt={item.titulo} loading="lazy" className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur">{item.badge}</span>
              </div>
              <div className="p-5">
                <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary">{item.cat}</span>
                <h3 className="mt-1.5 font-serif text-lg font-normal text-card-foreground">{item.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-foreground">{brl(item.preco)}</span>
                  {item.precoAntigo && <span className="text-sm text-muted-foreground line-through">{brl(item.precoAntigo)}</span>}
                </div>
                <button className="mt-4 w-full rounded-full bg-primary py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90">
                  Ver peça
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══ COLEÇÃO ══ */}
      <section id="colecao" className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionLabel eyebrow="Exclusividade" titulo="Nossa" italico="Coleção" desc="Cada linha foi pensada para diferentes momentos e estilos de vida." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {COLECAO.map((col, i) => (
              <div key={col.nome} data-reveal data-delay={String((i % 4) + 1)} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                <img src={col.imagem} alt={col.nome} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-white/80">{col.itens}</div>
                  <h3 className="mt-0.5 font-serif text-lg font-light">{col.nome}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TAMANHOS ══ */}
      <section id="tamanhos" className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
        <SectionLabel eyebrow="Guia completo" titulo="Encontre seu" italico="Tamanho" desc="Medidas precisas para garantir o caimento perfeito em cada peça." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TAMANHOS.map((t, i) => (
            <div key={t.label} data-reveal data-delay={String((i % 4) + 1)} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)] transition-colors hover:border-primary">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{t.label}</div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-5 rounded-xl border border-border/60 bg-accent/40 p-4 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Dica:</span> em caso de dúvida entre dois tamanhos, opte pelo maior. Modelos em renda têm menos elasticidade.
        </p>
      </section>

      {/* ══ LOOKBOOK ══ */}
      <section id="lookbook" className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionLabel eyebrow="Inspiração" titulo="Lookbook" italico="2026" desc="Editorials e looks para você se inspirar e montar seus conjuntos favoritos." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {LOOKBOOK.map((lk, i) => (
              <div key={lk.titulo} data-reveal data-delay={String((i % 4) + 1)} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                <img src={lk.imagem} alt={lk.titulo} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
                  <h3 className="font-serif text-lg font-light">{lk.titulo}</h3>
                  <span className="text-[0.65rem] uppercase tracking-[0.18em] text-white/75">{lk.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner cupom */}
          <div data-reveal className="mx-auto mt-16 max-w-xl rounded-3xl border border-border/60 bg-card p-10 text-center shadow-[var(--shadow-soft)]">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary">Oferta especial</span>
            <h2 className="mt-3 font-serif text-3xl font-light text-card-foreground">15% OFF na primeira compra</h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Use o cupom <strong className="text-primary">NOVIDADE15</strong> e ganhe 15% de desconto na sua primeira peça.
            </p>
            <button className="mt-6 rounded-full bg-primary px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.03]">
              Usar cupom
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          © {new Date().getFullYear()} {COMPANY_NAME} · Todos os direitos reservados
        </p>
      </footer>

      {/* ══ MODAL DE PRODUTO ══ */}
      {produto && <ProdutoModal produto={produto} onClose={() => setProduto(null)} />}
    </div>
  );
}

// ── Modal de detalhe / venda do produto ────────────────────────────────
function ProdutoModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const [tamanho, setTamanho] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const msg = encodeURIComponent(
    `Olá! Tenho interesse na peça "${produto.titulo}"${tamanho ? ` (tamanho ${tamanho})` : ""} — ${brl(produto.preco)}.`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={produto.titulo}
    >
      <div
        className="relative my-8 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-elegant)] md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Fechar"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Imagem */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted md:aspect-auto md:h-full">
          <img src={produto.imagem} alt={produto.titulo} className="h-full w-full object-cover object-center" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur">{produto.badge}</span>
        </div>

        {/* Informações */}
        <div className="flex flex-col gap-5 overflow-y-auto p-6 sm:p-8">
          <div>
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary">{produto.cat}</span>
            <h2 className="mt-1 font-serif text-2xl font-normal text-card-foreground sm:text-3xl">{produto.titulo}</h2>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-foreground">{brl(produto.preco)}</span>
            {produto.precoAntigo && (
              <>
                <span className="text-base text-muted-foreground line-through">{brl(produto.precoAntigo)}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  -{Math.round((1 - produto.preco / produto.precoAntigo) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{produto.descLonga}</p>

          {/* Detalhes */}
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {produto.detalhes.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-foreground/80">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
                {d}
              </li>
            ))}
          </ul>

          {/* Tamanhos */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tamanho</div>
            <div className="flex flex-wrap gap-2">
              {produto.tamanhos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTamanho(t)}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors ${
                    tamanho === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-1 flex flex-col gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Comprar pelo WhatsApp
            </a>
            <button
              onClick={onClose}
              className="rounded-full border border-border py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Continuar olhando
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Envio grátis acima de R$ 199 · Troca fácil em 30 dias
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Cabeçalho de seção reutilizável ───────────────────────────────────
function SectionLabel({ eyebrow, titulo, italico, desc }: { eyebrow: string; titulo: string; italico: string; desc: string }) {
  return (
    <div data-reveal className="mx-auto mb-14 max-w-md text-center">
      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</span>
      <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
        {titulo} <span className="italic text-primary">{italico}</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
