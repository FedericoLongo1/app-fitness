import React, { useState, useRef, useEffect } from "react";

// ─── Persistencia local (hasta Etapa 2 con Supabase) ─────────────
const todayKey = () => `meals:${new Date().toISOString().slice(0, 10)}`;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Helpers de imagen ────────────────────────────────────────────
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

async function prepareImage(file, maxDim = 1024) {
  const dataUrl = await readAsDataURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode-failed"));
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const jpeg = canvas.toDataURL("image/jpeg", 0.85);
    return { base64: jpeg.split(",")[1], mediaType: "image/jpeg", preview: jpeg };
  } catch {
    const supported = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!supported.includes(file.type)) {
      throw new Error(
        `Formato no soportado (${file.type || "desconocido"}). Si es HEIC de iPhone: Ajustes → Cámara → Formatos → "Más compatible".`
      );
    }
    if (file.size > 4.5 * 1024 * 1024) {
      throw new Error("La imagen pesa demasiado. Probá con una foto más liviana.");
    }
    return { base64: dataUrl.split(",")[1], mediaType: file.type, preview: dataUrl };
  }
}

async function analyzePhoto(base64, mediaType) {
  let lastError;
  for (let intento = 1; intento <= 2; intento++) {
    try {
      const response = await fetch("/.netlify/functions/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || `Error HTTP ${response.status}`);
      }
      return data;
    } catch (err) {
      lastError = err;
      if (intento < 2) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastError;
}

const round1 = (n) => Math.round(n * 10) / 10;

// ─── Componente principal ─────────────────────────────────────────
export default function App() {
  const [targets, setTargets] = useState(() => loadJSON("targets", { proteina: 160, kcal: 2600 }));
  const [meals, setMeals] = useState(() => loadJSON(todayKey(), []));
  const [pending, setPending] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("targets", JSON.stringify(targets));
  }, [targets]);

  useEffect(() => {
    localStorage.setItem(todayKey(), JSON.stringify(meals));
  }, [meals]);

  const totals = meals.reduce(
    (acc, m) => {
      m.items.forEach((it) => {
        acc.proteina += it.proteina;
        acc.carbs += it.carbs;
        acc.grasas += it.grasas;
        acc.kcal += it.kcal;
      });
      return acc;
    },
    { proteina: 0, carbs: 0, grasas: 0, kcal: 0 }
  );

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const { base64, mediaType, preview: prev } = await prepareImage(file);
      setPreview(prev);
      const result = await analyzePhoto(base64, mediaType);
      if (!result.alimentos || result.alimentos.length === 0) {
        setStatus("error");
        setErrorMsg(result.comentario || "No se detectó comida en la imagen. Probá con otra foto.");
        setPreview(null);
        return;
      }
      const items = result.alimentos.map((a, i) => ({
        id: i,
        nombre: a.nombre,
        porcion_g: a.porcion_g,
        base_g: a.porcion_g,
        base: { proteina: a.proteina, carbs: a.carbs, grasas: a.grasas, kcal: a.kcal },
        proteina: a.proteina,
        carbs: a.carbs,
        grasas: a.grasas,
        kcal: a.kcal,
      }));
      setPending({ items, confianza: result.confianza, comentario: result.comentario });
      setStatus("review");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message || "Falló el análisis. Volvé a intentar.");
      setPreview(null);
    }
  }

  function updatePortion(id, newG) {
    setPending((p) => ({
      ...p,
      items: p.items.map((it) => {
        if (it.id !== id) return it;
        const g = Math.max(0, Number(newG) || 0);
        const f = it.base_g > 0 ? g / it.base_g : 0;
        return {
          ...it,
          porcion_g: g,
          proteina: round1(it.base.proteina * f),
          carbs: round1(it.base.carbs * f),
          grasas: round1(it.base.grasas * f),
          kcal: Math.round(it.base.kcal * f),
        };
      }),
    }));
  }

  function removeItem(id) {
    setPending((p) => ({ ...p, items: p.items.filter((it) => it.id !== id) }));
  }

  function confirmMeal() {
    if (!pending || pending.items.length === 0) return;
    setMeals((m) => [
      ...m,
      {
        id: Date.now(),
        hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        preview,
        items: pending.items,
      },
    ]);
    setPending(null);
    setPreview(null);
    setStatus("idle");
  }

  function discardMeal() {
    setPending(null);
    setPreview(null);
    setStatus("idle");
  }

  function deleteMeal(id) {
    setMeals((m) => m.filter((x) => x.id !== id));
  }

  const protPct = Math.min(100, (totals.proteina / targets.proteina) * 100);
  const kcalPct = Math.min(100, (totals.kcal / targets.kcal) * 100);
  const pendingTotals = pending
    ? pending.items.reduce(
        (a, it) => ({
          proteina: round1(a.proteina + it.proteina),
          kcal: Math.round(a.kcal + it.kcal),
        }),
        { proteina: 0, kcal: 0 }
      )
    : null;

  const S = styles;

  return (
    <div style={S.app}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
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

      <section style={S.proteinCard}>
        <div style={S.proteinRow}>
          <span style={S.proteinLabel}>PROTEÍNA HOY</span>
          <span style={S.proteinNum}>
            {round1(totals.proteina)}
            <span style={S.proteinTarget}> / {targets.proteina}g</span>
          </span>
        </div>
        <div style={S.barTrack}>
          <div style={{ ...S.barFillProt, width: `${protPct}%` }} />
        </div>
        <div style={{ ...S.proteinRow, marginTop: 14 }}>
          <span style={S.kcalLabel}>CALORÍAS</span>
          <span style={S.kcalNum}>
            {Math.round(totals.kcal)} <span style={S.proteinTarget}>/ {targets.kcal}</span>
          </span>
        </div>
        <div style={S.barTrack}>
          <div style={{ ...S.barFillKcal, width: `${kcalPct}%` }} />
        </div>
        <div style={S.macroChips}>
          <span style={S.chip}>C {round1(totals.carbs)}g</span>
          <span style={S.chip}>G {round1(totals.grasas)}g</span>
          <span style={S.chipEdit}>
            Objetivo:{" "}
            <input
              style={S.inlineInput}
              type="number"
              value={targets.proteina}
              onChange={(e) => setTargets((t) => ({ ...t, proteina: Number(e.target.value) || 0 }))}
              aria-label="Objetivo de proteína en gramos"
            />
            g prot ·{" "}
            <input
              style={{ ...S.inlineInput, width: 52 }}
              type="number"
              value={targets.kcal}
              onChange={(e) => setTargets((t) => ({ ...t, kcal: Number(e.target.value) || 0 }))}
              aria-label="Objetivo de calorías"
            />
            kcal
          </span>
        </div>
      </section>

      {status !== "review" && (
        <section style={S.captureZone}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
          <button
            style={{ ...S.captureBtn, ...(status === "analyzing" ? S.captureBtnBusy : {}) }}
            onClick={() => status !== "analyzing" && fileRef.current?.click()}
            disabled={status === "analyzing"}
          >
            {status === "analyzing" ? (
              <span style={{ animation: "pulse 1.2s infinite" }}>ANALIZANDO FOTO…</span>
            ) : (
              "📷  FOTOGRAFIAR COMIDA"
            )}
          </button>
          {status === "error" && <p style={S.errorText}>{errorMsg}</p>}
        </section>
      )}

      {status === "review" && pending && (
        <section style={S.reviewCard}>
          <div style={S.reviewHead}>
            {preview && <img src={preview} alt="Foto de la comida" style={S.thumb} />}
            <div>
              <p style={S.reviewTitle}>Revisá y ajustá las porciones</p>
              <p style={S.confText}>
                Confianza IA: {Math.round((pending.confianza || 0) * 100)}%
                {pending.comentario ? ` — ${pending.comentario}` : ""}
              </p>
            </div>
          </div>

          {pending.items.map((it) => (
            <div key={it.id} style={S.itemRow}>
              <div style={S.itemInfo}>
                <span style={S.itemName}>{it.nombre}</span>
                <span style={S.itemMacros}>
                  P <b style={S.protHint}>{it.proteina}g</b> · C {it.carbs}g · G {it.grasas}g · {it.kcal} kcal
                </span>
              </div>
              <div style={S.itemControls}>
                <input
                  style={S.gramInput}
                  type="number"
                  value={it.porcion_g}
                  onChange={(e) => updatePortion(it.id, e.target.value)}
                  aria-label={`Porción en gramos de ${it.nombre}`}
                />
                <span style={S.gramUnit}>g</span>
                <button style={S.removeBtn} onClick={() => removeItem(it.id)} aria-label={`Quitar ${it.nombre}`}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div style={S.reviewTotals}>
            Total: <b style={S.protHint}>{pendingTotals.proteina}g proteína</b> · {pendingTotals.kcal} kcal
          </div>

          <div style={S.reviewActions}>
            <button style={S.discardBtn} onClick={discardMeal}>Descartar</button>
            <button style={S.confirmBtn} onClick={confirmMeal}>Agregar al día</button>
          </div>
        </section>
      )}

      <section style={S.logSection}>
        <h2 style={S.logTitle}>COMIDAS DE HOY</h2>
        {meals.length === 0 ? (
          <p style={S.emptyText}>Todavía no registraste comidas. Sacá una foto para empezar.</p>
        ) : (
          meals.map((m) => {
            const p = round1(m.items.reduce((a, i) => a + i.proteina, 0));
            const k = Math.round(m.items.reduce((a, i) => a + i.kcal, 0));
            return (
              <div key={m.id} style={S.mealCard}>
                {m.preview && <img src={m.preview} alt="" style={S.mealThumb} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.mealTop}>
                    <span style={S.mealTime}>{m.hora}</span>
                    <span style={S.mealStats}>
                      <b style={S.protHint}>{p}g P</b> · {k} kcal
                    </span>
                  </div>
                  <p style={S.mealItems}>{m.items.map((i) => i.nombre).join(", ")}</p>
                </div>
                <button style={S.removeBtn} onClick={() => deleteMeal(m.id)} aria-label="Eliminar comida">
                  ✕
                </button>
              </div>
            );
          })
        )}
      </section>

      <footer style={S.footer}>Macros · uso personal</footer>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────
const red = "#e8381a";
const styles = {
  app: {
    minHeight: "100vh",
    background: "#111113",
    color: "#f2f0ec",
    fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 40px",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoBlock: { display: "flex", flexDirection: "column", lineHeight: 1 },
  logoTop: { fontFamily: "'Oswald','Arial Narrow',sans-serif", fontSize: 11, letterSpacing: 4, color: "#8a8781" },
  logoMain: {
    fontFamily: "'Oswald','Arial Narrow',sans-serif",
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#f2f0ec",
    textTransform: "uppercase",
  },
  datePill: {
    fontSize: 12,
    color: "#8a8781",
    border: "1px solid #2a2a2e",
    borderRadius: 999,
    padding: "5px 12px",
    textTransform: "capitalize",
  },
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
  inlineInput: {
    width: 40,
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #3a3a3e",
    color: "#f2f0ec",
    fontSize: 12,
    textAlign: "center",
  },
  captureZone: { marginBottom: 18 },
  captureBtn: {
    width: "100%",
    padding: "18px 0",
    fontFamily: "'Oswald',sans-serif",
    fontSize: 16,
    letterSpacing: 3,
    fontWeight: 600,
    color: "#fff",
    background: red,
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
  },
  captureBtnBusy: { background: "#7a2013", cursor: "wait" },
  errorText: { color: "#ff8a75", fontSize: 13, marginTop: 10 },
  reviewCard: { background: "#1a1a1e", border: `1px solid ${red}44`, borderRadius: 16, padding: 16, marginBottom: 18 },
  reviewHead: { display: "flex", gap: 12, marginBottom: 14, alignItems: "center" },
  thumb: { width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  reviewTitle: { fontWeight: 600, fontSize: 14, margin: 0 },
  confText: { fontSize: 12, color: "#8a8781", margin: "4px 0 0" },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid #2a2a2e",
  },
  itemInfo: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: 600, textTransform: "capitalize" },
  itemMacros: { fontSize: 12, color: "#9a978f" },
  protHint: { color: red, fontStyle: "normal" },
  itemControls: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  gramInput: {
    width: 56,
    background: "#111113",
    border: "1px solid #3a3a3e",
    borderRadius: 8,
    color: "#f2f0ec",
    fontSize: 14,
    padding: "6px 4px",
    textAlign: "center",
  },
  gramUnit: { fontSize: 12, color: "#8a8781" },
  removeBtn: {
    background: "transparent",
    border: "1px solid #3a3a3e",
    color: "#8a8781",
    borderRadius: 8,
    width: 28,
    height: 28,
    cursor: "pointer",
    fontSize: 12,
    flexShrink: 0,
    alignSelf: "center",
  },
  reviewTotals: { fontSize: 13, color: "#c9c6c0", padding: "12px 0 4px", borderTop: "1px solid #2a2a2e" },
  reviewActions: { display: "flex", gap: 10, marginTop: 12 },
  discardBtn: {
    flex: 1,
    padding: "12px 0",
    background: "transparent",
    border: "1px solid #3a3a3e",
    color: "#c9c6c0",
    borderRadius: 12,
    fontSize: 14,
    cursor: "pointer",
  },
  confirmBtn: {
    flex: 2,
    padding: "12px 0",
    background: red,
    border: "none",
    color: "#fff",
    borderRadius: 12,
    fontFamily: "'Oswald',sans-serif",
    letterSpacing: 2,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  logSection: { marginTop: 6 },
  logTitle: { fontFamily: "'Oswald',sans-serif", fontSize: 13, letterSpacing: 3, color: "#8a8781", margin: "0 0 10px" },
  emptyText: { fontSize: 13, color: "#6a675f" },
  mealCard: { display: "flex", gap: 12, background: "#1a1a1e", borderRadius: 14, padding: 12, marginBottom: 10 },
  mealThumb: { width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  mealTop: { display: "flex", justifyContent: "space-between", marginBottom: 3 },
  mealTime: { fontSize: 12, color: "#8a8781" },
  mealStats: { fontSize: 13 },
  mealItems: {
    fontSize: 13,
    color: "#c9c6c0",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textTransform: "capitalize",
  },
  footer: { textAlign: "center", fontSize: 11, color: "#4a4842", marginTop: 30 },
};
