import React, { useState } from "react";
import Pesas from "./Pesas.jsx";
import Running from "./Running.jsx";
import Progreso from "./Progreso.jsx";
import { red, card, textDim, oswald } from "./theme.js";

const SECCIONES = [
  { id: "pesas", label: "Pesas" },
  { id: "running", label: "Running" },
  { id: "progreso", label: "Progreso" },
];

export default function Entrenos({ userId }) {
  const [seccion, setSeccion] = useState("pesas");
  const S = styles;

  return (
    <>
      <div style={S.pills}>
        {SECCIONES.map((s) => (
          <button key={s.id} style={{ ...S.pill, ...(seccion === s.id ? S.pillActive : {}) }}
            onClick={() => setSeccion(s.id)}>{s.label}</button>
        ))}
      </div>
      {seccion === "pesas" && <Pesas userId={userId} />}
      {seccion === "running" && <Running userId={userId} />}
      {seccion === "progreso" && <Progreso userId={userId} />}
    </>
  );
}

const styles = {
  pills: { display: "flex", gap: 8, marginBottom: 18 },
  pill: { flex: 1, padding: "9px 0", fontFamily: oswald, fontSize: 12, letterSpacing: 1.5, fontWeight: 600, color: textDim, background: card, border: "1px solid #2a2a2e", borderRadius: 999, cursor: "pointer", textTransform: "uppercase" },
  pillActive: { background: red, color: "#fff", border: "none" },
};
