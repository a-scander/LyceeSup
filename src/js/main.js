import { initMap, renderLycees, getUserLatLng,loadMoreLycees  } from "./map.js";
import { loadGeoJSON } from "./data.js";
import {resetFilters,initOptionDropdowns,resetFormationFields, } from "./ui.js"

const getFilters = () => {
  return {
    statut: document.querySelector('input[name="statut"]:checked')?.value || "",
    restauration: document.querySelector('input[name="restauration"]:checked')?.value || "",
    hebergement: document.querySelector('input[name="hebergement"]:checked')?.value || "",
    apprentissage: document.querySelector('input[name="apprentissage"]:checked')?.value || "",
    voie: document.querySelector('input[name="voie"]:checked')?.value || "",
    profil: document.querySelector('input[name="profil"]:checked')?.value || "",

    specialitesGeneral: [
      ...document.querySelectorAll('input[name="specialitesGeneral"]:checked')
    ].map(i => i.value),

    specialitesTechno: [
      ...document.querySelectorAll('input[name="specialitesTechno"]:checked')
    ].map(i => i.value),

    specialitesPro: [
      ...document.querySelectorAll('input[name="specialitesPro"]:checked')
    ].map(i => i.value),

    tauxMinGeneral: document.getElementById("tauxMinGeneral")?.value || "",
    tauxMinTechno: document.getElementById("tauxMinTechno")?.value || "",
    tauxMinPro: document.getElementById("tauxMinPro")?.value || ""
  };
};


window.onload = async () => {
  const map = initMap();
  const geojson = await loadGeoJSON("../data/lycees.geojson");
  initOptionDropdowns(geojson);
  renderLycees(geojson, getFilters(), map);



  document.querySelector(".filters").addEventListener("change", (e) => {
    if (e.target.name === "voie") {
      resetFormationFields();
    } 
    renderLycees(geojson, getFilters(), map);
  });


  document.getElementById("resetBtn").addEventListener("click", () => {
    resetFilters();
    renderLycees(geojson, getFilters(), map);
  });


  document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
    loadMoreLycees(map, getFilters());
  });
  

/////////////////////////////////////////////////////////////////////////////

  document.getElementById("locateBtn").addEventListener("click", () => {
    const userPos = getUserLatLng();

    if (!userPos) {
      alert("Position non disponible");
      return;
    }

    map.setView(userPos, 15);
  });
};
