import { readFile, writeFile } from "fs/promises";

export async function loadJson(path) {
  const txt = await readFile(path, "utf8");
  return JSON.parse(txt);
}

export async function saveJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

export const toNumOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export function moyenne(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const firstNonEmpty = (...vals) => {
  for (const v of vals) {
    if (v !== null && v !== undefined) {
      const s = String(v).trim();
      if (s !== "") return s;
    }
  }
  return null;
};

export function indexByKey(array, keyName) {
  const index = {};
  for (const item of array) {
    const key = item[keyName];
    if (key) index[key] = item;
  }
  return index;
}


