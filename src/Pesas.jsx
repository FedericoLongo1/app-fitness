import React, { useState, useEffect } from "react";
import Panel from "./Panel.jsx";
import SeleccionEjerciciosPanel from "./SeleccionEjerciciosPanel.jsx";
import { EJERCICIOS, GRUPOS_MUSCULARES, ejercicioPorId } from "./ejercicios.js";
import {
  loadTemplates, saveTemplate,
  loadWorkouts, createWorkout,
  loadSetsForWorkout, addSet, deleteSet,
  loadRecentSets,
} from "./data-workouts.js";
import { estimar1RM } from "./workoutMath.js";
import { red, card, border, text, textDim, textFaint, oswald } from "./theme.js";

export default function Pesas({ userId }) {
  const [templates, setTemplates] = useState([]);
  const [workout, setWorkout] = useState(null); // sesión activa de hoy
  const [sets, setSets] = useState([]);
  const [ejerciciosSesion, setEjerciciosSesion] = useState([]); // ids de ejercicios en la sesión
  const [vista, setVista] = useState(null); // null | "armar-rutina" | "agregar-ejercicio"

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const ts = await loadTemplates(userId);
      setTemplates(ts);
      const ws = await loadWorkouts(userId);
      if (ws.length) {
        const w = ws[ws.length - 1];
        setWorkout(w);
        if (w.template_id) {
          const t = ts.find((x) => x.id === w.template_id);
          if (t) setEjerciciosSesion((t.ejercicios || []).map((e) => e.ejercicio_id));
        }
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!workout) return;
    loadSetsForWorkout(userId, workout.id).then((s) => {
      setSets(s);
      const ids = [...new Set(s.map((x) => x.ejercicio_id))];
      setEjerciciosSesion((prev) => [...new Set([...prev, ...ids])]);
    });
  }, [workout, userId]);

  async function iniciarRutina({ ejercicioIds, nombrePlantilla }) {
    let templateId = null;
    let nombre = null;
    if (nombrePlantilla) {
      const ejercicios = ejercicioIds.map((id, i) => ({ ejercicio_id: id, orden: i }));
      const t = await saveTemplate(userId, { nombre: nombrePlantilla, ejercicios });
      setTemplates((prev) => [...prev, t]);
      templateId = t.id;
      nombre = t.nombre;
    }
    const w = await createWorkout(userId, { template_id: templateId, nombre });
    setWorkout(w);
    setSets([]);
    setEjerciciosSesion(ejercicioIds);
    setVista(null);
  }

  function agregarEjercicio(ej) {
    setEjerciciosSesion((prev) => (prev.includes(ej.id) ? prev : [...prev, ej.id]));
    setVista(null);
  }

  async function registrarSerie(ejercicioId, { reps, peso, rpe }) {
    const nueva = await addSet(userId, workout.id, { ejercicio_id: ejercicioId, reps, peso, rpe, orden: sets.length });
    setSets((prev) => [...prev, nueva]);
  }

  async function eliminarSerie(id) {
    setSets((prev) => prev.filter((s) => s.id !== id));
    await deleteSet(userId, workout.id, id);
  }

  const S = styles;

  if (!workout) {
    return (
      <>
        <section style={S.actions}>
          <button style={{ ...S.actionBtn, ...S.actionPrimary }} onClick={() => setVista("armar-rutina")}>
            ARMAR RUTINA
          </button>
        </section>
        {vista === "armar-rutina" && (
          <SeleccionEjerciciosPanel templates={templates} onIniciar={iniciarRutina} onClose={() => setVista(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div style={S.sesionHead}>
        <span style={S.sesionTitulo}>{workout.nombre || "Sesión de hoy"}</span>
        <button style={S.finBtn} onClick={() => setWorkout(null)}>Finalizar</button>
      </div>

      {ejerciciosSesion.map((id) => {
        const ej = ejercicioPorId(id);
        if (!ej) return null;
        const setsEj = sets.filter((s) => s.ejercicio_id === id);
        const rm = Math.max(0, ...setsEj.map((s) => estimar1RM(s.peso, s.reps)));
        return (
          <EjercicioCard
            key={id}
            userId={userId}
            ejercicio={ej}
            sets={setsEj}
            rm1={rm}
            onAgregarSerie={(vals) => registrarSerie(id, vals)}
            onEliminarSerie={eliminarSerie}
          />
        );
      })}

      <section style={S.actions}>
        <button style={S.actionBtn} onClick={() => setVista("agregar-ejercicio")}>+ AGREGAR EJERCICIO</button>
      </section>

      {vista === "agregar-ejercicio" && (
        <BuscarEjercicioPanel onElegir={agregarEjercicio} onClose={() => setVista(null)} />
      )}
    </>
  );
}

function EjercicioCard({ userId, ejercicio, sets, rm1, onAgregarSerie, onEliminarSerie }) {
  const [reps, setReps] = useState("");
  const [peso, setPeso] = useState("");
  const [rpe, setRpe] = useState("");
  const [ultima, setUltima] = useState(null); // última serie registrada (sesión previa), solo como recordatorio

  useEffect(() => {
    loadRecentSets(userId, ejercicio.id, 1).then((r) => setUltima(r[0] || null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejercicio.id]);

  function agregar() {
    const r = Number(reps);
    const p = Number(peso);
    if (!r || !p) return;
    onAgregarSerie({ reps: r, peso: p, rpe: rpe ? Number(rpe) : null });
    setReps("");
    setPeso("");
    setRpe("");
  }

  const S = styles;
  const pesoPh = ultima ? String(ultima.peso) : "kg";
  const repsPh = ultima ? String(ultima.reps) : "reps";

  return (
    <section style={S.ejCard}>
      <div style={S.ejHead}>
        <span style={S.ejNombre}>{ejercicio.nombre}</span>
        {rm1 > 0 && <span style={S.ejRm}>1RM ~{Math.round(rm1)}kg</span>}
      </div>
      {ultima && (
        <p style={S.ultimaHint}>Última vez: {ultima.peso}kg × {ultima.reps}{ultima.rpe ? ` · RPE ${ultima.rpe}` : ""}</p>
      )}
      {sets.map((s) => (
        <div key={s.id} style={S.setRow}>
          <span style={S.setInfo}>{s.peso}kg × {s.reps}{s.rpe ? ` · RPE ${s.rpe}` : ""}</span>
          <button style={S.removeBtn} onClick={() => onEliminarSerie(s.id)} aria-label="Eliminar serie">✕</button>
        </div>
      ))}
      <div style={S.setForm}>
        <input style={S.setInput} type="number" value={peso} placeholder={pesoPh} onChange={(e) => setPeso(e.target.value)} aria-label="Peso" />
        <input style={S.setInput} type="number" value={reps} placeholder={repsPh} onChange={(e) => setReps(e.target.value)} aria-label="Reps" />
        <input style={S.setInput} type="number" value={rpe} placeholder="RPE" onChange={(e) => setRpe(e.target.value)} aria-label="RPE" />
        <button style={S.addSetBtn} onClick={agregar}>+</button>
      </div>
    </section>
  );
}

function BuscarEjercicioPanel({ onElegir, onClose }) {
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState(null);
  const S = styles;

  const filtrados = EJERCICIOS.filter((e) => {
    if (grupo && e.musculo !== grupo) return false;
    if (q.trim() && !e.nombre.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <Panel titulo="Agregar ejercicio" onClose={onClose}>
      <input style={S.searchInput} value={q} placeholder="Buscar ejercicio…" onChange={(e) => setQ(e.target.value)} autoFocus />
      <div style={S.chips}>
        {GRUPOS_MUSCULARES.map((g) => (
          <button key={g} style={{ ...S.chip, ...(grupo === g ? S.chipActive : {}) }}
            onClick={() => setGrupo(grupo === g ? null : g)}>{g}</button>
        ))}
      </div>
      {filtrados.map((e) => (
        <button key={e.id} style={S.row} onClick={() => onElegir(e)}>
          <span style={S.nombre}>{e.nombre}</span>
          <span style={S.detalle}>{e.musculo}</span>
        </button>
      ))}
    </Panel>
  );
}

const styles = {
  actions: { display: "flex", gap: 8, marginBottom: 18 },
  actionBtn: { flex: 1, padding: "16px 0", fontFamily: oswald, fontSize: 13, letterSpacing: 1.5, fontWeight: 600, color: text, background: card, border: `1px solid ${border}`, borderRadius: 14, cursor: "pointer" },
  actionPrimary: { background: red, border: "none", color: "#fff" },
  sesionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sesionTitulo: { fontFamily: oswald, fontSize: 16, letterSpacing: 1, textTransform: "uppercase" },
  finBtn: { background: "transparent", border: `1px solid #3a3a3e`, color: textDim, borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  ejCard: { background: card, borderRadius: 16, padding: 14, marginBottom: 12 },
  ejHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  ejNombre: { fontSize: 14, fontWeight: 600 },
  ejRm: { fontSize: 12, color: red },
  ultimaHint: { fontSize: 12, color: textDim, margin: "0 0 8px" },
  setRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${border}` },
  setInfo: { fontSize: 13, color: "#c9c6c0" },
  removeBtn: { background: "transparent", border: `1px solid #3a3a3e`, color: textDim, borderRadius: 8, width: 24, height: 24, cursor: "pointer", fontSize: 11, flexShrink: 0 },
  setForm: { display: "flex", gap: 6, marginTop: 10 },
  setInput: { flex: 1, background: "#111113", border: `1px solid #3a3a3e`, borderRadius: 10, color: text, fontSize: 14, padding: "8px 6px", textAlign: "center", minWidth: 0 },
  addSetBtn: { background: red, border: "none", color: "#fff", borderRadius: 10, width: 38, fontSize: 18, cursor: "pointer" },
  searchInput: { width: "100%", background: "#111113", border: `1px solid #3a3a3e`, borderRadius: 10, color: text, fontSize: 14, padding: "10px 12px", marginBottom: 10 },
  chips: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  chip: { fontSize: 11, background: "#2a2a2e", border: "none", borderRadius: 999, padding: "5px 10px", color: "#c9c6c0", cursor: "pointer", textTransform: "capitalize" },
  chipActive: { background: red, color: "#fff" },
  row: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: `1px solid ${border}`, padding: "11px 4px", cursor: "pointer", color: text },
  nombre: { fontSize: 14, fontWeight: 600 },
  detalle: { fontSize: 12, color: textDim, textTransform: "capitalize" },
};
