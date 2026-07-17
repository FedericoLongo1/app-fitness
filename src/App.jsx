import React, { useState, useEffect } from "react";
import Auth from "./Auth.jsx";
import Comidas from "./Comidas.jsx";
import Entrenos from "./Entrenos.jsx";
import NavBar from "./NavBar.jsx";
import { supabase } from "./supabase.js";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando | null = sin sesión
  const [tab, setTab] = useState("comidas"); // "comidas" | "entrenos"

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
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

      {tab === "comidas" ? <Comidas userId={userId} /> : <Entrenos userId={userId} />}

      <footer style={S.footer}>
        Macros · uso personal · datos de Open Food Facts
        <br />
        <button style={S.logoutBtn} onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </footer>

      <NavBar tab={tab} onChange={setTab} />
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#111113", color: "#f2f0ec", fontFamily: "'Inter',-apple-system,'Segoe UI',sans-serif", maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top,0px) + 20px) 16px calc(env(safe-area-inset-bottom,0px) + 90px)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoBlock: { display: "flex", flexDirection: "column", lineHeight: 1 },
  logoTop: { fontFamily: "'Oswald',sans-serif", fontSize: 11, letterSpacing: 4, color: "#8a8781" },
  logoMain: { fontFamily: "'Oswald',sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: 2, color: "#f2f0ec", textTransform: "uppercase" },
  datePill: { fontSize: 12, color: "#8a8781", border: "1px solid #2a2a2e", borderRadius: 999, padding: "5px 12px", textTransform: "capitalize" },
  footer: { textAlign: "center", fontSize: 11, color: "#4a4842", marginTop: 30 },
  logoutBtn: { marginTop: 10, background: "transparent", border: "none", color: "#6a675f", fontSize: 11, textDecoration: "underline", cursor: "pointer" },
};
