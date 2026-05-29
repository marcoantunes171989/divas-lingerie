import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import { COMPANY_NAME } from "@/lib/constants";

const C = {
  bg: "#3d1a24",
  text: "#f5ede8",
  muted: "rgba(245,237,232,0.55)",
  rose: "#d4aab4",
  border: "rgba(220,170,185,0.2)",
};

const NAV_ITEMS = [
  { label: "NOVIDADES", hash: "novidades" },
  { label: "COLEÇÃO", hash: "colecao" },
  { label: "TAMANHOS", hash: "tamanhos" },
  { label: "LOOKBOOK", hash: "lookbook" },
];

export function PublicHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem clamp(1rem, 4vw, 2.5rem)",
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
        gap: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <img
          src="/logo.png"
          alt={COMPANY_NAME}
          style={{ height: "48px", width: "auto", objectFit: "contain" }}
        />
      </Link>

      <nav style={{ display: "flex", gap: "clamp(1rem, 3vw, 2rem)", flexWrap: "wrap", justifyContent: "center" }}>
        {NAV_ITEMS.map(({ label, hash }) => (
          <Link
            key={hash}
            to={`/#${hash}` as any}
            style={{
              color: C.muted,
              textDecoration: "none",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >
            {label}
          </Link>
        ))}
      </nav>

      <Link to="/login" style={{ textDecoration: "none", flexShrink: 0 }}>
        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "rgba(200,160,168,0.12)",
            border: `1px solid rgba(200,160,168,0.3)`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.rose,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(200,160,168,0.22)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(200,160,168,0.12)")}
        >
          <User size={17} />
        </button>
      </Link>
    </header>
  );
}
