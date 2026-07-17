// ─── Cálculos puros de progreso (sin dependencias) ────────────────

// Fórmula de Epley
export function estimar1RM(peso, reps) {
  if (!peso || !reps || reps <= 0) return 0;
  return peso * (1 + reps / 30);
}

export function mejor1RM(sets) {
  return sets.reduce((max, s) => Math.max(max, estimar1RM(s.peso, s.reps)), 0);
}

export function volumenSemanalPorMusculo(sets, ejercicios) {
  const acc = {};
  for (const s of sets) {
    const ej = ejercicios.find((e) => e.id === s.ejercicio_id);
    if (!ej) continue;
    acc[ej.musculo] = (acc[ej.musculo] || 0) + 1;
  }
  return acc;
}

// Lunes a domingo de la semana de fechaRef
export function rangoSemanaActual(fechaRef = new Date()) {
  const d = new Date(fechaRef);
  const dia = d.getDay(); // 0=domingo..6=sábado
  const diffLunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diffLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (x) => x.toISOString().slice(0, 10);
  return { desde: fmt(lunes), hasta: fmt(domingo) };
}

export function calcularPace(distanciaKm, tiempoSeg) {
  if (!distanciaKm || !tiempoSeg) return null;
  const segPorKm = tiempoSeg / distanciaKm;
  const min = Math.floor(segPorKm / 60);
  const seg = Math.round(segPorKm % 60);
  return `${min}:${String(seg).padStart(2, "0")}/km`;
}
