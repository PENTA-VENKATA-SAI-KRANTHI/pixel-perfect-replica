import paddyImg from "@/assets/crop-paddy.jpg";
import groundnutImg from "@/assets/crop-groundnut.jpg";
import maizeImg from "@/assets/crop-maize.jpg";
import pulsesImg from "@/assets/crop-pulses.jpg";

export type Soil = "Red" | "Black" | "Alluvial" | "Sandy" | "Loamy";
export type Season = "Kharif" | "Rabi" | "Zaid";
export type Irrigation = "Rainfed" | "Irrigated";
export type Lang = "en" | "te";

export const DISTRICTS = [
  "Srikakulam", "Vizianagaram", "Visakhapatnam", "East Godavari", "West Godavari",
  "Krishna", "Guntur", "Prakasam", "Nellore", "Kurnool", "Anantapur", "Kadapa", "Chittoor",
];
export const COASTAL = new Set(["Srikakulam", "Vizianagaram", "Visakhapatnam", "East Godavari", "West Godavari", "Krishna", "Guntur", "Prakasam", "Nellore"]);
export const SOILS: Soil[] = ["Red", "Black", "Alluvial", "Sandy", "Loamy"];
export const SEASONS: Season[] = ["Kharif", "Rabi", "Zaid"];
export const IRRIGATIONS: Irrigation[] = ["Rainfed", "Irrigated"];

export interface Crop {
  id: string;
  name: string;
  te: string;
  image: string;
  soils: Soil[];
  seasons: Season[];
  water: "Low" | "Medium" | "High";
  coastalBonus: boolean;
  why: string;
  weather: string;
  limits: string;
}

export const CROPS: Crop[] = [
  { id: "paddy", name: "Paddy (Rice)", te: "వరి", image: paddyImg, soils: ["Alluvial", "Loamy", "Black"], seasons: ["Kharif", "Rabi"], water: "High", coastalBonus: true,
    why: "Widely grown staple in coastal Andhra; clay-rich alluvial and loamy soils hold standing water well.",
    weather: "Needs assured water through tillering and flowering; heavy cyclone-season rain can cause lodging.",
    limits: "High water demand — risky without irrigation or reliable monsoon. Watch for pests like stem borer." },
  { id: "groundnut", name: "Groundnut", te: "వేరుశనగ", image: groundnutImg, soils: ["Red", "Sandy", "Loamy"], seasons: ["Kharif", "Rabi"], water: "Low", coastalBonus: false,
    why: "Well-drained red and sandy soils suit pod development; tolerant of moderate dry spells.",
    weather: "Avoid waterlogging; dry weather at harvest helps pod quality.",
    limits: "Prolonged drought at pegging stage reduces pods. Market prices fluctuate." },
  { id: "maize", name: "Maize", te: "మొక్కజొన్న", image: maizeImg, soils: ["Loamy", "Alluvial", "Red", "Black"], seasons: ["Kharif", "Rabi", "Zaid"], water: "Medium", coastalBonus: false,
    why: "Adaptable across soils and seasons; good fit for rotation after paddy.",
    weather: "Sensitive to waterlogging and to heat stress at tasseling.",
    limits: "Fall armyworm risk; needs moderate irrigation in Rabi/Zaid." },
  { id: "blackgram", name: "Black Gram (Urad)", te: "మినుములు", image: pulsesImg, soils: ["Black", "Loamy", "Alluvial", "Red"], seasons: ["Rabi", "Kharif", "Zaid"], water: "Low", coastalBonus: true,
    why: "Short-duration pulse that fits rice-fallow systems and adds nitrogen to the soil.",
    weather: "Grows on residual moisture; unseasonal rain at maturity can damage pods.",
    limits: "Yellow mosaic virus risk. Lower returns per acre than cash crops." },
  { id: "ragi", name: "Ragi (Finger Millet)", te: "రాగులు", image: pulsesImg, soils: ["Red", "Sandy", "Loamy"], seasons: ["Kharif", "Zaid"], water: "Low", coastalBonus: false,
    why: "Hardy millet for rainfed upland plots; tolerates poorer soils.",
    weather: "Handles dry spells well; heavy rain at harvest affects grain.",
    limits: "Smaller market in some districts; manual harvesting can be labour-intensive." },
  { id: "greengram", name: "Green Gram (Moong)", te: "పెసలు", image: pulsesImg, soils: ["Loamy", "Red", "Sandy", "Alluvial"], seasons: ["Zaid", "Kharif", "Rabi"], water: "Low", coastalBonus: false,
    why: "Very short duration (about 60–70 days) — useful as a summer catch crop.",
    weather: "Needs warm, dry weather; susceptible to excess moisture.",
    limits: "Uneven pod maturity may need multiple pickings." },
];

export interface ScoreInput { district: string; soil: Soil; season: Season; irrigation: Irrigation; landAcres: number; }
export interface ScoreBreakdown { soil: number; season: number; water: number; region: number; total: number; }

/** Transparent DEMO scoring (0–100). Not a scientific prediction. */
export function scoreCrop(c: Crop, i: ScoreInput): ScoreBreakdown {
  const soil = c.soils[0] === i.soil ? 35 : c.soils.includes(i.soil) ? 25 : 5;
  const season = c.seasons[0] === i.season ? 30 : c.seasons.includes(i.season) ? 20 : 0;
  let water = 20;
  if (i.irrigation === "Rainfed") water = c.water === "Low" ? 25 : c.water === "Medium" ? 12 : 0;
  else water = c.water === "High" ? 25 : 20;
  const region = c.coastalBonus && COASTAL.has(i.district) ? 10 : 5;
  return { soil, season, water, region, total: Math.min(100, soil + season + water + region) };
}

export function recommend(i: ScoreInput, n = 3) {
  return CROPS.map((c) => ({ crop: c, score: scoreCrop(c, i) }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, n);
}

export function currentSeason(d = new Date()): Season {
  const m = d.getMonth() + 1;
  if (m >= 6 && m <= 10) return "Kharif";
  if (m >= 11 || m <= 2) return "Rabi";
  return "Zaid";
}

export type Category = "Income Support" | "Crop Insurance" | "Irrigation" | "Mechanization" | "Credit" | "Soil Health";

export interface Question { id: string; text: string; failOn: "yes" | "no"; explainFail: string; explainPass: string; }
export interface Scheme {
  id: string; name: string; category: Category; state: "Central" | "Andhra Pradesh";
  beneficiary: string; benefit: string; verified: boolean; documents: string[]; steps: string[]; url: string;
  questions: Question[];
}

const Q_LAND: Question = { id: "land", text: "Do you own or cultivate agricultural land?", failOn: "no", explainFail: "This scheme is meant for people who own or cultivate farmland.", explainPass: "You cultivate farmland, which is a basic requirement." };
const Q_DOCS: Question = { id: "docs", text: "Do you have an Aadhaar card and a bank account?", failOn: "no", explainFail: "Aadhaar and a bank account are typically needed for direct benefit transfer.", explainPass: "You have the identity and bank documents usually required." };

export const SCHEMES: Scheme[] = [
  { id: "pmkisan", name: "PM-KISAN", category: "Income Support", state: "Central",
    beneficiary: "Landholding farmer families (subject to exclusion criteria)",
    benefit: "₹6,000 per year, paid in three instalments of ₹2,000 directly to bank accounts.", verified: true,
    documents: ["Aadhaar card", "Land ownership records", "Bank account linked to Aadhaar", "Mobile number"],
    steps: ["Visit pmkisan.gov.in and choose 'New Farmer Registration'", "Enter Aadhaar and state details", "Submit land records for verification by the state", "Complete e-KYC (OTP or biometric)"],
    url: "https://pmkisan.gov.in",
    questions: [
      { id: "own", text: "Is the farmland registered in your family's name?", failOn: "no", explainFail: "PM-KISAN is for landholding farmer families; tenant farmers are generally not covered.", explainPass: "You hold land in your family's name." },
      { id: "tax", text: "Did anyone in your family pay income tax last year?", failOn: "yes", explainFail: "Income-tax payers are listed in the official exclusion criteria.", explainPass: "No income-tax payer in the family." },
      { id: "govt", text: "Is any family member a serving or retired government employee / constitutional post holder?", failOn: "yes", explainFail: "Government employees and certain pensioners are excluded (some Group D / MTS exceptions apply).", explainPass: "No exclusion due to government employment." },
      Q_DOCS,
    ] },
  { id: "pmfby", name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)", category: "Crop Insurance", state: "Central",
    beneficiary: "Farmers (including tenants and sharecroppers) growing notified crops in notified areas",
    benefit: "Crop insurance with farmer premium of 2% (Kharif), 1.5% (Rabi) and 5% (commercial/horticulture) of sum insured.", verified: true,
    documents: ["Aadhaar card", "Land records or tenancy/sowing certificate", "Bank passbook", "Sowing declaration"],
    steps: ["Apply via bank, CSC, or pmfby.gov.in before the season cut-off date", "Select notified crop and area", "Pay farmer share of premium", "Report crop loss within 72 hours via app/helpline"],
    url: "https://pmfby.gov.in",
    questions: [
      Q_LAND,
      { id: "notified", text: "Is your crop notified for insurance in your area this season?", failOn: "no", explainFail: "Only notified crops in notified areas are covered.", explainPass: "Your crop is notified in your area." },
      Q_DOCS,
    ] },
  { id: "pmksy", name: "PMKSY — Per Drop More Crop (Micro Irrigation)", category: "Irrigation", state: "Central",
    beneficiary: "Farmers adopting drip / sprinkler irrigation",
    benefit: "Financial assistance for micro-irrigation systems. Demo information — verify official subsidy rates with the state agriculture / APMIP office.", verified: false,
    documents: ["Aadhaar card", "Land records", "Bank passbook", "Water source details", "Quotation from registered supplier"],
    steps: ["Contact district APMIP / agriculture office", "Field inspection and system design", "Install via registered company", "Subsidy released after verification"],
    url: "https://pmksy.gov.in",
    questions: [Q_LAND, { id: "water", text: "Do you have a water source (borewell, canal, tank)?", failOn: "no", explainFail: "A water source is needed to install micro irrigation.", explainPass: "You have a water source for micro irrigation." }, Q_DOCS] },
  { id: "smam", name: "Sub-Mission on Agricultural Mechanization (SMAM)", category: "Mechanization", state: "Central",
    beneficiary: "Farmers, especially small and marginal, and Custom Hiring Centres",
    benefit: "Assistance for farm machinery and custom hiring centres. Demo information — verify official requirements and subsidy percentages.", verified: false,
    documents: ["Aadhaar card", "Land records", "Bank passbook", "Caste certificate (if applicable)"],
    steps: ["Register on agrimachinery.nic.in", "Select machine and dealer", "Await approval / lottery", "Purchase and upload invoice for subsidy"],
    url: "https://agrimachinery.nic.in",
    questions: [Q_LAND, Q_DOCS] },
  { id: "kcc", name: "Kisan Credit Card (KCC)", category: "Credit", state: "Central",
    beneficiary: "Farmers, tenant farmers, sharecroppers, and SHGs/JLGs",
    benefit: "Short-term crop loans with interest subvention. Demo information — verify current limits and rates with your bank.", verified: false,
    documents: ["Aadhaar card", "Land records or tenancy proof", "Passport photo", "Bank application form"],
    steps: ["Visit your bank branch or apply online", "Submit KYC and land/crop details", "Bank assesses credit limit", "Receive RuPay KCC card"],
    url: "https://www.myscheme.gov.in/schemes/kcc",
    questions: [Q_LAND, Q_DOCS] },
  { id: "shc", name: "Soil Health Card", category: "Soil Health", state: "Central",
    beneficiary: "All farmers",
    benefit: "Soil testing report with nutrient status and fertilizer recommendations.", verified: true,
    documents: ["Aadhaar card", "Land / survey number"],
    steps: ["Contact local agriculture office or Rythu Seva Kendram", "Soil sample is collected from your field", "Download card from soilhealth.dac.gov.in"],
    url: "https://soilhealth.dac.gov.in",
    questions: [Q_LAND] },
  { id: "ap-annadata", name: "AP State Farmer Investment Support", category: "Income Support", state: "Andhra Pradesh",
    beneficiary: "Farmers in Andhra Pradesh",
    benefit: "Demo information — verify official requirements. Scheme name, amount and eligibility change across years; check with your Rythu Seva Kendram.", verified: false,
    documents: ["Aadhaar card", "Land records / CCRC for tenants", "Bank passbook"],
    steps: ["Visit village Rythu Seva Kendram", "Verify e-crop booking", "Complete e-KYC"],
    url: "https://apagrisnet.gov.in",
    questions: [Q_LAND, { id: "ap", text: "Is your farmland located in Andhra Pradesh?", failOn: "no", explainFail: "This is a state scheme for Andhra Pradesh farmers.", explainPass: "Your land is in Andhra Pradesh." }, Q_DOCS] },
];

export type Answer = "yes" | "no" | "unsure";
export type Verdict = "eligible" | "more-info" | "ineligible";

export function evaluate(s: Scheme, answers: Record<string, Answer>) {
  const reasons: { ok: boolean | null; text: string }[] = s.questions.map((q) => {
    const a = answers[q.id];
    if (!a || a === "unsure") return { ok: null, text: `Need to confirm: ${q.text}` };
    return a === q.failOn ? { ok: false, text: q.explainFail } : { ok: true, text: q.explainPass };
  });
  const verdict: Verdict = reasons.some((r) => r.ok === false) ? "ineligible" : reasons.some((r) => r.ok === null) ? "more-info" : "eligible";
  return { verdict, reasons };
}

export const WEATHER = { temp: 29, condition: "Partly cloudy", humidity: 78, rainfall: "12 mm expected next 3 days", wind: "14 km/h" };
