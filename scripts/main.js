import { loadJson, saveGeoJSON } from "./utils.js";
import { buildIndexByUai,buildSpecsByUai, buildGeoJSONFromAnnuaire,pickTauxRow,optionsFromPicked}  from "./functions.js";


const GENERAL_FILIERE = ["gnle"];
const TECHNO_FILIERE  = ["sti2d", "std2a", "stmg", "stl", "st2s", "s2tmd", "sthr"];
const PRO_FILIERE = [
  "pluri_techno","transfo","genie_civil","mat_souples","meca_elec",
  "production","pluri_services","echanges","communication",
  "serv_personnes","serv_collec","services"
];
const MENTIONS_G = ["nb_mentions_tb_avecf_g","nb_mentions_tb_sansf_g","nb_mentions_b_g","nb_mentions_ab_g"];
const MENTIONS_T = ["nb_mentions_tb_avecf_t","nb_mentions_tb_sansf_t","nb_mentions_b_t","nb_mentions_ab_t"];
const MENTIONS_P = ["nb_mentions_tb_sansf_p","nb_mentions_b_p","nb_mentions_ab_p"];

const annuaire = await loadJson("../data/annuaire_etablissement.json");
const rowsGT = await loadJson("../data/taux_lycee_general.json");
const rowsPro = await loadJson("../data/taux_lycee_pro.json");
const specsRows = await loadJson("../data/specialite_option.json");

const gt = buildIndexByUai(rowsGT);
const pro = buildIndexByUai(rowsPro);
const specsByUai = buildSpecsByUai(specsRows);

const geojson = buildGeoJSONFromAnnuaire(annuaire);



for (const f of geojson.features) {
  const uai = f.properties.uai;

  const gtRow = gt.get(uai) ?? null;
  const proRow = pro.get(uai) ?? null;
  const specs = specsByUai.get(uai) ?? [];

  const taux_general = pickTauxRow(gtRow, GENERAL_FILIERE, MENTIONS_G);
  const taux_techno  = pickTauxRow(gtRow, TECHNO_FILIERE,  MENTIONS_T);
  const taux_pro    = pickTauxRow(proRow, PRO_FILIERE,    MENTIONS_P);

  f.properties.taux_general = taux_general;
  f.properties.taux_techno = taux_techno;
  f.properties.taux_pro = taux_pro;

  f.properties.optionTechno = optionsFromPicked(taux_techno, TECHNO_FILIERE);
  f.properties.optionPro = optionsFromPicked(taux_pro, PRO_FILIERE);

  f.properties.optionGenerale =  specs;
   
}

await saveGeoJSON("../data/lycees.geojson", geojson);
console.log("GeoJSON sauvegardé");