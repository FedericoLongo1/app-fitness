// ─── Catálogo de ejercicios (con grupo muscular) ──────────────────
export const EJERCICIOS = [
  { id: "press-banca", nombre: "Press banca", musculo: "pecho" },
  { id: "press-inclinado", nombre: "Press inclinado con mancuernas", musculo: "pecho" },
  { id: "aperturas", nombre: "Aperturas con mancuernas", musculo: "pecho" },
  { id: "fondos", nombre: "Fondos en paralelas", musculo: "pecho" },
  { id: "press-plano-mancuerna", nombre: "Press plano con mancuernas", musculo: "pecho" },
  { id: "dominadas", nombre: "Dominadas", musculo: "espalda" },
  { id: "remo-barra", nombre: "Remo con barra", musculo: "espalda" },
  { id: "remo-mancuerna", nombre: "Remo con mancuerna", musculo: "espalda" },
  { id: "jalon-pecho", nombre: "Jalón al pecho", musculo: "espalda" },
  { id: "peso-muerto", nombre: "Peso muerto", musculo: "espalda" },
  { id: "remo-polea", nombre: "Remo en polea baja", musculo: "espalda" },
  { id: "sentadilla", nombre: "Sentadilla con barra", musculo: "pierna" },
  { id: "prensa", nombre: "Prensa de piernas", musculo: "pierna" },
  { id: "zancadas", nombre: "Zancadas", musculo: "pierna" },
  { id: "extension-cuadriceps", nombre: "Extensión de cuádriceps", musculo: "pierna" },
  { id: "curl-femoral", nombre: "Curl femoral", musculo: "pierna" },
  { id: "peso-muerto-rumano", nombre: "Peso muerto rumano", musculo: "pierna" },
  { id: "gemelos", nombre: "Elevación de gemelos", musculo: "pierna" },
  { id: "hip-thrust", nombre: "Hip thrust", musculo: "pierna" },
  { id: "press-militar", nombre: "Press militar", musculo: "hombro" },
  { id: "elevaciones-laterales", nombre: "Elevaciones laterales", musculo: "hombro" },
  { id: "elevaciones-frontales", nombre: "Elevaciones frontales", musculo: "hombro" },
  { id: "pajaros", nombre: "Pájaros (deltoide posterior)", musculo: "hombro" },
  { id: "press-arnold", nombre: "Press Arnold", musculo: "hombro" },
  { id: "curl-biceps", nombre: "Curl de bíceps con barra", musculo: "brazo" },
  { id: "curl-martillo", nombre: "Curl martillo", musculo: "brazo" },
  { id: "press-frances", nombre: "Press francés", musculo: "brazo" },
  { id: "extension-triceps-polea", nombre: "Extensión de tríceps en polea", musculo: "brazo" },
  { id: "fondos-triceps", nombre: "Fondos en banco (tríceps)", musculo: "brazo" },
  { id: "plancha", nombre: "Plancha", musculo: "core" },
  { id: "crunch", nombre: "Crunch abdominal", musculo: "core" },
  { id: "elevacion-piernas", nombre: "Elevación de piernas colgado", musculo: "core" },
];

export const GRUPOS_MUSCULARES = ["pecho", "espalda", "pierna", "hombro", "brazo", "core"];

export function ejercicioPorId(id) {
  return EJERCICIOS.find((e) => e.id === id);
}
