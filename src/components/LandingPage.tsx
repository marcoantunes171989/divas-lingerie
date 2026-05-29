import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { COMPANY_NAME } from "@/lib/constants";

// ── Paleta ────────────────────────────────────────────────────────────
const C = {
  text:   "#f5ede8",
  muted:  "rgba(245,237,232,0.55)",
  rose:   "#d4aab4",
  border: "rgba(220,170,185,0.18)",
  gold:   "#d4af85",
  bg:     "#2d1018",
  // superfícies semi-transparentes (ficam sobre o gradiente fixo)
  card:   "rgba(255,255,255,0.04)",
  cardH:  "rgba(255,255,255,0.07)",
};

// ── Dados ─────────────────────────────────────────────────────────────
const NOVIDADES = [
  { id:1, titulo:"Conjunto Rendas Florais",   desc:"Sutiã e calcinha em renda floral delicada com detalhes em laço de cetim.",           cat:"Conjuntos",  badge:"LANÇAMENTO",   badgeC:C.rose,  grad:"linear-gradient(135deg,#5c1a28,#8b3a4a)", icone:"✦", imagem:"https://images.unsplash.com/photo-1584559582128-b8be739912e1?w=600&h=480&fit=crop&q=80" },
  { id:2, titulo:"Body Veludo Bordô",         desc:"Body em veludo com decote em V profundo e fechamento com botões de pressão.",         cat:"Bodies",     badge:"DESTAQUE",     badgeC:C.gold,  grad:"linear-gradient(135deg,#4a0e1e,#7a2040)", icone:"◆", imagem:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=480&fit=crop&q=80" },
  { id:3, titulo:"Camisola Seda Natural",     desc:"Seda pura com acabamento em renda italiana. Comprimento midi, caimento perfeito.",    cat:"Camisolas",  badge:"EXCLUSIVO",    badgeC:"#b8a0d4", grad:"linear-gradient(135deg,#3d1235,#5c2a50)", icone:"❋", imagem:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=480&fit=crop&q=80" },
  { id:4, titulo:"Conjunto Strass",          desc:"Aplicações de strass artesanal. Peça única para ocasiões especiais.",                 cat:"Conjuntos",  badge:"EXCLUSIVO",    badgeC:"#b8a0d4", grad:"linear-gradient(135deg,#2d1a3d,#3d2550)", icone:"✧", imagem:"https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=600&h=480&fit=crop&q=80" },
  { id:5, titulo:"Sutiã Push-Up Clássico",   desc:"Modelagem push-up com espuma anatômica. Máximo conforto e valorização.",              cat:"Sutiãs",     badge:"MAIS VENDIDO", badgeC:"#80c8a0", grad:"linear-gradient(135deg,#4a1520,#6b2030)", icone:"◉", imagem:"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=480&fit=crop&q=80" },
  { id:6, titulo:"Calcinha Renda Francesa",  desc:"Renda francesa importada com fita de cetim na cintura.",                              cat:"Calcinhas",  badge:"LANÇAMENTO",   badgeC:C.rose,  grad:"linear-gradient(135deg,#4a1828,#6b2540)", icone:"✿", imagem:"https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&h=480&fit=crop&q=80" },
];

const COLECAO = [
  { nome:"Primavera Sensual",     itens:"18 peças", grad:"linear-gradient(135deg,#5c1a28,#7a2540)", imagem:"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=560&fit=crop&q=80" },
  { nome:"Noite de Veludo",       itens:"12 peças", grad:"linear-gradient(135deg,#2d1235,#4a1a3d)", imagem:"https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=560&fit=crop&q=80" },
  { nome:"Renda & Cetim",         itens:"24 peças", grad:"linear-gradient(135deg,#4a0e1e,#5c203a)", imagem:"https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=600&h=560&fit=crop&q=80" },
  { nome:"Básicos Sofisticados",  itens:"30 peças", grad:"linear-gradient(135deg,#3d1520,#5a1e2e)", imagem:"https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=600&h=560&fit=crop&q=80" },
];

const TAMANHOS = [
  { label:"PP",  desc:"Busto 76–80 cm · Cintura 60–64 cm" },
  { label:"P",   desc:"Busto 80–84 cm · Cintura 64–68 cm" },
  { label:"M",   desc:"Busto 84–88 cm · Cintura 68–72 cm" },
  { label:"G",   desc:"Busto 88–94 cm · Cintura 72–78 cm" },
  { label:"GG",  desc:"Busto 94–102 cm · Cintura 78–86 cm" },
  { label:"XGG", desc:"Busto 102–112 cm · Cintura 86–96 cm" },
];

const LOOKBOOK = [
  { titulo:"Inverno Íntimo",  sub:"Editorial 2026",    grad:"linear-gradient(135deg,#5c1a28,#8b3a4a)", icone:"✦", imagem:"https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=680&fit=crop&q=80" },
  { titulo:"Noite & Desejo",  sub:"Coleção Noturna",   grad:"linear-gradient(135deg,#3d1235,#5c2a50)", icone:"◆", imagem:"https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=680&fit=crop&q=80" },
  { titulo:"Seda & Rendas",   sub:"Look Premium",      grad:"linear-gradient(135deg,#4a0e1e,#7a2040)", icone:"❋", imagem:"https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600&h=680&fit=crop&q=80" },
  { titulo:"Veludo Bordô",    sub:"Edição Limitada",   grad:"linear-gradient(135deg,#2d1a3d,#3d2550)", icone:"✧", imagem:"https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=680&fit=crop&q=80" },
];

const NAV = [
  { label:"NOVIDADES", id:"novidades" },
  { label:"COLEÇÃO",   id:"colecao"   },
  { label:"TAMANHOS",  id:"tamanhos"  },
  { label:"LOOKBOOK",  id:"lookbook"  },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// ── Componente principal ───────────────────────────────────────────────
export function LandingPage() {
  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("iv")),
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll("[data-a]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── Estilos de animação injetados ── */}
      <style>{`
        /* Gradiente fixo de fundo — scroll passa sobre ele */
        .lp-root {
          background:
            linear-gradient(160deg,
              #1e0812 0%,
              #4a1828 18%,
              #3a1020 35%,
              #5e2035 52%,
              #3d1525 68%,
              #4a1830 82%,
              #1e0812 100%
            );
          background-attachment: fixed;
          min-height: 100dvh;
        }

        /* Entrada dos elementos */
        [data-a] {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.65s cubic-bezier(.22,1,.36,1),
                      transform 0.65s cubic-bezier(.22,1,.36,1);
        }
        [data-a].iv { opacity: 1; transform: translateY(0); }

        /* Atrasos escalonados para cards em grid */
        [data-a][data-d="1"] { transition-delay: 0.08s; }
        [data-a][data-d="2"] { transition-delay: 0.16s; }
        [data-a][data-d="3"] { transition-delay: 0.24s; }
        [data-a][data-d="4"] { transition-delay: 0.32s; }
        [data-a][data-d="5"] { transition-delay: 0.40s; }
        [data-a][data-d="6"] { transition-delay: 0.48s; }

        /* Card hover */
        .lp-card {
          transition: transform 0.28s cubic-bezier(.22,1,.36,1),
                      box-shadow 0.28s ease;
        }
        .lp-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 24px 64px rgba(0,0,0,0.45);
        }
        .lp-col-card {
          transition: transform 0.28s cubic-bezier(.22,1,.36,1);
        }
        .lp-col-card:hover { transform: scale(1.03); }

        /* Separador brilhante entre seções */
        .lp-divider {
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(212,170,180,0.35) 40%,
            rgba(212,170,180,0.35) 60%, transparent 100%);
        }
      `}</style>

      <div className="lp-root" style={{ color: C.text, fontFamily: "Georgia,'Times New Roman',serif" }}>

        {/* ══ HEADER FIXO ══ */}
        <header style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"1.25rem clamp(1rem,4vw,2.5rem)",
          borderBottom:`1px solid ${C.border}`,
          background:"rgba(30,8,18,0.82)",
          backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
          gap:"1rem", position:"sticky", top:0, zIndex:50,
        }}>
          <img src="/logo.png" alt={COMPANY_NAME}
            style={{ height:"48px", width:"auto", objectFit:"contain", flexShrink:0 }} />

          <nav style={{ display:"flex", gap:"clamp(1rem,3vw,2rem)", flexWrap:"wrap", justifyContent:"center" }}>
            {NAV.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                background:"none", border:"none", color:C.muted,
                fontSize:"0.65rem", letterSpacing:"0.22em",
                fontFamily:"system-ui,sans-serif", fontWeight:600,
                cursor:"pointer", padding:"2px 0", transition:"color 0.2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
              >{label}</button>
            ))}
          </nav>

          <Link to="/login" style={{ textDecoration:"none", flexShrink:0 }}>
            <button style={{
              width:"40px", height:"40px", borderRadius:"50%",
              background:"rgba(212,170,180,0.1)", border:`1px solid rgba(212,170,180,0.3)`,
              cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", color:C.rose, transition:"background 0.2s",
            }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(212,170,180,0.22)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(212,170,180,0.1)")}
            ><User size={17} /></button>
          </Link>
        </header>

        {/* ══ HERO ══ */}
        <section style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", textAlign:"center",
          padding:"7rem clamp(1.5rem,5vw,3rem) 6rem",
        }}>
          <span data-a style={{ fontSize:"0.58rem", letterSpacing:"0.38em", color:"rgba(212,170,180,0.6)", fontFamily:"system-ui,sans-serif", fontWeight:700, marginBottom:"2.5rem", display:"block" }}>
            OUTONO · INVERNO 2026
          </span>

          <h1 data-a data-d="1" style={{ fontSize:"clamp(2.8rem,12vw,7.5rem)", fontWeight:300, lineHeight:1.02, letterSpacing:"-0.02em", margin:0, color:C.text }}>
            Você merece
          </h1>
          <h1 data-a data-d="2" style={{ fontSize:"clamp(2.8rem,12vw,7.5rem)", fontWeight:300, lineHeight:1.06, fontStyle:"italic", letterSpacing:"-0.01em", margin:"0 0 2rem", color:C.rose }}>
            sentir-se única
          </h1>

          <p data-a data-d="3" style={{ fontSize:"clamp(0.88rem,2vw,1.05rem)", color:C.muted, maxWidth:"420px", lineHeight:1.85, marginBottom:"3.5rem", fontFamily:"system-ui,sans-serif", fontWeight:300 }}>
            Peças exclusivas que unem luxo, conforto e sensualidade —
            criadas para a mulher que sabe o que merece.
          </p>

          <div data-a data-d="4" style={{ display:"flex", gap:"1rem", flexWrap:"wrap", justifyContent:"center" }}>
            <button onClick={() => scrollTo("novidades")} style={{
              padding:"0.95rem 2.6rem", background:C.rose, color:"#1e0812",
              border:"none", borderRadius:"100px", fontSize:"0.7rem",
              letterSpacing:"0.18em", fontWeight:700, cursor:"pointer",
              fontFamily:"system-ui,sans-serif",
              boxShadow:"0 8px 32px rgba(212,170,180,0.3)",
              transition:"transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform="scale(1.04)"; (e.currentTarget as HTMLButtonElement).style.boxShadow="0 12px 40px rgba(212,170,180,0.45)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform="scale(1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow="0 8px 32px rgba(212,170,180,0.3)"; }}
            >VER NOVIDADES</button>

            <Link to="/login" style={{ textDecoration:"none" }}>
              <button style={{
                padding:"0.95rem 2.6rem", background:"transparent",
                color:C.rose, border:`1px solid rgba(212,170,180,0.35)`,
                borderRadius:"100px", fontSize:"0.7rem",
                letterSpacing:"0.18em", fontWeight:700,
                cursor:"pointer", fontFamily:"system-ui,sans-serif",
                transition:"border-color 0.2s, color 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(212,170,180,0.7)"; (e.currentTarget as HTMLButtonElement).style.color=C.text; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(212,170,180,0.35)"; (e.currentTarget as HTMLButtonElement).style.color=C.rose; }}
              >ACESSAR SISTEMA</button>
            </Link>
          </div>
        </section>

        {/* Separador */}
        <div className="lp-divider" />

        {/* ── Faixa de benefícios ── */}
        <div style={{ padding:"2.25rem clamp(1.5rem,5vw,3rem)", display:"flex", justifyContent:"center", gap:"clamp(2rem,6vw,5rem)", flexWrap:"wrap" }}>
          {[
            { label:"ENVIO GRÁTIS",      sub:"Compras acima de R$ 199" },
            { label:"QUALIDADE PREMIUM", sub:"Materiais selecionados" },
            { label:"TROCA FÁCIL",       sub:"30 dias sem complicação" },
          ].map((f, i) => (
            <div key={f.label} data-a data-d={String(i+1) as any} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"0.65rem", letterSpacing:"0.2em", fontFamily:"system-ui,sans-serif", fontWeight:700, color:C.rose, marginBottom:"0.35rem" }}>{f.label}</div>
              <div style={{ fontSize:"0.75rem", color:C.muted, fontFamily:"system-ui,sans-serif" }}>{f.sub}</div>
            </div>
          ))}
        </div>

        <div className="lp-divider" />

        {/* ══ NOVIDADES ══ */}
        <section id="novidades" style={{ padding:"5.5rem clamp(1.5rem,5vw,3rem)" }}>
          <SectionLabel eyebrow="RECÉM CHEGADAS" titulo="Novidades da" italico="Coleção"
            desc="As últimas peças que chegaram para renovar seu guarda-roupa íntimo." />

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.5rem", maxWidth:"1200px", margin:"0 auto" }}>
            {NOVIDADES.map((item, i) => (
              <article key={item.id} data-a data-d={String((i % 6) + 1) as any}
                className="lp-card"
                style={{ background:C.card, borderRadius:"20px", overflow:"hidden", border:`1px solid ${C.border}`, cursor:"pointer" }}>
                <div style={{ height:"240px", background:item.grad, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                  {item.imagem && (
                    <img
                      src={item.imagem}
                      alt={item.titulo}
                      loading="lazy"
                      style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {/* Overlay escuro para legibilidade */}
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(30,8,18,0.35) 0%,rgba(30,8,18,0.15) 50%,rgba(30,8,18,0.55) 100%)" }} />
                  <span style={{ position:"absolute", top:"1rem", left:"1rem", zIndex:2, background:item.badgeC, color:"#1e0812", fontSize:"0.55rem", letterSpacing:"0.18em", fontWeight:800, padding:"0.3rem 0.8rem", borderRadius:"100px", fontFamily:"system-ui,sans-serif" }}>{item.badge}</span>
                  {!item.imagem && (
                    <span style={{ fontSize:"4.5rem", color:"rgba(245,237,232,0.1)", userSelect:"none", lineHeight:1, position:"relative", zIndex:1 }}>{item.icone}</span>
                  )}
                </div>
                <div style={{ padding:"1.25rem 1.5rem" }}>
                  <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", color:C.rose, fontFamily:"system-ui,sans-serif", fontWeight:600 }}>{item.cat}</span>
                  <h3 style={{ fontSize:"1rem", fontWeight:400, margin:"0.4rem 0 0.6rem", color:C.text, lineHeight:1.3 }}>{item.titulo}</h3>
                  <p style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.7, fontFamily:"system-ui,sans-serif", fontWeight:300, margin:"0 0 1.25rem" }}>{item.desc}</p>
                  <div style={{ display:"flex", gap:"0.75rem" }}>
                    <button style={{ flex:1, padding:"0.6rem", background:C.rose, color:"#1e0812", border:"none", borderRadius:"100px", fontSize:"0.62rem", letterSpacing:"0.15em", fontWeight:700, cursor:"pointer", fontFamily:"system-ui,sans-serif", transition:"opacity 0.2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity="0.85")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity="1")}
                    >VER PEÇA</button>
                    <button style={{ padding:"0.6rem 1rem", background:"transparent", color:C.rose, border:`1px solid ${C.border}`, borderRadius:"100px", fontSize:"0.65rem", cursor:"pointer", transition:"border-color 0.2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor=C.rose)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor=C.border)}
                    >♡</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ══ COLEÇÃO ══ */}
        <section id="colecao" style={{ padding:"5.5rem clamp(1.5rem,5vw,3rem)" }}>
          <SectionLabel eyebrow="EXCLUSIVIDADE" titulo="Nossa" italico="Coleção"
            desc="Cada linha foi pensada para diferentes momentos e estilos de vida." />

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1.25rem", maxWidth:"1200px", margin:"0 auto" }}>
            {COLECAO.map((col, i) => (
              <div key={col.nome} data-a data-d={String(i+1) as any}
                className="lp-col-card"
                style={{ borderRadius:"20px", overflow:"hidden", background:col.grad, height:"280px", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"1.5rem", border:`1px solid ${C.border}`, cursor:"pointer", position:"relative" }}>
                {col.imagem && (
                  <img
                    src={col.imagem}
                    alt={col.nome}
                    loading="lazy"
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(30,8,18,0.1) 0%,rgba(30,8,18,0.75) 100%)" }} />
                <span style={{ fontSize:"0.6rem", letterSpacing:"0.2em", color:"rgba(245,237,232,0.7)", fontFamily:"system-ui,sans-serif", fontWeight:600, marginBottom:"0.4rem", position:"relative", zIndex:1 }}>{col.itens}</span>
                <h3 style={{ fontSize:"1.1rem", fontWeight:300, color:C.text, margin:0, lineHeight:1.2, position:"relative", zIndex:1 }}>{col.nome}</h3>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ══ TAMANHOS ══ */}
        <section id="tamanhos" style={{ padding:"5.5rem clamp(1.5rem,5vw,3rem)" }}>
          <SectionLabel eyebrow="GUIA COMPLETO" titulo="Encontre seu" italico="Tamanho"
            desc="Medidas precisas para garantir o caimento perfeito em cada peça." />

          <div style={{ maxWidth:"900px", margin:"0 auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1rem", marginBottom:"2.5rem" }}>
              {TAMANHOS.map((t, i) => (
                <div key={t.label} data-a data-d={String((i % 6) + 1) as any}
                  style={{ background:C.card, borderRadius:"16px", padding:"1.4rem", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"1.25rem", transition:"border-color 0.25s", cursor:"default" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.rose)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.border)}
                >
                  <div style={{ width:"50px", height:"50px", borderRadius:"50%", background:`linear-gradient(135deg,#a87088,${C.rose})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#1e0812", fontFamily:"system-ui,sans-serif" }}>{t.label}</span>
                  </div>
                  <p style={{ fontSize:"0.75rem", color:C.muted, fontFamily:"system-ui,sans-serif", lineHeight:1.5, margin:0 }}>{t.desc}</p>
                </div>
              ))}
            </div>
            <div data-a style={{ background:C.card, borderRadius:"16px", padding:"1.4rem 2rem", border:`1px solid ${C.border}`, textAlign:"center" }}>
              <p style={{ fontSize:"0.8rem", color:C.muted, fontFamily:"system-ui,sans-serif", lineHeight:1.7, margin:0 }}>
                <span style={{ color:C.rose, fontWeight:600 }}>Dica:</span> Em caso de dúvida entre dois tamanhos, opte pelo maior para maior conforto. Modelos em renda podem ter menos elasticidade.
              </p>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ══ LOOKBOOK ══ */}
        <section id="lookbook" style={{ padding:"5.5rem clamp(1.5rem,5vw,3rem)" }}>
          <SectionLabel eyebrow="INSPIRAÇÃO" titulo="Lookbook" italico="2026"
            desc="Editorials e looks para você se inspirar e montar seus conjuntos favoritos." />

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"1.25rem", maxWidth:"1200px", margin:"0 auto 4rem" }}>
            {LOOKBOOK.map((lk, i) => (
              <div key={lk.titulo} data-a data-d={String(i+1) as any}
                className="lp-col-card"
                style={{ borderRadius:"20px", overflow:"hidden", background:lk.grad, height:"340px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", border:`1px solid ${C.border}`, cursor:"pointer" }}>
                {lk.imagem && (
                  <img
                    src={lk.imagem}
                    alt={lk.titulo}
                    loading="lazy"
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(30,8,18,0.2) 0%,rgba(30,8,18,0.65) 100%)" }} />
                <span style={{ fontSize:"4rem", color:"rgba(245,237,232,0.12)", userSelect:"none", lineHeight:1, marginBottom:"1rem", position:"relative", zIndex:1 }}>{lk.icone}</span>
                <h3 style={{ fontSize:"1.1rem", fontWeight:300, color:C.text, margin:"0 0 0.4rem", textAlign:"center", position:"relative", zIndex:1 }}>{lk.titulo}</h3>
                <span style={{ fontSize:"0.65rem", letterSpacing:"0.18em", color:C.rose, fontFamily:"system-ui,sans-serif", fontWeight:600, position:"relative", zIndex:1 }}>{lk.sub}</span>
              </div>
            ))}
          </div>

          {/* Banner cupom */}
          <div data-a style={{ maxWidth:"680px", margin:"0 auto", background:C.card, borderRadius:"24px", padding:"3rem 2.5rem", textAlign:"center", border:`1px solid ${C.border}`, backdropFilter:"blur(8px)" }}>
            <span style={{ fontSize:"0.6rem", letterSpacing:"0.3em", color:C.gold, fontFamily:"system-ui,sans-serif", fontWeight:700, display:"block", marginBottom:"1rem" }}>OFERTA ESPECIAL</span>
            <h2 style={{ fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:300, letterSpacing:"-0.01em", margin:"0 0 1rem", color:C.text }}>
              15% OFF na primeira compra
            </h2>
            <p style={{ fontSize:"0.85rem", color:C.muted, margin:"0 auto 2rem", maxWidth:"320px", lineHeight:1.7, fontFamily:"system-ui,sans-serif" }}>
              Use o cupom <strong style={{ color:C.rose }}>NOVIDADE15</strong> e ganhe 15% de desconto na sua primeira peça.
            </p>
            <button style={{ padding:"0.9rem 2.5rem", background:C.gold, color:"#1e0812", border:"none", borderRadius:"100px", fontSize:"0.7rem", letterSpacing:"0.18em", fontWeight:700, cursor:"pointer", fontFamily:"system-ui,sans-serif", transition:"opacity 0.2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity="0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity="1")}
            >USAR CUPOM</button>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer style={{ padding:"1.5rem 2rem", textAlign:"center", fontSize:"0.65rem", color:"rgba(245,237,232,0.22)", letterSpacing:"0.12em", fontFamily:"system-ui,sans-serif", borderTop:`1px solid ${C.border}` }}>
          © {new Date().getFullYear()} DIVAS LINGERIE · TODOS OS DIREITOS RESERVADOS
        </footer>
      </div>
    </>
  );
}

// ── Cabeçalho de seção reutilizável ───────────────────────────────────
function SectionLabel({ eyebrow, titulo, italico, desc }: { eyebrow:string; titulo:string; italico:string; desc:string }) {
  return (
    <div data-a style={{ textAlign:"center", marginBottom:"3.5rem" }}>
      <span style={{ fontSize:"0.58rem", letterSpacing:"0.38em", color:"rgba(212,170,180,0.55)", fontFamily:"system-ui,sans-serif", fontWeight:700, display:"block", marginBottom:"1rem" }}>
        {eyebrow}
      </span>
      <h2 style={{ fontSize:"clamp(1.8rem,5vw,3rem)", fontWeight:300, letterSpacing:"-0.02em", margin:"0 0 0.75rem", color:"#f5ede8" }}>
        {titulo} <span style={{ fontStyle:"italic", color:"#d4aab4" }}>{italico}</span>
      </h2>
      <p style={{ fontSize:"0.88rem", color:"rgba(245,237,232,0.5)", maxWidth:"400px", margin:"0 auto", lineHeight:1.75, fontFamily:"system-ui,sans-serif", fontWeight:300 }}>
        {desc}
      </p>
    </div>
  );
}
