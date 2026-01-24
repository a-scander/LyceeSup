"use strict";

import { homeIcon, schoolIcon,schoolIconActive  } from "./icons.js";

import { PRO_LABELS } from "./ui.js";


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
let activeMarker = null;
let geolocationDenied = false;



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
  
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
   
      lyceesCluster = createLyceesCluster();
      map.addLayer(lyceesCluster);

  setupGeolocation(map);

  map.on("click", () => {
    if (activeMarker) {
      activeMarker.setIcon(schoolIcon);
      activeMarker = null;
    }

    document.querySelectorAll(".lycee-expand.open").forEach(el => {
      el.classList.remove("open");
      el.style.maxHeight = null;
      document.querySelectorAll('.lycee-top.active').forEach(top => {
      top.classList.remove('active');
    });
    });
  });

  return map;
}


/* ============================================================
Fonction qui gère la géolocalisation
============================================================ */
function setupGeolocation(map) {
  
    map.locate(); // Demande la position de l'utilisateur

    map.on("locationfound", (e) => {   // Événement déclenché quand la position est trouvée

      userLatLng = e.latlng;
      map.flyTo(e.latlng, 16, {
        duration: 1.2,
        easeLinearity: 0.25
      });

      L.marker(e.latlng, { icon: homeIcon })
        .addTo(map)
        .bindPopup("Moi")
        .openPopup();  // Ouvre la popup automatiquement
  });

  map.on("locationerror", (e) => {      // Événement déclenché si la géolocalisation échoue, on met Paris par défaut
    console.warn("Géolocalisation impossible :", e.message);
    geolocationDenied = true;
    map.setView(PARIS_DEFAULT.latlng, PARIS_DEFAULT.zoom);  
    });

}

export function isGeolocationDenied() {
  return geolocationDenied;
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
  const nom = props.nom_etablissement ?? "Lycée";
  const ville = props.commune ?? "—";

  // Voies (un lycée peut en avoir plusieurs)
  const voies = [];
  if (props.voie_generale === "1") voies.push("Général");
  if (props.voie_technologique === "1") voies.push("Techno");
  if (props.voie_professionnelle === "1") voies.push("Pro");

  // Statut
  const statut = props.statut_public_prive ?? "—";

  // Scores par voie
  const scores = [];

  if (typeof props.score_general === "number") {
    scores.push(`Général : ${props.score_general}%`);
  }

  if (typeof props.score_techno === "number") {
    scores.push(`Techno : ${props.score_techno}%`);
  }

  if (typeof props.score_pro === "number") {
    scores.push(`Pro : ${props.score_pro}%`);
  }

  const tauxHtml = scores.length
    ? `<div class="lycee-line">
         <img class="lycee-ico" src="assets/icons/trophyor.png" alt="">
         <span>${scores.join(" · ")}</span>
       </div>`
    : "";

  // Proximité
  const proximiteHtml =
    typeof props.distanceKm === "number"
      ? `<div class="lycee-line">
           <img class="lycee-ico" src="assets/icons/walkgrey.png" alt="">
           <span>${props.distanceKm.toFixed(1)} km</span>
         </div>`
      : "";

  // Badges voies
  const voiesBadges = voies
    .map(v => `<span class="badge badge-grey">${v}</span>`)
    .join("");

  const statutBadge = `<span class="badge badge-blue">${statut}</span>`;

  return `
    <div class="lycee-card">

      <div class="lycee-badges">
        ${voiesBadges}
        ${statutBadge}
      </div>

      <div class="lycee-top">
        <div class="lycee-name">
          <img class="lycee-ico lycee-ico-title" src="assets/icons/logonoir.png" alt="">
          <span class="lycee-title">${nom}</span>
        </div>
        <span class="lycee-arrow">›</span>
      </div>

      <div class="lycee-line">
        <img class="lycee-ico" src="assets/icons/marqueurvert.png" alt="">
        <span>${ville}</span>
      </div>

      ${tauxHtml}
      ${proximiteHtml}

    </div>
  `;
}

function buildLyceeDetails(props) {
  const adresse = props.adresse ?? "—";
  const commune = props.commune ?? "—";
  const telephone = props.telephone ?? "—";
  const web = props.web ?? null;
  const statut = props.statut_public_prive ?? "—";
  const hebergement = props.hebergement === 1 ? "Oui" : "Non";
  const restauration = props.restauration === 1 ? "Oui" : "Non";
  const apprentissage = props.apprentissage === "1" ? "Oui" : "Non";
  
  const voies = [];
  if (props.voie_generale === "1") voies.push("Général");
  if (props.voie_technologique === "1") voies.push("Techno");
  if (props.voie_professionnelle === "1") voies.push("Pro");
  const voiesBubbles = voies.map(v => `<span class="badge badge-grey">${v}</span>`).join('') || "—";
  
  const specsGenBubbles = (props.optionGenerale || []).slice(0, 8).map(s => `<span class="badge badge-grey">${s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>`).join('');
  const specsTechBubbles = (props.optionTechno || []).slice(0, 8).map(s => `<span class="badge badge-grey">${s.toUpperCase()}</span>`).join('');
  const specsProBubbles = (props.optionPro || []).slice(0, 8).map(s => {const label = PRO_LABELS[s] || s; return `<span class="badge badge-grey">${label}</span>`}).join('');
  
  return `
    <div class="lycee-details-grid">
      <div class="detail-row">
        <img src="assets/icons/marqueurvert.png" class="detail-ico" alt="">
        <div>
          <strong>Adresse</strong><br>${adresse}, ${commune}
        </div>
      </div>
      <div class="detail-row">
        <img src="assets/icons/telephone.png" class="detail-ico" alt="">
        <div><strong>Téléphone</strong><br>${telephone}</div>
      </div>
      ${web ? `<div class="detail-row">
        <img src="assets/icons/web.png" class="detail-ico" alt="">
        <div><strong>Site web</strong><br><a href="${web}" target="_blank">${web}</a></div>
      </div>` : ''}
      
      <div class="detail-row full">
        <div class="detail-label">Types de filières</div>
        <div class="spec-bubbles">${voiesBubbles}</div>
      </div>
      
      ${specsGenBubbles ? `<div class="detail-row full">
        <div class="detail-label">Spécialités Générales</div>
        <div class="spec-bubbles">${specsGenBubbles}</div>
      </div>` : ''}
      
      ${specsTechBubbles ? `<div class="detail-row full">
        <div class="detail-label">Spécialités Technologies</div>
        <div class="spec-bubbles">${specsTechBubbles}</div>
      </div>` : ''}
      
      ${specsProBubbles ? `<div class="detail-row full">
        <div class="detail-label">Spécialités Professionel</div>
        <div class="spec-bubbles">${specsProBubbles}</div>
      </div>` : ''}
      
      <div class="detail-row full">
        <div class="detail-label">Services disponibles</div>
        <div class="services-grid">
          ${hebergement === "Oui" ? `<div class="service-item"><img src="assets/icons/hebergement.png" class="service-ico"><span>Hébergement</span></div>` : ''}
          ${restauration === "Oui" ? `<div class="service-item"><img src="assets/icons/assiette.png" class="service-ico"><span>Restauration</span></div>` : ''}
          ${apprentissage === "Oui" ? `<div class="service-item"><img src="assets/icons/apprentissage.png" class="service-ico"><span>Apprentissage</span></div>` : ''}
        </div>
      </div>
    </div>
  `;
}



/* ============================================================
ssss
============================================================ */

function selectLycee(marker, lat, lng, map) {
  if (activeMarker && activeMarker !== marker) {
    activeMarker.setIcon(schoolIcon);
  }

 if (marker !== activeMarker) { 
    marker.setIcon(schoolIconActive);
    activeMarker = marker;
    
    map.flyTo([lat, lng], 16, {
      duration: 0.8,        
      easeLinearity: 0.25, 
      noMoveStart: false    
    });
    setTimeout(() => marker.openPopup(), 850);
  } else {
    
    setTimeout(() => marker.openPopup(), 50);
  }
  openLyceeInList(marker, map);
}

let isLoadingForMarker = false; // ✅ Global flag (ajoutez après variables)

function openLyceeInList(marker, map) {
  if (isLoadingForMarker) return; // Évite boucle
  
  isLoadingForMarker = true;

  // Ferme tous les autres
  document.querySelectorAll('.lycee-expand.open').forEach(el => {
    el.classList.remove("open");
    el.style.maxHeight = null;
  });

  const lyceeData = lyceesAffiches.find(l => l.marker === marker);
  if (!lyceeData) {
    isLoadingForMarker = false;
    return;
  }

  let item = Array.from(document.querySelectorAll('.lycee-item')).find(li => {
    const title = li.querySelector('.lycee-title')?.textContent.trim();
    return title === lyceeData.nom_etablissement;
  });

  // ✅ SI PAS DANS LISTE → CHARGE + RETRY
  if (!item) {
    const index = lyceesAffiches.findIndex(l => l.marker === marker);
    listLimit = Math.max(listLimit, index + LIST_STEP + 10); // + marge
    updateLyceesList(map, {});
    
    setTimeout(() => {
      isLoadingForMarker = false;
      openLyceeInList(marker, map); // Retry
    }, 350);
    return;
  }

  // ✅ OUVRE (trouvé)
  const expand = item.querySelector('.lycee-expand');
  const lyceeTop = item.querySelector('.lycee-top');

  expand.innerHTML = buildLyceeDetails(lyceeData);
  const scrollHeight = expand.scrollHeight + 32;
  expand.classList.add('open');
  expand.style.maxHeight = scrollHeight + 'px';
  
  lyceeTop.classList.add('active');
  
  // Ferme autres headers
  document.querySelectorAll('.lycee-top.active').forEach(otherTop => {
    if (otherTop !== lyceeTop) otherTop.classList.remove('active');
  });
  
  item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  isLoadingForMarker = false;
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

    li.innerHTML = `
      ${buildCardLyceeList(l)}
      <div class="lycee-expand"></div>
      `;


   li.addEventListener('click', function(e) {
      e.stopPropagation();

      const expand = li.querySelector(".lycee-expand");
      const lyceeTop = li.querySelector(".lycee-top");
      const isOpen = expand.classList.contains("open");

      document.querySelectorAll(".lycee-expand.open").forEach(el => {
        if (el !== expand) {
          el.classList.remove("open");
          el.style.maxHeight = null;
        }
      });

       if (!isOpen) {
        expand.innerHTML = buildLyceeDetails(l);
        const scrollHeight = expand.scrollHeight + 32;
        expand.classList.add("open");
        expand.style.maxHeight = scrollHeight + "px";

        lyceeTop.classList.add('active'); 
        
        li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (l.marker) selectLycee(l.marker, l.lat, l.lng, map);
      } else {
        expand.style.maxHeight = expand.scrollHeight + "px";
        expand.classList.remove("open");
        lyceeTop.classList.remove('active');
        setTimeout(() => { expand.style.maxHeight = null; }, 10);
      }
   });

    ul.appendChild(li);
  });

  let loadingMore = false;
  ul.onscroll = function() {
    if (loadingMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = ul;

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      loadingMore = true;
      
      listLimit += LIST_STEP;
      updateLyceesList(map, filters); 
      setTimeout(() => { loadingMore = false; }, 500);
    }
  };
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

  const services = filters.services || [];

  const matchServices =
    services.length === 0 ||
    services.every(service => {
      if (service === "restauration") return toNum01(p.restauration) === 1;
      if (service === "hebergement") return toNum01(p.hebergement) === 1;
      if (service === "apprentissage") return toNum01(p.apprentissage) === 1;
      return false;
    });

  const voieG = toNum01(p.voie_generale);
  const voieT = toNum01(p.voie_technologique);
  const voieP = toNum01(p.voie_professionnelle);

  const matchVoie =
    !filters.voie ||
    (filters.voie === "generale" && voieG === 1) ||
    (filters.voie === "technologique" && voieT === 1) ||
    (filters.voie === "professionnel" && voieP === 1);

  if (!(matchStatut && matchServices && matchVoie)) {
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
      // marker.on("popupopen", () => {
      //   console.groupCollapsed(`[LYCÉE] ${props.nom_etablissement ?? "—"} (${props.uai ?? "—"})`);
      //   console.log(props);
      //   console.groupEnd();
      // });
      marker.on("click", () => {
        selectLycee(marker, latlng.lat, latlng.lng, map);
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
