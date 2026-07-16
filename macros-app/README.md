# Macros — app personal de comidas y entrenos

PWA personal: foto de comida → macros con IA (Gemini free tier). Stack 100% gratuito.

## Deploy (una sola vez)

1. **Subir a GitHub**: creá un repo (privado) y subí esta carpeta.
2. **Netlify**: "Add new site" → "Import an existing project" → elegí el repo.
   - Build command: `npm run build` (lo detecta solo por el netlify.toml)
   - Publish directory: `dist`
3. **API key**: en Netlify → Site configuration → Environment variables → agregar:
   - Key: `GEMINI_API_KEY`
   - Value: tu API key de aistudio.google.com (la NUEVA, no la que quedó expuesta)
4. Deploy. Netlify te da una URL tipo `https://tu-app.netlify.app`.

## Instalar en el iPhone

1. Abrí la URL en Safari.
2. Botón compartir → "Agregar a inicio".
3. Se instala como app con ícono propio.

## Configuración opcional

- `GEMINI_MODEL` (variable de entorno): por defecto usa `gemini-2.5-flash`.
  Si querés más cuota diaria gratuita, probá `gemini-2.5-flash-lite`.

## Estado actual (Etapa 1)

- ✅ Foto → macros con IA, porciones editables
- ✅ Contador diario de proteína/kcal con objetivos configurables
- ✅ Datos guardados en el teléfono (localStorage) — se resetean por día
- ⏭ Etapa 2: Supabase (historial completo, sync con PC)
- ⏭ Etapa 3: pesas + running
- ⏭ Etapa 4: coach semanal
