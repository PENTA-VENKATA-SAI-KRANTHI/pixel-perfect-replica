import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Leaf, UserRound } from "lucide-react";
import { PageHeader, DemoBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp, useT } from "@/lib/app-store";
import { currentSeason, recommend, WEATHER, type Lang } from "@/lib/agri-data";
import type { Profile } from "@/lib/app-store";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Farming Assistant — AgriMitra AI" },
      { name: "description", content: "Ask farming questions in Telugu or English about crops, schemes and weather." },
      { property: "og:title", content: "AI Farming Assistant — AgriMitra AI" },
      { property: "og:description", content: "Bilingual farming assistant for Andhra Pradesh farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

interface Msg { role: "user" | "bot"; text: string }

const SUGGEST: Record<Lang, string[]> = {
  en: ["Which crops are suitable for my soil?", "Why was groundnut recommended?", "Which government schemes may apply to me?", "What documents do I need?", "Explain this in Telugu.", "How is the weather this week?"],
  te: ["నా నేలకు ఏ పంటలు సరిపోతాయి?", "వేరుశనగ ఎందుకు సూచించబడింది?", "నాకు ఏ ప్రభుత్వ పథకాలు వర్తించవచ్చు?", "నాకు ఏ పత్రాలు అవసరం?", "వాతావరణం ఎలా ఉంది?"],
};

export function demoReply(q: string, lang: Lang, p: Profile): { text: string; lang: Lang } {
  const s = q.toLowerCase();
  const season = currentSeason();
  const top = recommend({ district: p.district, soil: p.soil, season, irrigation: p.irrigation, landAcres: p.landAcres });
  const names = top.map((r) => r.crop.name).join(", ");
  const namesTe = top.map((r) => r.crop.te).join(", ");
  const wantTe = lang === "te" || /telugu|తెలుగు/.test(s);

  if (/telugu|తెలుగు|explain/.test(s) || ((/groundnut|వేరుశనగ/.test(s)) && wantTe)) {
    return { lang: "te", text: `మీ ${p.district} పొలంలో ${p.soil === "Red" ? "ఎర్ర" : p.soil} నేల ఉంది. ${season} సీజన్‌కు ${namesTe} పంటలు బాగా సరిపోతాయి. వేరుశనగ నీరు బాగా ఇంకే ఎర్ర, ఇసుక నేలల్లో బాగా పెరుగుతుంది మరియు తక్కువ నీటితో పండుతుంది. అయితే కాయలు ఏర్పడే సమయంలో ఎక్కువ కాలం వర్షం లేకపోతే దిగుబడి తగ్గవచ్చు. దయచేసి మీ స్థానిక వ్యవసాయ అధికారిని లేదా రైతు సేవా కేంద్రాన్ని సంప్రదించండి.` };
  }
  if (/groundnut|వేరుశనగ/.test(s)) return { lang, text: `Groundnut scores well because it prefers well-drained red, sandy and loamy soils and has low water needs — a good fit for ${p.irrigation.toLowerCase()} fields like yours. Watch out: long dry spells at the pegging stage reduce pod formation, and waterlogging harms the crop.` };
  if (/soil|crop|నేల|పంట/.test(s)) return wantTe
    ? { lang: "te", text: `${p.soil} నేల, ${season} సీజన్, ${p.irrigation === "Rainfed" ? "వర్షాధార" : "నీటిపారుదల"} పరిస్థితుల ఆధారంగా: ${namesTe}. ఇవి డెమో స్కోర్లు మాత్రమే.` }
    : { lang, text: `For ${p.soil} soil in ${p.district} during ${season} with ${p.irrigation.toLowerCase()} conditions, the top demo matches are: ${names}. Open Crop Recommendations to see the score breakdown.` };
  if (/scheme|పథక/.test(s)) return wantTe
    ? { lang: "te", text: "మీకు వర్తించే అవకాశం ఉన్న పథకాలు: PM-KISAN (సంవత్సరానికి ₹6,000), PMFBY (పంట బీమా), సాయిల్ హెల్త్ కార్డ్. అధికారిక అర్హతను తప్పక ధృవీకరించండి." }
    : { lang, text: "Schemes that may apply: PM-KISAN (₹6,000/year income support for landholding families), PMFBY (crop insurance — 2% premium for Kharif), Soil Health Card, and Kisan Credit Card. These are potential matches only — use 'Check My Eligibility' on the Schemes page." };
  if (/document|పత్ర/.test(s)) return wantTe
    ? { lang: "te", text: "సాధారణంగా అవసరమైనవి: ఆధార్ కార్డు, భూమి పత్రాలు (పట్టాదార్ పాస్‌బుక్), ఆధార్‌తో లింక్ అయిన బ్యాంక్ ఖాతా, మొబైల్ నంబర్." }
    : { lang, text: "Commonly required: Aadhaar card, land records (pattadar passbook) or tenancy certificate, Aadhaar-linked bank account, and a mobile number. Each scheme's exact list is on its details page." };
  if (/weather|rain|వాతావరణ|వర్ష/.test(s)) return wantTe
    ? { lang: "te", text: `డెమో వాతావరణం: ${WEATHER.temp}°C, తేమ ${WEATHER.humidity}%, రాబోయే 3 రోజుల్లో సుమారు 12 మి.మీ. వర్షం.` }
    : { lang, text: `Demo forecast for ${p.district}: ${WEATHER.temp}°C, ${WEATHER.condition.toLowerCase()}, humidity ${WEATHER.humidity}%, ${WEATHER.rainfall}. Hold off on spraying before expected rain.` };
  return wantTe
    ? { lang: "te", text: "క్షమించండి, ఈ డెమోలో పంటలు, పథకాలు, పత్రాలు మరియు వాతావరణం గురించి మాత్రమే సమాధానం ఇవ్వగలను." }
    : { lang, text: "In this demo I can answer questions about crops, schemes, documents and weather. Try one of the suggested questions!" };
}

function AssistantPage() {
  const t = useT();
  const { profile, lang, setLang } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: lang === "te" ? `నమస్తే ${profile.name} గారు! నేను AgriMitra. పంటలు, పథకాలు లేదా వాతావరణం గురించి అడగండి.` : `Namaste ${profile.name}! I'm AgriMitra. Ask me about crops, schemes or weather.` }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMsgs((m) => [...m, { role: "user", text }]); setInput(""); setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { role: "bot", text: demoReply(text, lang, profile).text }]); setTyping(false); }, 800);
  };

  return (
    <div>
      <PageHeader title={t("assistant")} subtitle="Demo responses from templates — not verified agricultural advice. Consult your local agriculture officer.">
        <div className="flex items-center gap-3">
          <DemoBadge>Demo responses</DemoBadge>
          <div className="grid grid-cols-2 rounded-lg border bg-card p-1 text-sm">
            {(["en", "te"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`rounded-md px-3 py-1 font-medium ${lang === l ? "bg-primary text-primary-foreground" : ""}`}>{l === "en" ? "EN" : "తెలుగు"}</button>
            ))}
          </div>
        </div>
      </PageHeader>
      <div className="card-soft flex h-[calc(100vh-15rem)] min-h-[480px] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`grid size-8 shrink-0 place-items-center rounded-full ${m.role === "bot" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>{m.role === "bot" ? <Leaf className="size-4" /> : <UserRound className="size-4" />}</div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "bot" ? "rounded-tl-sm bg-muted" : "rounded-tr-sm bg-primary text-primary-foreground"}`}>{m.text}</div>
            </div>
          ))}
          {typing && <div className="flex gap-3"><div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Leaf className="size-4" /></div><div className="flex gap-1 rounded-2xl bg-muted px-4 py-4">{[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />)}</div></div>}
          <div ref={endRef} />
        </div>
        <div className="border-t p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {SUGGEST[lang].map((s) => <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-secondary">{s}</button>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === "te" ? "మీ ప్రశ్నను టైప్ చేయండి…" : "Ask about crops, schemes, weather…"} />
            <Button type="submit" disabled={!input.trim() || typing} aria-label="Send"><Send /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
