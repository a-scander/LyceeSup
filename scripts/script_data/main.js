import { loadJson, saveJson, indexByKey } from "./utils.js";
import { filieresGeneral, filieresPro } from "./filieres.js";
import { buildFeatures,duplicateByUai }  from "./functions.js";

async function main() {
  const json_taux_lycee_general = await loadJson("../../data/taux_lycee_general.json");
  const json_taux_lycee_pro = await loadJson("../../data/taux_lycee_pro.json");
  const json_annuaire = await loadJson("../../data/annuaire_etablissement.json");
  const json_option = await loadJson("../../data/specialite_option.json");

  const annuaireByUai = indexByKey(json_annuaire, "identifiant_de_l_etablissement");
  const optionByUai = indexByKey(json_option, "uai_lieu_de_cours");

  const featuresGeneral = buildFeatures(
    json_taux_lycee_general,
    filieresGeneral,
    annuaireByUai,
    optionByUai
  );

  const featuresPro = buildFeatures(
    json_taux_lycee_pro,
    filieresPro,
    annuaireByUai,
    optionByUai
  );
  const resultat = duplicateByUai([...featuresGeneral, ...featuresPro]);

  const geojson = {
    type: "FeatureCollection",
    features: resultat
  };

  await saveJson("../../data/lycees.geojson", geojson);

  console.log(`GeoJSON créé : ${geojson.features.length} lycées`);
}

main().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
