import React from "react";
import Panel from "./Panel.jsx";
import { ejercicioPorId } from "./ejercicios.js";
import { border, text, textDim } from "./theme.js";

export default function EmpezarRutinaPanel({ templates, onElegir, onClose }) {
  const S = styles;
  return (
    <Panel titulo="Empezar rutina" onClose={onClose}>
      {templates.length === 0 ? (
        <p style={S.emptyText}>Todavía no armaste ninguna rutina.</p>
      ) : (
        templates.map((t) => (
          <button key={t.id} style={S.row} onClick={() => onElegir(t)}>
            <span style={S.nombre}>{t.nombre}</span>
            <span style={S.detalle}>
              {(t.ejercicios || []).map((e) => ejercicioPorId(e.ejercicio_id)?.nombre).filter(Boolean).join(" · ")}
            </span>
          </button>
        ))
      )}
    </Panel>
  );
}

const styles = {
  row: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: `1px solid ${border}`, padding: "11px 4px", cursor: "pointer", color: text },
  nombre: { fontSize: 14, fontWeight: 600 },
  detalle: { fontSize: 12, color: textDim },
  emptyText: { fontSize: 13, color: textDim, padding: "6px 4px" },
};
