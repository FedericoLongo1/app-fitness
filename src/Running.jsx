import React, { useState, useEffect } from "react";
import { loadRuns, addRun, deleteRun } from "./data-workouts.js";
import { calcularPace } from "./workoutMath.js";
import { red, card, border, text, textDim, textFaint, oswald } from "./theme.js";
import { todayKey } from "./data.js";

export default function Running({ userId }) {
  const [runs, setRuns] = useState([]);
  const [fecha, setFecha] = useState(todayKey());
  const [distancia, setDistancia] = useState("");
  const [min, setMin] = useState("");
  const [seg, setSeg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    loadRuns(userId).then(setRuns);
  }, [userId]);

  const distanciaKm = Number(distancia) || 0;
  const segParciales = Number(seg) || 0;
  const tiempoSeg = (Number(min) || 0) * 60 + segParciales;
  const paceLive = calcularPace(distanciaKm, tiempoSeg);

  async function guardar() {
    if (!distancia || !Number.isFinite(distanciaKm) || distanciaKm <= 0) return setError("La distancia tiene que ser mayor a 0.");
    if (distanciaKm > 300) return setError("Esa distancia parece un error de carga (más de 300km).");
    if (segParciales < 0 || segParciales > 59) return setError("Los segundos van de 0 a 59.");
    if (!tiempoSeg || tiempoSeg <= 0) return setError("Cargá el tiempo de la carrera.");
    if (!fecha) return setError("Elegí una fecha.");
    setError("");
    const nueva = await addRun(userId, { fecha, distancia_km: distanciaKm, tiempo_seg: tiempoSeg });
    setRuns((prev) => [nueva, ...prev]);
    setDistancia("");
    setMin("");
    setSeg("");
  }

  async function eliminar(id) {
    setRuns((prev) => prev.filter((r) => r.id !== id));
    await deleteRun(userId, id);
  }

  const S = styles;

  return (
    <>
      <section style={S.card}>
        <p style={S.title}>Nueva carrera</p>
        <div style={S.row}>
          <label style={S.label}>Fecha</label>
          <input style={S.inputDate} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div style={S.row}>
          <label style={S.label}>Distancia</label>
          <input style={S.input} type="number" min="0" step="0.1" value={distancia} placeholder="0.0"
            onChange={(e) => { setDistancia(e.target.value); setError(""); }} aria-label="Distancia en km" />
          <span style={S.unit}>km</span>
        </div>
        <div style={S.row}>
          <label style={S.label}>Tiempo</label>
          <input style={S.inputSmall} type="number" min="0" step="1" value={min} placeholder="0"
            onChange={(e) => { setMin(e.target.value); setError(""); }} aria-label="Minutos" />
          <span style={S.unit}>min</span>
          <input style={S.inputSmall} type="number" min="0" max="59" step="1" value={seg} placeholder="0"
            onChange={(e) => { setSeg(e.target.value); setError(""); }} aria-label="Segundos" />
          <span style={S.unit}>seg</span>
        </div>
        {paceLive && <div style={S.previa}>Ritmo: <b style={S.hint}>{paceLive}</b></div>}
        {error && <p style={S.errorText}>{error}</p>}
        <button style={S.confirmBtn} onClick={guardar}>Guardar carrera</button>
      </section>

      <section style={S.logSection}>
        <h2 style={S.logTitle}>CARRERAS</h2>
        {runs.length === 0 ? (
          <p style={S.emptyText}>Todavía no cargaste carreras.</p>
        ) : (
          runs.map((r) => (
            <div key={r.id} style={S.runCard}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.runTop}>
                  <span style={S.runDate}>{r.fecha}</span>
                  <span style={S.runStats}><b style={S.hint}>{calcularPace(r.distancia_km, r.tiempo_seg)}</b></span>
                </div>
                <p style={S.runInfo}>{r.distancia_km} km · {Math.floor(r.tiempo_seg / 60)}:{String(r.tiempo_seg % 60).padStart(2, "0")}</p>
              </div>
              <button style={S.removeBtn} onClick={() => eliminar(r.id)} aria-label="Eliminar">✕</button>
            </div>
          ))
        )}
      </section>
    </>
  );
}

const styles = {
  card: { background: card, borderRadius: 16, padding: 16, marginBottom: 18 },
  title: { fontWeight: 600, fontSize: 15, margin: "0 0 12px" },
  row: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  label: { fontSize: 13, color: textDim, width: 70, flexShrink: 0 },
  inputDate: { flex: 1, background: "#111113", border: `1px solid #3a3a3e`, borderRadius: 10, color: text, fontSize: 14, padding: "8px 10px" },
  input: { flex: 1, background: "#111113", border: `1px solid #3a3a3e`, borderRadius: 10, color: text, fontSize: 16, padding: "8px 10px", textAlign: "center" },
  inputSmall: { width: 60, background: "#111113", border: `1px solid #3a3a3e`, borderRadius: 10, color: text, fontSize: 16, padding: "8px 10px", textAlign: "center" },
  unit: { fontSize: 13, color: textDim },
  previa: { fontSize: 13, color: "#c9c6c0", padding: "10px 0", borderTop: `1px solid ${border}`, marginBottom: 10 },
  hint: { color: red, fontStyle: "normal" },
  errorText: { fontSize: 12, color: "#ff8a75", margin: "0 0 10px" },
  confirmBtn: { width: "100%", padding: "12px 0", background: red, border: "none", color: "#fff", borderRadius: 12, fontFamily: oswald, letterSpacing: 2, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  logSection: { marginTop: 6 },
  logTitle: { fontFamily: oswald, fontSize: 13, letterSpacing: 3, color: textDim, margin: "0 0 10px" },
  emptyText: { fontSize: 13, color: textFaint, padding: "6px 4px" },
  runCard: { display: "flex", gap: 12, alignItems: "center", background: card, borderRadius: 14, padding: 12, marginBottom: 10 },
  runTop: { display: "flex", justifyContent: "space-between", marginBottom: 3 },
  runDate: { fontSize: 12, color: textDim },
  runStats: { fontSize: 13 },
  runInfo: { fontSize: 13, color: "#c9c6c0", margin: 0 },
  removeBtn: { background: "transparent", border: `1px solid #3a3a3e`, color: textDim, borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 12, flexShrink: 0 },
};
