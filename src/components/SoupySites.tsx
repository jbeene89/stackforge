import { useState } from "react";
import { Copy, Share2, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

type Site = { name: string; url: string };

const ALL_SITES: Site[] = [
  { name: "Boat Lift Wizard", url: "https://boatliftwizard.com" },
  { name: "Soupy Cockpit", url: "https://soupycockpit.com" },
  { name: "Soupy MCP", url: "https://soupymcp.online" },
  { name: "Soupy Tag", url: "https://soupytag.company" },
  { name: "Soupy Together", url: "https://soupytogether.com" },
  { name: "Soupy Vet Claim", url: "https://soupyvetclaim.com" },
  { name: "Black Soups", url: "https://blacksoups.com" },
  { name: "SACE Concept", url: "https://saceconcept.com" },
  { name: "Invention Insight", url: "https://inventioninsight.com" },
  { name: "Quantize Flow", url: "https://quantizeflow.com" },
];

// Exclude the current site (soupylab) — this list lives on soupylab.com so all 10 stay.
const SITES = ALL_SITES.filter(
  (s) => !s.url.includes("soupylab"),
);

const stripProtocol = (url: string) => url.replace(/^https?:\/\//, "");

export function SoupySites() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyOne = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast.success("Link copied");
      setTimeout(() => setCopiedUrl(null), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const allText = `Check out our other Soupy sites:\n${SITES.map((s) => `${s.name} — ${s.url}`).join("\n")}`;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      toast.success("Full list copied");
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Our other Soupy sites",
          text: allText,
        });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    copyAll();
  };

  return (
    <section className="relative py-10 sm:py-14 px-3 sm:px-6 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Our other Soupy sites
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Same builder, different missions. Take a look around.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={share}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Check out our other Soupy sites
            </button>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              {copiedAll ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedAll ? "Copied" : "Copy all"}
            </button>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {SITES.map((site) => (
            <li
              key={site.url}
              className="group rounded-lg border border-border bg-card text-card-foreground p-4 hover:border-primary/50 transition-colors flex items-center gap-3"
            >
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-1.5 font-semibold text-foreground group-hover:text-primary transition-colors">
                  <span className="truncate">{site.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {stripProtocol(site.url)}
                </div>
              </a>
              <button
                onClick={() => copyOne(site.url)}
                aria-label={`Copy ${site.name} link`}
                className="flex-shrink-0 p-2 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedUrl === site.url ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default SoupySites;
