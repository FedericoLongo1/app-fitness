import { supabase } from "./supabase.js";

// ─── Cache local (fallback offline) ───────────────────────────────
export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage lleno o no disponible: seguimos, Supabase es la fuente de verdad
  }
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

// ─── Targets ───────────────────────────────────────────────────────
export async function loadTargets(userId) {
  const cached = loadJSON("targets", { proteina: 160, kcal: 2600, objetivo: "mantenimiento" });
  const { data, error } = await supabase
    .from("targets")
    .select("proteina, kcal, objetivo")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    if (!error) await supabase.from("targets").insert({ user_id: userId, ...cached });
    return cached;
  }
  saveJSON("targets", data);
  return data;
}

export async function saveTargets(userId, targets) {
  saveJSON("targets", targets);
  await supabase.from("targets").upsert({ user_id: userId, ...targets, updated_at: new Date().toISOString() });
}

// ─── Meals ─────────────────────────────────────────────────────────
export async function loadMeals(userId, fecha = todayKey()) {
  const cacheKey = `meals:${fecha}`;
  const cached = loadJSON(cacheKey, []);
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("fecha", fecha)
    .order("created_at", { ascending: true });
  if (error || !data) return cached;
  saveJSON(cacheKey, data);
  return data;
}

export async function addMeal(userId, meal, fecha = todayKey()) {
  const cacheKey = `meals:${fecha}`;
  const { data, error } = await supabase
    .from("meals")
    .insert({ user_id: userId, fecha, ...meal })
    .select()
    .single();
  const nuevo = error || !data ? { id: Date.now(), fecha, ...meal } : data;
  const actual = loadJSON(cacheKey, []);
  saveJSON(cacheKey, [...actual, nuevo]);
  return nuevo;
}

export async function deleteMeal(userId, id, fecha = todayKey()) {
  const cacheKey = `meals:${fecha}`;
  await supabase.from("meals").delete().eq("user_id", userId).eq("id", id);
  const actual = loadJSON(cacheKey, []);
  saveJSON(cacheKey, actual.filter((m) => m.id !== id));
}

// Comidas de un rango de fechas (para el coach). Sin cache.
export async function loadMealsRange(userId, desde, hasta) {
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .gte("fecha", desde)
    .lte("fecha", hasta);
  return error || !data ? [] : data;
}

// ─── Peso corporal ─────────────────────────────────────────────────
export async function loadBodyMetrics(userId, desde, hasta) {
  const { data, error } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", userId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true });
  return error || !data ? [] : data;
}

export async function addBodyMetric(userId, { fecha = todayKey(), peso }) {
  const { data, error } = await supabase
    .from("body_metrics")
    .insert({ user_id: userId, fecha, peso })
    .select()
    .single();
  return error || !data ? { id: Date.now(), fecha, peso } : data;
}
