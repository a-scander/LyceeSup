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
  const voies = [];

  if (props.voie_generale === 1) voies.push("Générale");
  if (props.voie_technologique === 1) voies.push("Technologique");
  if (props.voie_professionnelle === 1) voies.push("Professionnelle");

  return `
    <div class="popup-lycee">
      <h3 class="popup-title">${props.nom_etablissement ?? "Lycée"}</h3>

      <div class="popup-row">
        <strong>Statut :</strong> ${props.statut_public_prive ?? "—"}
      </div>

      <div class="popup-row">
        <strong>Voies :</strong> ${voies.join(", ") || "—"}
      </div>

      <div class="popup-row">
        <strong>Contact :</strong><br>
        ${props.telephone ? `📞 ${props.telephone}<br>` : ""}
        ${props.web ? `🌐 <a href="${props.web}" target="_blank">Site web</a>` : ""}
      </div>
    </div>
  `;
}

/* ============================================================
Vérifie si un lycée (feature GeoJSON) correspond aux filtres sélectionnés.
============================================================ */
function matchesFilters(feature, filters) {
  const p = feature?.properties;

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

  const anyVoie = filters.professionnel || filters.generale || filters.technologique;
  const matchVoie = !anyVoie ? true : (
    (filters.professionnel && voie_professionnelle === 1) ||
    (filters.generale       && voie_generale === 1) ||
    (filters.technologique  && voie_technologique === 1)
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

  return matchStatut && matchVoie && matchHeb && matchRes && matchApp;
}


/* ============================================================
Met à jour dynamiquement les marqueurs des lycées sur la carte en fonction des filtres sélectionnés
============================================================ */

export function renderLycees(geojsonData, filters) {
  lyceesCluster.clearLayers();

  const layer = L.geoJSON(geojsonData, {
    filter: (f) => matchesFilters(f, filters),
    pointToLayer: (feature, latlng) => {
      const marker = L.marker(latlng, { icon: schoolIcon });    
      marker.bindPopup(buildLyceePopup(feature.properties));
      return marker;
    }
  });

  lyceesCluster.addLayer(layer);
}

