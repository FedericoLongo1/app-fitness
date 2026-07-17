import React, { useState } from "react";
import Panel from "./Panel.jsx";
import { EJERCICIOS, GRUPOS_MUSCULARES } from "./ejercicios.js";
import { red, card, border, text, textDim } from "./theme.js";

export default function SeleccionEjerciciosPanel({ templates, onIniciar, onClose }) {
  const [seleccionados, setSeleccionados] = useState([]);
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState(null);
  const [nombrePlantilla, setNombrePlantilla] = useState("");

  function toggle(id) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function usarPlantilla(t) {
    setSeleccionados((t.ejercicios || []).map((e) => e.ejercicio_id));
  }

  const filtrados = EJERCICIOS.filter((e) => {
    if (grupo && e.musculo !== grupo) return false;
    if (q.trim() && !e.nombre.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  const S = styles;

  return (
    <Panel titulo="Armar rutina" onClose={onClose}>
      {templates.length > 0 && (
        <div style={S.templatesRow}>
          {templates.map((t) => (
            <button key={t.id} style={S.templateChip} onClick={() => usarPlantilla(t)}>{t.nombre}</button>
          ))}
        </div>
      )}

      <input style={S.searchInput} value={q} placeholder="Buscar ejercicio…" onChange={(e) => setQ(e.target.value)} />
      <div style={S.chips}>
        {GRUPOS_MUSCULARES.map((g) => (
          <button key={g} style={{ ...S.chip, ...(grupo === g ? S.chipActive : {}) }}
            onClick={() => setGrupo(grupo === g ? null : g)}>{g}</button>
        ))}
      </div>

      <div style={S.lista}>
        {filtrados.map((e) => {
          const activo = seleccionados.includes(e.id);
          return (
            <button key={e.id} style={{ ...S.row, ...(activo ? S.rowActive : {}) }} onClick={() => toggle(e.id)}>
              <span style={S.check}>{activo ? "✓" : ""}</span>
              <span style={S.nombre}>{e.nombre}</span>
              <span style={S.detalle}>{e.musculo}</span>
            </button>
          );
        })}
      </div>

      <input style={S.searchInput} value={nombrePlantilla} placeholder="Guardar como plantilla (opcional)"
        onChange={(e) => setNombrePlantilla(e.target.value)} />

      <button
        style={{ ...S.confirmBtn, ...(seleccionados.length === 0 ? S.confirmDisabled : {}) }}
        disabled={seleccionados.length === 0}
        onClick={() => onIniciar({ ejercicioIds: seleccionados, nombrePlantilla: nombrePlantilla.trim() || null })}
      >
        Empezar rutina{seleccionados.length > 0 ? ` (${seleccionados.length})` : ""}
      </button>
    </Panel>
  );
}

const styles = {
  templatesRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  templateChip: { fontSize: 12, background: "#2a2a2e", border: "none", borderRadius: 999, padding: "6px 12px", color: text, cursor: "pointer" },
  searchInput: { width: "100%", background: "#111113", border: `1px solid #3a3a3e`, borderRadius: 10, color: text, fontSize: 14, padding: "10px 12px", marginBottom: 10 },
  chips: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  chip: { fontSize: 11, background: "#2a2a2e", border: "none", borderRadius: 999, padding: "5px 10px", color: "#c9c6c0", cursor: "pointer", textTransform: "capitalize" },
  chipActive: { background: red, color: "#fff" },
  lista: { maxHeight: 220, overflowY: "auto", marginBottom: 10 },
  row: { display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: `1px solid ${border}`, padding: "10px 4px", cursor: "pointer", color: text },
  rowActive: { background: `${red}1a` },
  check: { width: 16, color: red, fontWeight: 700, flexShrink: 0 },
  nombre: { fontSize: 14, fontWeight: 600, flex: 1 },
  detalle: { fontSize: 11, color: textDim, textTransform: "capitalize" },
  confirmBtn: { width: "100%", padding: "12px 0", background: red, border: "none", color: "#fff", borderRadius: 12, fontFamily: "'Oswald',sans-serif", letterSpacing: 2, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  confirmDisabled: { opacity: 0.4, cursor: "not-allowed" },
};
