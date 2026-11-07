import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplets, Info, Loader2, Sprout, CloudSun, AlertTriangle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DemoBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp, useT } from "@/lib/app-store";
import { currentSeason, DISTRICTS, IRRIGATIONS, recommend, SEASONS, SOILS, CROPS, type Irrigation, type Season, type Soil } from "@/lib/agri-data";

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
  const { profile } = useApp();
  const [district, setDistrict] = useState(profile.district);
  const [soil, setSoil] = useState<Soil>(profile.soil);
  const [season, setSeason] = useState<Season>(currentSeason());
  const [land, setLand] = useState(String(profile.landAcres));
  const [irrigation, setIrrigation] = useState<Irrigation>(profile.irrigation);
  const [current, setCurrent] = useState("none");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result | null>(null);
  const [compare, setCompare] = useState(false);

  useEffect(() => { setDistrict(profile.district); setSoil(profile.soil); setIrrigation(profile.irrigation); setLand(String(profile.landAcres)); }, [profile]);

  const run = () => {
    const acres = Number(land);
    if (!acres || acres <= 0) { toast.error("Please enter a valid land size"); return; }
    setLoading(true);
    setTimeout(() => {
      const r = recommend({ district, soil, season, irrigation, landAcres: acres });
      setResults(r); setLoading(false);
      toast.success(`Top match: ${r[0].crop.name}`);
    }, 700);
  };

  const chartData = results?.map(({ crop, score }) => ({ name: crop.name.split(" (")[0], Soil: score.soil, Season: score.season, Water: score.water, Region: score.region }));

  return (
    <div>
      <PageHeader title={t("crops")} subtitle="Tell us about your field. We rank crops with a simple, transparent demo scoring model.">
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
          {results && <Button size="lg" variant="outline" onClick={() => setCompare(true)}><BarChart3 />Compare crops</Button>}
        </div>
      </div>

      {!results && !loading && (
        <div className="mt-8 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <Sprout className="mx-auto size-10 text-primary/60" />
          <p className="mt-3">Fill in your field details and click <b>{t("recommend")}</b> to see your top 3 crops.</p>
        </div>
      )}
      {loading && <div className="mt-8 grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />)}</div>}

      {results && !loading && (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {results.map(({ crop, score }, idx) => (
              <article key={crop.id} className="card-soft flex flex-col overflow-hidden">
                <div className="relative">
                  <img src={crop.image} alt={crop.name} loading="lazy" width={992} height={672} className="h-40 w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold">#{idx + 1}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-display text-xl font-semibold">{crop.name}</h3><p className="text-sm text-muted-foreground">{crop.te}</p></div>
                    <ScoreRing value={score.total} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Chip ok={crop.soils.includes(soil)}>Soil: {crop.soils.includes(soil) ? "compatible" : "weak"}</Chip>
                    <Chip ok={crop.seasons.includes(season)}>Season: {crop.seasons.includes(season) ? "compatible" : "off-season"}</Chip>
                    <Chip ok={crop.water !== "High" || irrigation === "Irrigated"}><Droplets className="size-3" />Water: {crop.water}</Chip>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <p className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0 text-primary" />{crop.why}</p>
                    <p className="flex gap-2"><CloudSun className="mt-0.5 size-4 shrink-0 text-primary" />{crop.weather}</p>
                    <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />{crop.limits}</p>
                  </div>
                  <p className="mt-auto pt-4 text-xs text-muted-foreground">Score = soil {score.soil} + season {score.season} + water {score.water} + region {score.region}</p>
                </div>
              </article>
            ))}
          </div>
          {current !== "none" && <p className="mt-4 text-sm text-muted-foreground">Tip: rotating away from {CROPS.find((c) => c.id === current)?.name} can help break pest cycles and restore soil nutrients.</p>}
        </>
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
      <div className="grid size-11 place-items-center rounded-full bg-card text-sm font-bold">{value}</div>
    </div>
  );
}
