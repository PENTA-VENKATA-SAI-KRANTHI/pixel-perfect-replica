/**
 * Farmer Decision Plan — pure, rule-based demo logic.
 * Explanations are derived from the SAME numbers as scoreCrop() so what the
 * farmer reads always matches the score. Scheme matches only use fields that
 * already exist in SCHEMES; anything missing is shown as "Check official source".
 */
import { CROPS, COASTAL, SCHEMES, recommend, scoreCrop, type Answer, type Crop, type Irrigation, type Scheme, type ScoreBreakdown, type ScoreInput, type Season, type Soil } from "./agri-data";

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

// ---------------- Suitability label ----------------

export type FitLevel = "good" | "possible" | "weak";
/** Plain-language label for the demo score. Not a yield or success prediction. */
export function suitability(total: number): { level: FitLevel; label: Bi } {
  if (total >= 75) return { level: "good", label: { en: "Good fit (demo score)", te: "మంచి అనుకూలత (డెమో స్కోరు)" } };
  if (total >= 50) return { level: "possible", label: { en: "Possible fit (demo score)", te: "సాధ్యమైన అనుకూలత (డెమో స్కోరు)" } };
  return { level: "weak", label: { en: "Weak fit (demo score)", te: "బలహీన అనుకూలత (డెమో స్కోరు)" } };
}

// ---------------- Scheme assessment ----------------

/** Telugu versions of the existing eligibility questions (same meaning, keyed by question id). */
export const QUESTION_TE: Record<string, string> = {
  land: "మీరు వ్యవసాయ భూమిని కలిగి ఉన్నారా లేదా సాగు చేస్తున్నారా?",
  docs: "మీకు ఆధార్ కార్డు, బ్యాంక్ ఖాతా ఉన్నాయా?",
  own: "వ్యవసాయ భూమి మీ కుటుంబం పేరున నమోదై ఉందా?",
  tax: "గత సంవత్సరం మీ కుటుంబంలో ఎవరైనా ఆదాయపు పన్ను చెల్లించారా?",
  govt: "మీ కుటుంబంలో ఎవరైనా ప్రస్తుత లేదా రిటైర్డ్ ప్రభుత్వ ఉద్యోగి / రాజ్యాంగ పదవిలో ఉన్నారా?",
  notified: "ఈ సీజన్‌లో మీ ప్రాంతంలో మీ పంట బీమాకు నోటిఫై అయిందా?",
  water: "మీకు నీటి వనరు (బోరు, కాలువ, చెరువు) ఉందా?",
  ap: "మీ వ్యవసాయ భూమి ఆంధ్రప్రదేశ్‌లో ఉందా?",
};

export type SchemeStatus = "potential" | "more-info" | "may-not-match";
export interface SchemeContext { state: string; district: string; landAcres: number; irrigation: Irrigation }
export interface SchemeAssessment { status: SchemeStatus; satisfied: Bi[]; failed: Bi[]; missing: Bi[]; verify: Bi[] }

/**
 * Compares the farmer's saved details (and any answers they gave in "Check My Eligibility")
 * against the scheme's EXISTING questions. Never returns an official decision.
 */
export function assessScheme(s: Scheme, ctx: SchemeContext, saved: Record<string, Answer> = {}): SchemeAssessment {
  const satisfied: Bi[] = [], failed: Bi[] = [], missing: Bi[] = [];
  const inAP = /andhra/i.test(ctx.state);
  for (const q of s.questions) {
    const qTe = QUESTION_TE[q.id] ?? q.text;
    const a = saved[q.id];
    if (a === "yes" || a === "no") {
      const yesTe = a === "yes" ? "అవును" : "కాదు";
      if (a === q.failOn) failed.push({ en: q.explainFail, te: `${qTe} — మీ సమాధానం: ${yesTe}` });
      else satisfied.push({ en: q.explainPass, te: `${qTe} — మీ సమాధానం: ${yesTe}` });
      continue;
    }
    if (q.id === "land" && a !== "unsure") {
      if (ctx.landAcres > 0) satisfied.push({ en: `Your profile lists ${ctx.landAcres} acres of farmland.`, te: `మీ ప్రొఫైల్‌లో ${ctx.landAcres} ఎకరాల వ్యవసాయ భూమి ఉంది.` });
      else failed.push({ en: q.explainFail, te: "మీ ప్రొఫైల్‌లో వ్యవసాయ భూమి లేదు." });
      continue;
    }
    if (q.id === "ap" && a !== "unsure" && ctx.state.trim()) {
      if (inAP) satisfied.push({ en: `Your profile state is Andhra Pradesh (${ctx.district}).`, te: `మీ ప్రొఫైల్ రాష్ట్రం ఆంధ్రప్రదేశ్ (${ctx.district}).` });
      else failed.push({ en: q.explainFail, te: "ఇది ఆంధ్రప్రదేశ్ రైతుల రాష్ట్ర పథకం; మీ ప్రొఫైల్ రాష్ట్రం వేరు." });
      continue;
    }
    if (q.id === "water" && a !== "unsure" && ctx.irrigation === "Irrigated") {
      satisfied.push({ en: "Your field is marked irrigated, so a water source is likely available.", te: "మీ పొలం నీటిపారుదల ఉన్నదిగా గుర్తించారు, కాబట్టి నీటి వనరు ఉండే అవకాశం ఉంది." });
      continue;
    }
    missing.push({ en: q.text, te: qTe });
  }
  const verify: Bi[] = [
    { en: "Final eligibility is decided only by the implementing authority.", te: "తుది అర్హతను అమలు చేసే అధికారులు మాత్రమే నిర్ణయిస్తారు." },
    s.verified
      ? { en: "Benefit and document list can change — confirm on the official portal.", te: "ప్రయోజనం, పత్రాల జాబితా మారవచ్చు — అధికారిక పోర్టల్‌లో నిర్ధారించుకోండి." }
      : { en: "Benefit and rules shown here are demo info — check official source.", te: "ఇక్కడ చూపిన ప్రయోజనం, నియమాలు డెమో సమాచారం — అధికారిక మూలాన్ని తనిఖీ చేయండి." },
  ];
  const status: SchemeStatus = failed.length ? "may-not-match" : missing.length ? "more-info" : "potential";
  return { status, satisfied, failed, missing, verify };
}

// ---------------- Action checklist ----------------

export interface ChecklistItem { id: string; title: Bi; hint: Bi }
export const CHECKLIST_IDS = ["soil-water", "sowing-window", "seed", "schemes-docs"] as const;

/** Personalised next steps after choosing a crop. Hints never invent dates or varieties. */
export function buildChecklist(c: Crop, i: ScoreInput): ChecklistItem[] {
  const irrTe = IRRIGATION_TE[i.irrigation];
  return [
    { id: "soil-water", title: { en: "Confirm soil and water availability", te: "నేల, నీటి లభ్యతను నిర్ధారించుకోండి" },
      hint: { en: `${c.name} has a ${c.water.toLowerCase()} water need. You entered ${i.soil} soil and a ${i.irrigation.toLowerCase()} field — a soil test can confirm your soil.`,
        te: `${c.te}కు నీటి అవసరం ${WATER_TE[c.water]}. మీరు ${SOIL_TE[i.soil]}, ${irrTe} పొలం అని ఇచ్చారు — మట్టి పరీక్షతో నేలను నిర్ధారించుకోండి.` } },
    { id: "sowing-window", title: { en: "Check the local sowing window", te: "స్థానిక విత్తే సమయాన్ని తనిఖీ చేయండి" },
      hint: { en: `Ask your agriculture extension officer, Rythu Seva Kendram or KVK for ${i.season} sowing dates for ${c.name} in ${i.district}.`,
        te: `${i.district}లో ${SEASON_TE[i.season]} సీజన్‌కు ${c.te} విత్తే తేదీల కోసం వ్యవసాయ విస్తరణ అధికారి, రైతు సేవా కేంద్రం లేదా KVKను అడగండి.` } },
    { id: "seed", title: { en: "Verify seed availability", te: "విత్తనాల లభ్యతను నిర్ధారించుకోండి" },
      hint: { en: `Check which ${c.name} varieties and certified seed are available locally before buying.`,
        te: `కొనే ముందు స్థానికంగా ఏ ${c.te} రకాలు, ధృవీకరించిన విత్తనాలు లభిస్తాయో తెలుసుకోండి.` } },
    { id: "schemes-docs", title: { en: "Review relevant schemes and documents", te: "సంబంధిత పథకాలు, పత్రాలను సమీక్షించండి" },
      hint: { en: "Open the related schemes, check eligibility and prepare documents from the official list.",
        te: "సంబంధిత పథకాలను తెరిచి, అర్హత తనిఖీ చేసి, అధికారిక జాబితా ప్రకారం పత్రాలు సిద్ధం చేయండి." } },
  ];
}
