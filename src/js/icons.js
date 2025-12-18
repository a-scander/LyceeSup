"use strict";

export const homeIcon = L.icon({
    iconUrl: "./assets/icons/house.png",// chemin vers l'image de l'icône
    iconSize: [40, 40],// taille de l'icône (largeur, hauteur)
    iconAnchor: [20, 40],// point de l'icône correspondant à la position GPS (le clou)
    popupAnchor: [0, -40]// position de la popup par rapport à l'icône
});

export const schoolIcon = L.icon({
    iconUrl: "./assets/icons/school.png", 
    iconSize: [40, 40],                   
    iconAnchor: [20, 40],                 
    popupAnchor: [0, -40]                 
  });
  