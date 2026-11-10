import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, CloudSun, Droplets, Info, Landmark, ListChecks, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListenButton } from "@/components/listen-button";
import { useApp, useBi, useT } from "@/lib/app-store";
import type { Crop, ScoreInput } from "@/lib/agri-data";
import { buildChecklist, explainCrop, matchSchemes, SEASON_TE, SOIL_TE, IRRIGATION_TE, suitability, type CropExplanation, type Factor, type FitLevel } from "@/lib/farm-plan";
import { cn } from "@/lib/utils";

const FIT_CLS: Record<FitLevel, string> = {
  good: "bg-secondary text-secondary-foreground",
  possible: "bg-accent/25 text-accent-foreground",
  weak: "bg-destructive/10 text-destructive",
};

export function FitLabel({ total }: { total: number }) {
  const bi = useBi();
  const s = suitability(total);
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", FIT_CLS[s.level])}>{bi(s.label)}</span>;
}

export function PreliminaryNote({ className }: { className?: string }) {
  const t = useT();
  return (
    <p role="note" className={cn("flex gap-2 rounded-xl border border-accent bg-accent/15 p-3 text-sm", className)}>
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent-foreground" />{t("preliminary")}
    </p>
  );
}

function useInputsLine() {
  const { lang } = useApp();
  return (i: ScoreInput) => lang === "te"
    ? `${i.district} · ${SOIL_TE[i.soil]} · ${SEASON_TE[i.season]} · ${IRRIGATION_TE[i.irrigation]}`
    : `${i.district} · ${i.soil} soil · ${i.season} · ${i.irrigation}`;
}

function FactorRow({ f }: { f: Factor }) {
  const bi = useBi();
  const Icon = f.status === "match" ? CheckCircle2 : f.status === "attention" ? AlertTriangle : CircleDashed;
  const color = f.status === "match" ? "text-success" : f.status === "attention" ? "text-warning" : "text-muted-foreground";
  return (
    <li className="flex gap-3 rounded-lg border bg-background p-3">
      <Icon className={cn("mt-0.5 size-4 shrink-0", color)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{bi(f.label)}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{f.points}/{f.max}</p>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{bi(f.detail)}</p>
      </div>
    </li>
  );
}

/** Plain-text summary used for the Listen button. */
function speakable(e: CropExplanation, lang: "en" | "te") {
  const pick = (b: { en: string; te: string }) => (lang === "te" ? b.te : b.en);
  const name = lang === "te" ? e.crop.te : e.crop.name;
  return [name + ".", pick(suitability(e.score.total).label) + ".", pick(e.why), ...e.factors.map((f) => `${pick(f.label)}: ${pick(f.detail)}`), pick(e.weather), pick(e.precaution)].join(" ");
}

export function CropWhyDialog({ crop, input, open, onOpenChange, onChoose, chosen }: {
  crop: Crop | null; input: ScoreInput; open: boolean; onOpenChange: (o: boolean) => void; onChoose: (c: Crop) => void; chosen: boolean;
}) {
  const t = useT();
  const bi = useBi();
  const { lang } = useApp();
  const line = useInputsLine();
  const e = crop ? explainCrop(crop, input) : null;
  const related = crop ? matchSchemes(input, crop).slice(0, 3) : [];

  return (
    <Dialog open={open && !!e} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {e && <>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{t("whyCrop")} — {lang === "te" ? e.crop.te : e.crop.name}</DialogTitle>
            <DialogDescription>{t("basedOn")}: {line(input)}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3">
            <FitLabel total={e.score.total} />
            <span className="text-sm text-muted-foreground">{e.score.total}/100</span>
            <ListenButton text={speakable(e, lang)} className="ml-auto" />
          </div>

          <p className="flex gap-2 text-sm"><Info className="mt-0.5 size-4 shrink-0 text-primary" /><span><b>{t("whyFits")}:</b> {bi(e.why)}</span></p>

          {([["matched", e.matched], ["attention", e.attention], ["neutral", e.neutral]] as const).map(([k, list]) => list.length > 0 && (
            <section key={k}>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t(k)}</h4>
              <ul className="space-y-2">{list.map((f) => <FactorRow key={f.key} f={f} />)}</ul>
            </section>
          ))}

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("waterRisk")}</h4>
            <ul className="space-y-2"><FactorRow f={e.water} /></ul>
            <div className="mt-2 space-y-2 text-sm">
              <p className="flex gap-2"><CloudSun className="mt-0.5 size-4 shrink-0 text-primary" /><span><b>{t("weatherNote")}:</b> {bi(e.weather)}</span></p>
              <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><span><b>{t("precautions")}:</b> {bi(e.precaution)}</span></p>
            </div>
          </section>

          <PreliminaryNote />

          <section>
            <h4 className="mb-2 flex items-center gap-2 font-semibold"><Landmark className="size-4 text-primary" />{t("relatedSupport")}</h4>
            <ul className="space-y-2">
              {related.map((m) => (
                <li key={m.scheme.id} className="rounded-lg border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{m.scheme.name}</p>
                    <span className="rounded-full bg-accent/25 px-2 py-0.5 text-xs font-medium text-accent-foreground">{t("potentiallyRelevant")}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.scheme.category}{!m.scheme.verified && ` · ${t("checkOfficial")}`}</p>
                  <p className="mt-1 text-sm">{bi(m.reason)}</p>
                  <Link to="/schemes" search={{ crop: e.crop.id, scheme: m.scheme.id }} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {t("openInSchemes")} <ArrowRight className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onChoose(e.crop)} disabled={chosen}><ListChecks />{chosen ? t("inPlan") : t("choosePlan")}</Button>
            <Button variant="outline" asChild><Link to="/schemes" search={{ crop: e.crop.id }}>{t("allRelated")} <ArrowRight /></Link></Button>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}

export function ActionPlanCard({ crop, input }: { crop: Crop; input: ScoreInput }) {
  const t = useT();
  const bi = useBi();
  const { lang, plan, updatePlan, resetPlan } = useApp();
  const items = buildChecklist(crop, input);
  const done = items.filter((i) => plan.checks[i.id]).length;
  const line = useInputsLine();
  const listenText = [lang === "te" ? crop.te : crop.name, ...items.map((i) => `${bi(i.title)}. ${bi(i.hint)}`)].join(". ");

  return (
    <section id="action-plan" className="card-soft scroll-mt-24 p-6" aria-labelledby="action-plan-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="action-plan-title" className="flex items-center gap-2 font-display text-2xl font-semibold"><ListChecks className="size-5 text-primary" />{t("actionPlan")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{lang === "te" ? crop.te : crop.name} · {line(input)} · {t("savedDevice")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ListenButton text={listenText} />
          <Button size="sm" variant="ghost" onClick={resetPlan}>{t("clearPlan")}</Button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / items.length) * 100}%` }} /></div>
        <p className="text-sm font-medium tabular-nums">{done}/{items.length} {t("stepsDone")}</p>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((it) => {
          const checked = !!plan.checks[it.id];
          return (
            <li key={it.id} className={cn("flex gap-3 rounded-xl border p-4 transition-colors", checked ? "bg-secondary/60" : "bg-background")}>
              <Checkbox id={`chk-${it.id}`} checked={checked} className="mt-0.5"
                onCheckedChange={(v) => updatePlan({ checks: { ...plan.checks, [it.id]: v === true } })} />
              <label htmlFor={`chk-${it.id}`} className="flex-1 cursor-pointer">
                <span className={cn("block font-medium", checked && "text-muted-foreground line-through")}>{bi(it.title)}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{bi(it.hint)}</span>
                {it.id === "schemes-docs" && (
                  <Link to="/schemes" search={{ crop: crop.id }} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    {t("allRelated")} <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HowItWorksPanel() {
  const t = useT();
  const { lang } = useApp();
  const en = [
    ["Soil (up to 35 points)", "35 if your soil is the crop's best-listed soil, 25 if it is in the suitable list, 5 otherwise."],
    ["Season (up to 30)", "30 for the crop's main season, 20 if it can also be grown then, 0 if not usually grown."],
    ["Water (up to 25)", "On rainfed fields: low-water crops 25, medium 12, high 0. With irrigation: high-water crops 25, others 20."],
    ["Region (up to 10)", "10 for crops commonly grown in coastal districts when your district is coastal, otherwise 5."],
  ];
  const te = [
    ["నేల (గరిష్ఠం 35 పాయింట్లు)", "మీ నేల ఆ పంటకు అత్యంత అనువైనదైతే 35, అనువైన జాబితాలో ఉంటే 25, లేకపోతే 5."],
    ["సీజన్ (గరిష్ఠం 30)", "ప్రధాన సీజన్‌కు 30, ఆ సీజన్‌లో కూడా వేయగలిగితే 20, సాధారణంగా వేయకపోతే 0."],
    ["నీరు (గరిష్ఠం 25)", "వర్షాధార పొలంలో: తక్కువ నీటి పంటలు 25, మధ్యస్థం 12, ఎక్కువ 0. నీటిపారుదల ఉంటే: ఎక్కువ నీటి పంటలు 25, మిగతావి 20."],
    ["ప్రాంతం (గరిష్ఠం 10)", "తీర జిల్లాల్లో సాధారణంగా పండే పంటలకు మీ జిల్లా తీర ప్రాంతమైతే 10, లేకపోతే 5."],
  ];
  const rows = lang === "te" ? te : en;
  return (
    <details className="card-soft group p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-display text-lg font-semibold">
        <span className="flex items-center gap-2"><Info className="size-5 text-primary" />{t("howWorks")}</span>
        <span className="text-sm font-normal text-muted-foreground group-open:hidden">+</span>
        <span className="hidden text-sm font-normal text-muted-foreground group-open:inline">−</span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">
        {lang === "te"
          ? "AgriMitra ప్రతి పంటకు నాలుగు సాధారణ నియమాలతో 100లో స్కోరు ఇస్తుంది. ఇది AI మోడల్ లేదా దిగుబడి అంచనా కాదు; అదే పాయింట్లతో వివరణలు చూపుతాం."
          : "AgriMitra gives each crop a score out of 100 using four simple rules on the details you enter. It is not an AI model or a yield prediction, and every explanation uses the same points as the score."}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(([h, d]) => <li key={h} className="rounded-lg border bg-background p-3 text-sm"><p className="font-semibold">{h}</p><p className="mt-0.5 text-muted-foreground">{d}</p></li>)}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Droplets className="size-3.5" />
        {lang === "te" ? "75+ = మంచి అనుకూలత, 50–74 = సాధ్యమైనది, 50 కంటే తక్కువ = బలహీనం. పంట డేటా డెమో కోసం సరళీకరించబడింది." : "75+ = good fit, 50–74 = possible, below 50 = weak. Crop data is simplified for this demo."}
      </p>
    </details>
  );
}
