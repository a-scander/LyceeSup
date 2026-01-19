"use strict";

import { homeIcon, schoolIcon } from "./icons.js";


/* ============================================================
CONSTANTES
============================================================ */
const PARIS_DEFAULT = {
    latlng: [48.8566, 2.3522],
    zoom: 13
  };

const LIST_STEP = 30;


/* ============================================================
VARIABLES
============================================================ */
let lyceesCluster;
let userLatLng = null;
let lyceesAffiches = [];
let listLimit = 30;


/* ============================================================
Fonction qui initialise la carte
============================================================ */

export function initMap() {
  const map = L.map("map", {
      center: PARIS_DEFAULT.latlng,
      zoom: PARIS_DEFAULT.zoom,
      zoomControl: false 
    });
  

    L.control.zoom({      // Mettre les boutons de zoom en bas à droite
      position: "bottomright"
    }).addTo(map);
  
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
      }).addTo(map);
   
      lyceesCluster = createLyceesCluster();
      map.addLayer(lyceesCluster);

  setupGeolocation(map);
  return map;
}


/* ============================================================
Fonction qui gère la géolocalisation
============================================================ */
function setupGeolocation(map) {
  
    map.locate(); // Demande la position de l'utilisateur

    map.on("locationfound", (e) => {   // Événement déclenché quand la position est trouvée

      userLatLng = e.latlng;
      map.setView(e.latlng, 15);

      L.marker(e.latlng, { icon: homeIcon })
        .addTo(map)
        .bindPopup("Moi")
        .openPopup();  // Ouvre la popup automatiquement
  });

  map.on("locationerror", (e) => {      // Événement déclenché si la géolocalisation échoue, on met Paris par défaut
    console.warn("Géolocalisation impossible :", e.message);
    map.setView(PARIS_DEFAULT.latlng, PARIS_DEFAULT.zoom);  
    });

}

/* ============================================================
Fonction qui gère la distance entre l'utilisateur et les lycées
============================================================ */
function calculateDistanceKm(fromLatLng, toLatLng) {
  if (!fromLatLng) return null;
  return fromLatLng.distanceTo(toLatLng) / 1000;
}

/* ============================================================
Fonction qui gère la géolocalisation
============================================================ */
export function createLyceesCluster() {
  return L.markerClusterGroup({  //MarkerClusterGroup permet de regrouper automatiquement les markers proches
    disableClusteringAtZoom: 16,  // plus de regroupement à partir du zoom 16

    iconCreateFunction: function (cluster) { //retourner une icône pour un cluster.
      const count = cluster.getChildCount(); 

      return L.divIcon({
        html: `<div class="cluster-circle">${count}</div>`,
        className: "",
        iconSize: [36, 36]
      });
    }
  });
}
/* ============================================================
Fonction qui gère la pop up lors du clique sur les lycées
============================================================ */
function buildLyceePopup(props) {
  return `
    <div class="popup-lycee">
      <h3 class="popup-title">${props.nom_etablissement ?? "Lycée"}</h3>
    </div>
  `;
  
}

/* ============================================================
Fonction qui gère la carte du lycée
============================================================ */
function buildCardLyceeList(props) {
  return `
    <div class="popup-lycee">
      <h3 class="popup-title">${props.nom_etablissement ?? "Lycée"}</h3>

      <div class="popup-row">
        <strong>Statut :</strong> ${props.statut_public_prive ?? "—"}
      </div>

      ${
        typeof props.distanceKm === "number"
          ? `<div class="popup-row">
              <strong>Distance :</strong> ${props.distanceKm.toFixed(1)} km
            </div>`
          : ""
      }

      <div class="popup-row">
        <strong>Contact :</strong><br>
        ${props.telephone ? `📞 ${props.telephone}<br>` : ""}
        ${props.web ? `🌐 <a href="${props.web}" target="_blank">Site web</a>` : ""}
      </div>
    </div>
  `;
}

/* ============================================================
Fonction qui affiche la liste des lycées présents sur la carte
============================================================ */
function updateLyceesList(map, filters) {
  
  const ul = document.getElementById("lycees-list");
  const countEl = document.getElementById("lycees-count");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  ul.innerHTML = "";

  const total = lyceesAffiches.length;
  if (countEl) countEl.textContent = String(total);

  if (total === 0) {
    ul.innerHTML = `<li class="placeholder">Aucun lycée affiché</li>`;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }
  const sorted = sortLycees(lyceesAffiches, filters);

  const shown = sorted.slice(0, listLimit);

  shown.forEach(l => {
    const li = document.createElement("li");
    li.className = "lycee-item popup-lycee";

    li.innerHTML = buildCardLyceeList(l);

    li.onclick = () => {
      map.setView([l.lat, l.lng], 16);
      l.marker.openPopup();
    };

    ul.appendChild(li);
  });

  if (loadMoreBtn) {
    if (listLimit < total) {
      loadMoreBtn.style.display = "";
      loadMoreBtn.textContent = `Afficher plus (${Math.min(LIST_STEP, total - listLimit)} suivants)`;
    } else {
      loadMoreBtn.style.display = "none";
    }
  }
}

function sortLycees(lycees, filters) {
  const profil = filters?.profil || "equilibre";

  const distances = lycees
    .map(l => (typeof l.distanceKm === "number" ? l.distanceKm : null))
    .filter(v => v !== null);

  const maxDist = distances.length ? Math.max(...distances) : 1;

  const getScore = (l) => {
    const voie = filters?.voie || "";
    if (voie === "generale") return typeof l.score_general === "number" ? l.score_general : null;
    if (voie === "technologique") return typeof l.score_techno === "number" ? l.score_techno : null;
    if (voie === "professionnel") return typeof l.score_pro === "number" ? l.score_pro : null;
    return typeof l.perf_score === "number" ? l.perf_score : null;
  };

  return [...lycees].sort((a, b) => {
    const distA = typeof a.distanceKm === "number" ? a.distanceKm : Infinity;
    const distB = typeof b.distanceKm === "number" ? b.distanceKm : Infinity;

    const scoreAraw = getScore(a);
    const scoreBraw = getScore(b);

    const scoreA = typeof scoreAraw === "number" ? scoreAraw : -Infinity;
    const scoreB = typeof scoreBraw === "number" ? scoreBraw : -Infinity;

    if (profil === "proximite") {
      return distA - distB;
    }

    if (profil === "performance") {
      return scoreB - scoreA;
    }

    const perfA = scoreA === -Infinity ? 0 : scoreA / 100;
    const perfB = scoreB === -Infinity ? 0 : scoreB / 100;
    const proxA = distA === Infinity ? 0 : 1 - Math.min(distA / maxDist, 1);
    const proxB = distB === Infinity ? 0 : 1 - Math.min(distB / maxDist, 1);
    const mixA = 0.4 * perfA + 0.6 * proxA;
    const mixB = 0.4 * perfB + 0.6 * proxB;
    return mixB - mixA; 
  });
}

export function loadMoreLycees(map, filters) {
  listLimit += LIST_STEP;
  updateLyceesList(map, filters);
}


/* ============================================================
Vérifie si un lycée (feature GeoJSON) correspond aux filtres sélectionnés.
============================================================ */
function matchesFilters(feature, filters) {
  const p = feature?.properties || {};

  const toNum01 = (v) => (Number(v) === 1 ? 1 : 0);
  const norm = (s) => String(s ?? "").trim();
  const normLower = (s) => norm(s).toLowerCase();

  const passRadio01 = (choice, value01) => {
    // choice: "" | "avec" | "sans"
    if (!choice) return true;
    const v = value01 === 1;
    return choice === "avec" ? v : !v;
  };

  // -----------------------
  // 1) Filtres globaux (radios)
  // -----------------------
  const statut = norm(p.statut_public_prive);
  const matchStatut =
    !filters.statut ||
    (filters.statut === "public" && statut.includes("Public")) ||
    (filters.statut === "prive" && statut.includes("Privé"));

  const matchRestauration = passRadio01(filters.restauration, toNum01(p.restauration));
  const matchHebergement = passRadio01(filters.hebergement, toNum01(p.hebergement));
  const matchApprentissage = passRadio01(filters.apprentissage, toNum01(p.apprentissage));

  const voieG = toNum01(p.voie_generale);
  const voieT = toNum01(p.voie_technologique);
  const voieP = toNum01(p.voie_professionnelle);

  const matchVoie =
    !filters.voie ||
    (filters.voie === "generale" && voieG === 1) ||
    (filters.voie === "technologique" && voieT === 1) ||
    (filters.voie === "professionnel" && voieP === 1);

  if (!(matchStatut && matchRestauration && matchHebergement && matchApprentissage && matchVoie)) {
    return false;
  }

  // UX: pas d'apprentissage en voie générale
  if (filters.voie === "generale" && filters.apprentissage === "avec") {
    return false;
  }

  // -----------------------
  // 2) Données options
  // -----------------------
  const optionsGen = (p.optionGenerale || []).map(norm);
  const optionsTech = (p.optionTechno || []).map(normLower);
  const optionsPro = (p.optionPro || []).map(normLower);

  // Si voie = "toutes", on n'applique pas les filtres spécifiques de voie
  if (!filters.voie) return true;

  // -----------------------
  // 3) Voie générale (options ET + taux global)
  // -----------------------
  if (filters.voie === "generale") {
    const selected = (filters.specialitesGeneral || []).map(norm);

    const okOptions = selected.length === 0 ? true : selected.every((s) => optionsGen.includes(s));

    const needMin = String(filters.tauxMinGeneral ?? "") !== "";
    if (!needMin) return okOptions;

    const min = Number(filters.tauxMinGeneral);
    const taux = p.taux_general?.taux_reu_gnle;

    const okTaux = typeof taux === "number" && taux >= min;
    return okOptions && okTaux;
  }

  // -----------------------
  // 4) Voie technologique (options ET + taux "au moins une")
  // -----------------------
  if (filters.voie === "technologique") {
    const selected = (filters.specialitesTechno || []).map(normLower);

    // options: toutes les séries cochées doivent être présentes
    const okOptions = selected.length === 0 ? true : selected.every((code) => optionsTech.includes(code));

    const needMin = String(filters.tauxMinTechno ?? "") !== "";
    if (!needMin) return okOptions;

    const min = Number(filters.tauxMinTechno);

    // si aucune cochée => tester toutes les séries du lycée
    const seriesToTest = selected.length ? selected : optionsTech;

    // taux: au moins une série testée doit être >= min
    const okTaux = seriesToTest.some((code) => {
      const key = `taux_reu_${code}`;
      const taux = p.taux_techno?.[key];
      return typeof taux === "number" && taux >= min;
    });

    return okOptions && okTaux;
  }

  // -----------------------
  // 5) Voie professionnelle (options ET + taux "au moins une")
  // -----------------------
  if (filters.voie === "professionnel") {
    const selected = (filters.specialitesPro || []).map(normLower);

    // options: tous les domaines cochés doivent être présents
    const okOptions = selected.length === 0 ? true : selected.every((code) => optionsPro.includes(code));

    const needMin = String(filters.tauxMinPro ?? "") !== "";
    if (!needMin) return okOptions;

    const min = Number(filters.tauxMinPro);

    // si aucune cochée => tester tous les domaines du lycée
    const domainsToTest = selected.length ? selected : optionsPro;

    // taux: au moins un domaine testé doit être >= min
    const okTaux = domainsToTest.some((code) => {
      const key = `taux_reu_${code}`;
      const taux = p.taux_pro?.[key];
      return typeof taux === "number" && taux >= min;
    });

    return okOptions && okTaux;
  }

  return true;
}


/* ============================================================
Met à jour dynamiquement les marqueurs des lycées sur la carte en fonction des filtres sélectionnés
============================================================ */

export function renderLycees(geojsonData, filters, map) {
  lyceesCluster.clearLayers();

  lyceesAffiches = [];

  const layer = L.geoJSON(geojsonData, {
    filter: (f) => matchesFilters(f, filters),
    pointToLayer: (feature, latlng) => {
      let distanceKm = null;

      if (userLatLng) {
        distanceKm = calculateDistanceKm(userLatLng, latlng);
      }
      const props = { ...feature.properties, distanceKm };
      const marker = L.marker(latlng, { icon: schoolIcon });    
      marker.bindPopup(buildLyceePopup(props));
      marker.on("popupopen", () => {
        console.groupCollapsed(`[LYCÉE] ${props.nom_etablissement ?? "—"} (${props.uai ?? "—"})`);
        console.log(props);
        console.groupEnd();
      });
      lyceesAffiches.push({
        ...feature.properties,
        lat: latlng.lat,
        lng: latlng.lng,
        distanceKm,
        marker
      });
      return marker;
    }
  });

  lyceesCluster.addLayer(layer);
  listLimit = LIST_STEP;
  updateLyceesList(map, filters);

}

export function getUserLatLng() {
  return userLatLng;
}
