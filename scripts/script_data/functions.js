import { toNumOrNull, moyenne, firstNonEmpty } from "./utils.js";

export function buildFeatures(json, filieres, annuaireByUai, optionByUai) {
  const mapLycee = {};

  for (const row of json) {
    const uai = row.uai;
    if (!uai) continue;

    if (!mapLycee[uai]) {
      mapLycee[uai] = {
        uai,
        libelle_uai: row.libelle_uai,
        departement: row.libelle_departement,
        commune: row.libelle_commune,
        taux: [],
        _collect: Object.fromEntries(Object.keys(filieres).map((k) => [k, []]))
      };
    }

    const annee = { annee: toNumOrNull(row.annee) };

    for (const [key, col] of Object.entries(filieres)) {
      const val = toNumOrNull(row[col]);
      annee[col] = val;

      if (val !== null) {
        mapLycee[uai]._collect[key].push(val);
      }
    }

    mapLycee[uai].taux.push(annee);
  }

  return Object.values(mapLycee).map((lycee) => {
    const moyennes = {};
    for (const [key, values] of Object.entries(lycee._collect)) {
      moyennes[`moyennetaux${key}`] = moyenne(values);
    }

    const ann = annuaireByUai[lycee.uai];

    const lon = ann?.position?.lon ?? ann?.longitude ?? null;
    const lat = ann?.position?.lat ?? ann?.latitude ?? null;

    let geometry = null;
    if (lon != null && lat != null) {
      geometry = {
        type: "Point",
        coordinates: [Number(lon), Number(lat)]
      };
    }

    const option =
      optionByUai[lycee.uai]?.enseignements_de_specialite_de_classe_de_1ere_generale ??
      null;

    const adresse = firstNonEmpty(ann?.adresse_1, ann?.adresse_2, ann?.adresse_3);

    const annuaireProps = {
      nom_etablissement: ann?.nom_etablissement ?? null,
      statut_public_prive: ann?.statut_public_prive ?? null,
      code_postal: ann?.code_postal ?? null,
      nom_commune: ann?.nom_commune ?? null,
      voie_professionnelle : toNumOrNull(ann?.voie_professionnelle),
      voie_technologique: toNumOrNull(ann?.voie_technologique),
      voie_generale: toNumOrNull(ann?.voie_generale),
      telephone: ann?.telephone ?? null,
      adresse: adresse,
      fax: ann?.fax ?? null,
      web: ann?.web ?? null,
      mail: ann?.mail ?? null,

      restauration: toNumOrNull(ann?.restauration),
      hebergement: toNumOrNull(ann?.hebergement),
      apprentissage: toNumOrNull(ann?.apprentissage),

      fiche_onisep: ann?.fiche_onisep ?? null
    };

    delete lycee._collect;

    return {
      type: "Feature",
      geometry,
      properties: {
        uai: lycee.uai,
        voie: lycee.voie,
        ...annuaireProps,
        option,
        taux: lycee.taux,
        moyennes
      }
    };
  });
}

export function duplicateByUai(features) {
  const map = new Map();
  for (const f of features) {
    const uai = f?.properties?.uai;
    if (!uai) continue;

    if (!map.has(uai)) map.set(uai, f);
  }
  return [...map.values()];
}


