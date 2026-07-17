// ─── Motor de coach por reglas (Etapa 4) ───────────────────────────
// Determinístico, sin IA, sin costo. Solo lógica sobre los datos ya cargados.

function fmtFecha(d) {
  return d.toISOString().slice(0, 10);
}

// Últimas n semanas (lunes-domingo), la más reciente al final.
export function ultimasSemanas(n, fechaRef = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(fechaRef);
    d.setDate(d.getDate() - i * 7);
    const dia = d.getDay();
    const diffLunes = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(d);
    lunes.setDate(d.getDate() + diffLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    out.push({ desde: fmtFecha(lunes), hasta: fmtFecha(domingo) });
  }
  return out;
}

// Agrupa comidas por fecha sumando proteína/kcal.
export function agruparPorDia(meals) {
  const acc = {};
  for (const m of meals) {
    if (!acc[m.fecha]) acc[m.fecha] = { fecha: m.fecha, proteina: 0, kcal: 0 };
    acc[m.fecha].proteina += Number(m.proteina) || 0;
    acc[m.fecha].kcal += Number(m.kcal) || 0;
  }
  return Object.values(acc).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function analizarProteina(diasConDatos, objetivoProteina) {
  if (diasConDatos.length < 3) return null;
  const promedio = diasConDatos.reduce((s, d) => s + d.proteina, 0) / diasConDatos.length;
  const diasBajos = diasConDatos.filter((d) => d.proteina < objetivoProteina).length;
  if (diasBajos >= 3) {
    return {
      tipo: "proteina",
      severidad: "aviso",
      mensaje: `Proteína promedio de ${Math.round(promedio)}g/día, por debajo del objetivo (${objetivoProteina}g) en ${diasBajos} de los últimos ${diasConDatos.length} días registrados. Sumá fuentes concretas: pollo, atún, huevo, yogur griego o whey en las comidas más flojas.`,
    };
  }
  return null;
}

export function analizarCalorias(diasConDatos, objetivoKcal) {
  if (diasConDatos.length < 3) return null;
  const promedio = diasConDatos.reduce((s, d) => s + d.kcal, 0) / diasConDatos.length;
  const desvioPct = (promedio - objetivoKcal) / objetivoKcal;
  if (Math.abs(desvioPct) >= 0.15) {
    const direccion = desvioPct > 0 ? "por encima" : "por debajo";
    return {
      tipo: "calorias",
      severidad: "info",
      mensaje: `Calorías promedio (${Math.round(promedio)}kcal) ${direccion} del objetivo (${objetivoKcal}kcal) por ${Math.round(Math.abs(desvioPct) * 100)}%. Si es sostenido, ajustá el objetivo o las porciones de a poco, nunca de golpe.`,
    };
  }
  return null;
}

// Tendencia de peso con media móvil simple (primera mitad vs segunda mitad del período).
export function analizarTendenciaPeso(bodyMetrics) {
  const ordenado = [...bodyMetrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (ordenado.length < 6) return null;
  const mitad = Math.floor(ordenado.length / 2);
  const media = (arr) => arr.reduce((s, x) => s + Number(x.peso), 0) / arr.length;
  const antes = media(ordenado.slice(0, mitad));
  const despues = media(ordenado.slice(mitad));
  const delta = despues - antes;
  if (Math.abs(delta) < 0.3) {
    return {
      tipo: "peso",
      severidad: "info",
      mensaje: `Peso estancado en las últimas semanas (variación de ${delta.toFixed(1)}kg). Si tu objetivo es subir o bajar, ajustá las calorías un ±10% en vez de mantener lo mismo.`,
    };
  }
  return {
    tipo: "peso",
    severidad: "info",
    mensaje: `Peso ${delta > 0 ? "subiendo" : "bajando"} (${delta > 0 ? "+" : ""}${delta.toFixed(1)}kg en el período). Seguí así si es lo buscado, o ajustá calorías si no.`,
  };
}

// Mismo peso máximo en un ejercicio durante 3 semanas seguidas.
export function analizarProgresionCargas(sets, ejercicios) {
  const semanas = ultimasSemanas(3);
  const porEjercicio = {};
  for (const s of sets) {
    (porEjercicio[s.ejercicio_id] ||= []).push(s);
  }
  const avisos = [];
  for (const [ejId, ss] of Object.entries(porEjercicio)) {
    const maxPorSemana = semanas.map(({ desde, hasta }) =>
      Math.max(0, ...ss.filter((s) => s.fecha >= desde && s.fecha <= hasta).map((s) => Number(s.peso)))
    );
    const completas = maxPorSemana.every((p) => p > 0);
    if (completas && maxPorSemana[0] === maxPorSemana[1] && maxPorSemana[1] === maxPorSemana[2]) {
      const ej = ejercicios.find((e) => e.id === ejId);
      avisos.push({
        tipo: "carga",
        severidad: "info",
        mensaje: `${ej?.nombre || ejId} lleva 3 semanas con el mismo peso máximo (${maxPorSemana[0]}kg). Probá subir carga un poco o meter una semana de deload.`,
      });
    }
  }
  return avisos;
}

// Volumen semanal de running, alerta si sube más de 10% vs la semana anterior.
export function analizarVolumenRunning(runs) {
  const semanas = ultimasSemanas(2);
  const km = semanas.map(({ desde, hasta }) =>
    runs.filter((r) => r.fecha >= desde && r.fecha <= hasta).reduce((s, r) => s + Number(r.distancia_km), 0)
  );
  const [previa, actual] = km;
  if (previa > 0) {
    const cambio = (actual - previa) / previa;
    if (cambio > 0.1) {
      return {
        tipo: "running",
        severidad: "riesgo",
        mensaje: `Volumen semanal de running subió ${Math.round(cambio * 100)}% (${previa.toFixed(1)}km → ${actual.toFixed(1)}km). Subidas bruscas aumentan el riesgo de lesión, tratá de no superar +10% por semana.`,
      };
    }
  }
  return null;
}

// Combina todos los análisis en una lista de recomendaciones.
export function generarResumenSemana({ meals, targets, bodyMetrics, sets, ejercicios, runs }) {
  const dias = agruparPorDia(meals);
  const resultados = [
    analizarProteina(dias, targets.proteina),
    analizarCalorias(dias, targets.kcal),
    analizarTendenciaPeso(bodyMetrics),
    ...analizarProgresionCargas(sets, ejercicios),
    analizarVolumenRunning(runs),
  ];
  return resultados.filter(Boolean);
}
