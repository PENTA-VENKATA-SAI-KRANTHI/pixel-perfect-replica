import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, useT } from "@/lib/app-store";

/**
 * Reads text aloud with the browser's built-in speech synthesis (no external service).
 * Hidden when the browser has no speech support; disabled for Telugu when no Telugu voice is installed.
 */
export function ListenButton({ text, className }: { text: string; className?: string }) {
  const t = useT();
  const { lang } = useApp();
  const [supported, setSupported] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
    setSupported(true);
    const synth = window.speechSynthesis;
    const pick = () => {
      const all = synth.getVoices();
      setVoicesLoaded(all.length > 0);
      const prefix = lang === "te" ? "te" : "en";
      setVoice(all.find((v) => v.lang.toLowerCase() === (lang === "te" ? "te-in" : "en-in")) ?? all.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null);
    };
    pick();
    synth.addEventListener("voiceschanged", pick);
    return () => { synth.removeEventListener("voiceschanged", pick); synth.cancel(); setSpeaking(false); };
  }, [lang]);

  if (!supported) return null;
  const teUnavailable = lang === "te" && voicesLoaded && !voice;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "te" ? "te-IN" : "en-IN";
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={toggle} disabled={teUnavailable} className={className}
      title={teUnavailable ? t("noTeVoice") : undefined} aria-label={speaking ? t("stop") : `${t("listen")} (${lang === "te" ? "తెలుగు" : "English"})`}>
      {speaking ? <Square /> : <Volume2 />}{speaking ? t("stop") : t("listen")}
      {teUnavailable && <span className="sr-only">{t("noTeVoice")}</span>}
    </Button>
  );
}
