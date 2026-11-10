import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplets, Info, Loader2, Sprout, CloudSun, AlertTriangle, BarChart3, HelpCircle, ListChecks, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DemoBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ActionPlanCard, CropWhyDialog, FitLabel, HowItWorksPanel, PreliminaryNote } from "@/components/crop-insights";
import { useApp, useBi, useT } from "@/lib/app-store";
import { currentSeason, DISTRICTS, IRRIGATIONS, recommend, SEASONS, SOILS, CROPS, type Crop, type Irrigation, type ScoreInput, type Season, type Soil } from "@/lib/agri-data";
import { findCrop } from "@/lib/farm-plan";

export const Route = createFileRoute("/crops")({
  head: () => ({
    meta: [
      { title: "Smart Crop Recommendations — AgriMitra AI" },
      { name: "description", content: "Get crop suggestions for your district, soil, season and irrigation with transparent demo scoring." },
      { property: "og:title", content: "Smart Crop Recommendations — AgriMitra AI" },
      { property: "og:description", content: "Transparent crop suitability scoring for Andhra Pradesh farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CropsPage,
});

type Result = ReturnType<typeof recommend>;

function CropsPage() {
  const t = useT();
  const bi = useBi();
  const { profile, lang, plan, updatePlan } = useApp();
  const [district, setDistrict] = useState(profile.district);
  const [soil, setSoil] = useState<Soil>(profile.soil);
  const [season, setSeason] = useState<Season>(currentSeason());
  const [land, setLand] = useState(String(profile.landAcres));
  const [irrigation, setIrrigation] = useState<Irrigation>(profile.irrigation);
  const [current, setCurrent] = useState("none");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result | null>(null);
  const [resultInput, setResultInput] = useState<ScoreInput | null>(null);
  const [compare, setCompare] = useState(false);
  const [why, setWhy] = useState<Crop | null>(null);
  const restored = useRef(false);

  // Only farm fields — switching language must not reset the form.
  useEffect(() => { setDistrict(profile.district); setSoil(profile.soil); setIrrigation(profile.irrigation); setLand(String(profile.landAcres)); },
    [profile.district, profile.soil, profile.irrigation, profile.landAcres]);

  // Restore the last saved plan's inputs and results once.
  useEffect(() => {
    if (restored.current || !plan.inputs) return;
    restored.current = true;
    const i = plan.inputs;
    setDistrict(i.district); setSoil(i.soil); setSeason(i.season); setIrrigation(i.irrigation); setLand(String(i.landAcres));
    setResults(recommend(i)); setResultInput(i);
  }, [plan.inputs]);

  const run = () => {
    const acres = Number(land);
    if (!acres || acres <= 0) { toast.error("Please enter a valid land size"); return; }
    setLoading(true);
    setTimeout(() => {
      const input: ScoreInput = { district, soil, season, irrigation, landAcres: acres };
      const r = recommend(input);
      setResults(r); setResultInput(input); setLoading(false);
      restored.current = true;
      updatePlan({ inputs: input });
      if (r[0]) toast.success(`Top match: ${r[0].crop.name}`);
    }, 700);
  };

  const choose = (c: Crop) => {
    if (!resultInput) return;
    updatePlan({ cropId: c.id, inputs: resultInput, checks: plan.cropId === c.id ? plan.checks : {} });
    setWhy(null);
    toast.success(lang === "te" ? `${c.te} మీ ప్రణాళికకు జోడించబడింది` : `${c.name} added to your action plan`);
    setTimeout(() => document.getElementById("action-plan")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const planCrop = findCrop(plan.cropId);
  const chartData = (results ?? []).map(({ crop, score }) => ({ name: crop.name.split(" (")[0] ?? crop.name, Soil: score.soil, Season: score.season, Water: score.water, Region: score.region }));

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title={t("crops")} subtitle={lang === "te" ? "మీ పొలం గురించి చెప్పండి. సరళమైన, పారదర్శక డెమో స్కోరింగ్‌తో పంటలను ర్యాంక్ చేస్తాం." : "Tell us about your field. We rank crops with a simple, transparent demo scoring model."}>
          <DemoBadge>Demo scoring — not a yield prediction</DemoBadge>
        </PageHeader>

        <div className="card-soft p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="District"><Pick value={district} onChange={setDistrict} options={DISTRICTS} /></Field>
            <Field label="Soil type"><Pick value={soil} onChange={(v) => setSoil(v as Soil)} options={SOILS} suffix=" soil" /></Field>
            <Field label="Season"><Pick value={season} onChange={(v) => setSeason(v as Season)} options={SEASONS} /></Field>
            <Field label="Land size (acres)"><Input type="number" min="0" step="0.5" value={land} onChange={(e) => setLand(e.target.value)} /></Field>
            <Field label="Irrigation"><Pick value={irrigation} onChange={(v) => setIrrigation(v as Irrigation)} options={IRRIGATIONS} /></Field>
            <Field label="Current crop (optional)">
              <Select value={current} onValueChange={setCurrent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">None</SelectItem>{CROPS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={run} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sprout />}{t("recommend")}</Button>
            {results && <Button size="lg" variant="outline" onClick={() => setCompare(true)}><BarChart3 />{t("compare")}</Button>}
          </div>
        </div>
      </div>

      {!results && !loading && (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <Sprout className="mx-auto size-10 text-primary/60" />
          <p className="mt-3">Fill in your field details and click <b>{t("recommend")}</b> to see your top 3 crops.</p>
        </div>
      )}
      {loading && <div className="grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />)}</div>}

      {results && !loading && (
        <div className="space-y-4">
          <PreliminaryNote />
          <div className="grid gap-6 md:grid-cols-3">
            {results.map(({ crop, score }, idx) => {
              const inPlan = plan.cropId === crop.id;
              return (
                <article key={crop.id} className={`card-soft flex flex-col overflow-hidden ${inPlan ? "ring-2 ring-primary" : ""}`}>
                  <div className="relative">
                    <img src={crop.image} alt={crop.name} loading="lazy" width={992} height={672} className="h-40 w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold">#{idx + 1}</span>
                    {inPlan && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"><Check className="size-3" />{t("inPlan")}</span>}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-display text-xl font-semibold">{crop.name}</h3><p className="text-sm text-muted-foreground">{crop.te}</p></div>
                      <ScoreRing value={score.total} />
                    </div>
                    <div className="mt-3"><FitLabel total={score.total} /></div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Chip ok={crop.soils.includes(soilOf(resultInput, soil))}>Soil: {crop.soils.includes(soilOf(resultInput, soil)) ? "compatible" : "weak"}</Chip>
                      <Chip ok={crop.seasons.includes(resultInput?.season ?? season)}>Season: {crop.seasons.includes(resultInput?.season ?? season) ? "compatible" : "off-season"}</Chip>
                      <Chip ok={crop.water !== "High" || (resultInput?.irrigation ?? irrigation) === "Irrigated"}><Droplets className="size-3" />Water: {crop.water}</Chip>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <p className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0 text-primary" />{bi({ en: crop.why, te: crop.whyTe })}</p>
                      <p className="flex gap-2"><CloudSun className="mt-0.5 size-4 shrink-0 text-primary" />{bi({ en: crop.weather, te: crop.weatherTe })}</p>
                      <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />{bi({ en: crop.limits, te: crop.limitsTe })}</p>
                    </div>
                    <p className="mt-auto pt-4 text-xs text-muted-foreground">Score = soil {score.soil} + season {score.season} + water {score.water} + region {score.region}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                      <Button variant="outline" onClick={() => setWhy(crop)}><HelpCircle />{t("whyCrop")}</Button>
                      <Button variant={inPlan ? "secondary" : "default"} onClick={() => choose(crop)} disabled={inPlan}><ListChecks />{inPlan ? t("inPlan") : t("choosePlan")}</Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {current !== "none" && <p className="text-sm text-muted-foreground">Tip: rotating away from {CROPS.find((c) => c.id === current)?.name} can help break pest cycles and restore soil nutrients.</p>}
        </div>
      )}

      {planCrop && plan.inputs && <ActionPlanCard crop={planCrop} input={plan.inputs} />}

      <HowItWorksPanel />

      {resultInput && (
        <CropWhyDialog crop={why} input={resultInput} open={!!why} onOpenChange={(o) => !o && setWhy(null)} onChoose={choose} chosen={!!why && plan.cropId === why.id} />
      )}

      <Dialog open={compare} onOpenChange={setCompare}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop comparison</DialogTitle>
            <DialogDescription>How each crop's demo score is built. Max: soil 35, season 30, water 25, region 10.</DialogDescription>
          </DialogHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} domain={[0, 100]} /><Tooltip /><Legend />
                <Bar dataKey="Soil" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="Season" stackId="a" fill="var(--chart-2)" />
                <Bar dataKey="Water" stackId="a" fill="var(--chart-3)" />
                <Bar dataKey="Region" stackId="a" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Crop</th><th>Water need</th><th>Seasons</th><th>Score</th></tr></thead>
            <tbody>{results?.map(({ crop, score }) => <tr key={crop.id} className="border-t"><td className="py-2 font-medium">{crop.name}</td><td>{crop.water}</td><td>{crop.seasons.join(", ")}</td><td className="font-semibold">{score.total}</td></tr>)}</tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function soilOf(i: ScoreInput | null, fallback: Soil) { return i?.soil ?? fallback; }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function Pick({ value, onChange, options, suffix = "" }: { value: string; onChange: (v: string) => void; options: string[]; suffix?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}{suffix}</SelectItem>)}</SelectContent>
    </Select>
  );
}
function Chip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${ok ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive"}`}>{children}</span>;
}
function ScoreRing({ value }: { value: number }) {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--muted) 0)` }}>
      <div className="grid size-11 place-items-center rounded-full bg-card text-sm font-bold" aria-label={`Demo score ${value} out of 100`}>{value}</div>
    </div>
  );
}
