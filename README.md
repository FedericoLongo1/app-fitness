# Macros — app personal de comidas y entrenos

PWA personal: registro de comidas y macros con base de datos nutricional (Open Food Facts).
Stack 100% gratuito, sin API keys, sin límites de uso.

## Cómo se carga una comida

- **⚡ Frecuentes**: lista instantánea de alimentos básicos (funciona sin internet).
- **▮▮▮ Escanear**: escaneá el código de barras de un producto envasado → trae los macros exactos.
- **🔍 Buscar**: buscá por nombre en la base online de Open Food Facts.

En los tres casos elegís el alimento e ingresás los gramos; los macros se calculan solos.

## Deploy (una sola vez)

1. **GitHub**: subí esta carpeta a un repo (privado).
2. **Netlify**: "Add new site" → "Import an existing project" → elegí el repo.
   Build lo detecta solo por el netlify.toml (command `npm run build`, publish `dist`).
3. Deploy. Ya NO hace falta ninguna variable de entorno ni API key.
   (Si quedó `GEMINI_API_KEY` de la versión anterior, podés borrarla.)

## Instalar en el iPhone

1. Abrí la URL `.netlify.app` en Safari.
2. Botón compartir → "Agregar a inicio".
3. La primera vez que uses "Escanear", Safari va a pedir permiso de cámara: aceptá.

## Notas

- Los datos se guardan en el teléfono (localStorage), separados por día.
- Los "Frecuentes" son valores estándar por 100g; editá los gramos al cargar.
- Fuente de datos online: Open Food Facts (gratis, colaborativa, sin registro).

## Próximas etapas

- Etapa 2: Supabase (historial completo, sync con la PC)
- Etapa 3: entrenamientos (pesas + running)
- Etapa 4: coach semanal (análisis de progreso y ajustes)
