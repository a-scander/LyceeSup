
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
  const setChecked = (selector) => {
    const el = document.querySelector(selector);
    if (el) el.checked = true;
  };

  setChecked('input[name="voie"][value=""]');
  setChecked('input[name="profil"][value="equilibre"]');
  setChecked('input[name="statut"][value=""]');
  setChecked('input[name="restauration"][value=""]');
  setChecked('input[name="hebergement"][value=""]');
  setChecked('input[name="apprentissage"][value=""]');

  resetFormationFields();
}

/*==============================================================================
Affiche ou masque les blocs (Général / Techno / Pro) selon la voie sélectionnée
================================================================================ */
export function updateVoieBlocks() {
  const voie = document.querySelector('input[name="voie"]:checked')?.value || "";

  const blocGeneral = document.getElementById("blocGeneral");
  const blocTechno  = document.getElementById("blocTechno");
  const blocPro     = document.getElementById("blocPro");

  if (blocGeneral) blocGeneral.style.display = (voie === "generale") ? "" : "none";
  if (blocTechno)  blocTechno.style.display  = (voie === "technologique") ? "" : "none";
  if (blocPro)     blocPro.style.display     = (voie === "professionnel") ? "" : "none";
}
/* ================================================================
Génère dynamiquement une liste de checkbox à partir d'un tableau
=================================================================== */
function fillCheckboxList(containerEl, items, name) {
  if (!containerEl) return;

  containerEl.innerHTML = "";

  for (const item of items) {
    const label = document.createElement("label");
    label.className = "check";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;       
    input.value = item;

    label.appendChild(input);
    label.appendChild(document.createTextNode(item));

    containerEl.appendChild(label);
  }
}
/* ================================================================
Génère une liste de checkbox à partir d'une liste de codes
=================================================================== */
function fillCheckboxListWithLabels(containerEl, codes, name, labelsMap) {
  if (!containerEl) return;

  containerEl.innerHTML = "";

  for (const code of codes) {
    const labelText = labelsMap?.[code] ?? code;

    const label = document.createElement("label");
    label.className = "check";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;
    input.value = code; 

    label.appendChild(input);
    label.appendChild(document.createTextNode(labelText)); 

    containerEl.appendChild(label);
  }
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
Init dropdowns dynamiques
============================================================ */
export function initOptionDropdowns(geojson) {
  const lists = extractOptionLists(geojson);

  fillCheckboxList(
    document.getElementById("specialitesGeneralList"),
    lists.general,
    "specialitesGeneral"
  );

  fillCheckboxListWithLabels(
    document.getElementById("specialitesTechnoList"),
    lists.techno,
    "specialitesTechno",
    TECHNO_LABELS
  );

  fillCheckboxListWithLabels(
    document.getElementById("specialitesProList"),
    lists.pro,
    "specialitesPro",
    PRO_LABELS
  );

}

/*=====================================================================================
Réinitialise les champs liés aux formations et aux taux (appelé quand la voie change)
======================================================================================= */
export function resetFormationFields() {
  ["tauxMinGeneral", "tauxMinTechno", "tauxMinPro"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  [
    "specialitesGeneral",
    "specialitesTechno",
    "specialitesPro"
  ].forEach(groupName => {
    document
      .querySelectorAll(`input[type="checkbox"][name="${groupName}"]`)
      .forEach(cb => (cb.checked = false));
  });
  updateVoieBlocks();
}

