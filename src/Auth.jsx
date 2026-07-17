import React, { useState } from "react";
import { supabase } from "./supabase.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | entrando | error

  async function entrar(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setEstado("entrando");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
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
      <form onSubmit={entrar} style={S.form}>
        <p style={S.hint}>Ingresá tu email y contraseña.</p>
        <input
          style={S.input}
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
        <input
          style={S.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={S.btn} disabled={estado === "entrando"}>
          {estado === "entrando" ? "Entrando…" : "Entrar"}
        </button>
        {estado === "error" && <p style={S.error}>Email o contraseña incorrectos.</p>}
      </form>
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
