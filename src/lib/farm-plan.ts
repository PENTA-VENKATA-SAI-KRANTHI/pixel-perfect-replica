/**
 * Farmer Decision Plan — pure, rule-based demo logic.
 * Explanations are derived from the SAME numbers as scoreCrop() so what the
 * farmer reads always matches the score. Scheme matches only use fields that
 * already exist in SCHEMES; anything missing is shown as "Check official source".
 */
import { CROPS, COASTAL, SCHEMES, recommend, scoreCrop, type Crop, type Irrigation, type Scheme, type ScoreBreakdown, type ScoreInput, type Season, type Soil } from "./agri-data";

export interface Bi { en: string; te: string }

export const SOIL_TE: Record<Soil, string> = { Red: "ఎర్ర నేల", Black: "నల్ల రేగడి నేల", Alluvial: "ఒండ్రు నేల", Sandy: "ఇసుక నేల", Loamy: "గరప నేల" };
export const SEASON_TE: Record<Season, string> = { Kharif: "ఖరీఫ్", Rabi: "రబీ", Zaid: "జాయిద్ (వేసవి)" };
export const IRRIGATION_TE: Record<Irrigation, string> = { Rainfed: "వర్షాధారం", Irrigated: "నీటిపారుదల ఉంది" };
export const WATER_TE: Record<Crop["water"], string> = { Low: "తక్కువ", Medium: "మధ్యస్థం", High: "ఎక్కువ" };

export const FACTOR_MAX = { soil: 35, season: 30, water: 25, region: 10 } as const;
export type FactorKey = keyof typeof FACTOR_MAX;
export type FactorStatus = "match" | "attention" | "neutral";

export interface Factor { key: FactorKey; label: Bi; points: number; max: number; status: FactorStatus; detail: Bi }

export const FACTOR_LABEL: Record<FactorKey, Bi> = {
  soil: { en: "Soil fit", te: "నేల అనుకూలత" },
  season: { en: "Season fit", te: "సీజన్ అనుకూలత" },
  water: { en: "Water / irrigation fit", te: "నీరు / నీటిపారుదల అనుకూలత" },
  region: { en: "Region", te: "ప్రాంతం" },
};

export interface CropExplanation {
  crop: Crop;
  score: ScoreBreakdown;
  factors: Factor[];
  /** Soil / season / region factors that matched (water is shown separately). */
  matched: Factor[];
  attention: Factor[];
  neutral: Factor[];
  water: Factor;
  why: Bi;
  weather: Bi;
  precaution: Bi;
}

export function explainCrop(c: Crop, i: ScoreInput): CropExplanation {
  const score = scoreCrop(c, i);
  const soilTe = SOIL_TE[i.soil];
  const seasonTe = SEASON_TE[i.season];

  const soil: Factor = {
    key: "soil", label: FACTOR_LABEL.soil, points: score.soil, max: FACTOR_MAX.soil,
    status: score.soil >= 25 ? "match" : "attention",
    detail: score.soil === 35
      ? { en: `${i.soil} soil is this crop's best-listed soil.`, te: `${soilTe} ఈ పంటకు అత్యంత అనువైన నేల.` }
      : score.soil === 25
        ? { en: `${i.soil} soil is in this crop's suitable list (${c.soils.join(", ")}).`, te: `${soilTe} ఈ పంటకు అనువైన నేలల జాబితాలో ఉంది.` }
        : { en: `${i.soil} soil is not in this crop's suitable list (${c.soils.join(", ")}). Get a soil test before deciding.`, te: `${soilTe} ఈ పంటకు అనువైన నేలల్లో లేదు. నిర్ణయించే ముందు మట్టి పరీక్ష చేయించండి.` },
  };

  const season: Factor = {
    key: "season", label: FACTOR_LABEL.season, points: score.season, max: FACTOR_MAX.season,
    status: score.season > 0 ? "match" : "attention",
    detail: score.season === 30
      ? { en: `${i.season} is this crop's main season.`, te: `${seasonTe} ఈ పంటకు ప్రధాన సీజన్.` }
      : score.season === 20
        ? { en: `Can be grown in ${i.season}, though its main season is ${c.seasons[0]}.`, te: `${seasonTe}లో కూడా వేయవచ్చు, కానీ ప్రధాన సీజన్ ${SEASON_TE[c.seasons[0]!]}.` }
        : { en: `Not usually grown in ${i.season} (grown in ${c.seasons.join(", ")}).`, te: `${seasonTe}లో సాధారణంగా ఈ పంట వేయరు.` },
  };

  let waterDetail: Bi;
  if (i.irrigation === "Rainfed") {
    waterDetail = c.water === "Low"
      ? { en: "Low water need — suits rainfed fields.", te: "నీటి అవసరం తక్కువ — వర్షాధార పొలాలకు సరిపోతుంది." }
      : c.water === "Medium"
        ? { en: "Medium water need — plan protective irrigation for dry spells.", te: "నీటి అవసరం మధ్యస్థం — వర్షం లేని రోజుల్లో రక్షక నీటిపారుదల ఏర్పాటు చేసుకోండి." }
        : { en: "High water need — risky on a rainfed field without assured water.", te: "నీటి అవసరం ఎక్కువ — నమ్మకమైన నీరు లేని వర్షాధార పొలంలో ప్రమాదం." };
  } else {
    waterDetail = c.water === "High"
      ? { en: "High water need is covered by your irrigation.", te: "ఎక్కువ నీటి అవసరం మీ నీటిపారుదలతో తీరుతుంది." }
      : { en: `${c.water} water need — your irrigation is more than enough.`, te: `నీటి అవసరం ${WATER_TE[c.water]} — మీ నీటిపారుదల సరిపోతుంది.` };
  }
  const water: Factor = {
    key: "water", label: FACTOR_LABEL.water, points: score.water, max: FACTOR_MAX.water,
    status: score.water >= 20 ? "match" : "attention", detail: waterDetail,
  };

  const coastal = COASTAL.has(i.district);
  const region: Factor = {
    key: "region", label: FACTOR_LABEL.region, points: score.region, max: FACTOR_MAX.region,
    status: score.region === 10 ? "match" : "neutral",
    detail: score.region === 10
      ? { en: `Commonly grown in coastal districts like ${i.district}.`, te: `${i.district} వంటి తీర జిల్లాల్లో సాధారణంగా పండిస్తారు.` }
      : c.coastalBonus && !coastal
        ? { en: `Coastal bonus does not apply to ${i.district}.`, te: `${i.district}కు తీర ప్రాంత బోనస్ వర్తించదు.` }
        : { en: "No district-specific bonus in this demo.", te: "ఈ డెమోలో జిల్లా ప్రత్యేక బోనస్ లేదు." },
  };

  const factors = [soil, season, water, region];
  const others = [soil, season, region];
  return {
    crop: c, score, factors, water,
    matched: others.filter((f) => f.status === "match"),
    attention: others.filter((f) => f.status === "attention"),
    neutral: others.filter((f) => f.status === "neutral"),
    why: { en: c.why, te: c.whyTe },
    weather: { en: c.weather, te: c.weatherTe },
    precaution: { en: c.limits, te: c.limitsTe },
  };
}

/** Top-3 crops explained, plus the farmer's preferred crop if it is not already in the top 3. */
export function planCrops(i: ScoreInput, preference?: string | null): { top: CropExplanation[]; preferred: CropExplanation | null } {
  const top = recommend(i, 3).map((r) => explainCrop(r.crop, i));
  const pref = preference && preference !== "none" && !top.some((e) => e.crop.id === preference) ? CROPS.find((c) => c.id === preference) : undefined;
  return { top, preferred: pref ? explainCrop(pref, i) : null };
}

export function findCrop(id: string | null | undefined): Crop | null {
  return CROPS.find((c) => c.id === id) ?? null;
}

// ---------------- Scheme matches ----------------

export interface SchemeMatch {
  scheme: Scheme;
  reason: Bi;
  priority: number;
  /** Eligibility questions copied from the existing scheme record. */
  checks: string[];
  /** Document list copied from the existing scheme record. */
  documents: string[];
  /** Only set when the scheme record is marked verified; otherwise UI shows "Check official source". */
  benefit: string | null;
}

export function matchSchemes(i: ScoreInput, crop: Crop | null): SchemeMatch[] {
  const rainfed = i.irrigation === "Rainfed";
  const cropName = crop?.name ?? "your crop";
  const cropTe = crop?.te ?? "మీ పంట";
  const soilWeak = crop ? scoreCrop(crop, i).soil < 25 : false;
  const thirsty = crop ? crop.water !== "Low" : false;

  const rules: Record<string, { reason: Bi; priority: number } | null> = {
    pmfby: {
      priority: rainfed ? 90 : 80,
      reason: {
        en: `Crop insurance can protect ${cropName} against weather losses${rainfed ? " — rainfed fields carry higher weather risk" : ""}. Only notified crops in notified areas are covered, so check whether ${cropName} is notified in ${i.district} this season.`,
        te: `పంట బీమా వాతావరణ నష్టం నుంచి ${cropTe}ను రక్షించగలదు${rainfed ? " — వర్షాధార పొలాలకు వాతావరణ ప్రమాదం ఎక్కువ" : ""}. నోటిఫై చేసిన పంటలు, ప్రాంతాలకు మాత్రమే వర్తిస్తుంది — ఈ సీజన్‌లో ${i.district}లో ${cropTe} నోటిఫై అయిందో తనిఖీ చేయండి.`,
      },
    },
    shc: {
      priority: soilWeak ? 88 : 60,
      reason: soilWeak
        ? { en: `Your ${i.soil} soil is not a strong match for ${cropName}. A soil test confirms your soil type and nutrients before you decide.`, te: `మీ ${SOIL_TE[i.soil]} ${cropTe}కు బలమైన అనుకూలత కాదు. నిర్ణయించే ముందు మట్టి పరీక్ష మీ నేల రకం, పోషకాలను నిర్ధారిస్తుంది.` }
        : { en: `A soil test confirms the ${i.soil} soil you entered and guides fertilizer use before sowing ${cropName}.`, te: `మీరు ఇచ్చిన ${SOIL_TE[i.soil]}ను మట్టి పరీక్ష నిర్ధారిస్తుంది, ${cropTe} విత్తే ముందు ఎరువుల వాడకానికి సహాయపడుతుంది.` },
    },
    pmksy: rainfed || thirsty ? {
      priority: rainfed && crop?.water === "High" ? 89 : rainfed ? 75 : 55,
      reason: rainfed
        ? { en: "Your field is rainfed. Drip or sprinkler irrigation may reduce dry-spell risk — this needs a water source such as a borewell, canal or tank.", te: "మీ పొలం వర్షాధారం. డ్రిప్ లేదా స్ప్రింక్లర్ వర్షం లేని రోజుల ప్రమాదాన్ని తగ్గించవచ్చు — దీనికి బోరు, కాలువ లేదా చెరువు వంటి నీటి వనరు అవసరం." }
        : { en: `${cropName} has a ${crop?.water.toLowerCase()} water need; micro irrigation may help use your water more efficiently.`, te: `${cropTe}కు నీటి అవసరం ${crop ? WATER_TE[crop.water] : ""}; సూక్ష్మ నీటిపారుదల నీటిని పొదుపుగా వాడటానికి సహాయపడవచ్చు.` },
    } : null,
    pmkisan: {
      priority: 70,
      reason: { en: "Income support for landholding farmer families. Exclusions apply (for example income-tax payers and government employees) — check them before applying.", te: "భూమి ఉన్న రైతు కుటుంబాలకు ఆదాయ సహాయం. మినహాయింపులు ఉన్నాయి (ఉదా: ఆదాయపు పన్ను చెల్లించేవారు, ప్రభుత్వ ఉద్యోగులు) — దరఖాస్తుకు ముందు తనిఖీ చేయండి." },
    },
    kcc: {
      priority: 65,
      reason: { en: `Short-term crop loans can help with seed and input costs for ${cropName} this ${i.season} season.`, te: `ఈ ${SEASON_TE[i.season]} సీజన్‌లో ${cropTe} విత్తనాలు, ఇతర ఖర్చులకు స్వల్పకాలిక పంట రుణం సహాయపడవచ్చు.` },
    },
    "ap-annadata": {
      priority: 50,
      reason: { en: `State support for Andhra Pradesh farmers — your land is in ${i.district}. Name, amount and rules change across years; ask your Rythu Seva Kendram.`, te: `ఆంధ్రప్రదేశ్ రైతులకు రాష్ట్ర సహాయం — మీ భూమి ${i.district}లో ఉంది. పేరు, మొత్తం, నియమాలు ఏటా మారుతాయి; రైతు సేవా కేంద్రంలో అడగండి.` },
    },
    smam: {
      priority: 45,
      reason: { en: "Support for farm machinery and custom hiring — may help with sowing and harvest labour.", te: "వ్యవసాయ యంత్రాలు, అద్దె యంత్ర కేంద్రాలకు సహాయం — విత్తడం, కోత కూలీ సమస్యకు ఉపయోగపడవచ్చు." },
    },
  };

  return SCHEMES.flatMap((s) => {
    const r = rules[s.id];
    if (!r) return [];
    return [{ scheme: s, reason: r.reason, priority: r.priority, checks: s.questions.map((q) => q.text), documents: s.documents, benefit: s.verified ? s.benefit : null }];
  }).sort((a, b) => b.priority - a.priority);
}

// ---------------- Action checklist ----------------

export interface ChecklistItem { id: string; en: string; te: string; hintEn: string; hintTe: string }

export const CHECKLIST: ChecklistItem[] = [
  { id: "crop-fit", en: "Review the crop fit for my chosen crop", te: "నేను ఎంచుకున్న పంట అనుకూలతను సమీక్షించాలి",
    hintEn: "Read the 'needs attention' factors and the precautions.", hintTe: "'జాగ్రత్త అవసరం' అంశాలు, జాగ్రత్తలు చదవండి." },
  { id: "sowing-calendar", en: "Confirm the local sowing calendar with the agriculture extension officer / KVK", te: "స్థానిక విత్తే సమయాన్ని వ్యవసాయ విస్తరణ అధికారి / KVK వద్ద నిర్ధారించుకోవాలి",
    hintEn: "Your Rythu Seva Kendram or Krishi Vigyan Kendra knows local dates and varieties.", hintTe: "రైతు సేవా కేంద్రం లేదా కృషి విజ్ఞాన కేంద్రానికి స్థానిక తేదీలు, రకాలు తెలుసు." },
  { id: "verify-schemes", en: "Verify scheme details on the official portal", te: "పథకాల వివరాలను అధికారిక పోర్టల్‌లో ధృవీకరించాలి",
    hintEn: "AgriMitra shows possible matches only — not official eligibility.", hintTe: "AgriMitra సాధ్యమైన పథకాలను మాత్రమే చూపుతుంది — అధికారిక అర్హత కాదు." },
  { id: "documents", en: "Prepare documents only after checking each scheme's requirements", te: "ప్రతి పథకం అవసరాలు తనిఖీ చేసిన తర్వాతే పత్రాలు సిద్ధం చేయాలి",
    hintEn: "Requirements can change; use the official list.", hintTe: "అవసరాలు మారవచ్చు; అధికారిక జాబితాను ఉపయోగించండి." },
];
