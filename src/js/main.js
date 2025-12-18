import { initMap, addLycees } from "./map.js";
import { loadGeoJSON } from "./data.js";

window.onload = async () => {
  const map = initMap();
  const geojson = await loadGeoJSON("../data/lycees.geojson");
  addLycees(map, geojson);
};
