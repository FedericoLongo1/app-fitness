import React, { useState, useEffect } from "react";
import { FRECUENTES, buscarPorCodigo, buscarPorTexto, buscarLocal } from "./food.js";
import Scanner from "./Scanner.jsx";
import Auth from "./Auth.jsx";
import { supabase } from "./supabase.js";
import { loadTargets, saveTargets, loadMeals, addMeal, deleteMeal } from "./data.js";

const round1 = (n) => Math.round(n * 10) / 10;

// Escala macros por 100g a la porción en gramos
function escalar(base100, gramos) {
  const f = gramos / 100;
  return {
    proteina: round1(base100.proteina * f),
    carbs: round1(base100.carbs * f),
    grasas: round1(base100.grasas * f),
    kcal: Math.round(base100.kcal * f),
  };
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando | null = sin sesión
  const [targets, setTargets] = useState({ proteina: 160, kcal: 2600 });
  const [meals, setMeals] = useState([]);
  const [modo, setModo] = useState(null);        // null | "frecuentes" | "buscar" | "escanear"
  const [seleccion, setSeleccion] = useState(null); // alimento elegido, esperando gramos
  const [gramos, setGramos] = useState(100);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    loadTargets(userId).then(setTargets);
    loadMeals(userId).then(setMeals);
  }, [userId]);

  const totals = meals.reduce(
    (a, m) => ({
      proteina: a.proteina + m.proteina,
      carbs: a.carbs + m.carbs,
      grasas: a.grasas + m.grasas,
      kcal: a.kcal + m.kcal,
    }),
    { proteina: 0, carbs: 0, grasas: 0, kcal: 0 }
  );

  // Elegir un alimento (viene con macros por 100g) → pedir gramos
  function elegir(base100) {
    setSeleccion(base100);
    setGramos(100);
    setModo(null);
  }

  async function agregar() {
    if (!seleccion) return;
    const m = escalar(seleccion, gramos);
    const meal = {
      nombre: seleccion.nombre,
      gramos,
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      ...m,
    };
    setSeleccion(null);
    const guardada = await addMeal(userId, meal);
    setMeals((prev) => [...prev, guardada]);
  }

  async function eliminar(id) {
    setMeals((prev) => prev.filter((x) => x.id !== id));
    await deleteMeal(userId, id);
  }

  function actualizarTargets(next) {
    setTargets(next);
    saveTargets(userId, next);
  }

  const protPct = Math.min(100, (totals.proteina / targets.proteina) * 100);
  const kcalPct = Math.min(100, (totals.kcal / targets.kcal) * 100);
  const previa = seleccion ? escalar(seleccion, gramos) : null;
  const S = styles;

  if (session === undefined) return null;
  if (session === null) return <Auth />;

  return (
    <div style={S.app}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button{ -webkit-appearance:none; }
        input[type=number]{ -moz-appearance:textfield; }
        button:focus-visible, input:focus-visible { outline: 2px solid #e8381a; outline-offset: 2px; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      `}</style>

      <header style={S.header}>
        <div style={S.logoBlock}>
          <span style={S.logoTop}>REGISTRO DE</span>
          <span style={S.logoMain}>MACROS</span>
        </div>
        <span style={S.datePill}>
          {new Date().toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </header>

      {/* Resumen diario */}
      <section style={S.proteinCard}>
        <div style={S.proteinRow}>
          <span style={S.proteinLabel}>PROTEÍNA HOY</span>
          <span style={S.proteinNum}>{round1(totals.proteina)}<span style={S.proteinTarget}> / {targets.proteina}g</span></span>
        </div>
        <div style={S.barTrack}><div style={{ ...S.barFillProt, width: `${protPct}%` }} /></div>
        <div style={{ ...S.proteinRow, marginTop: 14 }}>
          <span style={S.kcalLabel}>CALORÍAS</span>
          <span style={S.kcalNum}>{Math.round(totals.kcal)} <span style={S.proteinTarget}>/ {targets.kcal}</span></span>
        </div>
        <div style={S.barTrack}><div style={{ ...S.barFillKcal, width: `${kcalPct}%` }} /></div>
        <div style={S.macroChips}>
          <span style={S.chip}>C {round1(totals.carbs)}g</span>
          <span style={S.chip}>G {round1(totals.grasas)}g</span>
          <span style={S.chipEdit}>
            Objetivo:{" "}
            <input style={S.inlineInput} type="number" value={targets.proteina}
              onChange={(e) => actualizarTargets({ ...targets, proteina: Number(e.target.value) || 0 })} aria-label="Objetivo proteína" />g prot ·{" "}
            <input style={{ ...S.inlineInput, width: 52 }} type="number" value={targets.kcal}
              onChange={(e) => actualizarTargets({ ...targets, kcal: Number(e.target.value) || 0 })} aria-label="Objetivo calorías" />kcal
          </span>
        </div>
      </section>

      {/* Botones de carga */}
      {!seleccion && !modo && (
        <section style={S.actions}>
          <button style={{ ...S.actionBtn, ...S.actionPrimary }} onClick={() => setModo("frecuentes")}>⚡ FRECUENTES</button>
          <button style={S.actionBtn} onClick={() => setModo("escanear")}>▮▮▮ ESCANEAR</button>
          <button style={S.actionBtn} onClick={() => setModo("buscar")}>🔍 BUSCAR</button>
        </section>
      )}

      {/* Panel: frecuentes */}
      {modo === "frecuentes" && (
        <Panel titulo="Alimentos frecuentes" onClose={() => setModo(null)}>
          {FRECUENTES.map((f) => (
            <button key={f.nombre} style={S.foodRow} onClick={() => elegir(f)}>
              <span style={S.foodName}>{f.nombre}</span>
              <span style={S.foodMacro}><b style={S.protHint}>{f.proteina}g P</b> · {f.kcal} kcal <span style={S.per100}>/100g</span></span>
            </button>
          ))}
        </Panel>
      )}

      {/* Panel: buscar */}
      {modo === "buscar" && <BuscarPanel onElegir={elegir} onClose={() => setModo(null)} />}

      {/* Escáner de código de barras */}
      {modo === "escanear" && (
        <Scanner
          onClose={() => setModo(null)}
          onDetected={async (codigo) => {
            setModo("resolviendo");
            try {
              const prod = await buscarPorCodigo(codigo);
              elegir(prod);
            } catch (e) {
              alert(e.message);
              setModo(null);
            }
          }}
        />
      )}
      {modo === "resolviendo" && <p style={S.loading}>Buscando producto…</p>}

      {/* Ingreso de gramos para el alimento elegido */}
      {seleccion && (
        <section style={S.gramCard}>
          <p style={S.gramTitle}>{seleccion.nombre}</p>
          {seleccion.serving && <p style={S.servingHint}>Porción sugerida: {seleccion.serving}</p>}
          <div style={S.gramInputRow}>
            <span style={S.gramLabel}>Cantidad</span>
            <input style={S.gramInput} type="number" value={gramos} autoFocus
              onChange={(e) => setGramos(Math.max(0, Number(e.target.value) || 0))} aria-label="Cantidad en gramos" />
            <span style={S.gramUnit}>g</span>
          </div>
          <div style={S.quickGrams}>
            {[50, 100, 150, 200, 250].map((g) => (
              <button key={g} style={{ ...S.quickBtn, ...(gramos === g ? S.quickActive : {}) }} onClick={() => setGramos(g)}>{g}g</button>
            ))}
          </div>
          <div style={S.previa}>= <b style={S.protHint}>{previa.proteina}g proteína</b> · {previa.carbs}g C · {previa.grasas}g G · {previa.kcal} kcal</div>
          <div style={S.gramActions}>
            <button style={S.discardBtn} onClick={() => setSeleccion(null)}>Cancelar</button>
            <button style={S.confirmBtn} onClick={agregar}>Agregar al día</button>
          </div>
        </section>
      )}

      {/* Comidas del día */}
      <section style={S.logSection}>
        <h2 style={S.logTitle}>COMIDAS DE HOY</h2>
        {meals.length === 0 ? (
          <p style={S.emptyText}>Todavía no registraste comidas. Cargá una para empezar.</p>
        ) : (
          meals.map((m) => (
            <div key={m.id} style={S.mealCard}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.mealTop}>
                  <span style={S.mealTime}>{m.hora}</span>
                  <span style={S.mealStats}><b style={S.protHint}>{round1(m.proteina)}g P</b> · {Math.round(m.kcal)} kcal</span>
                </div>
                <p style={S.mealItems}>{m.nombre} · {m.gramos}g</p>
              </div>
              <button style={S.removeBtn} onClick={() => eliminar(m.id)} aria-label="Eliminar">✕</button>
            </div>
          ))
        )}
      </section>

      <footer style={S.footer}>
        Macros · uso personal · datos de Open Food Facts
        <br />
        <button style={S.logoutBtn} onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </footer>
    </div>
  );
}

// ─── Panel genérico (contenedor con cerrar) ───────────────────────
function Panel({ titulo, onClose, children }) {
  return (
    <section style={styles.panel}>
      <div style={styles.panelHead}>
        <span style={styles.panelTitle}>{titulo}</span>
        <button style={styles.panelClose} onClick={onClose}>✕</button>
      </div>
      <div style={styles.panelBody}>{children}</div>
    </section>
  );
}

// ─── Panel de búsqueda online ─────────────────────────────────────
function BuscarPanel({ onElegir, onClose }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [estado, setEstado] = useState("idle"); // idle | buscando | ok | error | vacio

  async function buscar(e) {
    e?.preventDefault?.();
    if (q.trim().length < 2) return;
    setEstado("buscando");
    const locales = buscarLocal(q);
    try {
      const online = await buscarPorTexto(q.trim());
      const r = [...locales, ...online];
      setResultados(r);
      setEstado(r.length ? "ok" : "vacio");
    } catch {
      if (locales.length) {
        setResultados(locales);
        setEstado("ok");
      } else {
        setEstado("error");
      }
    }
  }

  return (
    <Panel titulo="Buscar alimento" onClose={onClose}>
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={q}
          placeholder="Ej: yogur griego, atún, barrita…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          autoFocus
        />
        <button style={styles.searchBtn} onClick={buscar}>Buscar</button>
      </div>
      {estado === "buscando" && <p style={styles.loading}>Buscando…</p>}
      {estado === "vacio" && <p style={styles.emptyText}>Sin resultados. Probá otro término o cargalo como frecuente.</p>}
      {estado === "error" && <p style={styles.errorText}>Error de conexión. Volvé a intentar.</p>}
      {estado === "ok" &&
        resultados.map((r, i) => (
          <button key={i} style={styles.foodRow} onClick={() => onElegir(r)}>
            <span style={styles.foodName}>{r.nombre}</span>
            <span style={styles.foodMacro}><b style={styles.protHint}>{round1(r.proteina)}g P</b> · {r.kcal} kcal <span style={styles.per100}>/100g</span></span>
          </button>
        ))}
    </Panel>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────
const red = "#e8381a";
const styles = {
  app: { minHeight: "100vh", background: "#111113", color: "#f2f0ec", fontFamily: "'Inter',-apple-system,'Segoe UI',sans-serif", maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top,0px) + 20px) 16px 40px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoBlock: { display: "flex", flexDirection: "column", lineHeight: 1 },
  logoTop: { fontFamily: "'Oswald',sans-serif", fontSize: 11, letterSpacing: 4, color: "#8a8781" },
  logoMain: { fontFamily: "'Oswald',sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: 2, color: "#f2f0ec", textTransform: "uppercase" },
  datePill: { fontSize: 12, color: "#8a8781", border: "1px solid #2a2a2e", borderRadius: 999, padding: "5px 12px", textTransform: "capitalize" },
  proteinCard: { background: "#1a1a1e", borderRadius: 16, padding: "18px 16px", marginBottom: 16 },
  proteinRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  proteinLabel: { fontFamily: "'Oswald',sans-serif", fontSize: 12, letterSpacing: 3, color: red },
  proteinNum: { fontFamily: "'Oswald',sans-serif", fontSize: 26, fontWeight: 600 },
  proteinTarget: { fontSize: 14, color: "#8a8781", fontWeight: 400 },
  kcalLabel: { fontFamily: "'Oswald',sans-serif", fontSize: 11, letterSpacing: 3, color: "#8a8781" },
  kcalNum: { fontFamily: "'Oswald',sans-serif", fontSize: 17 },
  barTrack: { height: 8, background: "#2a2a2e", borderRadius: 999, overflow: "hidden" },
  barFillProt: { height: "100%", background: red, borderRadius: 999, transition: "width .5s ease" },
  barFillKcal: { height: "100%", background: "#5a5852", borderRadius: 999, transition: "width .5s ease" },
  macroChips: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" },
  chip: { fontSize: 12, background: "#2a2a2e", borderRadius: 999, padding: "4px 10px", color: "#c9c6c0" },
  chipEdit: { fontSize: 11, color: "#8a8781", marginLeft: "auto" },
  inlineInput: { width: 40, background: "transparent", border: "none", borderBottom: "1px solid #3a3a3e", color: "#f2f0ec", fontSize: 12, textAlign: "center" },
  actions: { display: "flex", gap: 8, marginBottom: 18 },
  actionBtn: { flex: 1, padding: "16px 0", fontFamily: "'Oswald',sans-serif", fontSize: 13, letterSpacing: 1.5, fontWeight: 600, color: "#f2f0ec", background: "#1a1a1e", border: "1px solid #2a2a2e", borderRadius: 14, cursor: "pointer" },
  actionPrimary: { background: red, border: "none", color: "#fff" },
  panel: { background: "#1a1a1e", borderRadius: 16, padding: 14, marginBottom: 18 },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  panelTitle: { fontFamily: "'Oswald',sans-serif", fontSize: 15, letterSpacing: 2, textTransform: "uppercase" },
  panelClose: { background: "transparent", border: "1px solid #3a3a3e", color: "#8a8781", borderRadius: 8, width: 30, height: 30, cursor: "pointer" },
  panelBody: { maxHeight: 340, overflowY: "auto" },
  foodRow: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: "1px solid #2a2a2e", padding: "11px 4px", cursor: "pointer", color: "#f2f0ec" },
  foodName: { fontSize: 14, fontWeight: 600 },
  foodMacro: { fontSize: 12, color: "#9a978f" },
  per100: { color: "#6a675f" },
  protHint: { color: red, fontStyle: "normal" },
  searchRow: { display: "flex", gap: 8, marginBottom: 6 },
  searchInput: { flex: 1, background: "#111113", border: "1px solid #3a3a3e", borderRadius: 10, color: "#f2f0ec", fontSize: 14, padding: "10px 12px" },
  searchBtn: { background: red, border: "none", color: "#fff", borderRadius: 10, padding: "0 16px", fontWeight: 600, cursor: "pointer" },
  loading: { fontSize: 13, color: "#8a8781", padding: "10px 4px" },
  gramCard: { background: "#1a1a1e", border: `1px solid ${red}44`, borderRadius: 16, padding: 16, marginBottom: 18 },
  gramTitle: { fontWeight: 600, fontSize: 15, margin: "0 0 4px", textTransform: "capitalize" },
  servingHint: { fontSize: 12, color: "#8a8781", margin: "0 0 10px" },
  gramInputRow: { display: "flex", alignItems: "center", gap: 10, margin: "8px 0" },
  gramLabel: { fontSize: 13, color: "#c9c6c0" },
  gramInput: { width: 90, background: "#111113", border: "1px solid #3a3a3e", borderRadius: 10, color: "#f2f0ec", fontSize: 18, padding: "8px 10px", textAlign: "center" },
  gramUnit: { fontSize: 14, color: "#8a8781" },
  quickGrams: { display: "flex", gap: 6, margin: "10px 0" },
  quickBtn: { flex: 1, padding: "8px 0", background: "#2a2a2e", border: "none", borderRadius: 8, color: "#c9c6c0", fontSize: 13, cursor: "pointer" },
  quickActive: { background: red, color: "#fff" },
  previa: { fontSize: 13, color: "#c9c6c0", padding: "10px 0", borderTop: "1px solid #2a2a2e" },
  gramActions: { display: "flex", gap: 10, marginTop: 6 },
  discardBtn: { flex: 1, padding: "12px 0", background: "transparent", border: "1px solid #3a3a3e", color: "#c9c6c0", borderRadius: 12, fontSize: 14, cursor: "pointer" },
  confirmBtn: { flex: 2, padding: "12px 0", background: red, border: "none", color: "#fff", borderRadius: 12, fontFamily: "'Oswald',sans-serif", letterSpacing: 2, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  logSection: { marginTop: 6 },
  logTitle: { fontFamily: "'Oswald',sans-serif", fontSize: 13, letterSpacing: 3, color: "#8a8781", margin: "0 0 10px" },
  emptyText: { fontSize: 13, color: "#6a675f", padding: "6px 4px" },
  errorText: { fontSize: 13, color: "#ff8a75", padding: "6px 4px" },
  mealCard: { display: "flex", gap: 12, alignItems: "center", background: "#1a1a1e", borderRadius: 14, padding: 12, marginBottom: 10 },
  mealTop: { display: "flex", justifyContent: "space-between", marginBottom: 3 },
  mealTime: { fontSize: 12, color: "#8a8781" },
  mealStats: { fontSize: 13 },
  mealItems: { fontSize: 13, color: "#c9c6c0", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "capitalize" },
  removeBtn: { background: "transparent", border: "1px solid #3a3a3e", color: "#8a8781", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 12, flexShrink: 0 },
  footer: { textAlign: "center", fontSize: 11, color: "#4a4842", marginTop: 30 },
  logoutBtn: { marginTop: 10, background: "transparent", border: "none", color: "#6a675f", fontSize: 11, textDecoration: "underline", cursor: "pointer" },
};
