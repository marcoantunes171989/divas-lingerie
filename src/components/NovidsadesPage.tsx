import { useState } from "react";
import { PublicHeader } from "./PublicHeader";

const C = {
  bg: "#3d1a24",
  surface: "#4e2030",
  surface2: "#5a2438",
  text: "#f5ede8",
  muted: "rgba(245,237,232,0.55)",
  muted2: "rgba(245,237,232,0.35)",
  rose: "#d4aab4",
  roseDeep: "#b87888",
  border: "rgba(220,170,185,0.2)",
  gold: "#d4af85",
};

type Badge = "LANÇAMENTO" | "DESTAQUE" | "EXCLUSIVO" | "MAIS VENDIDO" | "COLEÇÃO";

interface Novidade {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  badge: Badge;
  gradiente: string;
  icone: string;
}

const NOVIDADES: Novidade[] = [
  {
    id: 1,
    titulo: "Conjunto Rendas Florais",
    descricao:
      "Sutia e calcinha em renda floral delicada. Detalhes em laço de cetim e alças ajustáveis.",
    categoria: "Conjuntos",
    badge: "LANÇAMENTO",
    gradiente: "linear-gradient(135deg, #3d1520 0%, #6b2535 50%, #8b3a4a 100%)",
    icone: "✦",
  },
  {
    id: 2,
    titulo: "Body Veludo Bordô",
    descricao:
      "Body em veludo com decote em V profundo. Fechamento com botões de pressão na entreperna.",
    categoria: "Bodies",
    badge: "DESTAQUE",
    gradiente: "linear-gradient(135deg, #2d0a1a 0%, #5c1530 50%, #7a2040 100%)",
    icone: "◆",
  },
  {
    id: 3,
    titulo: "Camisola Seda Natural",
    descricao:
      "Camisola em seda pura com acabamento em renda italiana. Comprimento midi, caimento perfeito.",
    categoria: "Camisolas",
    badge: "EXCLUSIVO",
    gradiente: "linear-gradient(135deg, #1a0d1a 0%, #3d1a35 50%, #5c2a50 100%)",
    icone: "❋",
  },
  {
    id: 4,
    titulo: "Conjunto Strass",
    descricao: "Conjunto com aplicações de strass artesanal. Peça única para ocasiões especiais.",
    categoria: "Conjuntos",
    badge: "EXCLUSIVO",
    gradiente: "linear-gradient(135deg, #1a1020 0%, #2d1a3d 50%, #3d2550 100%)",
    icone: "✧",
  },
  {
    id: 5,
    titulo: "Sutiã Push-Up Clássico",
    descricao: "Modelagem push-up com espuma anatômica. Máximo conforto e valorização.",
    categoria: "Sutiãs",
    badge: "MAIS VENDIDO",
    gradiente: "linear-gradient(135deg, #1a0a10 0%, #4a1520 50%, #6b2030 100%)",
    icone: "◉",
  },
  {
    id: 6,
    titulo: "Calcinha Renda Francesa",
    descricao: "Calcinha em renda francesa importada. Detalhe de fita de cetim na cintura.",
    categoria: "Calcinhas",
    badge: "LANÇAMENTO",
    gradiente: "linear-gradient(135deg, #200a15 0%, #4a1828 50%, #6b2540 100%)",
    icone: "✿",
  },
];

const CATEGORIAS = ["Todas", "Conjuntos", "Bodies", "Camisolas", "Sutiãs", "Calcinhas"];

const BADGE_COLORS: Record<Badge, string> = {
  LANÇAMENTO: C.rose,
  DESTAQUE: C.gold,
  EXCLUSIVO: "#b8a0d4",
  "MAIS VENDIDO": "#80c8a0",
  COLEÇÃO: C.rose,
};

export function NovidsadesPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");

  const filtradas =
    categoriaAtiva === "Todas"
      ? NOVIDADES
      : NOVIDADES.filter((n) => n.categoria === categoriaAtiva);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.bg,
        color: C.text,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <PublicHeader activePath="/novidades" />

      {/* ── Hero da seção ── */}
      <section
        style={{
          textAlign: "center",
          padding: "4rem clamp(1.5rem, 5vw, 3rem) 3rem",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.35em",
            color: "rgba(200,160,168,0.6)",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            display: "block",
            marginBottom: "1.25rem",
          }}
        >
          OUTONO · INVERNO 2026
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 6vw, 4rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            margin: "0 0 0.75rem",
            color: C.text,
          }}
        >
          Novidades da <span style={{ fontStyle: "italic", color: C.rose }}>Coleção</span>
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: C.muted,
            maxWidth: "420px",
            margin: "0 auto",
            lineHeight: 1.7,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 300,
          }}
        >
          As últimas peças que chegaram para renovar seu guarda-roupa íntimo. Exclusividade e
          sofisticação em cada detalhe.
        </p>
      </section>

      {/* ── Filtros de categoria ── */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "2rem clamp(1.5rem, 5vw, 3rem)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {CATEGORIAS.map((cat) => {
          const ativa = cat === categoriaAtiva;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "100px",
                background: ativa ? C.rose : "transparent",
                color: ativa ? C.bg : C.muted,
                border: `1px solid ${ativa ? C.rose : C.border}`,
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
                transition: "all 0.2s",
              }}
            >
              {cat.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* ── Grid de novidades ── */}
      <main
        style={{
          flex: 1,
          padding: "0 clamp(1.5rem, 5vw, 3rem) 4rem",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filtradas.map((item) => (
            <article
              key={item.id}
              style={{
                background: C.surface,
                borderRadius: "20px",
                overflow: "hidden",
                border: `1px solid ${C.border}`,
                transition: "transform 0.25s, box-shadow 0.25s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px rgba(0,0,0,0.4)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Imagem placeholder */}
              <div
                style={{
                  height: "260px",
                  background: item.gradiente,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Badge */}
                <span
                  style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    background: BADGE_COLORS[item.badge],
                    color: C.bg,
                    fontSize: "0.55rem",
                    letterSpacing: "0.18em",
                    fontWeight: 800,
                    padding: "0.3rem 0.75rem",
                    borderRadius: "100px",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {item.badge}
                </span>

                {/* Ícone decorativo */}
                <span
                  style={{
                    fontSize: "5rem",
                    color: "rgba(200,160,168,0.15)",
                    userSelect: "none",
                    lineHeight: 1,
                  }}
                >
                  {item.icone}
                </span>
              </div>

              {/* Conteúdo do card */}
              <div style={{ padding: "1.5rem" }}>
                <span
                  style={{
                    fontSize: "0.6rem",
                    letterSpacing: "0.2em",
                    color: C.rose,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {item.categoria}
                </span>

                <h2
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    margin: "0.5rem 0 0.75rem",
                    color: C.text,
                    lineHeight: 1.3,
                  }}
                >
                  {item.titulo}
                </h2>

                <p
                  style={{
                    fontSize: "0.8rem",
                    color: C.muted,
                    lineHeight: 1.7,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 300,
                    margin: "0 0 1.5rem",
                  }}
                >
                  {item.descricao}
                </p>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      background: C.rose,
                      color: C.bg,
                      border: "none",
                      borderRadius: "100px",
                      fontSize: "0.65rem",
                      letterSpacing: "0.15em",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    VER PEÇA
                  </button>
                  <button
                    style={{
                      padding: "0.65rem 1rem",
                      background: "transparent",
                      color: C.rose,
                      border: `1px solid ${C.border}`,
                      borderRadius: "100px",
                      fontSize: "0.65rem",
                      cursor: "pointer",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    ♡
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtradas.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: C.muted,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Nenhuma novidade nesta categoria no momento.
          </div>
        )}
      </main>

      {/* ── Banner de destaque ── */}
      <section
        style={{
          margin: "0 clamp(1.5rem, 5vw, 3rem) 4rem",
          background: C.surface2,
          borderRadius: "24px",
          padding: "3rem 2.5rem",
          textAlign: "center",
          border: `1px solid ${C.border}`,
          maxWidth: "1200px",
          width: "calc(100% - clamp(3rem, 10vw, 6rem))",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: C.gold,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            display: "block",
            marginBottom: "1rem",
          }}
        >
          OFERTA ESPECIAL
        </span>
        <h2
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            fontWeight: 300,
            letterSpacing: "-0.01em",
            margin: "0 0 1rem",
          }}
        >
          15% OFF na primeira compra
        </h2>
        <p
          style={{
            fontSize: "0.85rem",
            color: C.muted,
            margin: "0 auto 2rem",
            maxWidth: "360px",
            lineHeight: 1.7,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Use o cupom <strong style={{ color: C.rose }}>NOVIDADE15</strong> e ganhe 15% de desconto
          na sua primeira peça da coleção.
        </p>
        <button
          style={{
            padding: "0.9rem 2.5rem",
            background: C.gold,
            color: C.bg,
            border: "none",
            borderRadius: "100px",
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          USAR CUPOM
        </button>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "1.25rem 2rem",
          textAlign: "center",
          fontSize: "0.65rem",
          color: "rgba(245,237,232,0.25)",
          letterSpacing: "0.12em",
          fontFamily: "system-ui, sans-serif",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        © {new Date().getFullYear()} DIVAS LINGERIE · TODOS OS DIREITOS RESERVADOS
      </footer>
    </div>
  );
}
