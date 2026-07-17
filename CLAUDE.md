# Macros — app personal de comidas y entrenamientos

## Qué es (WHY / WHAT)
App **personal** (uso de una sola persona, NO para publicar) para registrar comidas
y entrenamientos, con foco en **alta proteína y macros**. Evalúa el progreso contra
objetivos y sugiere ajustes de dieta/rutina y hábitos.

Es una **PWA instalable en iPhone** (Safari → "Agregar a inicio"). Prioridad absoluta:
**costo $0 y sin dependencias de pago**. No usar servicios que requieran tarjeta ni
que tengan cuotas que se agoten.

## Tech stack
- **Vite + React 18** (JavaScript, no TypeScript)
- Estilos: objetos JS inline (sin Tailwind ni CSS externo). Ver "Design system".
- Persistencia actual: **localStorage** (a migrar a Supabase en Etapa 2)
- Datos nutricionales: **Open Food Facts** (API pública, sin key, sin límite, CORS OK)
- Escaneo de código de barras: **@zxing/browser** + **@zxing/library** (client-side)
- Deploy: **Netlify** (build estático; ya NO hay Netlify Functions ni API keys)

## Comandos
- `npm install` — instalar dependencias
- `npm run dev` — server de desarrollo (Vite)
- `npm run build` — build de producción a `dist/`
- `npm run preview` — previsualizar el build

## Design system (respetar en todo lo nuevo)
- Fondo: `#111113` · Tarjetas: `#1a1a1e` · Bordes: `#2a2a2e`
- Acento (rojo de marca): `#e8381a` — barras de proteína, botones primarios, énfasis
- Texto: `#f2f0ec` (claro), `#8a8781` (secundario), `#6a675f` (tenue)
- Tipografías: **Oswald** (títulos, números, labels en mayúscula con letter-spacing)
  e **Inter** (texto). Ya cargadas en index.html.
- Ancho máx. de contenido: 480px, centrado. Respetar `env(safe-area-inset-top)` (notch).
- Estética: oscura, deportiva, tipo streetwear. Números grandes en Oswald.

## Arquitectura y mapa de archivos
- `index.html` — metadata PWA (apple-touch-icon, manifest, fuentes)
- `public/manifest.webmanifest` + `public/icon-*.png` — PWA
- `src/main.jsx` — entrypoint React
- `src/App.jsx` — componente principal: resumen diario, carga de comidas, log del día
- `src/food.js` — tabla FRECUENTES (macros/100g) + cliente Open Food Facts
  (`buscarPorCodigo`, `buscarPorTexto`)
- `src/Scanner.jsx` — escáner de código de barras con cámara (zxing)

## Modelo de datos (actual, en localStorage)
- `targets` → `{ proteina, kcal }` (objetivos)
- `meals:YYYY-MM-DD` → array de comidas del día:
  `{ id, nombre, gramos, hora, proteina, carbs, grasas, kcal }`
- Los alimentos se guardan con macros **por 100g** y se escalan por gramos al cargar
  (función `escalar(base100, gramos)` en App.jsx).

## Estado actual — Etapa 1 COMPLETA
Registro de comidas por tres vías, todas sin IA y sin límite:
1. **Frecuentes** — lista local de ~20 alimentos base (instantánea, offline)
2. **Escanear** — código de barras → Open Food Facts → macros de la etiqueta
3. **Buscar** — texto → Open Food Facts
Más: resumen diario (barra de proteína + calorías), objetivos editables,
comidas del día con eliminar, persistencia por día.

---

## Roadmap — próximas etapas

### Etapa 2 — Persistencia con Supabase
Reemplazar localStorage por Supabase (free tier, sin tarjeta) para tener historial
completo y poder ver los datos desde la PC además del iPhone.
- Auth simple (un solo usuario). Puede ser Supabase Auth con magic link, o una
  clave única en variable de entorno — mantener MUY simple, es de uso personal.
- Tablas sugeridas: `targets`, `meals` (con fecha), `body_metrics` (peso, etc.).
- Migrar lectura/escritura de comidas y objetivos a Supabase, manteniendo localStorage
  como cache/fallback offline si es viable.
- Mantener el free tier: comprimir/limitar datos, no guardar imágenes.

### Etapa 3 — Entrenamientos (pesas + running)
Nueva sección con navegación entre "Comidas" y "Entrenos".
- **Pesas:** registro de sesión → ejercicio, series, reps, peso (kg), RPE.
  Plantillas de rutina reutilizables. Calcular **volumen semanal por grupo muscular**
  y **1RM estimado** con fórmula de Epley: `1RM = peso * (1 + reps/30)`.
- **Running:** carga manual → distancia (km), tiempo, ritmo (calculado), fecha.
  (Integración con HealthKit/Strava queda fuera de alcance por ahora; es de pago/compleja.)
- Persistir en Supabase (tablas `workouts`, `sets`, `runs`).

### Etapa 4 — Motor de progreso y coach (SIN IA, basado en reglas)
Importante: el usuario decidió NO depender de IA externa (lenta y con cuota).
El coach debe ser **determinístico, lógica en código**, $0 y offline.
- Resumen semanal calculado desde los datos: proteína promedio/día vs objetivo,
  adherencia calórica, tendencia de peso (media móvil 7 días), progresión de cargas
  (volumen semanal), km corridos.
- Recomendaciones por reglas, por ejemplo:
  - proteína promedio < objetivo por 3+ días → sugerir fuentes proteicas concretas
  - peso estancado vs objetivo (subir/bajar) → sugerir ajuste calórico ±10%
  - mismo peso en un ejercicio por 3 semanas → sugerir progresión o deload
  - volumen de running subiendo >10%/semana → advertir riesgo
- Reglas de seguridad: nunca sugerir déficit calórico agresivo ni saltear comidas;
  incrementos de carga/volumen graduales.
- Pantalla "Analizar mi semana" con las conclusiones y sugerencias.

---

## Convenciones y restricciones (IMPORTANTE)
- **$0 siempre.** No introducir servicios de pago ni que requieran tarjeta.
  No reintroducir APIs de IA (se probaron Gemini y se descartaron por lentas y con cuota).
- App **personal**, no multiusuario, no para App Store. Nada de flujos de registro complejos.
- Mantener el design system y la estética actual.
- JavaScript plano (no migrar a TypeScript salvo pedido explícito).
- Todo lo que se pueda resolver client-side, mejor (menos infraestructura = menos costo/fallas).
- iOS/PWA: la cámara (escáner) solo funciona en HTTPS y desde la app instalada; tenerlo
  en cuenta al tocar esa parte.
