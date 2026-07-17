import React, { useState, useEffect } from "react";
import { EJERCICIOS, GRUPOS_MUSCULARES } from "./ejercicios.js";
import { loadSetsForWeek, loadRecentSets } from "./data-workouts.js";
import { volumenSemanalPorMusculo, rangoSemanaActual, mejor1RM } from "./workoutMath.js";
import { red, card, border, text, textDim, textFaint, oswald } from "./theme.js";

export default function Progreso({ userId }) {
  const [volumen, setVolumen] = useState({});
  const [rms, setRms] = useState([]); // [{ejercicio, rm}]

  useEffect(() => {
    if (!userId) return;
    const { desde, hasta } = rangoSemanaActual();
    loadSetsForWeek(userId, desde, hasta).then((sets) => {
      setVolumen(volumenSemanalPorMusculo(sets, EJERCICIOS));
    });

    (async () => {
      const resultados = [];
      for (const ej of EJERCICIOS) {
        const recientes = await loadRecentSets(userId, ej.id, 20);
        if (recientes.length) {
          resultados.push({ ejercicio: ej, rm: mejor1RM(recientes) });
        }
      }
      resultados.sort((a, b) => b.rm - a.rm);
      setRms(resultados);
    })();
  }, [userId]);

  const maxVolumen = Math.max(1, ...Object.values(volumen));
  const S = styles;

  return (
    <>
      <section style={S.card}>
        <p style={S.title}>Volumen semanal por grupo muscular</p>
        {GRUPOS_MUSCULARES.map((g) => {
          const cantidad = volumen[g] || 0;
          const pct = (cantidad / maxVolumen) * 100;
          return (
            <div key={g} style={S.volRow}>
              <span style={S.volLabel}>{g}</span>
              <div style={S.barTrack}><div style={{ ...S.barFill, width: `${pct}%` }} /></div>
              <span style={S.volCount}>{cantidad}</span>
            </div>
          );
        })}
      </section>

      <section style={S.card}>
        <p style={S.title}>1RM estimado</p>
        {rms.length === 0 ? (
          <p style={S.emptyText}>Todavía no hay historial suficiente.</p>
        ) : (
          rms.map(({ ejercicio, rm }) => (
            <div key={ejercicio.id} style={S.rmRow}>
              <span style={S.rmNombre}>{ejercicio.nombre}</span>
              <span style={S.rmValor}>{Math.round(rm)}kg</span>
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
  volRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  volLabel: { fontSize: 12, color: text, width: 60, flexShrink: 0, textTransform: "capitalize" },
  barTrack: { flex: 1, height: 8, background: "#2a2a2e", borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", background: red, borderRadius: 999, transition: "width .5s ease" },
  volCount: { fontSize: 12, color: textDim, width: 20, textAlign: "right" },
  emptyText: { fontSize: 13, color: textFaint, padding: "6px 4px" },
  rmRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${border}` },
  rmNombre: { fontSize: 13, color: "#c9c6c0" },
  rmValor: { fontSize: 13, color: red, fontWeight: 600 },
};
