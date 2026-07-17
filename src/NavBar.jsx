import React from "react";
import { red, card, border, textDim, oswald } from "./theme.js";

export default function NavBar({ tab, onChange }) {
  return (
    <nav style={S.nav}>
      <button style={{ ...S.btn, ...(tab === "comidas" ? S.btnActive : {}) }} onClick={() => onChange("comidas")}>
        <span style={S.icon}>🍽</span>
        <span>COMIDAS</span>
      </button>
      <button style={{ ...S.btn, ...(tab === "entrenos" ? S.btnActive : {}) }} onClick={() => onChange("entrenos")}>
        <span style={S.icon}>🏋</span>
        <span>ENTRENOS</span>
      </button>
    </nav>
  );
}

const S = {
  nav: {
    position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 10,
    display: "flex", maxWidth: 480, margin: "0 auto",
    background: card, borderTop: `1px solid ${border}`,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  btn: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    padding: "10px 0 8px", background: "transparent", border: "none", cursor: "pointer",
    fontFamily: oswald, fontSize: 11, letterSpacing: 1.5, color: textDim,
  },
  btnActive: { color: red },
  icon: { fontSize: 18 },
};
