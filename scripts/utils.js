import { readFile, writeFile } from "fs/promises";

/* ============================================================
   Fonction utilitaire qui retourne la première valeur non vide
   parmi une liste de champs (adresse, etc.)
============================================================ */
export function firstNonEmpty(...values) {
  return values.find(v => v != null && v !== "") ?? null;
}

/* ============================================================
   Fonction utilitaire qui convertit une valeur en nombre
   → Gère les virgules décimales
   → Retourne null si la conversion est impossible
============================================================ */
export function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* ============================================================
   Fonction asynchrone qui charge un fichier JSON depuis le disque
============================================================ */
export async function loadJson(path) {
  const txt = await readFile(path, "utf8");
  return JSON.parse(txt);
}

/* ============================================================
   Fonction qui transforme une chaîne de spécialités séparées
   par des "/" en tableau propre
============================================================ */
export function parseSpecialites(raw) {
  if (!raw) return [];
  return raw.split("/").map(s => s.trim()).filter(Boolean);
}

/* ============================================================
   Fonction asynchrone qui sauvegarde un objet GeoJSON
   sous forme de fichier formaté
============================================================ */
export async function saveGeoJSON(path, geojson) {
  await writeFile(
    path,
    JSON.stringify(geojson, null, 2),
    "utf8"
  );
}
