import React from "react";
import Panel from "./Panel.jsx";
import { ejercicioPorId } from "./ejercicios.js";
import { red, textDim } from "./theme.js";

export default function PlantillasPanel({ templates, onElegir, onClose }) {
  return (
    <Panel titulo="Elegir plantilla" onClose={onClose}>
      {templates.length === 0 ? (
        <p style={S.emptyText}>Todavía no guardaste plantillas.</p>
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

const S = {
  row: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: "1px solid #2a2a2e", padding: "11px 4px", cursor: "pointer", color: "#f2f0ec" },
  nombre: { fontSize: 14, fontWeight: 600 },
  detalle: { fontSize: 12, color: textDim },
  emptyText: { fontSize: 13, color: textDim, padding: "6px 4px" },
};
