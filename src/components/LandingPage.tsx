import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { COMPANY_NAME } from "@/lib/constants";

// ── Ícone inline (sem biblioteca externa) ──────────────────────────────
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ── Dados ─────────────────────────────────────────────────────────────
const NOVIDADES = [
  { id: 1, titulo: "Conjunto Rendas Florais", desc: "Renda floral delicada com detalhes em laço de cetim.", cat: "Conjuntos", badge: "Lançamento", imagem: "https://images.unsplash.com/photo-1584559582128-b8be739912e1?w=600&h=480&fit=crop&q=80" },
  { id: 2, titulo: "Body Veludo Bordô", desc: "Veludo com decote em V profundo e fechamento em pressão.", cat: "Bodies", badge: "Destaque", imagem: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=480&fit=crop&q=80" },
  { id: 3, titulo: "Camisola Seda Natural", desc: "Seda pura com acabamento em renda italiana, caimento midi.", cat: "Camisolas", badge: "Exclusivo", imagem: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=480&fit=crop&q=80" },
  { id: 4, titulo: "Conjunto Strass", desc: "Aplicações de strass artesanal para ocasiões especiais.", cat: "Conjuntos", badge: "Exclusivo", imagem: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=600&h=480&fit=crop&q=80" },
  { id: 5, titulo: "Sutiã Push-Up Clássico", desc: "Modelagem push-up com espuma anatômica e conforto total.", cat: "Sutiãs", badge: "Mais vendido", imagem: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=480&fit=crop&q=80" },
  { id: 6, titulo: "Calcinha Renda Francesa", desc: "Renda francesa importada com fita de cetim na cintura.", cat: "Calcinhas", badge: "Lançamento", imagem: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&h=480&fit=crop&q=80" },
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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── Componente principal ───────────────────────────────────────────────
export function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("reveal-in")),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-dvh bg-white text-neutral-900 antialiased">
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
      <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <img src="/logo.png" alt={COMPANY_NAME} className="h-9 w-auto object-contain" />

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500 transition-colors hover:text-primary"
              >
                {label}
              </button>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-primary hover:text-primary"
            aria-label="Acessar sistema"
          >
            <UserIcon className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28">
        <span data-reveal className="mb-6 block text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-primary">
          Outono · Inverno 2026
        </span>
        <h1 data-reveal data-delay="1" className="mx-auto max-w-3xl font-serif text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
          Você merece <span className="italic text-primary">sentir-se única</span>
        </h1>
        <p data-reveal data-delay="2" className="mx-auto mt-7 max-w-md text-base leading-relaxed text-neutral-500">
          Peças exclusivas que unem luxo, conforto e sensualidade — criadas para a mulher que sabe o que merece.
        </p>
        <div data-reveal data-delay="3" className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => scrollTo("novidades")}
            className="rounded-full bg-primary px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Ver novidades
          </button>
          <Link
            to="/login"
            className="rounded-full border border-neutral-300 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700 transition-colors hover:border-primary hover:text-primary"
          >
            Acessar sistema
          </Link>
        </div>
      </section>

      {/* ══ BENEFÍCIOS ══ */}
      <section className="border-y border-neutral-200/70 bg-neutral-50/60">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-5 py-10 text-center sm:grid-cols-3 sm:px-8">
          {BENEFICIOS.map((b, i) => (
            <div key={b.label} data-reveal data-delay={String(i + 1)}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{b.label}</div>
              <div className="mt-1.5 text-sm text-neutral-500">{b.sub}</div>
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
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-xl hover:shadow-neutral-200/60"
            >
              <div className="relative aspect-[5/4] overflow-hidden bg-neutral-100">
                <img
                  src={item.imagem}
                  alt={item.titulo}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur">
                  {item.badge}
                </span>
              </div>
              <div className="p-5">
                <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary">{item.cat}</span>
                <h3 className="mt-1.5 font-serif text-lg font-normal">{item.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
                <button className="mt-4 w-full rounded-full bg-neutral-900 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary">
                  Ver peça
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══ COLEÇÃO ══ */}
      <section id="colecao" className="border-t border-neutral-200/70 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionLabel eyebrow="Exclusividade" titulo="Nossa" italico="Coleção" desc="Cada linha foi pensada para diferentes momentos e estilos de vida." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {COLECAO.map((col, i) => (
              <div
                key={col.nome}
                data-reveal
                data-delay={String((i % 4) + 1)}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200"
              >
                <img
                  src={col.imagem}
                  alt={col.nome}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
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
            <div
              key={t.label}
              data-reveal
              data-delay={String((i % 4) + 1)}
              className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-primary"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {t.label}
              </div>
              <p className="text-sm text-neutral-500">{t.desc}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">
          <span className="font-semibold text-primary">Dica:</span> em caso de dúvida entre dois tamanhos, opte pelo maior. Modelos em renda têm menos elasticidade.
        </p>
      </section>

      {/* ══ LOOKBOOK ══ */}
      <section id="lookbook" className="border-t border-neutral-200/70 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionLabel eyebrow="Inspiração" titulo="Lookbook" italico="2026" desc="Editorials e looks para você se inspirar e montar seus conjuntos favoritos." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {LOOKBOOK.map((lk, i) => (
              <div
                key={lk.titulo}
                data-reveal
                data-delay={String((i % 4) + 1)}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200"
              >
                <img
                  src={lk.imagem}
                  alt={lk.titulo}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
                  <h3 className="font-serif text-lg font-light">{lk.titulo}</h3>
                  <span className="text-[0.65rem] uppercase tracking-[0.18em] text-white/75">{lk.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner cupom */}
          <div data-reveal className="mx-auto mt-16 max-w-xl rounded-3xl border border-neutral-200 bg-white p-10 text-center">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary">Oferta especial</span>
            <h2 className="mt-3 font-serif text-3xl font-light">15% OFF na primeira compra</h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              Use o cupom <strong className="text-primary">NOVIDADE15</strong> e ganhe 15% de desconto na sua primeira peça.
            </p>
            <button className="mt-6 rounded-full bg-primary px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:scale-[1.03]">
              Usar cupom
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-neutral-200/70 py-8 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
          © {new Date().getFullYear()} {COMPANY_NAME} · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}

// ── Cabeçalho de seção reutilizável ───────────────────────────────────
function SectionLabel({ eyebrow, titulo, italico, desc }: { eyebrow: string; titulo: string; italico: string; desc: string }) {
  return (
    <div data-reveal className="mx-auto mb-14 max-w-md text-center">
      <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-primary">{eyebrow}</span>
      <h2 className="mt-3 font-serif text-3xl font-light tracking-tight sm:text-4xl">
        {titulo} <span className="italic text-primary">{italico}</span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-500">{desc}</p>
    </div>
  );
}
