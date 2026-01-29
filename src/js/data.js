"use strict";


/* ============================================================
Fonction qui charge un fichier GeoJSON depuis une URL
============================================================ */
export async function loadGeoJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erreur HTTP : " + response.status);
  return response.json();
}
