"use strict";

import { homeIcon, schoolIcon } from "./icons.js";

const PARIS_DEFAULT = {
    latlng: [48.8566, 2.3522],
    zoom: 13
  };
  

export function initMap() {
    const map = L.map("map", {
        center: PARIS_DEFAULT.latlng,
        zoom: PARIS_DEFAULT.zoom
      });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 16,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  setupGeolocation(map);
  return map;
}



function setupGeolocation(map) {
   
    map.locate();

    map.on("locationfound", (e) => {
    map.setView(e.latlng, 15);

    L.marker(e.latlng, { icon: homeIcon })
      .addTo(map)
      .bindPopup("Votre position")
      .openPopup();
  });

  map.on("locationerror", (e) => {
    console.warn("Géolocalisation impossible :", e.message);
    map.setView(PARIS_DEFAULT.latlng, PARIS_DEFAULT.zoom);  
    });

}



export function addLycees(map, geojsonData) {
  L.geoJSON(geojsonData, {
    pointToLayer: (feature, latlng) =>
      L.marker(latlng, { icon: schoolIcon })
  }).addTo(map);
}
