import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudSun, Droplets, Wind, Thermometer, Sprout, Landmark, MessageCircle, MapPin, Layers, ArrowRight, CloudRain } from "lucide-react";
import { useApp, useT } from "@/lib/app-store";
import { currentSeason, recommend, SCHEMES, WEATHER } from "@/lib/agri-data";
import { DemoBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/crop-paddy.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriMitra AI" },
      { name: "description", content: "Your personalized farm dashboard: season, weather, soil, crop and scheme summaries." },
      { property: "og:title", content: "Dashboard — AgriMitra AI" },
      { property: "og:description", content: "Personalized farm dashboard for Andhra Pradesh farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const { profile } = useApp();
  const season = currentSeason();
  const top = recommend({ district: profile.district, soil: profile.soil, season, irrigation: profile.irrigation, landAcres: profile.landAcres });
  const verifiedCount = SCHEMES.filter((s) => s.verified).length;

  const actions = [
    { to: "/crops" as const, icon: Sprout, title: "Crop Recommendation", desc: "Find crops that fit your soil and season." },
    { to: "/schemes" as const, icon: Landmark, title: "Government Scheme Finder", desc: "Discover schemes you may qualify for." },
    { to: "/assistant" as const, icon: MessageCircle, title: "AI Farming Assistant", desc: "Ask questions in Telugu or English." },
    { to: "/profile" as const, icon: Layers, title: "Update Farm Profile", desc: "Keep soil, land and irrigation current." },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-field text-primary-foreground">
        <img src={heroImg} alt="Paddy field at sunrise" width={992} height={672} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative grid gap-6 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-sm opacity-90"><MapPin className="size-4" />{profile.district}, {profile.state}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{t("namaste")}</h1>
            <p className="mt-3 max-w-lg opacity-90">Welcome back, {profile.name}. Here's a snapshot of your farm for the {season} season.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary"><Link to="/crops">{t("recommend")} <ArrowRight /></Link></Button>
              <Button asChild variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/schemes">{t("schemes")}</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur">
            <Stat label={t("season")} value={season} />
            <Stat label={t("soil")} value={profile.soil} />
            <Stat label="Land" value={`${profile.landAcres} ac`} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft p-6">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{t("weather")}</h2><DemoBadge /></div>
          <div className="mt-5 flex items-center gap-4">
            <CloudSun className="size-14 text-accent" />
            <div><p className="text-4xl font-semibold">{WEATHER.temp}°C</p><p className="text-sm text-muted-foreground">{WEATHER.condition}</p></div>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><CloudRain className="size-4 text-primary" />{WEATHER.rainfall}</li>
            <li className="flex items-center gap-2"><Droplets className="size-4 text-primary" />Humidity {WEATHER.humidity}%</li>
            <li className="flex items-center gap-2"><Wind className="size-4 text-primary" />Wind {WEATHER.wind}</li>
            <li className="flex items-center gap-2"><Thermometer className="size-4 text-primary" />Good window for field preparation</li>
          </ul>
        </div>

        <div className="card-soft p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recommended crops</h2>
            <Link to="/crops" className="text-sm font-medium text-primary hover:underline">See details →</Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Based on {profile.soil} soil, {season}, {profile.irrigation.toLowerCase()} — demo scoring.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {top.map(({ crop, score }) => (
              <div key={crop.id} className="overflow-hidden rounded-xl border bg-background">
                <img src={crop.image} alt={crop.name} loading="lazy" width={992} height={672} className="h-24 w-full object-cover" />
                <div className="p-3">
                  <p className="font-semibold">{crop.name}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${score.total}%` }} /></div>
                  <p className="mt-1 text-xs text-muted-foreground">Suitability {score.total}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft p-6">
          <h2 className="font-display text-xl font-semibold">Schemes summary</h2>
          <p className="mt-4 text-4xl font-semibold text-primary">{SCHEMES.length}</p>
          <p className="text-sm text-muted-foreground">relevant schemes to explore · {verifiedCount} with verified official details</p>
          <Button asChild className="mt-5 w-full"><Link to="/schemes">{t("check")}</Link></Button>
        </div>
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-semibold">{t("quick")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {actions.map((a) => (
              <Link key={a.title} to={a.to} className="card-soft group flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><a.icon className="size-5" /></div>
                <div className="flex-1"><p className="font-semibold">{a.title}</p><p className="text-sm text-muted-foreground">{a.desc}</p></div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs opacity-75">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
