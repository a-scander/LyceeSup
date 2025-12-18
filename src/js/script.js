"use strict";
window.onload = async () => {

  const map = L.map("map", {
    center: [48.8566, 2.3522],
    zoom: 13
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 15,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  let geojsonData; 

  try {
    const response = await fetch("../data/lycees.geojson");
    if (!response.ok) {
      throw new Error("Erreur HTTP : " + response.status);
    }

    geojsonData = await response.json();
    L.geoJSON(geojsonData).addTo(map);

  } catch (error) {
    console.error("Erreur lors du chargement du GeoJSON :", error);
  }

  console.log(geojsonData); // ✅ fonctionne
};
