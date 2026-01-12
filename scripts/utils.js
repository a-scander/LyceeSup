
import { readFile, writeFile } from "fs/promises";

export function firstNonEmpty(...values) {
  return values.find(v => v != null && v !== "") ?? null;
}

export function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function loadJson(path) {
  const txt = await readFile(path, "utf8");
  return JSON.parse(txt);
}

export function parseSpecialites(raw) {
  if (!raw) return [];
  return raw.split("/").map(s => s.trim()).filter(Boolean);
}

export async function saveGeoJSON(path, geojson) {
  await writeFile(
    path,
    JSON.stringify(geojson, null, 2),
    "utf8"
  );
}
