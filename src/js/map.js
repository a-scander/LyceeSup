"use strict";

import { homeIcon, schoolIcon } from "./icons.js";


/* ============================================================
CONSTANTES
============================================================ */
const PARIS_DEFAULT = {
    latlng: [48.8566, 2.3522],
    zoom: 13
  };
  

/* ============================================================
VARIABLES
============================================================ */
let lyceesCluster;
let userLatLng = null;
let lyceesAffiches = [];

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
function updateLyceesList(map) {
  const ul = document.getElementById("lycees-list");
  ul.innerHTML = "";

  if (!map) return;

  const bounds = map.getBounds();

  const lyceesVisibles = lyceesAffiches.filter(l =>
    bounds.contains([l.lat, l.lng])
  );

  if (lyceesVisibles.length === 0) {
    ul.innerHTML = `<li class="placeholder">Aucun lycée visible</li>`;
    return;
  }

  lyceesVisibles.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  
  const total = lyceesVisibles.length;

  const MAX = 30;
  const lyceesAffichesList =
    total > MAX ? lyceesVisibles.slice(0, MAX) : lyceesVisibles;

  lyceesAffichesList.forEach(l => {
    const li = document.createElement("li");
    li.className = "lycee-item popup-lycee"; 

    
    li.innerHTML = buildCardLyceeList({
      nom_etablissement: l.nom_etablissement,
      distanceKm: l.distanceKm,
      statut_public_prive: l.statut_public_prive,
      telephone: l.telephone,
      web: l.web
    });

    // clic → centre carte + ouvre popup
    li.onclick = () => {
      map.setView([l.lat, l.lng], 16);
      l.marker.openPopup();
    };

    ul.appendChild(li);
  });
}


/* ============================================================
Vérifie si un lycée (feature GeoJSON) correspond aux filtres sélectionnés.
============================================================ */
function matchesFilters(feature, filters) {
  const p = feature?.properties || {};

  const statut = String(p.statut_public_prive ?? "");

  const voie_professionnelle = Number(p.voie_professionnelle ?? 0);
  const voie_generale        = Number(p.voie_generale ?? 0);
  const voie_technologique   = Number(p.voie_technologique ?? 0);

  const hebergement   = Number(p.hebergement ?? 0);
  const restauration  = Number(p.restauration ?? 0);
  const apprentissage = Number(p.apprentissage ?? 0);

  const anyStatut = filters.public || filters.prive;
  const matchStatut = !anyStatut ? true : (
    (filters.public && statut.includes("Public")) ||
    (filters.prive  && statut.includes("Privé"))
  );

  const selectedVoie = String(filters.voie || "");
  const anyVoie = selectedVoie !== "";

  const matchVoie = !anyVoie ? true : (
    (selectedVoie === "professionnel" && voie_professionnelle === 1) ||
    (selectedVoie === "generale" && voie_generale === 1) ||
    (selectedVoie === "technologique" && voie_technologique === 1)
  );

  const anyHeb = filters.hebergement || filters.sans_hebergement;
  const matchHeb = !anyHeb ? true : (
    (filters.hebergement && hebergement === 1) ||
    (filters.sans_hebergement && hebergement === 0)
  );

  const anyRes = filters.restauration || filters.sans_restauration;
  const matchRes = !anyRes ? true : (
    (filters.restauration && restauration === 1) ||
    (filters.sans_restauration && restauration === 0)
  );

  const anyApp = filters.apprentissage || filters.sans_apprentissage;
  const matchApp = !anyApp ? true : (
    (filters.apprentissage && apprentissage === 1) ||
    (filters.sans_apprentissage && apprentissage === 0)
  );

  let matchFormation = true;
  let matchTaux = true;

  const optionsGen  = (p.optionGenerale || []).map(x => String(x).trim());
  const optionsTech = (p.optionTechno || []).map(x => String(x).trim().toLowerCase());
  const optionsPro  = (p.optionPro || []).map(x => String(x).trim().toLowerCase());

  if (selectedVoie === "generale") {
    const s1 = String(filters.specialite1 || "").trim();
    const s2 = String(filters.specialite2 || "").trim();

    const anySpec = s1 !== "" || s2 !== "";
    matchFormation = !anySpec ? true : (
      (s1 === "" || optionsGen.includes(s1)) &&
      (s2 === "" || optionsGen.includes(s2))
    );

    const anyMin = String(filters.tauxMinGeneral || "") !== "";
    const min = Number(filters.tauxMinGeneral);
    const taux = p.taux_general?.taux_reu_gnle;

    matchTaux = !anyMin ? true : (typeof taux === "number" && taux >= min);
  }

  if (selectedVoie === "technologique") {
    const t = String(filters.techno || "").trim().toLowerCase();
    matchFormation = (t === "") ? true : optionsTech.includes(t);

    const anyMin = String(filters.tauxMinTechno || "") !== "";
    const min = Number(filters.tauxMinTechno);

    if (!anyMin) {
      matchTaux = true;
    } else {
      if (t === "") {
        matchTaux = false;
      } else {
        const key = `taux_reu_${t}`;
        const taux = p.taux_techno?.[key];
        matchTaux = (typeof taux === "number" && taux >= min);
      }
    }
  }

  if (selectedVoie === "professionnel") {
    const pr = String(filters.pro || "").trim().toLowerCase();
    matchFormation = (pr === "") ? true : optionsPro.includes(pr);

    const anyMin = String(filters.tauxMinPro || "") !== "";
    const min = Number(filters.tauxMinPro);

    if (!anyMin) {
      matchTaux = true;
    } else {
      if (pr === "") {
        matchTaux = false;
      } else {
        const key = `taux_reu_${pr}`;
        const taux = p.taux_pro?.[key];
        matchTaux = (typeof taux === "number" && taux >= min);
      }
    }
  }

  return matchStatut && matchVoie && matchHeb && matchRes && matchApp
      && matchFormation && matchTaux;
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

      const marker = L.marker(latlng, { icon: schoolIcon });    
      marker.bindPopup(buildLyceePopup({...feature.properties, distanceKm: distanceKm}));

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

  updateLyceesList(map);

  map.on("moveend", () => updateLyceesList(map));
}

export function getUserLatLng() {
  return userLatLng;
}
