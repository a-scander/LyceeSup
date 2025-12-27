import { initMap, renderLycees } from "./map.js";
import { loadGeoJSON } from "./data.js";
import {resetFilters} from "./ui.js"

const getFilters = () =>
  Object.fromEntries(
    [...document.querySelectorAll(".filters input[type=checkbox]")]
      .map((i) => [i.name, i.checked])
  );


window.onload = async () => {
  const map = initMap();
  const geojson = await loadGeoJSON("../data/lycees.geojson");
  renderLycees(geojson, getFilters());

  document.querySelector(".filters").addEventListener("change", () => {
  renderLycees(geojson, getFilters());
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    resetFilters();
    renderLycees(geojson, getFilters());
  });
};
