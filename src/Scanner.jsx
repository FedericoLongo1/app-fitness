import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

// Formatos de código de barras de productos (EAN/UPC)
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]);

export default function Scanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints);
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (cancelled) return;
        if (!controlsRef.current && controls) controlsRef.current = controls;
        if (result) {
          controls?.stop();
          onDetected(result.getText());
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            "No se pudo acceder a la cámara. Revisá los permisos en Safari (Ajustes → Safari → Cámara)."
          );
          console.error(e);
        }
      });

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {}
    };
  }, [onDetected]);

  return (
    <div style={s.overlay}>
      <div style={s.frame}>
        <video ref={videoRef} style={s.video} muted playsInline />
        <div style={s.reticle} />
      </div>
      {error ? (
        <p style={s.error}>{error}</p>
      ) : (
        <p style={s.hint}>Apuntá al código de barras del producto</p>
      )}
      <button style={s.close} onClick={onClose}>
        Cancelar
      </button>
    </div>
  );
}

const red = "#e8381a";
const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#000",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  frame: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    aspectRatio: "4/3",
    borderRadius: 16,
    overflow: "hidden",
    background: "#111",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  reticle: {
    position: "absolute",
    top: "50%",
    left: "8%",
    right: "8%",
    height: 2,
    background: red,
    boxShadow: `0 0 12px ${red}`,
    transform: "translateY(-50%)",
  },
  hint: { color: "#c9c6c0", fontSize: 14, marginTop: 20, textAlign: "center" },
  error: { color: "#ff8a75", fontSize: 14, marginTop: 20, textAlign: "center", maxWidth: 400 },
  close: {
    marginTop: 24,
    padding: "12px 28px",
    background: "transparent",
    border: "1px solid #3a3a3e",
    color: "#f2f0ec",
    borderRadius: 12,
    fontSize: 15,
    cursor: "pointer",
  },
};
