import { initMap, renderLycees, getUserLatLng } from "./map.js";
import { loadGeoJSON } from "./data.js";
import {resetFilters,initOptionDropdowns, updateVoieBlocks,resetFormationFields} from "./ui.js"

const getFilters = () => {
  const checkboxFilters = Object.fromEntries(
    [...document.querySelectorAll(".filters input[type=checkbox]")]
      .map((i) => [i.name, i.checked])
  );

  return {
    ...checkboxFilters,

    voie: document.getElementById("selectVoie")?.value || "",

    specialite1: document.getElementById("selectSpecialite1")?.value || "",
    specialite2: document.getElementById("selectSpecialite2")?.value || "",

    techno: document.getElementById("selectTechno")?.value || "",
    pro: document.getElementById("selectPro")?.value || "",

    tauxMinGeneral: document.getElementById("tauxMinGeneral")?.value || "",
    tauxMinTechno: document.getElementById("tauxMinTechno")?.value || "",
    tauxMinPro: document.getElementById("tauxMinPro")?.value || ""
  };
};


window.onload = async () => {
  const map = initMap();
  const geojson = await loadGeoJSON("../data/lycees.geojson");
  initOptionDropdowns(geojson);
  updateVoieBlocks();
  renderLycees(geojson, getFilters(), map);

  document.querySelector(".filters").addEventListener("change", (e) => {
    if (e.target.id === "selectVoie") {
      resetFormationFields();
      updateVoieBlocks();
    } 
    renderLycees(geojson, getFilters(), map);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    resetFilters();
    updateVoieBlocks();
    renderLycees(geojson, getFilters(), map);
  });

  document.getElementById("locateBtn").addEventListener("click", () => {
    const userPos = getUserLatLng();

    if (!userPos) {
      alert("Position non disponible");
      return;
    }

    map.setView(userPos, 15);
  });
};
