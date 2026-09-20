import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Blocks, BookOpen, BrainCircuit,
  ChevronRight, Cloud, Cpu, Database, Download, FlaskConical, Flame,
  Grid2X2, Hammer, History, House, Image, Layers3, LockKeyhole, Mail,
  NotebookPen, Rocket, Search, Smartphone, Sparkles, Star, Terminal,
  UserRound, Wifi, WifiOff, Workflow, X, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import {
  searchWorkspaceTools, WORKSPACE_SUBJECTS, WORKSPACE_TOOLS,
  type WorkspaceIcon, type WorkspaceSubject, type WorkspaceTool,
} from "@/lib/workspace-catalog";
import {
  readWorkspacePreferences, saveWorkspacePreferences,
  toggleWorkspaceFavorite, WORKSPACE_PREFERENCES_KEY, type WorkspacePreferences,
} from "@/lib/workspace-preferences";
import "@/components/native/NativeLaunchpad.css";
import { WelcomeGuideCard } from "@/components/native/QuickStartGuide";

const TOOL_ICONS: Record<WorkspaceIcon, LucideIcon> = {
  brain: BrainCircuit, notebook: NotebookPen, blocks: Blocks, cloud: Cloud,
  layers: Layers3, database: Database, flask: FlaskConical, image: Image,
  cpu: Cpu, phone: Smartphone, rocket: Rocket, download: Download,
  workflow: Workflow, audio: AudioLines, book: BookOpen, terminal: Terminal,
};
const TOOLS_BY_PATH = new Map(WORKSPACE_TOOLS.map(tool => [tool.path, tool]));
const SLM_LAB = WORKSPACE_TOOLS[0];
const OFFLINE_WORKBENCH = WORKSPACE_TOOLS[1];
const DEMO_BUILDER = WORKSPACE_TOOLS[2];
const INITIAL_TOOL_COUNT = 6;
const STARTERS = [
  { title: "Make sense of field notes", description: "Turn a rough job description into a structured scope.", preset: "scope-summarizer", label: "Scope summarizer", icon: Hammer, color: "orange" },
  { title: "Give your words a polish", description: "Try rewriting a rough draft in a professional tone.", preset: "tone-rewriter", label: "Tone rewriter", icon: Sparkles, color: "lilac" },
  { title: "Bring order to your inbox", description: "Try sorting an email by its intent and category.", preset: "email-classifier", label: "Email classifier", icon: Mail, color: "mint" },
] as const;

function ToolAvailability({ tool }: { tool: WorkspaceTool }) {
  return (
    <span className={`slp-availability ${tool.connection === "offline" ? "slp-availability--local" : ""}`}>
      {tool.connection === "offline" ? <Smartphone aria-hidden="true" /> : tool.access === "account" ? <LockKeyhole aria-hidden="true" /> : <Wifi aria-hidden="true" />}
      {tool.connection === "offline" ? "Works offline" : tool.access === "account" ? "Sign-in required" : "Online"}
      {tool.access === "account" ? <span className="slp-online-note"> · {tool.connection === "download" ? "Download first" : "Online"}</span> : null}
    </span>
  );
}

export default function NativeLaunchpadPage() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const openTools = searchParams.get("view") === "tools";
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [preferences, setPreferences] = useState(readWorkspacePreferences);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<WorkspaceSubject>("All tools");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const toolsRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    const updatePreferences = (event: StorageEvent) => {
      if (event.key === WORKSPACE_PREFERENCES_KEY || event.key === null) setPreferences(readWorkspacePreferences());
    };
    const syncPreferences = () => setPreferences(readWorkspacePreferences());
    window.addEventListener("soupylab:workspace-preferences", syncPreferences);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("storage", updatePreferences);
    return () => {
      window.removeEventListener("soupylab:workspace-preferences", syncPreferences);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("storage", updatePreferences);
    };
  }, []);

  useEffect(() => {
    if (!openTools) return;
    const frame = requestAnimationFrame(() => {
      toolsRef.current?.scrollIntoView({ block: "start" });
      searchRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [openTools]);

  const commitPreferences = (next: WorkspacePreferences, message?: string) => {
    setPreferences(next);
    const saved = saveWorkspacePreferences(next);
    if (message) setAnnouncement(saved ? message : `${message} Storage is unavailable; this change will last for this visit.`);
  };

  const favoriteTool = (tool: WorkspaceTool) => {
    const wasFavorite = preferences.favorites.includes(tool.path);
    commitPreferences(toggleWorkspaceFavorite(preferences, tool.path), `${tool.name} ${wasFavorite ? "removed from" : "added to"} favorites.`);
  };

  const toolDestination = (tool: WorkspaceTool) => tool.access === "account" && !user ? "/login" : tool.path;
  const toolLinkState = (tool: WorkspaceTool) => tool.access === "account" && !user ? { from: tool.path } : undefined;
  const matchingTools = searchWorkspaceTools(query, subject).filter(tool => !favoritesOnly || preferences.favorites.includes(tool.path));
  const filtered = query.trim().length > 0 || subject !== "All tools" || favoritesOnly;
  const visibleTools = showAll || filtered ? matchingTools : matchingTools.slice(0, INITIAL_TOOL_COUNT);
  const recentTools = preferences.recent.flatMap(path => {
    const tool = TOOLS_BY_PATH.get(path);
    return tool ? [tool] : [];
  });

  const jumpToTools = (onlyFavorites: boolean) => {
    setFavoritesOnly(onlyFavorites);
    setSubject("All tools");
    setQuery("");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    toolsRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="slp" id="launchpad-top">
      <SEOHead title="Your workspace — SoupyLab" description="Your starting point for small language models, useful AI tools, and an offline workbench." canonicalPath="/launchpad" />
      <button className="slp-skip-link" type="button" onClick={() => mainRef.current?.focus()}>Skip to workspace</button>
      <header className="slp-header">
        <div className="slp-header-inner">
          <Link className="slp-brand" to="/launchpad" aria-label="SoupyLab home">
            <span className="slp-brand-mark"><Flame aria-hidden="true" /></span>
            <span>Soupy<span className="slp-brand-light">Lab</span><span className="slp-brand-dot">.</span></span>
          </Link>
          <div className="slp-header-actions">
            <Link className="slp-settings" to="/app-settings" aria-label="App settings"><Settings aria-hidden="true" /></Link>
            <span className={`slp-connection ${online ? "" : "slp-connection--offline"}`} role="status">
              <span className="slp-connection-dot" />{online ? "Online" : "Offline"}
            </span>
            <Link className="slp-account" to={user ? "/account" : "/login"} state={!user ? { from: "/launchpad" } : undefined}>
              <UserRound aria-hidden="true" /><span>{loading ? "Account" : user ? "Account" : "Sign in"}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="slp-main" id="launchpad-main" ref={mainRef} tabIndex={-1}>
        {!online ? (
          <div className="slp-offline-banner" role="status">
            <WifiOff aria-hidden="true" />
            <p>You’re offline. Your offline workbench is ready. Cloud tools need a connection.</p>
          </div>
        ) : null}

        <section className="slp-hero" aria-labelledby="launchpad-title">
          <div className="slp-hero-content">
            <p className="slp-eyebrow"><span /> YOUR IDEAS START HERE</p>
            <h1 id="launchpad-title">Make AI<br />your <span>own.</span></h1>
            <p className="slp-hero-description">A little curiosity. A powerful set of tools.<br className="slp-wide-break" /> Build something that works for you.</p>
            <Link className="slp-primary-button" to={SLM_LAB.path}>
              Open SLM Lab <ArrowUpRight aria-hidden="true" />
            </Link>
            <p className="slp-hero-note">Explore the lab · Sign in to save your work</p>
          </div>
          <div className="slp-orbit-art" aria-hidden="true">
            <div className="slp-orbit-grid" />
            <div className="slp-orbit-glow" />
            <div className="slp-orbit slp-orbit-one"><i /></div>
            <div className="slp-orbit slp-orbit-two"><i /></div>
            <div className="slp-orbit slp-orbit-three"><i /></div>
            <div className="slp-orbit-core"><BrainCircuit /><span>YOUR NEXT IDEA</span></div>
            <span className="slp-orbit-label slp-orbit-label-top"><span /> EXPLORE</span>
            <span className="slp-orbit-label slp-orbit-label-bottom">BUILD SOMETHING YOURS <ArrowUpRight /></span>
          </div>
          <span className="slp-hero-corner" aria-hidden="true">01 / THE LAUNCHPAD</span>
        </section>

        <WelcomeGuideCard />

        <section className="slp-quick-grid" aria-label="Quick starts">
          <Link className="slp-quick-card" to={OFFLINE_WORKBENCH.path}>
            <span className="slp-feature-icon slp-feature-icon--mint"><NotebookPen aria-hidden="true" /></span>
            <span className="slp-quick-copy"><span className="slp-quick-title">Offline workbench</span><span>Create training pairs, wherever you are.</span><span className="slp-quick-status"><span /> On this device · No sign-in</span></span>
            <ArrowUpRight className="slp-card-arrow" aria-hidden="true" />
          </Link>
          <Link className="slp-quick-card" to={DEMO_BUILDER.path}>
            <span className="slp-feature-icon slp-feature-icon--lilac"><Blocks aria-hidden="true" /></span>
            <span className="slp-quick-copy"><span className="slp-quick-title">Try the module builder</span><span>Get a feel for what you can make.</span><span className="slp-quick-status slp-quick-status--online"><Wifi aria-hidden="true" /> Online demo · No sign-in</span></span>
            <ArrowUpRight className="slp-card-arrow" aria-hidden="true" />
          </Link>
        </section>

        {recentTools.length > 0 ? (
          <section className="slp-recent" aria-labelledby="recent-title">
            <div className="slp-section-heading slp-section-heading--compact">
              <h2 id="recent-title"><History aria-hidden="true" /> Recently opened</h2>
              <button type="button" className="slp-text-button" onClick={() => commitPreferences({ ...preferences, recent: [] }, "Recently opened tools cleared.")}>Clear recent</button>
            </div>
            <div className="slp-recent-links">
              {recentTools.map(tool => {
                const Icon = TOOL_ICONS[tool.icon];
                return <Link key={tool.id} to={toolDestination(tool)} state={toolLinkState(tool)}><Icon aria-hidden="true" /><span>{tool.name}</span><ChevronRight aria-hidden="true" /></Link>;
              })}
            </div>
          </section>
        ) : null}

        <section className="slp-tools-section" id="workspace-tools" ref={toolsRef} aria-labelledby="tools-title">
          <div className="slp-section-heading">
            <div><p className="slp-eyebrow slp-eyebrow--muted">FIND YOUR NEXT THING</p><h2 id="tools-title">Your toolkit<span>.</span></h2></div>
            <span className="slp-tool-count">{WORKSPACE_TOOLS.length} ways to get going</span>
          </div>
          <div className="slp-search-row">
            <div className="slp-search">
              <Search aria-hidden="true" />
              <label className="slp-sr-only" htmlFor="launchpad-search">Search tools by name or purpose</label>
              <input id="launchpad-search" type="search" placeholder="What do you want to make?" value={query} onChange={event => setQuery(event.target.value)} ref={searchRef} autoComplete="off" />
              {query ? <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); searchRef.current?.focus(); }}><X aria-hidden="true" /></button> : null}
            </div>
            <button className={`slp-favorite-filter ${favoritesOnly ? "is-selected" : ""}`} type="button" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(current => !current)}><Star aria-hidden="true" /><span>Favorites</span>{preferences.favorites.length > 0 ? <span className="slp-favorite-count">{preferences.favorites.length}</span> : null}</button>
          </div>
          <div className="slp-subjects" aria-label="Filter tools by subject">
            {WORKSPACE_SUBJECTS.map(item => <button key={item} type="button" aria-pressed={subject === item} className={subject === item ? "is-selected" : ""} onClick={() => setSubject(item)}>{item === "All tools" ? <Grid2X2 aria-hidden="true" /> : null}{item}</button>)}
          </div>
          <p className="slp-results-status slp-sr-only" role="status">{matchingTools.length} {matchingTools.length === 1 ? "tool" : "tools"} found{favoritesOnly ? " in favorites" : ""}.</p>
          <div className="slp-tool-grid">
            {visibleTools.map(tool => {
              const Icon = TOOL_ICONS[tool.icon];
              const favorite = preferences.favorites.includes(tool.path);
              return (
                <article className="slp-tool-card" key={tool.id}>
                  <div className="slp-tool-card-top"><span className={`slp-tool-icon slp-tool-icon--${tool.subject.toLowerCase()}`}><Icon aria-hidden="true" /></span><button type="button" className={`slp-star-button ${favorite ? "is-selected" : ""}`} aria-label={`${favorite ? "Remove" : "Add"} ${tool.name} ${favorite ? "from" : "to"} favorites`} aria-pressed={favorite} onClick={() => favoriteTool(tool)}><Star aria-hidden="true" /></button></div>
                  <Link className="slp-tool-link" to={toolDestination(tool)} state={toolLinkState(tool)}>
                    <span className="slp-tool-name">{tool.name}<ArrowUpRight aria-hidden="true" /></span>
                    <span className="slp-tool-description">{tool.description}</span>
                  </Link>
                  <div className="slp-tool-card-bottom"><ToolAvailability tool={tool} />{tool.detail ? <span className="slp-tool-detail">{tool.detail}</span> : null}</div>
                </article>
              );
            })}
          </div>
          {matchingTools.length === 0 ? (
            <div className="slp-empty-state">
              {favoritesOnly && preferences.favorites.length === 0 ? <Star aria-hidden="true" /> : <Search aria-hidden="true" />}
              <h3>{favoritesOnly && preferences.favorites.length === 0 ? "Keep your go-to tools close." : "No tools found. Try a different angle."}</h3>
              <p>{favoritesOnly && preferences.favorites.length === 0 ? "Tap the star on any tool to add it here." : "Search by a task, like writing, training, or phone."}</p>
              <button type="button" className="slp-secondary-button" onClick={() => { setFavoritesOnly(false); setSubject("All tools"); setQuery(""); }}>Explore all tools <ArrowRight aria-hidden="true" /></button>
            </div>
          ) : null}
          {!filtered && matchingTools.length > INITIAL_TOOL_COUNT ? <button className="slp-show-more" type="button" onClick={() => setShowAll(current => !current)}>{showAll ? "Show fewer tools" : `Explore all ${matchingTools.length} tools`}<ArrowDown className={showAll ? "is-reversed" : ""} aria-hidden="true" /></button> : null}
          {!favoritesOnly && preferences.favorites.length === 0 ? <p className="slp-favorite-tip"><Star aria-hidden="true" /> A toolkit that feels like yours. Star a tool to save it here.</p> : null}
        </section>

        <section className="slp-starters" aria-labelledby="starters-title">
          <div className="slp-section-heading"><div><p className="slp-eyebrow slp-eyebrow--muted">A SPARK TO GET STARTED</p><h2 id="starters-title">Small tools. Real uses.</h2></div><span className="slp-starter-label"><Wifi aria-hidden="true" /> Online demos</span></div>
          <div className="slp-starter-grid">
            {STARTERS.map(starter => <Link key={starter.preset} className="slp-starter-card" to={`/demo/module-builder?preset=${starter.preset}`}><span className={`slp-starter-icon slp-starter-icon--${starter.color}`}><starter.icon aria-hidden="true" /></span><h3>{starter.title}</h3><p>{starter.description}</p><span className="slp-starter-footer">{starter.label}<ArrowRight aria-hidden="true" /></span></Link>)}
          </div>
          <p className="slp-demo-note">Try the presets without an account. Demo usage limits apply.</p>
        </section>

        <section className="slp-cloud-strip" aria-label="Cloud workspace">
          <span className="slp-cloud-icon"><Cloud aria-hidden="true" /></span>
          <div><h2>{user ? "Your workspace is waiting." : "Ready to take it further?"}</h2><p>{user ? "Return to your projects and connected tools." : "Sign in to save projects and use your cloud workspace."}</p></div>
          <Link className="slp-secondary-button" to={user ? "/dashboard" : "/login"} state={!user ? { from: "/dashboard" } : undefined}>{user ? "Open workspace" : "Sign in"}<ArrowRight aria-hidden="true" /></Link>
        </section>

        <footer className="slp-footer"><span>Made for curious minds.<span className="slp-footer-brand"> SoupyLab.</span></span><nav aria-label="Legal"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></nav><p>Favorites and recently opened tools stay on this device.</p></footer>
        <p className="slp-sr-only" role="status" aria-live="polite">{announcement}</p>
      </main>

      <nav className="slp-bottom-nav" aria-label="Workspace navigation">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "auto" })} className="is-current" aria-current="page"><House aria-hidden="true" /><span>Home</span></button>
        <button type="button" onClick={() => jumpToTools(false)}><Grid2X2 aria-hidden="true" /><span>Explore</span></button>
        <button type="button" onClick={() => jumpToTools(true)}><Star aria-hidden="true" /><span>Favorites</span></button>
        <Link to={user ? "/dashboard" : "/login"} state={!user ? { from: "/dashboard" } : undefined}><Cloud aria-hidden="true" /><span>Workspace</span></Link>
      </nav>
    </div>
  );
}
