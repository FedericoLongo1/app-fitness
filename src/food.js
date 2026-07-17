// ─── Alimentos frecuentes (macros por 100g) ───────────────────────
// Valores estándar aproximados. Editables al cargar la porción.
export const FRECUENTES = [
  { nombre: "Pechuga de pollo (cruda)", proteina: 22.5, carbs: 0, grasas: 2.6, kcal: 120 },
  { nombre: "Carne vacuna magra (cruda)", proteina: 21.5, carbs: 0, grasas: 6, kcal: 145 },
  { nombre: "Huevo entero", proteina: 13, carbs: 1.1, grasas: 11, kcal: 155 },
  { nombre: "Clara de huevo", proteina: 11, carbs: 0.7, grasas: 0.2, kcal: 52 },
  { nombre: "Atún al natural (lata)", proteina: 26, carbs: 0, grasas: 1, kcal: 116 },
  { nombre: "Merluza / pescado blanco", proteina: 20, carbs: 0, grasas: 2, kcal: 100 },
  { nombre: "Yogur natural", proteina: 3.5, carbs: 4.7, grasas: 3.3, kcal: 61 },
  { nombre: "Leche entera", proteina: 3.2, carbs: 4.8, grasas: 3.6, kcal: 61 },
  { nombre: "Queso port salut", proteina: 24, carbs: 1.5, grasas: 26, kcal: 340 },
  { nombre: "Proteína whey (polvo)", proteina: 80, carbs: 8, grasas: 6, kcal: 400 },
  { nombre: "Arroz blanco (cocido)", proteina: 2.7, carbs: 28, grasas: 0.3, kcal: 130 },
  { nombre: "Fideos (cocidos)", proteina: 5, carbs: 25, grasas: 1.1, kcal: 131 },
  { nombre: "Lentejas (cocidas)", proteina: 9, carbs: 20, grasas: 0.4, kcal: 116 },
  { nombre: "Avena", proteina: 13, carbs: 67, grasas: 7, kcal: 379 },
  { nombre: "Pan", proteina: 9, carbs: 49, grasas: 3.2, kcal: 265 },
  { nombre: "Papa (cocida)", proteina: 2, carbs: 20, grasas: 0.1, kcal: 87 },
  { nombre: "Batata (cocida)", proteina: 1.6, carbs: 20, grasas: 0.1, kcal: 86 },
  { nombre: "Banana", proteina: 1.1, carbs: 23, grasas: 0.3, kcal: 89 },
  { nombre: "Manzana", proteina: 0.3, carbs: 14, grasas: 0.2, kcal: 52 },
  { nombre: "Palta", proteina: 2, carbs: 9, grasas: 15, kcal: 160 },

  // Cortes de carne argentinos (crudos, valores por 100g según FatSecret ES)
  { nombre: "Asado (costilla, crudo)", proteina: 24, carbs: 0, grasas: 20, kcal: 270 },
  { nombre: "Vacío (crudo)", proteina: 21.5, carbs: 0, grasas: 5.7, kcal: 144 },
  { nombre: "Matambre (crudo)", proteina: 18.7, carbs: 0, grasas: 15, kcal: 215 },
  { nombre: "Bife de chorizo (crudo)", proteina: 20.5, carbs: 0, grasas: 6, kcal: 142 },
  { nombre: "Bife de lomo (crudo)", proteina: 22, carbs: 0, grasas: 8, kcal: 166 },
  { nombre: "Nalga (cruda)", proteina: 22.2, carbs: 0, grasas: 3.8, kcal: 129 },
  { nombre: "Peceto (crudo)", proteina: 22.3, carbs: 0, grasas: 2.6, kcal: 119 },
  { nombre: "Cuadril (crudo)", proteina: 21.7, carbs: 0, grasas: 7, kcal: 152 },
  { nombre: "Colita de cuadril (cruda)", proteina: 21, carbs: 0, grasas: 9, kcal: 165 },
  { nombre: "Entraña (cruda)", proteina: 22.6, carbs: 0, grasas: 8.8, kcal: 176 },
  { nombre: "Bola de lomo (cruda)", proteina: 21.7, carbs: 0, grasas: 4, kcal: 129 },
  { nombre: "Osobuco (crudo)", proteina: 20, carbs: 0, grasas: 3, kcal: 110 },
  { nombre: "Carne picada / molida (cruda, 90/10)", proteina: 20, carbs: 0, grasas: 10, kcal: 176 },
  { nombre: "Milanesa de carne (frita)", proteina: 22, carbs: 12, grasas: 15, kcal: 260 },
  { nombre: "Pollo pata/muslo (crudo, con piel)", proteina: 19.3, carbs: 0, grasas: 8.7, kcal: 161 },
  { nombre: "Chorizo (parrillero, crudo)", proteina: 15, carbs: 2, grasas: 26, kcal: 296 },
  { nombre: "Morcilla", proteina: 14.6, carbs: 1.3, grasas: 34.5, kcal: 379 },
];

// Búsqueda local dentro de FRECUENTES (sin acentos, case-insensitive)
const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function buscarLocal(query) {
  const q = sinAcentos(query.trim());
  if (!q) return [];
  return FRECUENTES.filter((f) => sinAcentos(f.nombre).includes(q));
}

// ─── Cliente Open Food Facts (gratis, sin API key) ────────────────
const OFF_BASE = "https://world.openfoodfacts.org";

// Extrae macros por 100g de un producto de OFF
function macros100(nutriments = {}) {
  const g = (k) => {
    const v = nutriments[k];
    return typeof v === "number" && !isNaN(v) ? v : 0;
  };
  return {
    proteina: g("proteins_100g"),
    carbs: g("carbohydrates_100g"),
    grasas: g("fat_100g"),
    kcal: g("energy-kcal_100g") || Math.round(g("energy-kcal_serving")) || 0,
  };
}

// Busca un producto por código de barras
export async function buscarPorCodigo(codigo) {
  const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(codigo)}.json?fields=product_name,product_name_es,brands,nutriments,serving_size`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    throw new Error("Producto no encontrado en la base. Probá cargarlo por búsqueda o como frecuente.");
  }
  const p = data.product;
  const nombre = p.product_name_es || p.product_name || "Producto sin nombre";
  const marca = (p.brands || "").split(",")[0].trim();
  return {
    nombre: marca ? `${nombre} (${marca})` : nombre,
    ...macros100(p.nutriments),
    serving: p.serving_size || null,
  };
}

// Busca productos por texto
export async function buscarPorTexto(query) {
  const url =
    `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=25` +
    `&fields=product_name,product_name_es,brands,nutriments`;

  // El endpoint legacy de OFF (cgi/search.pl) es inestable y devuelve
  // 503 con frecuencia; reintentamos un par de veces antes de fallar.
  let data;
  let ultimoError;
  for (let intento = 0; intento < 3; intento++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OFF respondió ${res.status}`);
      data = await res.json();
      ultimoError = null;
      break;
    } catch (e) {
      ultimoError = e;
      if (intento < 2) await new Promise((r) => setTimeout(r, 500 * (intento + 1)));
    }
  }
  if (ultimoError) throw ultimoError;
  const productos = (data.products || [])
    .map((p) => {
      const nombre = p.product_name_es || p.product_name;
      if (!nombre) return null;
      const m = macros100(p.nutriments);
      // Descartamos productos sin ningún dato nutricional
      if (m.proteina === 0 && m.carbs === 0 && m.grasas === 0 && m.kcal === 0) return null;
      const marca = (p.brands || "").split(",")[0].trim();
      return { nombre: marca ? `${nombre} (${marca})` : nombre, ...m };
    })
    .filter(Boolean)
    .slice(0, 20);
  return productos;
}
