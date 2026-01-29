import { initMap, renderLycees, getUserLatLng,loadMoreLycees, isGeolocationDenied } from "./map.js";
import { loadGeoJSON } from "./data.js";
import {resetFilters,initOptionDropdowns,resetFormationFields } from "./ui.js"

export const getFilters = () => {
  return {
    statut: document.querySelector('input[name="statut"]:checked')?.value || "",
    voie: document.querySelector('input[name="voie"]:checked')?.value || "",
    profil: document.querySelector('input[name="profil"]:checked')?.value || "",

    services: [
      ...document.querySelectorAll('input[name="services"]:checked')
    ].map(i => i.value),
    
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
  const popup = document.getElementById("resultsPopup");
  const toggle = document.getElementById("resultsToggle");


  initOptionDropdowns(geojson);
  renderLycees(geojson, getFilters(), map);
  
  map.on("locationfound", () => {
    renderLycees(geojson, getFilters(), map);
  });

  if (isGeolocationDenied()) {
  document
    .querySelectorAll('input[name="profil"]')
    .forEach(input => {
      if (input.value !== "performance") {
        input.disabled = true;
      } else {
        input.checked = true;
      }
    });
}

  toggle.addEventListener("click", () => {
    const isCollapsed = popup.classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    toggle.textContent = isCollapsed ? "▶" : "▼";
  });
  

  document.querySelector(".filters").addEventListener("change", (e) => {
    if (e.target.name === "voie") resetFormationFields();

    renderLycees(geojson, getFilters(), map);

    if (Number(document.getElementById("lycees-count")?.textContent) === 0) {
      popup.classList.add("is-collapsed");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "▶";
    } else {
      popup.classList.remove("is-collapsed");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "▼";
    }
  });


  document.getElementById("resetBtn").addEventListener("click", () => {
    resetFilters();
    renderLycees(geojson, getFilters(), map);
  });


  document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
    loadMoreLycees(map, getFilters());
  });

  document.getElementById("locateBtn").addEventListener("click", () => {
    const userPos = getUserLatLng();

    if (!userPos) {
      alert("Position non disponible");
      return;
    }

     map.flyTo(userPos, 16, {
        duration: 1.2,
        easeLinearity: 0.25
      });

  });

};
