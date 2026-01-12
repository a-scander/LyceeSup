
import { firstNonEmpty, toNumOrNull,parseSpecialites } from "./utils.js";
const year = 2024;

export function pickTauxRow(row, series, mentionFields) {
  if (!row) return null;

  const out = {};

  for (const k of series) {
    const col = `taux_reu_${k}`;
    out[col] = toNumOrNull(row[col]);
  }

  for (const m of mentionFields) {
    out[m] = toNumOrNull(row[m]);
  }

  return out;
}

export function optionsFromPicked(picked, series) {
  if (!picked) return [];
  return series.filter(k => picked[`taux_reu_${k}`] !== null);
}

export function buildIndexByUai(rows) {
  const map = new Map();
  for (const r of rows) {
    const uai = r.uai;
    if (!uai) continue;
    if (toNumOrNull(r.annee) !== year) continue;
    map.set(uai, r);
  }
  return map;
}

export function buildSpecsByUai(rows) {
  const map = new Map();
  for (const r of rows) {
    const uai = r.uai_lieu_de_cours;
    if (!uai) continue;
    const specs = parseSpecialites(r.enseignements_de_specialite_de_classe_de_1ere_generale);
    if (!map.has(uai)) map.set(uai, new Set());
    specs.forEach(s => map.get(uai).add(s));
  }
  const out = new Map();
  for (const [uai, s] of map.entries()) out.set(uai, [...s]);
  return out;
}

export function buildGeoJSONFromAnnuaire(annuaire) {
  return {
    type: "FeatureCollection",
    features: annuaire
      .filter(e => {
        const lon = e.position?.lon;
        const lat = e.position?.lat;
        if (lon == null || lat == null) return false;
        if (e.type_etablissement !== "Lycée" && e.type_etablissement !== "EREA") return false;
        return (
          e.voie_professionnelle !== null &&
          e.voie_generale !== null &&
          e.voie_technologique !== null
        );
      })
      .map(e => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(e.position.lon), Number(e.position.lat)] },
        properties: {
          uai: e.identifiant_de_l_etablissement,
          nom_etablissement: e.nom_etablissement,
          type_etablissement: e.type_etablissement,
          statut_public_prive: e.statut_public_prive,
          adresse: firstNonEmpty(e.adresse_1, e.adresse_2, e.adresse_3),
          commune: e.nom_commune,
          code_postal: e.code_postal,
          telephone: e.telephone ?? null,
          web: e.web ?? null,
          mail: e.mail ?? null,
          restauration: e.restauration ?? null,
          apprentissage: e.apprentissage ?? null,
          hebergement : e.hebergement ?? null,
          fiche_onisep: e.fiche_onisep ?? null,
          voie_professionnelle: e.voie_professionnelle,
          voie_generale: e.voie_generale,
          voie_technologique: e.voie_technologique
        }
      }))
  };
}
