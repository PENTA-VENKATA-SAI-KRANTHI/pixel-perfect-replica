import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Irrigation, Lang, Soil } from "./agri-data";

export interface Profile {
  name: string; district: string; state: string; soil: Soil; landAcres: number; irrigation: Irrigation; language: Lang;
}
export const DEFAULT_PROFILE: Profile = {
  name: "Ravi Kumar", district: "Srikakulam", state: "Andhra Pradesh", soil: "Red", landAcres: 2.5, irrigation: "Rainfed", language: "en",
};

const KEY = "agrimitra-profile";
interface Ctx { profile: Profile; setProfile: (p: Profile) => void; lang: Lang; setLang: (l: Lang) => void; }
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setP] = useState<Profile>(DEFAULT_PROFILE);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setP({ ...DEFAULT_PROFILE, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  const setProfile = (p: Profile) => { setP(p); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ } };
  return (
    <AppCtx.Provider value={{ profile, setProfile, lang: profile.language, setLang: (l) => setProfile({ ...profile, language: l }) }}>
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
} as const;
export type DictKey = keyof typeof DICT;
export function useT() {
  const { lang } = useApp();
  return (k: DictKey) => DICT[k][lang === "te" ? 1 : 0];
}
