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

const NOMBRE_OBJETIVO = {
  "ganar-musculo": "ganar músculo",
  "perder-grasa": "perder grasa",
  mantenimiento: "mantenimiento",
};

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

// Tendencia de peso con media móvil simple (primera mitad vs segunda mitad del período),
// interpretada según el objetivo actual (ganar músculo / perder grasa / mantenimiento).
export function analizarTendenciaPeso(bodyMetrics, objetivo = "mantenimiento") {
  const ordenado = [...bodyMetrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (ordenado.length < 6) return null;
  const mitad = Math.floor(ordenado.length / 2);
  const media = (arr) => arr.reduce((s, x) => s + Number(x.peso), 0) / arr.length;
  const antes = media(ordenado.slice(0, mitad));
  const despues = media(ordenado.slice(mitad));
  const delta = despues - antes;
  const estancado = Math.abs(delta) < 0.3;
  const nombreObjetivo = NOMBRE_OBJETIVO[objetivo] || objetivo;
  const signo = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}kg`;

  if (objetivo === "ganar-musculo") {
    if (estancado) {
      return { tipo: "peso", severidad: "aviso", mensaje: `Peso estancado (${signo}) mientras el objetivo es ganar músculo. Subí las calorías un ~10% (más carbo y proteína) para volver a una ganancia gradual.` };
    }
    if (delta < 0) {
      return { tipo: "peso", severidad: "aviso", mensaje: `Estás bajando de peso (${signo}) con el objetivo de ganar músculo. Es probable que falten calorías: subí la ingesta antes de que se pierda masa muscular.` };
    }
    if (delta > 1.5) {
      return { tipo: "peso", severidad: "info", mensaje: `Subiendo bastante rápido (${signo} en el período). Para minimizar grasa ganada, bajá un poco las calorías, apuntá a una suba más gradual.` };
    }
    return { tipo: "peso", severidad: "info", mensaje: `Peso subiendo de forma gradual (${signo}), en línea con el objetivo de ganar músculo. Seguí así.` };
  }

  if (objetivo === "perder-grasa") {
    if (estancado) {
      return { tipo: "peso", severidad: "aviso", mensaje: `Peso estancado (${signo}) mientras el objetivo es perder grasa. Bajá las calorías un ~10% en vez de mantener lo mismo.` };
    }
    if (delta > 0) {
      return { tipo: "peso", severidad: "aviso", mensaje: `Estás subiendo de peso (${signo}) con el objetivo de perder grasa. Revisá las porciones o bajá un poco las calorías.` };
    }
    if (delta < -1.5) {
      return { tipo: "peso", severidad: "info", mensaje: `Bajando bastante rápido (${signo} en el período). Una pérdida muy agresiva suele costar músculo, considerá subir un poco las calorías para desacelerar.` };
    }
    return { tipo: "peso", severidad: "info", mensaje: `Peso bajando de forma gradual (${signo}), en línea con el objetivo de perder grasa. Seguí así.` };
  }

  // mantenimiento
  if (estancado) {
    return { tipo: "peso", severidad: "info", mensaje: `Peso estable (${signo}), acorde al objetivo de mantenimiento.` };
  }
  return { tipo: "peso", severidad: "info", mensaje: `Peso ${delta > 0 ? "subiendo" : "bajando"} (${signo}) pese al objetivo de mantenimiento (${nombreObjetivo}). Ajustá las calorías un ~5-10% en la dirección contraria para estabilizarlo.` };
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
    analizarTendenciaPeso(bodyMetrics, targets.objetivo),
    ...analizarProgresionCargas(sets, ejercicios),
    analizarVolumenRunning(runs),
  ];
  return resultados.filter(Boolean);
}
