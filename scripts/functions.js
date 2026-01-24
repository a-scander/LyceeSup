import { firstNonEmpty, toNumOrNull, parseSpecialites } from "./utils.js";
const year = 2024;

/* ============================================================
   Fonction qui extrait les taux de réussite et les mentions
   pour une ligne donnée et une liste de filières
   → Retourne un objet normalisé ou null si la ligne n'existe pas
============================================================ */
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

/* ============================================================
   Fonction qui détermine quelles filières sont réellement
   proposées par un lycée à partir des taux disponibles
   → Utilisée pour lister les options (techno / pro)
============================================================ */
export function optionsFromPicked(picked, series) {
  if (!picked) return [];
  return series.filter(k => picked[`taux_reu_${k}`] !== null);
}

/* ============================================================
   Fonction qui indexe des lignes de données par UAI
   → Ne conserve que l'année de référence (year)
   → Facilite l'accès rapide aux données par établissement
============================================================ */
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

/* ============================================================
   Fonction qui regroupe les spécialités générales par UAI
   → Évite les doublons grâce à un Set
   → Retourne une Map (uai → tableau de spécialités)
============================================================ */
export function buildSpecsByUai(rows) {
  const map = new Map();
  for (const r of rows) {
    const uai = r.uai_lieu_de_cours;
    if (!uai) continue;
    const specs = parseSpecialites(
      r.enseignements_de_specialite_de_classe_de_1ere_generale
    );
    if (!map.has(uai)) map.set(uai, new Set());
    specs.forEach(s => map.get(uai).add(s));
  }

  const out = new Map();
  for (const [uai, s] of map.entries()) out.set(uai, [...s]);
  return out;
}

/* ============================================================
   Fonction qui transforme l'annuaire des établissements
   en GeoJSON exploitable par la carte
   → Filtre les lycées valides
   → Normalise les coordonnées et les propriétés
============================================================ */
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
        geometry: {
          type: "Point",
          coordinates: [Number(e.position.lon), Number(e.position.lat)]
        },
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
          hebergement: e.hebergement ?? null,
          fiche_onisep: e.fiche_onisep ?? null,
          voie_professionnelle: e.voie_professionnelle,
          voie_generale: e.voie_generale,
          voie_technologique: e.voie_technologique
        }
      }))
  };
}

/* ============================================================
   Fonction utilitaire qui calcule la moyenne d'un tableau
   de valeurs numériques en ignorant les valeurs invalides
============================================================ */
function mean(values) {
  const valid = values.filter(v => v != null && Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/* ============================================================
   Fonction utilitaire qui extrait uniquement les taux
   de réussite (taux_reu_*) d'un objet de données
============================================================ */
function extractTaux(picked) {
  if (!picked) return [];
  return Object.entries(picked)
    .filter(([k, v]) => k.startsWith("taux_reu_") && v != null && Number.isFinite(v))
    .map(([, v]) => v);
}

/* ============================================================
   Fonction qui calcule le score global de performance
   d'un lycée à partir des scores par voie
   → Utilise une moyenne pondérée renormalisée
============================================================ */
export function computePerfScoreFromScores(
  score_general,
  score_techno,
  score_pro
) {
  const weights = {
    general: 0.4,
    techno: 0.3,
    pro: 0.3
  };

  const parts = [];
  if (score_general != null) parts.push(["general", score_general]);
  if (score_techno  != null) parts.push(["techno", score_techno]);
  if (score_pro     != null) parts.push(["pro", score_pro]);

  if (parts.length === 0) return null;

  const wSum = parts.reduce((s, [k]) => s + weights[k], 0);

  const score = parts.reduce(
    (s, [k, v]) => s + (weights[k] / wSum) * v,
    0
  );

  return Math.round(score * 10) / 10;
}

/* ============================================================
   Fonction qui calcule le score de la voie générale
   → Un seul taux, donc pas de moyenne
============================================================ */
export function computeScoreGeneral(taux_general) {
  return taux_general?.taux_reu_gnle ?? null;
}

/* ============================================================
   Fonction qui calcule le score de la voie technologique
   → Moyenne des taux de réussite disponibles
============================================================ */
export function computeScoreTechno(taux_techno) {
  const value = mean(extractTaux(taux_techno));

  if (value === null || value === undefined || isNaN(value)) {
    return null; 
  }

  return Number(value.toFixed(1));
}

/* ============================================================
   Fonction qui calcule le score de la voie professionnelle
   → Moyenne des taux de réussite disponibles
============================================================ */
export function computeScorePro(taux_pro) {
  const value = mean(extractTaux(taux_pro));

  if (value === null || value === undefined || isNaN(value)) {
    return null; 
  }

  return Number(value.toFixed(1));
}