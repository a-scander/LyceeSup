import { initMap, renderLycees } from "./map.js";
import { loadGeoJSON } from "./data.js";

const getFilters = () =>
  Object.fromEntries(
    [...document.querySelectorAll(".filters input[type=checkbox]")]
      .map((i) => [i.name, i.checked])
  );


window.onload = async () => {
  const map = initMap();
  const geojson = await loadGeoJSON("../data/lycees.geojson");
  debugger
  renderLycees(geojson, getFilters());

  document.querySelector(".filters").addEventListener("change", () => {
  renderLycees(geojson, getFilters());
  });

  
};
