import { supabase } from "./supabase.js";
import { loadJSON, saveJSON, todayKey } from "./data.js";

// ─── Plantillas de rutina ──────────────────────────────────────────
export async function loadTemplates(userId) {
  const cached = loadJSON("templates", []);
  const { data, error } = await supabase
    .from("routine_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return cached;
  saveJSON("templates", data);
  return data;
}

export async function saveTemplate(userId, { nombre, ejercicios }) {
  const { data, error } = await supabase
    .from("routine_templates")
    .insert({ user_id: userId, nombre, ejercicios })
    .select()
    .single();
  const nueva = error || !data ? { id: Date.now(), nombre, ejercicios } : data;
  const actual = loadJSON("templates", []);
  saveJSON("templates", [...actual, nueva]);
  return nueva;
}

export async function deleteTemplate(userId, id) {
  await supabase.from("routine_templates").delete().eq("user_id", userId).eq("id", id);
  const actual = loadJSON("templates", []);
  saveJSON("templates", actual.filter((t) => t.id !== id));
}

// ─── Sesiones de pesas (workouts) ─────────────────────────────────
export async function loadWorkouts(userId, fecha = todayKey()) {
  const cacheKey = `workouts:${fecha}`;
  const cached = loadJSON(cacheKey, []);
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("fecha", fecha)
    .order("created_at", { ascending: true });
  if (error || !data) return cached;
  saveJSON(cacheKey, data);
  return data;
}

export async function createWorkout(userId, { template_id = null, nombre = null } = {}, fecha = todayKey()) {
  const cacheKey = `workouts:${fecha}`;
  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, fecha, template_id, nombre })
    .select()
    .single();
  const nuevo = error || !data ? { id: Date.now(), fecha, template_id, nombre } : data;
  const actual = loadJSON(cacheKey, []);
  saveJSON(cacheKey, [...actual, nuevo]);
  return nuevo;
}

// ─── Series (sets) ─────────────────────────────────────────────────
export async function loadSetsForWorkout(userId, workoutId) {
  const cacheKey = `sets:${workoutId}`;
  const cached = loadJSON(cacheKey, []);
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_id", workoutId)
    .order("created_at", { ascending: true });
  if (error || !data) return cached;
  saveJSON(cacheKey, data);
  return data;
}

export async function addSet(userId, workoutId, { ejercicio_id, reps, peso, rpe = null, orden = 0 }, fecha = todayKey()) {
  const cacheKey = `sets:${workoutId}`;
  const { data, error } = await supabase
    .from("sets")
    .insert({ user_id: userId, workout_id: workoutId, ejercicio_id, reps, peso, rpe, orden, fecha })
    .select()
    .single();
  const nueva = error || !data ? { id: Date.now(), workout_id: workoutId, ejercicio_id, reps, peso, rpe, orden, fecha } : data;
  const actual = loadJSON(cacheKey, []);
  saveJSON(cacheKey, [...actual, nueva]);
  return nueva;
}

export async function deleteSet(userId, workoutId, setId) {
  const cacheKey = `sets:${workoutId}`;
  await supabase.from("sets").delete().eq("user_id", userId).eq("id", setId);
  const actual = loadJSON(cacheKey, []);
  saveJSON(cacheKey, actual.filter((s) => s.id !== setId));
}

// Historial reciente de un ejercicio (para 1RM). Sin cache: si falla, no rompe la UI.
export async function loadRecentSets(userId, ejercicioId, limit = 20) {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("user_id", userId)
    .eq("ejercicio_id", ejercicioId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return error || !data ? [] : data;
}

// Series de un rango de fechas (para volumen semanal). Sin cache.
export async function loadSetsForWeek(userId, desde, hasta) {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("user_id", userId)
    .gte("fecha", desde)
    .lte("fecha", hasta);
  return error || !data ? [] : data;
}

// ─── Running ────────────────────────────────────────────────────────
export async function loadRuns(userId) {
  const cached = loadJSON("runs", []);
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });
  if (error || !data) return cached;
  saveJSON("runs", data);
  return data;
}

export async function addRun(userId, { fecha = todayKey(), distancia_km, tiempo_seg }) {
  const { data, error } = await supabase
    .from("runs")
    .insert({ user_id: userId, fecha, distancia_km, tiempo_seg })
    .select()
    .single();
  const nueva = error || !data ? { id: Date.now(), fecha, distancia_km, tiempo_seg } : data;
  const actual = loadJSON("runs", []);
  saveJSON("runs", [nueva, ...actual]);
  return nueva;
}

export async function deleteRun(userId, id) {
  await supabase.from("runs").delete().eq("user_id", userId).eq("id", id);
  const actual = loadJSON("runs", []);
  saveJSON("runs", actual.filter((r) => r.id !== id));
}
