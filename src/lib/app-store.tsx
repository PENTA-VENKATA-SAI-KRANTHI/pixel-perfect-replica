import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Answer, Irrigation, Lang, ScoreInput, Soil } from "./agri-data";

export interface Profile {
  name: string; district: string; state: string; soil: Soil; landAcres: number; irrigation: Irrigation; language: Lang;
}
/** Fictional sample farmer used for the demo. */
export const DEFAULT_PROFILE: Profile = {
  name: "Ravi Kumar", district: "Srikakulam", state: "Andhra Pradesh", soil: "Red", landAcres: 2.5, irrigation: "Rainfed", language: "en",
};

/** Farmer action plan saved on this device. */
export interface Plan {
  cropId: string | null;
  inputs: ScoreInput | null;
  checks: Record<string, boolean>;
  /** Answers the farmer gave in "Check My Eligibility", per scheme id. */
  schemeAnswers: Record<string, Record<string, Answer>>;
}
export const EMPTY_PLAN: Plan = { cropId: null, inputs: null, checks: {}, schemeAnswers: {} };

const KEY = "agrimitra-profile";
const PLAN_KEY = "agrimitra-plan";
interface Ctx {
  profile: Profile; setProfile: (p: Profile) => void; lang: Lang; setLang: (l: Lang) => void;
  plan: Plan; updatePlan: (patch: Partial<Plan>) => void; resetPlan: () => void;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setP] = useState<Profile>(DEFAULT_PROFILE);
  const [plan, setPlan] = useState<Plan>(EMPTY_PLAN);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setP({ ...DEFAULT_PROFILE, ...JSON.parse(raw) }); } catch { /* ignore */ }
    try { const raw = localStorage.getItem(PLAN_KEY); if (raw) setPlan({ ...EMPTY_PLAN, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  const setProfile = (p: Profile) => { setP(p); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ } };
  const savePlan = (next: Plan) => { try { localStorage.setItem(PLAN_KEY, JSON.stringify(next)); } catch { /* ignore */ } return next; };
  const updatePlan = (patch: Partial<Plan>) => setPlan((prev) => savePlan({ ...prev, ...patch }));
  const resetPlan = () => setPlan((prev) => savePlan({ ...EMPTY_PLAN, schemeAnswers: prev.schemeAnswers }));
  return (
    <AppCtx.Provider value={{ profile, setProfile, lang: profile.language, setLang: (l) => setProfile({ ...profile, language: l }), plan, updatePlan, resetPlan }}>
      {children}
    </AppCtx.Provider>
  );
}
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

const DICT = {
  dashboard: ["Dashboard", "డాష్‌బోర్డ్"],
  crops: ["Crop Recommendations", "పంట సిఫార్సులు"],
  schemes: ["Government Schemes", "ప్రభుత్వ పథకాలు"],
  assistant: ["AI Farming Assistant", "AI వ్యవసాయ సహాయకుడు"],
  profile: ["Farmer Profile", "రైతు ప్రొఫైల్"],
  namaste: ["Namaste, Farmer!", "నమస్తే, రైతు గారు!"],
  season: ["Current season", "ప్రస్తుత సీజన్"],
  weather: ["Weather Insights", "వాతావరణ సమాచారం"],
  soil: ["Soil", "నేల"],
  quick: ["Quick actions", "త్వరిత చర్యలు"],
  recommend: ["Recommend Crops", "పంటలు సూచించండి"],
  demo: ["Demo data", "డెమో డేటా"],
  language: ["Language", "భాష"],
  save: ["Save profile", "ప్రొఫైల్ సేవ్ చేయండి"],
  check: ["Check My Eligibility", "నా అర్హత తనిఖీ"],
  // Explainable crops
  whyCrop: ["Why this crop?", "ఈ పంట ఎందుకు?"],
  basedOn: ["Based on your inputs", "మీరు ఇచ్చిన వివరాల ఆధారంగా"],
  matched: ["Matched", "సరిపోయినవి"],
  attention: ["Needs attention", "జాగ్రత్త అవసరం"],
  neutral: ["Neutral / not assessed", "తటస్థం / అంచనా వేయలేదు"],
  whyFits: ["Why it may fit", "ఎందుకు సరిపోవచ్చు"],
  waterRisk: ["Water & risk notes", "నీరు & ప్రమాద సూచనలు"],
  precautions: ["Precautions", "జాగ్రత్తలు"],
  weatherNote: ["Weather sensitivity", "వాతావరణ ప్రభావం"],
  preliminary: [
    "Preliminary guidance only — the score is a simple rule-based demo, not a scientifically validated prediction. Check with your local agriculture officer or Rythu Seva Kendram before deciding.",
    "ఇది ప్రాథమిక మార్గదర్శనం మాత్రమే — స్కోరు సాధారణ నియమాల డెమో, శాస్త్రీయంగా ధృవీకరించిన అంచనా కాదు. నిర్ణయించే ముందు మీ స్థానిక వ్యవసాయ అధికారి లేదా రైతు సేవా కేంద్రాన్ని సంప్రదించండి.",
  ],
  relatedSupport: ["Explore related support", "సంబంధిత సహాయం చూడండి"],
  potentiallyRelevant: ["Potentially relevant — check eligibility", "సంబంధం ఉండవచ్చు — అర్హత తనిఖీ చేయండి"],
  openInSchemes: ["Open in Schemes", "పథకాల పేజీలో తెరవండి"],
  allRelated: ["See all related schemes", "అన్ని సంబంధిత పథకాలు చూడండి"],
  choosePlan: ["Choose for my plan", "నా ప్రణాళికకు ఎంచుకోండి"],
  inPlan: ["In my plan", "నా ప్రణాళికలో ఉంది"],
  actionPlan: ["My farm action plan", "నా వ్యవసాయ కార్యాచరణ ప్రణాళిక"],
  savedDevice: ["Saved on this device", "ఈ పరికరంలో సేవ్ అయింది"],
  stepsDone: ["steps done", "దశలు పూర్తయ్యాయి"],
  clearPlan: ["Clear plan", "ప్రణాళిక తొలగించండి"],
  howWorks: ["How recommendations work", "సిఫార్సులు ఎలా పనిచేస్తాయి"],
  listen: ["Listen", "వినండి"],
  stop: ["Stop", "ఆపండి"],
  noTeVoice: ["Telugu voice not available on this device", "ఈ పరికరంలో తెలుగు వాయిస్ అందుబాటులో లేదు"],
  compare: ["Compare crops", "పంటలను పోల్చండి"],
  // Scheme matching
  potentialMatch: ["Potential match", "సరిపోయే అవకాశం ఉంది"],
  moreInfo: ["More information needed", "మరింత సమాచారం అవసరం"],
  mayNotMatch: ["May not match", "సరిపోకపోవచ్చు"],
  whyStatus: ["Why this status?", "ఈ స్థితి ఎందుకు?"],
  satisfied: ["Your details that meet known criteria", "తెలిసిన నిబంధనలకు సరిపోయే మీ వివరాలు"],
  failed: ["Details that may not meet criteria", "నిబంధనలకు సరిపోకపోవచ్చు"],
  missing: ["Details still missing", "ఇంకా తెలియని వివరాలు"],
  verify: ["Needs official verification", "అధికారిక ధృవీకరణ అవసరం"],
  checkOfficial: ["Check official source", "అధికారిక మూలాన్ని తనిఖీ చేయండి"],
  cropContext: ["Showing support related to your crop", "మీ పంటకు సంబంధించిన సహాయం చూపిస్తున్నాం"],
  clear: ["Clear", "తొలగించు"],
  // Demo transparency
  sampleWeather: ["Sample weather data", "నమూనా వాతావరణ డేటా"],
  noWeatherApi: ["Demo mode — no live weather API connected", "డెమో మోడ్ — ప్రత్యక్ష వాతావరణ సేవ అనుసంధానం కాలేదు"],
  buildPlan: ["Build my farm plan", "నా వ్యవసాయ ప్రణాళిక తయారు చేయండి"],
  continuePlan: ["Continue my plan", "నా ప్రణాళిక కొనసాగించండి"],
  noPlan: ["Pick a crop on the Crops page to get a personalised checklist.", "వ్యక్తిగత చెక్‌లిస్ట్ కోసం పంటల పేజీలో ఒక పంటను ఎంచుకోండి."],
  sampleFarmer: ["Fictional sample farmer", "కల్పిత నమూనా రైతు"],
} as const;
export type DictKey = keyof typeof DICT;
export function useT() {
  const { lang } = useApp();
  return (k: DictKey) => DICT[k][lang === "te" ? 1 : 0];
}
/** Pick the right language from a bilingual {en, te} pair. */
export function useBi() {
  const { lang } = useApp();
  return (b: { en: string; te: string }) => (lang === "te" ? b.te : b.en);
}
