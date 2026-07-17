import React, { useState, useEffect } from "react";
import { loadTargets, saveTargets, loadMealsRange, loadBodyMetrics, addBodyMetric, todayKey } from "./data.js";
import { loadSetsForWeek, loadRuns } from "./data-workouts.js";
import { generarResumenSemana } from "./coach.js";
import { EJERCICIOS } from "./ejercicios.js";
import { red, card, border, text, textDim, textFaint, oswald } from "./theme.js";

const ICONOS = { proteina: "🍗", calorias: "🔥", peso: "⚖️", carga: "🏋", running: "🏃" };
const OBJETIVOS = [
  { id: "ganar-musculo", label: "Ganar músculo" },
  { id: "perder-grasa", label: "Perder grasa" },
  { id: "mantenimiento", label: "Mantenimiento" },
];

function hace(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default function Coach({ userId }) {
  const [cargando, setCargando] = useState(true);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [pesos, setPesos] = useState([]);
  const [pesoInput, setPesoInput] = useState("");
  const [error, setError] = useState("");
  const [targets, setTargets] = useState({ proteina: 160, kcal: 2600, objetivo: "mantenimiento" });

  async function cargarTodo() {
    setCargando(true);
    const [targetsData, meals, bodyMetrics, sets, runs] = await Promise.all([
      loadTargets(userId),
      loadMealsRange(userId, hace(14), todayKey()),
      loadBodyMetrics(userId, hace(21), todayKey()),
      loadSetsForWeek(userId, hace(21), todayKey()),
      loadRuns(userId),
    ]);
    setTargets(targetsData);
    setPesos(bodyMetrics);
    setRecomendaciones(generarResumenSemana({ meals, targets: targetsData, bodyMetrics, sets, ejercicios: EJERCICIOS, runs }));
    setCargando(false);
  }

  useEffect(() => {
    if (!userId) return;
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function cambiarObjetivo(objetivo) {
    const next = { ...targets, objetivo };
    setTargets(next);
    saveTargets(userId, next);
    cargarTodo();
  }

  async function guardarPeso() {
    const p = Number(pesoInput);
    if (!pesoInput || !Number.isFinite(p) || p <= 0 || p > 400) return setError("Ingresá un peso válido en kg.");
    setError("");
    await addBodyMetric(userId, { fecha: todayKey(), peso: p });
    setPesoInput("");
    cargarTodo();
  }

  const S = styles;

  return (
    <>
      <section style={S.card}>
        <p style={S.title}>Objetivo</p>
        <div style={S.objetivoPills}>
          {OBJETIVOS.map((o) => (
            <button key={o.id} style={{ ...S.objetivoPill, ...(targets.objetivo === o.id ? S.objetivoPillActive : {}) }}
              onClick={() => cambiarObjetivo(o.id)}>{o.label}</button>
          ))}
        </div>
      </section>

      <section style={S.card}>
        <p style={S.title}>Peso corporal</p>
        <div style={S.pesoForm}>
          <input style={S.pesoInput} type="number" min="0" step="0.1" value={pesoInput} placeholder="0.0"
            onChange={(e) => { setPesoInput(e.target.value); setError(""); }} aria-label="Peso en kg" />
          <span style={S.unit}>kg</span>
          <button style={S.pesoBtn} onClick={guardarPeso}>Guardar</button>
        </div>
        {error && <p style={S.errorText}>{error}</p>}
        {pesos.length > 0 && (
          <p style={S.pesoUltimo}>Último registro: {pesos[pesos.length - 1].peso}kg ({pesos[pesos.length - 1].fecha})</p>
        )}
      </section>

      <section style={S.card}>
        <p style={S.title}>Analizar mi semana</p>
        {cargando ? (
          <p style={S.emptyText}>Calculando…</p>
        ) : recomendaciones.length === 0 ? (
          <p style={S.emptyText}>Todo en orden, sin observaciones esta semana.</p>
        ) : (
          recomendaciones.map((r, i) => (
            <div key={i} style={{ ...S.recCard, ...(r.severidad === "riesgo" ? S.recRiesgo : {}) }}>
              <span style={S.recIcono}>{ICONOS[r.tipo] || "•"}</span>
              <p style={S.recTexto}>{r.mensaje}</p>
            </div>
          ))
        )}
      </section>
    </>
  );
}

const styles = {
  card: { background: card, borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontFamily: oswald, fontSize: 13, letterSpacing: 2, color: textDim, margin: "0 0 12px", textTransform: "uppercase" },
  objetivoPills: { display: "flex", gap: 8, flexWrap: "wrap" },
  objetivoPill: { flex: "1 0 auto", padding: "9px 12px", fontFamily: oswald, fontSize: 12, letterSpacing: 1, fontWeight: 600, color: textDim, background: "#111113", border: `1px solid ${border}`, borderRadius: 999, cursor: "pointer", textTransform: "uppercase" },
  objetivoPillActive: { background: red, color: "#fff", border: "none" },
  pesoForm: { display: "flex", alignItems: "center", gap: 8 },
  pesoInput: { flex: 1, background: "#111113", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", color: text, fontSize: 15, textAlign: "center" },
  unit: { fontSize: 13, color: textDim },
  pesoBtn: { background: red, border: "none", color: "#fff", borderRadius: 10, padding: "10px 16px", fontFamily: oswald, letterSpacing: 1, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  errorText: { fontSize: 12, color: "#ff8a75", margin: "8px 0 0" },
  pesoUltimo: { fontSize: 12, color: textFaint, margin: "10px 0 0" },
  emptyText: { fontSize: 13, color: textFaint, padding: "6px 4px" },
  recCard: { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${border}` },
  recRiesgo: { borderTop: `1px solid ${red}` },
  recIcono: { fontSize: 16, flexShrink: 0 },
  recTexto: { fontSize: 13, color: "#c9c6c0", lineHeight: 1.5, margin: 0 },
};
