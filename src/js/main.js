import {
  initMap,
  renderLycees,
  getUserLatLng,
  loadMoreLycees,
  isGeolocationDenied
} from "./map.js";

import { loadGeoJSON } from "./data.js";

import {
  resetFilters,
  initOptionDropdowns,
  resetFormationFields
} from "./ui.js";

/* ============================================================
Fonction qui récupère l’ensemble des filtres sélectionnés
============================================================ */
export const getFilters = () => {
  return {
    // Filtres radio
    statut: document.querySelector('input[name="statut"]:checked')?.value || "",
    voie: document.querySelector('input[name="voie"]:checked')?.value || "",
    profil: document.querySelector('input[name="profil"]:checked')?.value || "",

    // Filtres à choix multiples
    services: [
      ...document.querySelectorAll('input[name="services"]:checked')
    ].map(input => input.value),

    specialitesGeneral: [
      ...document.querySelectorAll('input[name="specialitesGeneral"]:checked')
    ].map(input => input.value),

    specialitesTechno: [
      ...document.querySelectorAll('input[name="specialitesTechno"]:checked')
    ].map(input => input.value),

    specialitesPro: [
      ...document.querySelectorAll('input[name="specialitesPro"]:checked')
    ].map(input => input.value),

    // Seuils minimums
    tauxMinGeneral: document.getElementById("tauxMinGeneral")?.value || "",
    tauxMinTechno: document.getElementById("tauxMinTechno")?.value || "",
    tauxMinPro: document.getElementById("tauxMinPro")?.value || ""
  };
};

/* ============================================================
Initialisation principale au chargement de la page
============================================================ */
window.onload = async () => {
  // Initialisation de la carte
  const map = initMap();

  // Chargement des données GeoJSON
  const geojson = await loadGeoJSON("../data/lycees.geojson");

  // Récupération des éléments UI
  const popup = document.getElementById("resultsPopup");
  const toggle = document.getElementById("resultsToggle");
 
  // Affiche la liste 3 secondes après le début 
  setTimeout(() => {
    popup.style.display = "";
  }, 3000);

  // Initialisation des dropdowns
  initOptionDropdowns(geojson);

  // Premier affichage des lycées
  renderLycees(geojson, getFilters(), map);

  // Rechargement des résultats après géolocalisation
  map.on("locationfound", () => {
    renderLycees(geojson, getFilters(), map);
  });

  // Gestion du refus de géolocalisation
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

  // Bouton d’ouverture / fermeture du panneau
  toggle.addEventListener("click", () => {
    const isCollapsed = popup.classList.toggle("is-collapsed");

    toggle.setAttribute("aria-expanded", String(!isCollapsed));
    toggle.textContent = isCollapsed ? "▶" : "▼";
  });

  // Mise à jour des résultats lors d’un changement de filtre
  document.querySelector(".filters").addEventListener("change", (e) => {
    // Réinitialisation des champs selon la voie
    if (e.target.name === "voie") {
      resetFormationFields();
    }

    // Rechargement des lycées
    renderLycees(geojson, getFilters(), map);

    // Gestion automatique de l’affichage du popup
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

  // Bouton de réinitialisation des filtres
  document.getElementById("resetBtn").addEventListener("click", () => {
    resetFilters();
    renderLycees(geojson, getFilters(), map);
  });

  // Chargement de résultats supplémentaires
  document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
    loadMoreLycees(map, getFilters());
  });

  // Bouton de localisation utilisateur
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
