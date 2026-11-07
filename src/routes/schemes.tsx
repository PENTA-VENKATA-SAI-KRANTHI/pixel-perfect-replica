import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ExternalLink, FileText, ListChecks, ShieldCheck, AlertCircle, CheckCircle2, HelpCircle, XCircle, SearchX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DemoBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp, useT } from "@/lib/app-store";
import { evaluate, SCHEMES, type Answer, type Scheme, type Verdict } from "@/lib/agri-data";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Government Scheme Finder — AgriMitra AI" },
      { name: "description", content: "Discover agricultural schemes like PM-KISAN and PMFBY and check potential eligibility." },
      { property: "og:title", content: "Government Scheme Finder — AgriMitra AI" },
      { property: "og:description", content: "Search Indian farm schemes and check potential eligibility." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchemesPage,
});

const CATS = ["All", ...Array.from(new Set(SCHEMES.map((s) => s.category)))];

function SchemesPage() {
  const t = useT();
  const { profile } = useApp();
  const [q, setQ] = useState("");
  const [state, setState] = useState("All");
  const [cat, setCat] = useState("All");
  const [detail, setDetail] = useState<Scheme | null>(null);
  const [checking, setChecking] = useState<Scheme | null>(null);

  const list = useMemo(() => SCHEMES.filter((s) =>
    (state === "All" || s.state === state) && (cat === "All" || s.category === cat) &&
    (s.name + s.category + s.beneficiary).toLowerCase().includes(q.toLowerCase())), [q, state, cat]);

  return (
    <div>
      <PageHeader title={t("schemes")} subtitle={`Matched for ${profile.name} · ${profile.district}, ${profile.state} · ${profile.landAcres} acres`} />

      <div className="mb-6 rounded-xl border border-accent bg-accent/15 p-4 text-sm">
        <b>Important:</b> AgriMitra never confirms official eligibility. Results show <i>potential</i> eligibility only — always verify with official portals or your Rythu Seva Kendram.
      </div>

      <div className="card-soft mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_180px_200px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search schemes…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={state} onValueChange={setState}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "Central", "Andhra Pradesh"].map((s) => <SelectItem key={s} value={s}>{s === "All" ? "All states" : s}</SelectItem>)}</SelectContent></Select>
        <Select value={cat} onValueChange={setCat}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All categories" : c}</SelectItem>)}</SelectContent></Select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <SearchX className="mx-auto size-10" /><p className="mt-3">No schemes match your filters.</p>
          <Button variant="link" onClick={() => { setQ(""); setState("All"); setCat("All"); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((s) => (
            <article key={s.id} className="card-soft flex flex-col p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{s.category}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{s.state}</span>
                {s.verified ? <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><ShieldCheck className="size-3.5" />Official details</span> : <DemoBadge>Demo info — verify</DemoBadge>}
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">For: {s.beneficiary}</p>
              <p className="mt-3 text-sm">{s.benefit}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><HelpCircle className="size-3.5" />Eligibility needs verification</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button onClick={() => setChecking(s)}>{t("check")}</Button>
                <Button variant="outline" onClick={() => setDetail(s)}>View details</Button>
                <Button variant="ghost" asChild><a href={s.url} target="_blank" rel="noreferrer">Official site <ExternalLink /></a></Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {detail && <>
            <DialogHeader><DialogTitle className="font-display text-2xl">{detail.name}</DialogTitle><DialogDescription>{detail.category} · {detail.state}</DialogDescription></DialogHeader>
            {!detail.verified && <p className="rounded-lg bg-accent/20 p-3 text-sm">Demo information — verify official requirements.</p>}
            <section><h4 className="font-semibold">Potential benefit</h4><p className="mt-1 text-sm text-muted-foreground">{detail.benefit}</p></section>
            <section><h4 className="flex items-center gap-2 font-semibold"><FileText className="size-4" />Required documents</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{detail.documents.map((d) => <li key={d}>{d}</li>)}</ul></section>
            <section><h4 className="flex items-center gap-2 font-semibold"><ListChecks className="size-4" />Application steps</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{detail.steps.map((d) => <li key={d}>{d}</li>)}</ol></section>
            <div className="flex gap-2"><Button onClick={() => { setChecking(detail); setDetail(null); }}>{t("check")}</Button>
              <Button variant="outline" asChild><a href={detail.url} target="_blank" rel="noreferrer">Official website <ExternalLink /></a></Button></div>
          </>}
        </DialogContent>
      </Dialog>

      <EligibilityDialog scheme={checking} onClose={() => setChecking(null)} onDetails={(s) => { setChecking(null); setDetail(s); }} />
    </div>
  );
}

const VERDICT: Record<Verdict, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  eligible: { label: "Potentially eligible", icon: CheckCircle2, cls: "bg-secondary text-secondary-foreground" },
  "more-info": { label: "More information required", icon: AlertCircle, cls: "bg-accent/25 text-accent-foreground" },
  ineligible: { label: "Appears ineligible based on provided information", icon: XCircle, cls: "bg-destructive/10 text-destructive" },
};

function EligibilityDialog({ scheme, onClose, onDetails }: { scheme: Scheme | null; onClose: () => void; onDetails: (s: Scheme) => void }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<ReturnType<typeof evaluate> | null>(null);
  const close = () => { setAnswers({}); setResult(null); onClose(); };
  const done = scheme ? scheme.questions.every((q) => answers[q.id]) : false;

  return (
    <Dialog open={!!scheme} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {scheme && <>
          <DialogHeader><DialogTitle>Check eligibility: {scheme.name}</DialogTitle><DialogDescription>Answer a few questions. This is guidance only, not an official decision.</DialogDescription></DialogHeader>
          {!result ? (
            <div className="space-y-5">
              {scheme.questions.map((q, i) => (
                <div key={q.id}>
                  <p className="text-sm font-medium">{i + 1}. {q.text}</p>
                  <div className="mt-2 flex gap-2">
                    {(["yes", "no", "unsure"] as Answer[]).map((a) => (
                      <Button key={a} size="sm" variant={answers[q.id] === a ? "default" : "outline"} onClick={() => setAnswers({ ...answers, [q.id]: a })} className="capitalize">{a === "unsure" ? "Not sure" : a}</Button>
                    ))}
                  </div>
                </div>
              ))}
              <Button className="w-full" disabled={!done} onClick={() => { const r = evaluate(scheme, answers); setResult(r); toast(VERDICT[r.verdict].label); }}>See result</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => { const v = VERDICT[result.verdict]; return <div className={`flex items-center gap-3 rounded-xl p-4 font-semibold ${v.cls}`}><v.icon className="size-6 shrink-0" />{v.label}</div>; })()}
              <ul className="space-y-2 text-sm">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    {r.ok === true ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : r.ok === false ? <XCircle className="size-4 shrink-0 text-destructive" /> : <HelpCircle className="size-4 shrink-0 text-warning" />}{r.text}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Final eligibility is decided by the implementing authority. Verify at the official portal.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onDetails(scheme)}>Documents & steps</Button>
                <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>Start over</Button>
              </div>
            </div>
          )}
        </>}
      </DialogContent>
    </Dialog>
  );
}
