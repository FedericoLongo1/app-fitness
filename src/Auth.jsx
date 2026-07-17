import React, { useState } from "react";
import { supabase } from "./supabase.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | esperando_codigo | verificando | error

  async function enviarCodigo(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEstado("enviando");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setEstado(error ? "error" : "esperando_codigo");
  }

  async function verificarCodigo(e) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setEstado("verificando");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "email",
    });
    if (error) setEstado("error");
    // si es correcto, App.jsx detecta la sesión solo via onAuthStateChange
  }

  return (
    <div style={S.wrap}>
      <div style={S.logoBlock}>
        <span style={S.logoTop}>REGISTRO DE</span>
        <span style={S.logoMain}>MACROS</span>
      </div>
      {estado === "esperando_codigo" || estado === "verificando" ? (
        <form onSubmit={verificarCodigo} style={S.form}>
          <p style={S.hint}>Te mandamos un código a <b>{email}</b>. Ingresalo acá.</p>
          <input
            style={S.input}
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoFocus
            required
          />
          <button style={S.btn} disabled={estado === "verificando"}>
            {estado === "verificando" ? "Verificando…" : "Ingresar"}
          </button>
          {estado === "error" && <p style={S.error}>Código incorrecto o vencido. Probá de nuevo.</p>}
        </form>
      ) : (
        <form onSubmit={enviarCodigo} style={S.form}>
          <p style={S.hint}>Ingresá tu email para recibir un código de acceso.</p>
          <input
            style={S.input}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <button style={S.btn} disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Enviar código"}
          </button>
          {estado === "error" && <p style={S.error}>Error al enviar el código. Probá de nuevo.</p>}
        </form>
      )}
    </div>
  );
}

const red = "#e8381a";
const S = {
  wrap: { minHeight: "100vh", background: "#111113", color: "#f2f0ec", fontFamily: "'Inter',-apple-system,'Segoe UI',sans-serif", maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top,0px) + 60px) 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  logoBlock: { display: "flex", flexDirection: "column", lineHeight: 1, marginBottom: 40 },
  logoTop: { fontFamily: "'Oswald',sans-serif", fontSize: 12, letterSpacing: 4, color: "#8a8781" },
  logoMain: { fontFamily: "'Oswald',sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: 2, color: "#f2f0ec", textTransform: "uppercase" },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 12 },
  hint: { fontSize: 13, color: "#8a8781", margin: "0 0 4px" },
  input: { width: "100%", background: "#1a1a1e", border: "1px solid #2a2a2e", borderRadius: 12, color: "#f2f0ec", fontSize: 15, padding: "14px 16px", textAlign: "center" },
  btn: { width: "100%", padding: "14px 0", background: red, border: "none", color: "#fff", borderRadius: 12, fontFamily: "'Oswald',sans-serif", letterSpacing: 2, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  msg: { fontSize: 14, color: "#c9c6c0", lineHeight: 1.6 },
  error: { fontSize: 13, color: "#ff8a75" },
};
