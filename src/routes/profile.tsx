import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_PROFILE, useApp, useT, type Profile } from "@/lib/app-store";
import { DISTRICTS, IRRIGATIONS, SOILS } from "@/lib/agri-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Farmer Profile — AgriMitra AI" },
      { name: "description", content: "Edit your farm details: district, soil, land size, irrigation and language." },
      { property: "og:title", content: "Farmer Profile — AgriMitra AI" },
      { property: "og:description", content: "Manage your farm profile for personalized recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const t = useT();
  const nav = useNavigate();
  const { profile, setProfile } = useApp();
  const [f, setF] = useState<Profile>(profile);
  useEffect(() => setF(profile), [profile]);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setF({ ...f, [k]: v });

  const save = () => {
    if (!f.name.trim()) return toast.error("Please enter the farmer name");
    if (!(f.landAcres > 0)) return toast.error("Land size must be greater than 0");
    setProfile(f);
    toast.success("Profile saved", { action: { label: "Get crops", onClick: () => nav({ to: "/crops" }) } });
  };

  return (
    <div>
      <PageHeader title={t("profile")} subtitle="Saved on this device. Used to personalize crops, schemes and assistant answers." />
      <div className="card-soft max-w-3xl p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <F label="Farmer name"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></F>
          <F label="State"><Input value={f.state} onChange={(e) => set("state", e.target.value)} /></F>
          <F label="District"><S value={f.district} onChange={(v) => set("district", v)} options={DISTRICTS} /></F>
          <F label="Soil type"><S value={f.soil} onChange={(v) => set("soil", v as Profile["soil"])} options={SOILS} /></F>
          <F label="Land size (acres)"><Input type="number" min="0" step="0.5" value={f.landAcres} onChange={(e) => set("landAcres", Number(e.target.value))} /></F>
          <F label="Irrigation type"><S value={f.irrigation} onChange={(v) => set("irrigation", v as Profile["irrigation"])} options={IRRIGATIONS} /></F>
          <F label="Preferred language">
            <Select value={f.language} onValueChange={(v) => set("language", v as Profile["language"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="te">తెలుగు (Telugu)</SelectItem></SelectContent>
            </Select>
          </F>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={save}><Save />{t("save")}</Button>
          <Button size="lg" variant="outline" onClick={() => { setF(DEFAULT_PROFILE); toast("Demo farmer loaded — click save to apply"); }}><RotateCcw />Load Srikakulam demo farmer</Button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function S({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>;
}
