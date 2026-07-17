import React from "react";
import { oswald, card, border, textDim, text } from "./theme.js";

export default function Panel({ titulo, onClose, children }) {
  return (
    <section style={S.panel}>
      <div style={S.panelHead}>
        <span style={S.panelTitle}>{titulo}</span>
        <button style={S.panelClose} onClick={onClose}>✕</button>
      </div>
      <div style={S.panelBody}>{children}</div>
    </section>
  );
}

const S = {
  panel: { background: card, borderRadius: 16, padding: 14, marginBottom: 18 },
  panelHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  panelTitle: { fontFamily: oswald, fontSize: 15, letterSpacing: 2, textTransform: "uppercase", color: text },
  panelClose: { background: "transparent", border: `1px solid #3a3a3e`, color: textDim, borderRadius: 8, width: 30, height: 30, cursor: "pointer" },
  panelBody: { maxHeight: 340, overflowY: "auto" },
};
