// Chargement des fonctions utilitaires (I/O)
import { loadJson, saveGeoJSON } from "./utils.js";

// Chargement des fonctions métier (données, scores, GeoJSON)
import {
  buildIndexByUai,
  buildSpecsByUai,
  buildGeoJSONFromAnnuaire,
  pickTauxRow,
  optionsFromPicked,
  computePerfScoreFromScores,
  computeScoreGeneral,
  computeScoreTechno,
  computeScorePro
} from "./functions.js";

// Définition des filières par voie
const GENERAL_FILIERE = ["gnle"];
const TECHNO_FILIERE  = ["sti2d", "std2a", "stmg", "stl", "st2s", "s2tmd", "sthr"];
const PRO_FILIERE = [
  "pluri_techno","transfo","genie_civil","mat_souples","meca_elec",
  "production","pluri_services","echanges","communication",
  "serv_personnes","serv_collec","services"
];

// Champs des mentions (par voie)
const MENTIONS_G = ["nb_mentions_tb_avecf_g","nb_mentions_tb_sansf_g","nb_mentions_b_g","nb_mentions_ab_g"];
const MENTIONS_T = ["nb_mentions_tb_avecf_t","nb_mentions_tb_sansf_t","nb_mentions_b_t","nb_mentions_ab_t"];
const MENTIONS_P = ["nb_mentions_tb_sansf_p","nb_mentions_b_p","nb_mentions_ab_p"];

// Chargement des données sources
const annuaire = await loadJson("../data/annuaire_etablissement.json");
const rowsGT = await loadJson("../data/taux_lycee_general.json");
const rowsPro = await loadJson("../data/taux_lycee_pro.json");
const specsRows = await loadJson("../data/specialite_option.json");

// Indexation des données par UAI pour accès rapide
const gt = buildIndexByUai(rowsGT);
const pro = buildIndexByUai(rowsPro);
const specsByUai = buildSpecsByUai(specsRows);

// Création du GeoJSON de base à partir de l'annuaire
const geojson = buildGeoJSONFromAnnuaire(annuaire);

// Enrichissement de chaque lycée avec les taux, scores et options
for (const f of geojson.features) {
  const uai = f.properties.uai;

  // Récupération des données associées au lycée
  const gtRow = gt.get(uai) ?? null;
  const proRow = pro.get(uai) ?? null;
  const specs = specsByUai.get(uai) ?? [];

  // Extraction des taux par voie
  const taux_general = pickTauxRow(gtRow, GENERAL_FILIERE, MENTIONS_G);
  const taux_techno  = pickTauxRow(gtRow, TECHNO_FILIERE,  MENTIONS_T);
  const taux_pro     = pickTauxRow(proRow, PRO_FILIERE,    MENTIONS_P);

  // Ajout des taux au GeoJSON
  f.properties.taux_general = taux_general;
  f.properties.taux_techno = taux_techno;
  f.properties.taux_pro = taux_pro;

  // Calcul des scores par voie
  const score_general = computeScoreGeneral(taux_general);
  const score_techno  = computeScoreTechno(taux_techno);
  const score_pro     = computeScorePro(taux_pro);

  // Calcul du score global de performance
  const perf_score = computePerfScoreFromScores(
    score_general,
    score_techno,
    score_pro
  );

  // Ajout des scores au GeoJSON
  f.properties.score_general = score_general;
  f.properties.score_techno = score_techno;
  f.properties.score_pro = score_pro;
  f.properties.perf_score = perf_score;

  // Détermination des options proposées
  f.properties.optionTechno = optionsFromPicked(taux_techno, TECHNO_FILIERE);
  f.properties.optionPro = optionsFromPicked(taux_pro, PRO_FILIERE);
  f.properties.optionGenerale = specs;
}

// Sauvegarde du GeoJSON final enrichi
await saveGeoJSON("../data/lycees.geojson", geojson);
console.log("GeoJSON sauvegardé");
