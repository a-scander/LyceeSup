"use strict";

export const homeIcon = L.icon({
    iconUrl: "./assets/icons/house.png",// chemin vers l'image de l'icône
    iconSize: [40, 40],// taille de l'icône (largeur, hauteur)
    iconAnchor: [20, 40],// point de l'icône correspondant à la position GPS (le clou)
    popupAnchor: [0, -40]// position de la popup par rapport à l'icône
});

export const schoolIcon = L.divIcon({
    className: "school-marker",
    html: `
      <div class="school-marker-inner"></div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
  
  export const schoolIconActive = L.divIcon({
    className: "school-marker active",
    html: `<div class="school-marker-inner active"></div>`,
    iconSize: [44, 44],      
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  });