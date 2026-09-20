import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Share2, Star, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuickStartGuide } from "@/components/native/QuickStartGuide";
import { isNativeApp } from "@/lib/native-navigation";

export const SOUPYLAB_PLAY_URL = "https://play.google.com/store/apps/details?id=com.soupylab.app";
const SUPPORT_EMAIL = "support@soupy.com";

export default function AppSettingsPage() {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const [sharing, setSharing] = useState(false);
  const body = `SoupyLab 1.1.0 (10002) feedback\n\n${feedback.trim()}`;
  const share = async () => {
    setSharing(true); setStatus("");
    try {
      if (isNativeApp()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title: "SoupyLab", text: "Explore AI tools and prepare training examples with SoupyLab.", url: SOUPYLAB_PLAY_URL, dialogTitle: "Share SoupyLab" });
      } else if (navigator.share) {
        await navigator.share({ title: "SoupyLab", url: SOUPYLAB_PLAY_URL });
      } else {
        await navigator.clipboard.writeText(SOUPYLAB_PLAY_URL);
        setStatus("SoupyLab's Play link copied.");
      }
    } catch (error) {
      if (!(error instanceof Error && /cancel|dismiss|abort/i.test(error.name + error.message))) setStatus("Sharing is unavailable. You can use the Google Play link below.");
    } finally { setSharing(false); }
  };
  return <main className="mx-auto max-w-2xl px-5 py-6 space-y-6" style={{ paddingLeft: "max(1.25rem, var(--safe-area-left, 0px))", paddingRight: "max(1.25rem, var(--safe-area-right, 0px))" }}>
    <Button variant="ghost" asChild className="min-h-12"><Link to="/launchpad"><ArrowLeft aria-hidden="true" />Workspace</Link></Button>
    <div><h1 className="text-2xl font-bold">App settings</h1><p className="text-muted-foreground mt-2">Help, feedback, and sharing for SoupyLab.</p></div>
    <section aria-label="Help and sharing" className="grid gap-3 sm:grid-cols-2">
      <QuickStartGuide />
      <Button asChild variant="outline" className="min-h-12"><a href={SOUPYLAB_PLAY_URL} target="_blank" rel="noopener noreferrer"><Star aria-hidden="true" />Rate SoupyLab</a></Button>
      <Button variant="outline" className="min-h-12" disabled={sharing} onClick={share}><Share2 aria-hidden="true" />{sharing ? "Opening share options…" : "Share SoupyLab"}</Button>
      <Button asChild variant="outline" className="min-h-12"><Link to="/privacy">Privacy policy</Link></Button>
    </section>
    <p className="text-sm text-muted-foreground">Google Play controls review availability. During closed testing, testers may be offered private feedback instead of a public rating.</p>
    <section className="rounded-xl border bg-card p-4 space-y-3" aria-labelledby="feedback-title">
      <h2 id="feedback-title" className="text-lg font-semibold">Send feedback</h2>
      <Label htmlFor="app-feedback">What worked, or what should we improve?</Label>
      <Textarea id="app-feedback" value={feedback} onChange={event => setFeedback(event.target.value)} maxLength={2000} rows={5} placeholder="Tell us what happened and which tool you were using." />
      <p className="text-sm text-muted-foreground">Your draft stays here until you open your email app and choose Send. Please leave out passwords and private training data.</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="min-h-12"><a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("SoupyLab feedback")}&body=${encodeURIComponent(body)}`}><Mail aria-hidden="true" />Open email draft</a></Button>
        <Button variant="outline" className="min-h-12" onClick={async () => { try { await navigator.clipboard.writeText(body); setStatus("Feedback copied. You can send it to support@soupy.com."); } catch { setStatus("Copy is unavailable. Select your text and email support@soupy.com."); } }}><Copy aria-hidden="true" />Copy feedback</Button>
      </div>
      <p className="text-sm break-all">{SUPPORT_EMAIL}</p>
    </section>
    <p role="status" className="text-sm min-h-6">{status}</p>
    <p className="text-xs text-muted-foreground">SoupyLab 1.1.0 · Build 10002</p>
  </main>;
}
