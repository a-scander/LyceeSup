
"use strict";

const TECHNO_LABELS = {
  s2tmd: "S2TMD — Théâtre / Musique / Danse",
  st2s: "ST2S — Santé et social",
  std2a: "STD2A — Design et arts appliqués",
  sthr: "STHR — Hôtellerie-restauration",
  sti2d: "STI2D — Industrie et développement durable",
  stl: "STL — Laboratoire",
  stmg: "STMG — Management et gestion"
};

const PRO_LABELS = {
  communication: "Communication",
  echanges: "Échanges / commerce",
  genie_civil: "Génie civil",
  mat_souples: "Matériaux souples (textile/cuir…)",
  meca_elec: "Mécanique / électricité",
  pluri_services: "Pluri-services",
  pluri_techno: "Pluri-technologies",
  production: "Production",
  serv_collec: "Services aux collectivités",
  serv_personnes: "Services aux personnes",
  services: "Services",
  transfo: "Transformation"
};

/* ============================================================
Fonction pour réinitialiser les filtres
============================================================ */
export function resetFilters() {
  document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);

  [
    "selectVoie",
    "selectSpecialite1", "selectSpecialite2",
    "selectTechno", "selectPro",
    "tauxMinGeneral", "tauxMinTechno", "tauxMinPro"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  updateVoieBlocks();
}

  
/* ======================================================================
Extraire listes uniques depuis le GeoJSON de chaque options et filières
========================================================================= */
function extractOptionLists(geojson) {
  const general = new Set();
  const techno = new Set();
  const pro = new Set();

  for (const f of geojson.features || []) {
    const p = f?.properties || {};

    (p.optionGenerale || []).forEach(x => x && general.add(String(x).trim()));
    (p.optionTechno || []).forEach(x => x && techno.add(String(x).trim().toLowerCase()));
    (p.optionPro || []).forEach(x => x && pro.add(String(x).trim().toLowerCase()));
  }

  return {
    general: Array.from(general).sort((a,b) => a.localeCompare(b, "fr")),
    techno: Array.from(techno).sort(),
    pro: Array.from(pro).sort()
  };
}

/* ============================================================
Remplir un select
============================================================ */
function fillSelect(selectEl, items, placeholder) {
  if (!selectEl) return;

  selectEl.innerHTML = "";
  selectEl.appendChild(new Option(placeholder, ""));

  for (const item of items) {
    selectEl.appendChild(new Option(item, item));
  }
}

/* ============================================================
Remplir un select avec traduction du code des données
============================================================ */
function fillSelectWithLabels(selectEl, codes, labelsMap, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  selectEl.appendChild(new Option(placeholder, ""));

  codes.forEach(code => {
    const label = labelsMap[code] ?? code; 
    selectEl.appendChild(new Option(label, code)); 
  });
}
/* ============================================================
Init dropdowns dynamiques
============================================================ */
export function initOptionDropdowns(geojson) {
  const lists = extractOptionLists(geojson);

  fillSelect(
    document.getElementById("selectSpecialite1"),
    lists.general,
    "Toutes"
  );

  fillSelect(
    document.getElementById("selectSpecialite2"),
    lists.general,
    "Toutes"
  );

  fillSelectWithLabels(
    document.getElementById("selectTechno"),
    lists.techno,
    TECHNO_LABELS,
    "— Toutes les filières techno —"
  );
  
  fillSelectWithLabels(
    document.getElementById("selectPro"),
    lists.pro,
    PRO_LABELS,
    "— Toutes les filières pro —"
  );
}

/*==============================================================================
Affiche ou masque les blocs (Général / Techno / Pro) selon la voie sélectionnée
================================================================================ */
export function updateVoieBlocks() {
  const voie = document.getElementById("selectVoie")?.value || "";

  const blocGeneral = document.getElementById("blocGeneral");
  const blocTechno = document.getElementById("blocTechno");
  const blocPro = document.getElementById("blocPro");

  if (blocGeneral) blocGeneral.style.display = (voie === "generale") ? "" : "none";
  if (blocTechno)  blocTechno.style.display  = (voie === "technologique") ? "" : "none";
  if (blocPro)     blocPro.style.display     = (voie === "professionnel") ? "" : "none";
}

/*=====================================================================================
Réinitialise les champs liés aux formations et aux taux (appelé quand la voie change)
======================================================================================= */
export function resetFormationFields() {
  [
    "selectSpecialite1", "selectSpecialite2", "tauxMinGeneral",
    "selectTechno", "tauxMinTechno",
    "selectPro", "tauxMinPro"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}
