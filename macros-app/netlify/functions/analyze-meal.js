// Netlify Function: análisis de comida con Gemini (free tier)
// La API key vive en la variable de entorno GEMINI_API_KEY

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const VISION_PROMPT = `Sos un nutricionista experto en estimación visual de porciones.
Analizá la foto de esta comida y estimá los alimentos presentes, su porción en gramos y sus macronutrientes.

Respondé ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "alimentos": [
    {"nombre": "string en español", "porcion_g": number, "proteina": number, "carbs": number, "grasas": number, "kcal": number}
  ],
  "confianza": number entre 0 y 1,
  "comentario": "una observación breve sobre la estimación o sugerencia proteica"
}

Reglas:
- Los macros deben corresponder a la porción estimada (no a 100g).
- Si un alimento es ambiguo, elegí la interpretación más común en Argentina.
- Si la imagen no contiene comida, devolvé {"alimentos": [], "confianza": 0, "comentario": "No se detectó comida en la imagen"}.`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar GEMINI_API_KEY en Netlify" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Body inválido" }) };
  }

  const { image, mediaType } = payload;
  if (!image) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta la imagen" }) };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mediaType || "image/jpeg", data: image } },
              { text: VISION_PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `Error HTTP ${response.status}`;
      return { statusCode: 502, body: JSON.stringify({ error: `Gemini: ${msg}` }) };
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.filter((p) => !p.thought)
        .map((p) => p.text || "")
        .join("") || "";

    if (!text) {
      return { statusCode: 502, body: JSON.stringify({ error: "Gemini respondió vacío" }) };
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) {
        return { statusCode: 502, body: JSON.stringify({ error: `Respuesta sin JSON: ${text.slice(0, 120)}` }) };
      }
      result = JSON.parse(text.slice(start, end + 1));
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Error interno" }) };
  }
};
